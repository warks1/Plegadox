/**
 * Plegadox · sección técnica paramétrica con una única escala en mm.
 *
 * IMPORTANTE: esto NO es CAD certificado ni un solver FEM. Las siluetas de
 * punzón/matriz se calculan a partir de los datos que sí conocemos. La chapa
 * es un perfil de fibra media con espesor nominal; el contacto es orientativo.
 * No usar esta vista para verificar colisiones o seguridad de máquina.
 */
import {normalized,stage,presentedAtStage,presentedForMachine,gaugeReference,gaugePointOnProfile,getTooling,development,clamp} from './engine.js';
import {sectionPunch,sectionDie,sectionBounds} from './tool-profiles.js';
import {contactKinematics,roundedCorner} from './bend-contact.js';
import {gaugePlacement,gaugeContourAtContact} from './backgauge-placement.js';
import {getActiveMachineConfig,gaugeOutline,gaugeContactFeature} from './machine-config.js';
import {gaugeRetractionPath,planGaugeRetraction} from './gauge-retract-motion.js';
import {inspectGaugeProfile} from './gauge-interference.js';
import {resolveGaugeSetup} from './gauge-contact-solver.js';

const mm=v=>Number.isFinite(+v)?+v:0;
// LRU pequeño: el barrido es POR CONFIGURACIÓN/PLIEGUE, no cada frame.
const gaugePlanCache=new Map();
const gaugeSetupCache=new Map();

const mPoint=(x,y)=>({x:mm(x),y:mm(y)});

/**
 * Encuadre métrico de la sección: incluye la silueta COMPLETA del tope.
 * Durante la retirada se reserva el mismo espacio para los extremos y la
 * posición de despeje. Así no se recorta el dedo ni se hace zoom/pan
 * persiguiéndolo a mitad de una transición de un mismo golpe.
 *
 * Es sólo el encuadre gráfico; no modifica la trayectoria CNC X/R ni el
 * ángulo, la cara, la referencia o la geometría de la pieza.
 */
export function technicalWorldBounds(scene){
 const pts=[...scene.sheetDisplay,...scene.sheet,
  ...scene.diePolygon,...scene.punchPolygon];
 const stopNumber=scene.piece.stopByBend?.[scene.stage.activeBend]===2?2:1;
 const dims=stopNumber===2?getActiveMachineConfig().support:getActiveMachineConfig().stop;
 const place=gaugePlacement(scene,stopNumber);
 const contour=gaugeContourAtContact(place,dims);
 pts.push(...contour);
 const transition=scene.gaugeTransition;
 if(transition){
  // Reserva fija durante TODA la retirada: origen, destino y posición
  // posterior extrema. El perfil se TRASLADA rígido, nunca se espeja.
  const withdraw=Math.max(transition.from.x,transition.to.x)+
   Math.max(12,scene.die.opening||16);
  for(const reference of [
   transition.parkPoint||transition.from,transition.from,transition.to,
   {x:withdraw,y:transition.from.y},{x:withdraw,y:transition.to.y}
  ]){
   const dx=reference.x-place.point.x,dy=reference.y-place.point.y;
   pts.push(...contour.map(pt=>({x:pt.x+dx,y:pt.y+dy})));
  }
 }
 const valid=pts.filter(pt=>Number.isFinite(pt.x)&&Number.isFinite(pt.y));
 if(!valid.length)return {minX:-50,maxX:50,minY:-50,maxY:50};
 return {minX:Math.min(...valid.map(pt=>pt.x)),
  maxX:Math.max(...valid.map(pt=>pt.x)),
  minY:Math.min(...valid.map(pt=>pt.y)),
  maxY:Math.max(...valid.map(pt=>pt.y))};
}

export function technicalScene(piece,instant=0){
 const p=normalized(piece),st=typeof instant==='number'?stage(p,instant):instant;
 const tooling=getTooling(p),die=sectionDie(tooling.die),punch=sectionPunch(tooling.punch);
 const t=p.thickness;
 // One real-world coordinate system (millimetres, matrix top at y=0).
 // Symmetric bend presentation uses both shoulders of the V as supports.
 const machine=getActiveMachineConfig();
 const setupKey=JSON.stringify([p.flanges,p.angles,p.order,p.stopByBend,
  p.gaugeSideByBend,p.gaugeSegmentByBend,p.gaugePointByBend,
  p.thickness,p.kFactor,p.radius,p.punch,p.die,
  machine.profileId||machine.name,machine.stop,machine.support,st.activeBend,
  st.activeOperation]);
 let resolvedGauge=gaugeSetupCache.get(setupKey);
 if(!resolvedGauge){
  resolvedGauge=resolveGaugeSetup(p,st,machine);
  gaugeSetupCache.set(setupKey,resolvedGauge);
  if(gaugeSetupCache.size>24)gaugeSetupCache.delete(gaugeSetupCache.keys().next().value);
 }
 const reference=resolvedGauge.ref;
 // La máquina tiene el tope trasero a la derecha del eje de perfil.
 // Para apoyar el ala ANTERIOR hay que alimentar desde el lado contrario;
 // no se cambia el signo firmado del pliegue en el programa.
 const feedMirror=reference.side==='before';
 const from=presentedAtStage(p,st);
 // Si cambia la cara de alimentación, interpolar la proyección del
 // giro durante la retirada. Un reflejo inmediato al iniciar el golpe
 // siguiente teletransporta la pieza en la representación.
 const nextBend=st.activeOperation<p.order.length-1?
  p.order[st.activeOperation+1]:st.activeBend;
 let nextResolved=resolvedGauge;
 if(st.activeOperation<p.order.length-1){
  const futureKey=setupKey+'::next:'+nextBend;
  nextResolved=gaugeSetupCache.get(futureKey);
  if(!nextResolved){
   const nextFractions=[...st.fractions];
   nextFractions[st.activeBend]=1;
   nextFractions[nextBend]=0;
   nextResolved=resolveGaugeSetup(p,{
    ...st,activeBend:nextBend,activeOperation:st.activeOperation+1,
    fractions:nextFractions
   },machine);
   gaugeSetupCache.set(futureKey,nextResolved);
   if(gaugeSetupCache.size>24)gaugeSetupCache.delete(gaugeSetupCache.keys().next().value);
  }
 }
 const nextFeedMirror=nextResolved.ref.side==='before';
 const changingSide=from.repositioning&&nextFeedMirror!==feedMirror;
 // Cambiar el signo de alimentación DESPUÉS del volteo de cara.
 // Ambos giros simultáneos hacían colapsar X e Y a cero en el mismo instante.
 const spin=changingSide?Math.cos(Math.PI*(from.feedProgress??from.progress??0)):1;
 const mirror=pt=>({...pt,x:(feedMirror?-pt.x:pt.x)*spin});
 const presentation={...from,points:from.points.map(mirror),
  points3D:from.points3D?.map(mirror),gaugeSide:reference.side,
  feedMirrored:feedMirror,changingFeedSide:changingSide};
 // Referencia FIJA de presentación: se mide antes de que baje el punzón.
 // No seguir el extremo de la chapa durante la deformación del golpe.
 // El margen de retirada debe calcularse DESPUÉS de la orientación
 // que conserva el último plegado. Antes se calculaba sobre la posición
 // previa y el giro simétrico podía meter una esquina bajo la matriz.
 // No se mueve el tope: su referencia se toma del estado previo al golpe.
 if(presentation.repositioning){
  const half=Math.abs(p.angles[st.activeBend]*st.fractions[st.activeBend])*Math.PI/360;
  const theta=(feedMirror?1:-1)*half*(1-(presentation.progress??0));
  const c=Math.cos(theta),s=Math.sin(theta);
  const pivot=presentation.points[st.activeBend+1];
  const low=Math.min(...presentation.points.map(pt=>(pt.x-pivot.x)*s+(pt.y-pivot.y)*c));
  const factor=Math.max(0,Math.min(1,presentation.liftFactor??0));
  presentation.clearanceLift=Math.max(presentation.clearanceLift??0,Math.max(0,5-low)*factor);
 }
 const setupFractions=[...st.fractions];setupFractions[st.activeBend]=0;
 const setup=presentedForMachine(p,setupFractions,st.activeBend);
 // CRÍTICO: el punto origen del dedo es la referencia del golpe
 // anterior ANTES de retirar la chapa. El factor visual spin es
 // sólo para dibujar el giro de la CHAPA: nunca debe mover los ejes
 // X/R del TOPE ni cambiar su origen durante el mismo traslado.
 const fixedGaugePoint=gaugePointOnProfile(setup.points,reference);
 const gaugeAnchor={x:resolvedGauge.point?.x??(feedMirror?-1:1)*fixedGaugePoint.x,
  y:resolvedGauge.point?.y??fixedGaugePoint.y+p.thickness/2};
 // El tope permanece apoyado hasta sujetar. Sólo se retira si un
 // barrido 2D prevé interferencia durante el plegado, no en todos los golpes.
 const stopNumber=p.stopByBend[st.activeBend]===2?2:1;
 const finger=stopNumber===2?machine.support:machine.stop;
 const feature=gaugeContactFeature(finger,stopNumber);
 const fingerShape=gaugeOutline(finger,stopNumber);
 const fingerReach=Math.max(0,...fingerShape.map(q=>q.x));
 const gaugeSeatOffset=feature.surface==='horizontal-top'?p.thickness/2:0;
 const anchorOrigin={x:gaugeAnchor.x-feature.point.x,
  y:gaugeAnchor.y-gaugeSeatOffset-feature.point.y};
 const fixedFingerPolygon=fingerShape.map(q=>({
  x:q.x+anchorOrigin.x,y:q.y+anchorOrigin.y
 }));
 const cacheKey=JSON.stringify([
  p.flanges,p.angles,p.thickness,p.width,p.order,p.stopByBend,
  p.gaugeSideByBend,p.gaugeSegmentByBend,p.gaugePointByBend,
  p.punch,p.die,p.kFactor,p.radius,p.material,p.punchOrientation,
  machine.profileId||machine.name,st.activeOperation,reference.side,
  gaugeAnchor,finger,die.opening
 ]);
 let prediction=gaugePlanCache.get(cacheKey);
 if(!prediction){
  const fractionsForBend=[.44,.48,.52,.56,.60,.64,.68,.72,.76,.8,.83];
  const nominalRadius=development(p).radius;
  const sheetSamples=fractionsForBend.map(relative=>{
   const next=stage(p,st.activeOperation*5+5*relative);
   const projected=presentedAtStage(p,next);
   const points=projected.points.map(pt=>({...pt,x:(feedMirror?-1:1)*pt.x}));
   const modeled=contactKinematics({
    points,activeBend:st.activeBend,
    angle:p.angles[st.activeBend]*next.fractions[st.activeBend],
    opening:die.opening,dieDepth:die.depth,thickness:t,
    phase:next.phase,press:next.press,insideRadius:nominalRadius,
    feedMirrored:feedMirror,
    repositionProgress:projected.repositioning?projected.progress:1,
    presentationLift:projected.clearanceLift??0
   });
   return {at:relative,sheet:modeled.sheet};
  });
  const gaugePlan=planGaugeRetraction({
   sheetSamples,polygon:fixedFingerPolygon,thickness:t,contact:gaugeAnchor,
   geometryDocumented:machine.gaugeGeometryDocumented!==false,
   inspect:(sample,polygon,thickness,contact)=>
    inspectGaugeProfile(sample.sheet,polygon,thickness,contact,{
     supportShelf:feature.surface==='horizontal-top'?{
      seated:resolvedGauge.valid,
      from:{x:anchorOrigin.x+feature.from.x,y:anchorOrigin.y+feature.from.y},
      to:{x:anchorOrigin.x+feature.to.x,y:anchorOrigin.y+feature.to.y}
     }:null
    })
  });
  const maxSheetX=Math.max(gaugeAnchor.x,...sheetSamples.flatMap(
   sample=>sample.sheet.map(q=>q.x)));

  prediction={gaugePlan,maxSheetX};
  gaugePlanCache.set(cacheKey,prediction);
  if(gaugePlanCache.size>24)gaugePlanCache.delete(gaugePlanCache.keys().next().value);
 }
 const {gaugePlan,maxSheetX}=prediction;
 // Nunca resolver una preparación que YA colisiona moviendo el dedo.
 // Primero corregir el apoyo/volteo; la retirada sólo libera un
 // obstáculo que aparece DESPUÉS de sujetar una chapa bien apoyada.
 const gaugeSetup=resolvedGauge;
 const gaugeDecision={...gaugePlan,
  enabled:resolvedGauge.valid&&gaugePlan.enabled,
  setupValid:resolvedGauge.valid,
  setupReason:resolvedGauge.reason,
  needsSetupCorrection:!resolvedGauge.valid,
  autoSelected:resolvedGauge.autoSelected,
  referenceSegment:reference.segmentIndex};
 let target=null;
 if(st.activeOperation<p.order.length-1&&
    Number.isFinite(nextResolved.point?.x)&&Number.isFinite(nextResolved.point?.y)){
  // Es obligatorio llegar geométricamente a la referencia propuesta del
  // próximo golpe incluso si el apoyo es inválido. Sin este destino, el
  // dedo quedaba aparcado y TELETRANSPORTABA al comenzar el golpe nuevo.
  // Llegar a esa coordenada NO autoriza el contacto: la validación
  // inicial sigue señalando el apoyo erróneo en rojo.
  target={x:nextResolved.point.x,y:nextResolved.point.y};
 }
 const sub=st.completed?1:(st.time/5)%1;
 const gaugeTransition=gaugeRetractionPath({
  anchor:gaugeAnchor,target,maxSheetX,fingerReach,
  opening:die.opening,sub,enabled:gaugeDecision.enabled
 });
 const kinematics=contactKinematics({
  points:presentation.points,activeBend:st.activeBend,
  angle:p.angles[st.activeBend]*st.fractions[st.activeBend],
  opening:die.opening,dieDepth:die.depth,thickness:t,
  phase:st.phase,press:st.press,
  insideRadius:development(p).radius,
  feedMirrored:feedMirror,
  repositionProgress:presentation.repositioning?presentation.progress:1,
  presentationLift:presentation.clearanceLift??0
 });
 const sheet=kinematics.sheet;
 // Mantener los radios visibles de TODOS los golpes ejecutados, en vez de
 // redondear sólo el pliegue activo y perder los anteriores al avanzar.
 let sheetDisplay=sheet;
 for(let bend=p.angles.length-1;bend>=0;bend--){
  if(st.fractions[bend]>1e-5)
   sheetDisplay=roundedCorner(sheetDisplay,bend+1,
    kinematics.requestedCenterlineRadius);
 }
 const diePolygon=die.points.map(([x,y])=>mPoint(x,y-die.height));
 // Girar 180° el útil montado cambia el lado de su cuello y TODO el
 // contorno, no sólo la decoración. La misma poligonal se usa en la
 // cabina, la sección y el cribado de interferencias 2D.
 const punchX=p.punchOrientation==='reversed'?-1:1;
 const punchPolygon=punch.points.map(([x,y])=>mPoint(punchX*x,y+kinematics.tipHeight));
 const engagement=kinematics.sag;
 // Include the selected punch, the V and all sheet wings in view bounds.
 const world=technicalWorldBounds({
  piece:p,stage:st,sheet,sheetDisplay,diePolygon,punchPolygon,die,
  gaugeReference:reference,gaugeAnchor,gaugeTransition,gaugePlan:gaugeDecision,gaugeSetup,feedMirrored:feedMirror
 });
 return {piece:p,stage:st,presentation,sheet,sheetDisplay,kinematics,diePolygon,punchPolygon,die,punch,
         gaugeReference:reference,gaugeAnchor,gaugeTransition,gaugePlan:gaugeDecision,gaugeSetup,feedMirrored:feedMirror,
         dimensions:{opening:die.opening,dieAngle:die.angle,depth:die.depth,
           punchAngle:punch.angle,punchHeight:punch.height,
           punchTipDiameter:tooling.punch.tip,thickness:t,engagement},
         world,verified:false};
}

function gradient(ctx,x,y,w,h,colors){
 const g=ctx.createLinearGradient(x,y,x+w,y+h);
 colors.forEach(([stop,c])=>g.addColorStop(stop,c));return g;
}
function polygon(ctx,points,fill,stroke,width=1.5){
 ctx.beginPath();points.forEach((p,i)=>i?ctx.lineTo(p.x,p.y):ctx.moveTo(p.x,p.y));
 ctx.closePath();ctx.fillStyle=fill;ctx.fill();ctx.strokeStyle=stroke;
 ctx.lineWidth=width;ctx.stroke();
}
function drawLabel(ctx,text,x,y,color='#c7e7f8',size=12,align='left'){
 ctx.font='600 '+size+'px system-ui';ctx.fillStyle=color;ctx.textAlign=align;
 ctx.fillText(text,x,y);
}
function dimLine(ctx,a,b,caption,scale,color='#66ccff',vertical=false){
 const off=18,pa=vertical?{x:a.x-off,y:a.y}:{x:a.x,y:a.y-off};
 const pb=vertical?{x:b.x-off,y:b.y}:{x:b.x,y:b.y-off};
 ctx.strokeStyle=color;ctx.lineWidth=1;ctx.beginPath();
 ctx.moveTo(a.x,a.y);ctx.lineTo(pa.x,pa.y);
 ctx.moveTo(b.x,b.y);ctx.lineTo(pb.x,pb.y);
 ctx.moveTo(pa.x,pa.y);ctx.lineTo(pb.x,pb.y);ctx.stroke();
 const len=Math.hypot(pb.x-pa.x,pb.y-pa.y),dx=(pb.x-pa.x)/(len||1),dy=(pb.y-pa.y)/(len||1);
 for(const [end,sign] of [[pa,1],[pb,-1]]){
  ctx.beginPath();ctx.moveTo(end.x,end.y);
  ctx.lineTo(end.x+dx*sign*6+dy*3,end.y+dy*sign*6-dx*3);
  ctx.lineTo(end.x+dx*sign*6-dy*3,end.y+dy*sign*6+dx*3);
  ctx.fillStyle=color;ctx.fill();
 }
 drawLabel(ctx,caption,(pa.x+pb.x)/2+(vertical?-5:0),(pa.y+pb.y)/2+(vertical?-3:-7),color,10,vertical?'right':'center');
}
export function drawTechnicalSection(ctx,w,h,piece,sim,view={}){
 const result=technicalScene(piece,sim.time),{stage:st,dimensions:d,presentation}=result;
 ctx.save();
 const bg=gradient(ctx,0,0,w,h,[[0,'#071c2f'],[.45,'#0d3046'],[1,'#061322']]);
 ctx.fillStyle=bg;ctx.fillRect(0,0,w,h);
 // En móvil la fila de mandos ocupa la parte inferior del visor.
 // Se resta esa franja ANTES de ajustar la escala, evitando cortar la matriz.
 const controlsReserve=w<500?67:0,drawHeight=h-controlsReserve;
 const bounds=result.world,padW=Math.max(28,w*.07),padH=Math.max(30,drawHeight*.095);
 const xRange=Math.max(60,bounds.maxX-bounds.minX),yRange=Math.max(100,bounds.maxY-bounds.minY);
 const scale=Math.max(.08,Math.min((w-padW*2)/xRange,(drawHeight-padH*2)/yRange))*(view.zoom||1);
 const mx=(bounds.minX+bounds.maxX)/2,my=(bounds.minY+bounds.maxY)/2;
 const map=pt=>({x:w*.5+(pt.x-mx)*scale+(view.panX||0),
  y:drawHeight*.5-(pt.y-my)*scale+(view.panY||0)});
 const poly=pts=>pts.map(map),origin=map(mPoint(0,0));
 // 10 mm metric grid. Draw only the visible grid; no browser zoom.
 const step=10;ctx.save();ctx.lineWidth=.55;ctx.strokeStyle='#83b2d920';
 let minX=Math.floor((mx-w/scale)*.1)*10,maxX=Math.ceil((mx+w/scale)*.1)*10;
 let minY=Math.floor((my-h/scale)*.1)*10,maxY=Math.ceil((my+h/scale)*.1)*10;
 for(let x=minX,c=0;x<=maxX&&c++<120;x+=step){
  const at=map(mPoint(x,0)).x;ctx.beginPath();ctx.moveTo(at,0);ctx.lineTo(at,h);ctx.stroke();
 }
 for(let y=minY,c=0;y<=maxY&&c++<120;y+=step){
  const at=map(mPoint(0,y)).y;ctx.beginPath();ctx.moveTo(0,at);ctx.lineTo(w,at);ctx.stroke();
 }
 ctx.restore();
 // Bed top / datum.
 ctx.setLineDash([6,5]);ctx.lineWidth=1;
 ctx.strokeStyle='#65a7ce5c';ctx.beginPath();ctx.moveTo(0,origin.y);
 ctx.lineTo(w,origin.y);ctx.stroke();ctx.setLineDash([]);
 // Tool contour is derived from die opening and included V-angle in mm.
 const dp=poly(result.diePolygon),dieFill=gradient(ctx,dp[0].x,0,dp.at(5).x,0,
 [[0,'#24576b'],[.24,'#85b6c5'],[.52,'#356e82'],[.75,'#9bcbd5'],[1,'#244359']]);
 ctx.save();ctx.shadowBlur=16;ctx.shadowColor='#000b';
 polygon(ctx,dp,dieFill,'#a2d5e9',1.7);ctx.restore();
 // Tope seleccionado detrás de la chapa, como en la foto de taller.
 // Sin reconstrucción CAD ni posición de los ejes X/R/Z de la máquina.
 const stopNumber=result.piece.stopByBend?.[st.activeBend]===2?2:1;
 const place=gaugePlacement(result,stopNumber);
 const v85=getActiveMachineConfig(),dimensions=place.profile==='support'?v85.support:v85.stop;
 const gp=gaugeContourAtContact(place,dimensions).map(map);
 ctx.save();ctx.lineWidth=1.8;
 const gaugeIssue=!!place.gaugeInterference?.warning;
 const gaugeFill=gaugeIssue?'#7b342c':place.alignedToSheet?'#37865f':'#265746';
 polygon(ctx,gp,gaugeFill,gaugeIssue?'#ff8a71':'#a1f4c7',1.8);
 // La sección técnica usa la misma CARA STOP / ESCALÓN SUPPORT
 // y la misma escala en mm que la vista de máquina.
 if(place.contact){
  const a=map(place.contact.from),b=map(place.contact.to);
  ctx.lineWidth=3.2;ctx.strokeStyle=gaugeIssue?'#ff8673':
   place.alignedToSheet?'#dbffe7':'#ffca8d';
  ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(b.x,b.y);ctx.stroke();
  if(place.contact.surface==='horizontal-top'&&place.contact.frontFace){
   const u=map(place.contact.frontFace.from),v=map(place.contact.frontFace.to);
   ctx.strokeStyle=gaugeIssue?'#ff8673':'#8dd9ff';
   ctx.beginPath();ctx.moveTo(u.x,u.y);ctx.lineTo(v.x,v.y);ctx.stroke();
  }
 }
 const nose=map(place.contact?.point||place.point);
 ctx.beginPath();ctx.arc(nose.x,nose.y,3.2,0,Math.PI*2);
 ctx.fillStyle=gaugeIssue?'#ff8673':place.alignedToSheet?'#c7ffe7':'#ffb567';ctx.fill();
 ctx.restore();
  const pp=poly(result.punchPolygon),punchFill=gradient(ctx,pp[0].x,0,pp[1].x,0,
 [[0,'#435d6f'],[.17,'#d7ebf2'],[.4,'#809cac'],[.55,'#e7f5f9'],[.8,'#637f95'],[1,'#253f57']]);
 ctx.save();ctx.globalAlpha=view.transparent?.34:1;
 ctx.shadowColor='#000b';ctx.shadowBlur=11;
 polygon(ctx,pp,punchFill,'#d8f1ff',1.35);ctx.restore();
 // Sheet from the current accumulated bend state, not a finished omega.
 const sp=poly(result.sheetDisplay);
 ctx.save();ctx.beginPath();sp.forEach((p,i)=>i?ctx.lineTo(p.x,p.y):ctx.moveTo(p.x,p.y));
 ctx.lineJoin='round';ctx.lineCap='round';ctx.lineWidth=Math.max(1.4,d.thickness*scale);
 ctx.strokeStyle='#f6aa4e';ctx.shadowColor='#ffb15377';ctx.shadowBlur=5;
 ctx.stroke();ctx.lineWidth=.9;ctx.strokeStyle='#ffe7aa';ctx.stroke();ctx.restore();
 // Remarcar el perímetro del punzón SOBRE la chapa, para que su filo
 // no se esconda por el trazo de la pieza ni se confunda con la trancha.
 ctx.save();ctx.lineJoin='round';ctx.lineWidth=2.4;
 ctx.shadowColor='#9fe8ff';ctx.shadowBlur=9;
 ctx.strokeStyle='#ffffff';ctx.beginPath();
 pp.forEach((p,i)=>i?ctx.lineTo(p.x,p.y):ctx.moveTo(p.x,p.y));
 ctx.closePath();ctx.stroke();ctx.restore();
 // Contact marker: graphic, not a load/force calculation.
 if(st.press>=.45&&st.press<.84){
  const cp=map(mPoint(0,result.sheet[st.activeBend+1]?.y??d.thickness/2));
  ctx.fillStyle='#ffbd51';ctx.beginPath();ctx.arc(cp.x,cp.y,Math.max(2.5,3*scale),0,Math.PI*2);ctx.fill();
 }
 if(w>300&&scale>0.22){
  const left=map(mPoint(-d.opening/2,0)),right=map(mPoint(d.opening/2,0));
  dimLine(ctx,left,right,'V '+d.opening+' mm',scale);
 }
 // On-screen legends are separated from the tool contact area.
 const badge=(text,x,y,fill)=>{
  ctx.font='700 11px system-ui';const width=ctx.measureText(text).width+16;
  ctx.fillStyle=fill;ctx.fillRect(x,y-13,width,20);
  drawLabel(ctx,text,x+8,y+1,'#f2f9ff',11);
 };
 if(w<500){
  // Fichas reducidas sin tapar la cabeza del punzón en pantallas estrechas.
  badge('P '+d.punchAngle+'°',9,17,'#315878de');
  badge('V'+d.opening+'/'+d.dieAngle+'°',9,39,'#1a5a69db');
  badge('e '+d.thickness+' mm',9,61,'#7c531cdb');
  badge('TOPE '+stopNumber,9,83,'#176445db');
 }else{
  badge('PUNZÓN '+d.punchAngle+'°',9,22,'#315878de');
  badge('MATRIZ V'+d.opening+' / '+d.dieAngle+'°',9,49,'#1a5a69db');
  badge('CHAPA '+d.thickness+' mm',9,76,'#7c531cdb');
  badge('TOPE '+stopNumber+' · REFERENCIA',9,103,'#176445db');
 }
 drawLabel(ctx,st.phase+' · pliegue '+(st.activeBend+1),w-11,18,'#d6eefb',11,'right');
 // En móvil se reserva una banda inferior para los mandos táctiles:
 // ni la escala ni la advertencia quedan debajo de los botones.
 const compact=w<500,footerY=compact?h-58:h-8,scaleBarY=compact?h-76:h-23;
 if(presentation.flipped)drawLabel(ctx,'Presentación volteada: '+result.piece.angles[st.activeBend]+'°',
  w-10,compact?h-103:h-33,'#ffca79',10,'right');
 if(w>=310){
  const x=14,y=scaleBarY,bar=20*scale;
  ctx.strokeStyle='#e5f4ff';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x+bar,y);ctx.stroke();
  drawLabel(ctx,'20 mm',x+bar/2,y-6,'#b9dbee',10,'center');
 }
 drawLabel(ctx,'SECCIÓN PARAMÉTRICA · CONTACTO NO CERTIFICADO',
  w/2,footerY,'#93bbcc',Math.max(8,Math.min(11,w/44)),'center');
 ctx.restore();
 return result;
}
