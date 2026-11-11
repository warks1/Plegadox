/**
 * PlegadoX R31 — sólidos de barrido de sección extruida (2,5D).
 *
 * Al ser una sección extruida a lo largo de Z es una ocupación de volumen
 * real en el modelo, y detecta interferencias de profundidad/anchura que el
 * inspector 2D no considera. NO equivale a CAD 3D OEM: perfiles, amarres,
 * ejes, radios y carrera reales siguen requiriendo evidencia y calibración.
 */
import {normalized,getTooling} from './engine.js';
import {getV85,gaugeOutline} from './machine-config.js';
import {gaugePlacement} from './backgauge-placement.js';
import {sheetSolidMesh} from './sheet-solid.js';
const EPS=1e-8;
const v=(x,y)=>({x,y});
const isFinitePoint=p=>p&&Number.isFinite(p.x)&&Number.isFinite(p.y);
const signedArea=p=>p.reduce((s,a,i)=>{const b=p[(i+1)%p.length];return s+a.x*b.y-b.x*a.y;},0)/2;
const cross=(a,b,c)=>(b.x-a.x)*(c.y-a.y)-(b.y-a.y)*(c.x-a.x);
export function triangulateSimplePolygon(polygon){
 if(!Array.isArray(polygon)||polygon.length<3||!polygon.every(isFinitePoint))return [];
 const clean=polygon.filter((p,i)=>i===0||
  Math.hypot(p.x-polygon[i-1].x,p.y-polygon[i-1].y)>EPS);
 if(clean.length>3&&Math.hypot(clean[0].x-clean.at(-1).x,clean[0].y-clean.at(-1).y)<EPS)clean.pop();
 if(clean.length<3)return [];
 const a=signedArea(clean);
 if(Math.abs(a)<EPS)return [];
 const winding=a>0?1:-1,indices=clean.map((_,i)=>i),faces=[];
 // Ear clipping accepts concave die/punch outlines. Self-crossing polygons
 // are rejected rather than silently turning into a bounding box.
 for(let attempt=0;indices.length>3&&attempt<clean.length*clean.length;attempt++){
  let removed=false;
  for(let k=0;k<indices.length;k++){
   const i=indices[(k+indices.length-1)%indices.length],j=indices[k],
    l=indices[(k+1)%indices.length];
   const a=clean[i],b=clean[j],c=clean[l];
   if(cross(a,b,c)*winding<=EPS)continue;
   const inside=point=>{
    const c1=cross(a,b,point)*winding,c2=cross(b,c,point)*winding,
     c3=cross(c,a,point)*winding;
    return c1>=-EPS&&c2>=-EPS&&c3>=-EPS;
   };
   if(indices.some(m=>m!==i&&m!==j&&m!==l&&inside(clean[m])))continue;
   faces.push([a,b,c]);indices.splice(k,1);removed=true;break;
  }
  if(!removed)return [];
 }
 if(indices.length!==3)return [];
 faces.push(indices.map(i=>clean[i]));
 const sum=faces.reduce((s,p)=>s+Math.abs(signedArea(p)),0);
 return Math.abs(sum-Math.abs(signedArea(clean)))<Math.max(1e-6,Math.abs(signedArea(clean))*1e-6)?faces:[];
}
function clipConvex(subject,clip){
 let output=subject;
 const winding=Math.sign(signedArea(clip));
 for(let j=0;j<clip.length;j++){
  const a=clip[j],b=clip[(j+1)%clip.length],input=output;
  output=[];
  if(!input.length)break;
  const side=p=>cross(a,b,p)*winding;
  for(let i=0;i<input.length;i++){
   const current=input[i],previous=input[(i+input.length-1)%input.length];
   const c=side(current),p=side(previous),insideC=c>=-EPS,insideP=p>=-EPS;
   if(insideC!==insideP){
    const t=p/(p-c);
    output.push(v(previous.x+(current.x-previous.x)*t,
     previous.y+(current.y-previous.y)*t));
   }
   if(insideC)output.push(current);
  }
 }
 return output;
}
export function intersectionArea2D(a,b){
 const ta=triangulateSimplePolygon(a),tb=triangulateSimplePolygon(b);
 if(!ta.length||!tb.length)return {area:0,geometryValid:false};
 let area=0;
 for(const x of ta)for(const y of tb){
  const intersection=clipConvex(x,y);
  if(intersection.length>=3)area+=Math.abs(signedArea(intersection));
 }
 return {area,geometryValid:true};
}
export function makePrism(id,polygon,zMin,zMax,provenance='provisional'){
 if(!Array.isArray(polygon)||polygon.length<3||
  !Number.isFinite(zMin)||!Number.isFinite(zMax)||zMax<=zMin)
  return {id,valid:false,provenance};
 const points=polygon.map(p=>({x:Number(p.x),y:Number(p.y)}));
 const valid=points.every(isFinitePoint)&&triangulateSimplePolygon(points).length>0;
 return {id,polygon:points,zMin,zMax,valid,provenance};
}
export function prismOverlap(a,b){
 if(!a?.valid||!b?.valid)return {intersects:false,volume:0,unknown:true};
 const depth=Math.min(a.zMax,b.zMax)-Math.max(a.zMin,b.zMin);
 if(depth<=EPS)return {intersects:false,volume:0,unknown:false};
 const inter=intersectionArea2D(a.polygon,b.polygon);
 const volume=inter.area*Math.max(0,depth);
 return {intersects:volume>EPS,volume,area:inter.area,depth,
  unknown:!inter.geometryValid};
}
const rect=(x1,y1,x2,y2)=>[v(x1,y1),v(x2,y1),v(x2,y2),v(x1,y2)];
function strip(a,b,t){
 const dx=b.x-a.x,dy=b.y-a.y,len=Math.hypot(dx,dy);
 if(len<EPS)return null;
 const nx=-dy*t/(2*len),ny=dx*t/(2*len);
 return [v(a.x+nx,a.y+ny),v(b.x+nx,b.y+ny),
  v(b.x-nx,b.y-ny),v(a.x-nx,a.y-ny)];
}
export function buildVolumeScene(scene,{machine=getV85()}={}){
 const p=normalized(scene.piece);
 const width=p.width,half=width/2;
 // Compartir EXACTAMENTE el contorno de espesor del visor 3D,
 // incluyendo uniones de alas y radios representados, evitando dos
 // motores incompatibles de normales/desplazamiento en las esquinas.
 const segments=[];
 const contour=scene.sheetDisplay||scene.sheet;
 const skin=sheetSolidMesh(contour,width,p.thickness);
 for(let i=0;i<skin.outer.length-1;i++){
  const shape=[skin.outer[i],skin.outer[i+1],
   skin.inner[i+1],skin.inner[i]];
  segments.push(makePrism('chapa-ala-'+(i+1),shape,-half,half,'malla-chapa-compartida'));
 }
 const punch=scene.punch,die=scene.die;
 const registered=getTooling(p);
 const pLength=Number(registered.punch?.length),dLength=Number(registered.die?.length);
 const pSpan=Number.isFinite(pLength)&&pLength>0?pLength:width;
 const dSpan=Number.isFinite(dLength)&&dLength>0?dLength:width;
 const punchPrism=makePrism('punzon',scene.punchPolygon,-pSpan/2,pSpan/2,
  registered.punch?.profileAccuracy==='verified'?'perfil-acotado':'perfil-provisional');
 const diePrism=makePrism('matriz',scene.diePolygon,-dSpan/2,dSpan/2,
  registered.die?.profileAccuracy==='verified'?'perfil-acotado':'perfil-provisional');
 const top=scene.kinematics.tipHeight-scene.punch.height;
 // ALZADO PROVISIONAL: alturas relativas proceden del dibujo actual del
 // portaherramientas, NO se deducen de L1=1340 mm como si fuese carrera.
 // Una L* sin referencia de caras no define por sí sola un sólido CAD.
 const ramHalf=(Number(machine.ram?.[6])||125)/2;
 const ram=makePrism('trancha-envolvente',rect(-ramHalf,top-65,
  ramHalf,top+10),-(machine.ramWidth||2040)/2,(machine.ramWidth||2040)/2,
  'envolvente-ilustrativa-sin-CAD');
 const bedHalf=(Number(machine.bed?.[1])||80)/2;
 const bottom=-scene.die.height;
 const bed=makePrism('mesa-envolvente',rect(-bedHalf,bottom-50,
  bedHalf,bottom),-(machine.holderWidth||2040)/2,(machine.holderWidth||2040)/2,
  'envolvente-ilustrativa-sin-CAD');
 const stopNumber=p.stopByBend[scene.stage.activeBend]===2?2:1;
 const placement=gaugePlacement(scene,stopNumber);
 const gaugeValues=stopNumber===2?machine.support:machine.stop;
 const origin=placement.contact?.origin||placement.point;
 const gaugePolygon=gaugeOutline(gaugeValues,stopNumber)
  .map(q=>v(q.x+origin.x,q.y+origin.y));
 // Se desconoce el ancho y la posición Z del dedo real; adoptar el ancho
 // de pieza es una ENVOLVENTE CONSERVADORA de posible contacto, no su volumen.
 const gauge=makePrism('tope-'+stopNumber,gaugePolygon,-half,half,
  'Z-del-dedo-desconocida-envolvente-conservadora');
 return {sheet:segments,objects:{punch:punchPrism,die:diePrism,ram,bed,gauge},
  gaugePlacement:placement,
  geometryKnown:segments.every(s=>s.valid)&&punchPrism.valid&&diePrism.valid,
  provenance:{machineDimensions:'cotas Cybelec del usuario 30-10-2026',
   ram:'envolvente del visor, no contorno CAD/amarre verificado',
   bed:'envolvente del visor, no contorno CAD/amarre verificado',
   gauge:'L1–L6 documentados, posición y anchura Z no verificadas',
   punch:punchPrism.provenance,die:diePrism.provenance,
   machineTonnage:85,ramWidth:machine.ramWidth,holderWidth:machine.holderWidth,
   documentedDimensions:{
    ramL:[...machine.ram],bedL:[...machine.bed],
    stopL:[...machine.stop],supportL:[...machine.support],
    toolWorkingDistance:machine.toolWorkingDistance
   },
   geometryMapping:'Se utiliza ram L7 como anchura orientativa y mesa L2 como anchura orientativa; las demás cotas se conservan pero NO se convierten sin plano de caras referenciado.'},
  verified:false};
}
/**
 * El contacto chapa/punzón y chapa/matriz en la zona activa es normal.
 * Se mantienen como indicios volumétricos; la severidad de penetración
 * se determina por el inspector especializado de contacto, no por todo
 * solapamiento idealizado de espesores en la zona de plegado.
 */
export function inspectVolumeFrame(scene,options={}){
 const model=buildVolumeScene(scene,options);
 const issues=[];
 for(const [kind,solid] of Object.entries(model.objects)){
  let maxVolume=0,segment=null,unknown=false;
  for(let i=0;i<model.sheet.length;i++){
   const overlap=prismOverlap(model.sheet[i],solid);
   unknown ||= overlap.unknown;
   if(overlap.volume>maxVolume){maxVolume=overlap.volume;segment=i;}
  }
  if(maxVolume>EPS)issues.push({kind,segment,volumeMm3:maxVolume,
   severity:kind==='punch'||kind==='die'?'contacto-o-penetracion-posible':
    'interferencia-envolvente',
   evidence:solid.provenance,verified:false});
  if(unknown)issues.push({kind,segment:null,volumeMm3:null,
   severity:'geometria-invalida',evidence:solid.provenance,verified:false});
 }
 return {issues,model,
  geometryKnown:model.geometryKnown&&
    Object.values(model.objects).every(s=>s.valid),
  verified:false,canApproveForMachine:false};
}
