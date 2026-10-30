/**
 * PLEGADOX — cribado de penetraciones en sección 2D.
 * Detecta si la fibra media o el espesor nominal de la chapa se superponen
 * con siluetas de herramientas PARAMÉTRICAS en una presentación concreta.
 *
 * NO certifica colisiones ni calcula deformación plástica, holgura,
 * cinemática 3D, soportes, profundidad de mordazas ni esfuerzos.
 */
import {technicalScene} from './technical-section.js';
import {normalized,stage} from './engine.js';

const EPS=1e-8;
const distance=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
function distanceSegment(p,a,b){
 const vx=b.x-a.x,vy=b.y-a.y,len=vx*vx+vy*vy;
 if(len<EPS)return distance(p,a);
 const t=Math.max(0,Math.min(1,((p.x-a.x)*vx+(p.y-a.y)*vy)/len));
 return Math.hypot(p.x-a.x-t*vx,p.y-a.y-t*vy);
}
export function insidePolygon(p,verts){
 let inside=false;
 for(let i=0,j=verts.length-1;i<verts.length;j=i++){
  const a=verts[i],b=verts[j];
  const d=distanceSegment(p,a,b);
  if(d<EPS)return true;
  if((a.y>p.y)!==(b.y>p.y) &&
    p.x < (b.x-a.x)*(p.y-a.y)/(b.y-a.y)+a.x)inside=!inside;
 }
 return inside;
}
function polygonDistance(p,verts){
 let closest=Infinity;
 for(let i=0;i<verts.length;i++)
  closest=Math.min(closest,distanceSegment(p,verts[i],verts[(i+1)%verts.length]));
 return closest;
}
/**
 * Distancia exacta entre dos segmentos de sección 2D, con los puntos
 * más próximos de ambos. Detecta cruces de la ENVOLVENTE de espesor
 * incluso si la fibra media no corta el útil y las muestras son lejanas.
 */
function segmentNearestPoints(a,b,c,d){
 const closest=(p,v,w)=>{
  const dx=w.x-v.x,dy=w.y-v.y,len=dx*dx+dy*dy;
  const t=len<EPS?0:Math.max(0,Math.min(1,((p.x-v.x)*dx+(p.y-v.y)*dy)/len));
  return {point:{x:v.x+dx*t,y:v.y+dy*t},t};
 };
 const candidates=[];
 for(const p of [a,b]){
  const q=closest(p,c,d);candidates.push({sheet:p,tool:q.point,dist:distance(p,q.point)});
 }
 for(const p of [c,d]){
  const q=closest(p,a,b);candidates.push({sheet:q.point,tool:p,dist:distance(q.point,p)});
 }
 return candidates.reduce((best,item)=>item.dist<best.dist?item:best);
}
/**
 * Para cada ala, comprueba la distancia mínima de su fibra a TODAS las
 * aristas de cada herramienta. La muestra espaciada a 100 mm puede fallar
 * ante una arista de solo 1 mm. Este método no necesita muestras.
 *
 * Se omite el apoyo esperado sobre el plano Y=0 de la matriz cuando la
 * fibra se encuentra a medio espesor sobre ese plano.
 */
function segmentPolygonClearances(sheet,scene,kind){
 const polygon=kind==='punch'?scene.punchPolygon:scene.diePolygon;
 const half=Math.max(0,Number(scene.piece.thickness)||0)/2,issues=[];
 if(!Array.isArray(polygon)||polygon.length<3||half<=.18)return issues;
 for(let segment=0;segment<sheet.length-1;segment++){
  const a=sheet[segment],b=sheet[segment+1];
  let best=null;
  for(let j=0;j<polygon.length;j++){
   const near=segmentNearestPoints(a,b,polygon[j],polygon[(j+1)%polygon.length]);
   if(!best||near.dist<best.dist)best=near;
  }
  if(!best||best.dist>=half-.18)continue;
  // Un punto con fibra central dentro del material es penetración, no holgura.
  // Ya se analiza con los cortes exactos segmento/polígono.
  if(insidePolygon(best.sheet,polygon) &&
    polygonDistance(best.sheet,polygon)>1e-6)continue;
  const support=kind==='die' && Math.abs(best.tool.y)<.15 &&
    Math.abs(best.sheet.y-half)<.15;
  const punchContact=kind==='punch' &&
    (segment===scene.stage.activeBend||segment===scene.stage.activeBend+1) &&
    Math.abs(best.sheet.x)<Math.max(half*1.3,1.2);
  if(support||punchContact)continue;
  issues.push({kind,category:'clearance',point:best.sheet,segment,
   depth:half-best.dist});
 }
 return issues;
}
function sampleSheet(sheet,step){
 const samples=[];
 for(let i=0;i<sheet.length-1;i++){
  const a=sheet[i],b=sheet[i+1],d=distance(a,b);
  const n=Math.max(2,Math.min(100,Math.ceil(d/step)));
  for(let k=0;k<=n;k++){
   const u=k/n;
   samples.push({point:{x:a.x+(b.x-a.x)*u,y:a.y+(b.y-a.y)*u},
    segment:i,u});
  }
 }
 return samples;
}
/**
 * Comprobar intersecciones exactas del EJE de cada ala con los perfiles 2D.
 * El muestreo está limitado a 100 subdivisiones por tramo y puede omitir
 * herramientas estrechas cuando un ala alcanza varios metros.
 *
 * Para cada corte con el contorno se estudian los intervalos abiertos que
 * quedan entre los parámetros de intersección. Así se comprueban también
 * penetraciones inferiores al intervalo de muestreo sin inventar CAD.
 */
function segmentPolygonPenetrations(sheet,scene,kind){
 const polygon=kind==='punch'?scene.punchPolygon:scene.diePolygon;
 const cross=(a,b)=>a.x*b.y-a.y*b.x,issues=[];
 if(!Array.isArray(polygon)||polygon.length<3)return issues;
 for(let segment=0;segment<sheet.length-1;segment++){
  const a=sheet[segment],b=sheet[segment+1],r={x:b.x-a.x,y:b.y-a.y};
  if(r.x*r.x+r.y*r.y<EPS)continue;
  const cuts=[0,1];
  for(let j=0;j<polygon.length;j++){
   const c=polygon[j],d=polygon[(j+1)%polygon.length];
   const s={x:d.x-c.x,y:d.y-c.y};
   const denominator=cross(r,s);
   if(Math.abs(denominator)<=EPS)continue; // tangentes paralelas o solapadas
   const delta={x:c.x-a.x,y:c.y-a.y};
   const t=cross(delta,s)/denominator,u=cross(delta,r)/denominator;
   if(t>=-EPS&&t<=1+EPS&&u>=-EPS&&u<=1+EPS)
    cuts.push(Math.max(0,Math.min(1,t)));
  }
  cuts.sort((x,y)=>x-y);
  const unique=cuts.filter((t,i)=>i===0||t-cuts[i-1]>1e-9);
  for(let i=0;i<unique.length-1;i++){
   if(unique[i+1]-unique[i]<=1e-9)continue;
   const u=(unique[i]+unique[i+1])/2;
   const point={x:a.x+r.x*u,y:a.y+r.y*u};
   if(!insidePolygon(point,polygon))continue;
   const distanceToEdge=polygonDistance(point,polygon);
   if(distanceToEdge<=EPS)continue; // contacto en el borde, sin penetración
   issues.push({kind,category:'penetration',point,segment,
    depth:distanceToEdge+scene.piece.thickness/2});
  }
 }
 return issues;
}
function classifySample(sample,scene,kind){
 const {point:p,segment}=sample;
 const polygon=kind==='punch'?scene.punchPolygon:scene.diePolygon;
 const inside=insidePolygon(p,polygon),boundaryDistance=polygonDistance(p,polygon);
 const half=scene.piece.thickness/2;
 const active=scene.stage.activeBend;
 const contactNearBend=(segment===active||segment===active+1) &&
   Math.abs(p.x)<Math.max(half*1.3,1.2);
 // Inside the solid with a positive margin: impossible even for the
 // zero-thickness centreline. Do not exempt it as "normal bending".
 if(inside && boundaryDistance>0.18)return {
  kind,category:'penetration',point:p,segment,
  depth:boundaryDistance+half
 };
 // On the intended punch-to-sheet contact line, a tiny mismatch in the
 // simplified sharp-tip model must not claim a real 3D collision.
 if(kind==='punch'&&contactNearBend && !inside)return null;
 // On the flat shoulders of the V, contact at underside y=0 is intended.
 if(kind==='die' && p.y>=half-0.12 && !inside)return null;
 if(!inside && boundaryDistance<half-0.18){
  return {kind,category:'clearance',point:p,segment,
   depth:half-boundaryDistance};
 }
 return null;
}
/**
 * Geometry-only inspection for a user-provided polygon and polyline.
 * Used by tests and, with the selected tool polygons, by the simulator.
 */
export function inspectSheetAgainstPolygon(sheet,polygon,thickness=2,kind='punch',activeBend=-99){
 const scene={sheet,punchPolygon:polygon,diePolygon:polygon,stage:{activeBend},
  piece:{thickness}};
 const samples=sampleSheet(sheet,Math.max(.5,Math.min(3,thickness*.65)));
 return [...samples.map(sample=>classifySample(sample,scene,kind)).filter(Boolean),
  ...segmentPolygonPenetrations(sheet,scene,kind),
  ...segmentPolygonClearances(sheet,scene,kind)];
}
export function inspectToolContact(piece,instant=0){
 const scene=technicalScene(piece,instant),samples=sampleSheet(scene.sheet,
  Math.max(.5,Math.min(3,scene.piece.thickness*.65)));
 const all=[];
 for(const sample of samples){
  for(const kind of ['punch','die']){
   const found=classifySample(sample,scene,kind);
   if(found)all.push(found);
  }
 }
 // Detectar también penetraciones entre puntos muestreados, por ejemplo
 // un perfil estrecho en un ala de varios metros.
 for(const kind of ['punch','die']){
  all.push(...segmentPolygonPenetrations(scene.sheet,scene,kind));
  all.push(...segmentPolygonClearances(scene.sheet,scene,kind));
 }
 // Keep the deepest issue per tool and segment, avoiding dozens of repeated
 // warnings and huge per-frame DOM updates.
 const grouped=new Map();
 for(const issue of all){
  const key=issue.kind+':'+issue.segment;
  const old=grouped.get(key);
  if(!old||issue.depth>old.depth)grouped.set(key,issue);
 }
 const warnings=[...grouped.values()].sort((a,b)=>b.depth-a.depth);
 const hard=warnings.filter(i=>i.category==='penetration');
 const result={
  stage:scene.stage,issues:warnings,
  hasPenetration:hard.length>0,hasWarning:warnings.length>0,
  checkedSamples:samples.length,
  limits:'Siluetas 2D paramétricas y espesor nominal; no colisión 3D certificada',
  verified:false
 };
 return result;
}
// A shared small cache prevents 2D polygon checks at every animation frame.
let cachedKey='',cachedContact=null;
export function currentToolContact(piece,time=0){
 const p=normalized(piece);
 const t=Math.round(Math.max(0,Number(time)||0)*10)/10;
 const key=JSON.stringify([p.flanges,p.angles,p.order,p.punch,p.die,p.thickness,t]);
 if(key!==cachedKey){cachedKey=key;cachedContact=inspectToolContact(p,t);}
 return cachedContact;
}
export function inspectSequenceTools(piece,samplesPerOperation=9){
 const p=normalized(piece),out=[];
 for(let op=0;op<p.order.length;op++){
  let worst=null,firstTime=null,checked=0;
  for(let n=0;n<samplesPerOperation;n++){
   const time=op*5+(n+.5)/samplesPerOperation*5;
   const result=inspectToolContact(p,time);checked++;
   if(result.issues.length){
    const deepest=result.issues[0];
    if(!worst||deepest.depth>worst.depth){worst={...deepest};firstTime=time;}
   }
  }
  out.push({operation:op,bend:p.order[op],angle:p.angles[p.order[op]],
   possibleToolIntrusion:!!worst,example:worst,exampleTime:firstTime,
   samples:checked,verified:false});
 }
 return {operations:out,verified:false,warningCount:out.filter(x=>x.possibleToolIntrusion).length};
}
