/**
 * Posición VISUAL del tope respecto al borde trasero de la chapa.
 * Sección 2D ilustrativa, no programa CNC X/R ni garantía de apoyo.
 */
import {getV85,gaugeContactFeature,gaugeOutline} from './machine-config.js';
import {inspectGaugeProfile} from './gauge-interference.js';

/**
 * R37: un vértice interior puede referenciar la CARA exterior de un ala
 * ya plegada. El contacto requiere un segmento vertical y que el otro
 * segmento avance hacia la izquierda de la chapa. La cara exterior se
 * encuentra e/2 a la DERECHA de la fibra media (+X), no sobre el escalón.
 */
export function gaugeFoldedFlangeFace(points,index,thickness=2){
 if(!Array.isArray(points)||!Number.isInteger(index)||
  index<=0||index>=points.length-1)return null;
 const edge=points[index],t=Number(thickness);
 if(!Number.isFinite(t)||t<=0||
  !Number.isFinite(edge?.x)||!Number.isFinite(edge?.y))return null;
 const margin=Math.max(.12,Math.min(.5,t*.12));
 const tolerance=Math.max(.05,Math.min(.35,t*.05));
 const neighbours=[index-1,index+1].map(j=>({index:j,point:points[j]}));
 const vertical=neighbours.filter(({point})=>
  Number.isFinite(point?.x)&&Number.isFinite(point?.y)&&
  Math.abs(point.x-edge.x)<=tolerance&&
  Math.abs(point.y-edge.y)>=Math.max(2,t));
 if(vertical.length!==1)return null;
 const other=neighbours.find(n=>n.index!==vertical[0].index)?.point;
 if(!Number.isFinite(other?.x)||other.x>edge.x-margin)return null;
 const far=vertical[0].point;
 return {kind:'folded-flange-front',index,adjacentIndex:vertical[0].index,
  fiberX:edge.x,faceX:edge.x+t/2,referenceY:edge.y,
  faceLow:Math.min(edge.y,far.y),faceHigh:Math.max(edge.y,far.y),
  thickness:t,verified:false};
}
/** Contacto válido sólo si el resto de la chapa viene de la IZQUIERDA. */
export function sheetInFrontOfGauge(scene,index,anchor,thickness=2){
 const sheet=scene?.sheet;
 if(!Array.isArray(sheet)||sheet.length<2||!Number.isInteger(index)||
  index<0||index>=sheet.length|| (index!==0&&index!==sheet.length-1))return false;
 const neighbour=sheet[index===0?1:index-1];
 const margin=Math.max(.12,Math.min(.5,thickness*.12));
 return Number.isFinite(neighbour?.x)&&Number.isFinite(anchor?.x)&&
  neighbour.x<=anchor.x-margin;
}
/**
 * Solape vertical de la cara de detención con TODO el espesor del canto.
 * Un segmento vertical en contacto con la fibra media no basta por sí solo
 * para demostrar que el tope puede detener la chapa en 2D.
 * Sólo una comprobación de sección; no dimensiona fuerzas ni CNC.
 */
export function gaugeStopOverlap(feature,thickness=2){
 const t=Math.max(.2,Number(thickness)||2);
 const face=feature?.surface==='horizontal-top'?feature.frontFace:
  {from:feature?.from,to:feature?.to};
 const center=feature?.point?.y+(feature?.surface==='horizontal-top'?t/2:0);
 if(!face?.from||!face?.to||!Number.isFinite(center)||
    ![face.from.x,face.to.x,face.from.y,face.to.y].every(Number.isFinite))
  return {valid:false,overlap:0,minimum:Math.max(.25,t*.25),
   reason:'cara de parada no definida'};
 const left=Math.min(face.from.y,face.to.y),right=Math.max(face.from.y,face.to.y);
 const sheetLow=center-t/2,sheetHigh=center+t/2;
 const overlap=Math.max(0,Math.min(right,sheetHigh)-Math.max(left,sheetLow));
 const minimum=Math.max(.25,t*.25);
 return {valid:Math.abs(face.from.x-face.to.x)<1e-5&&
  Math.abs(face.from.x-feature.point.x)<1e-5&&overlap+1e-8>=minimum,
  overlap,minimum,reason:overlap>=minimum?'solape vertical nominal':
   'cara de parada demasiado baja para el espesor',
  faceLow:left,faceHigh:right,sheetLow,sheetHigh};
}
/**
 * Comprueba que la cara INFERIOR de la chapa queda sobre una longitud real
 * de repisa en Support 2, no únicamente coincidiendo en un vértice.
 * El Stop frontal no necesita apoyo horizontal: sólo contacto frontal.
 * La orientación completa del dedo se conserva (cuerpo a la derecha).
 */
export function gaugeSeatAssessment(scene,index,anchor,thickness,feature){
 const vertical=gaugeStopOverlap(feature,thickness);
 const folded=gaugeFoldedFlangeFace(scene?.sheet,index,thickness);
 if(folded&&feature.surface==='vertical-front'){
  const faceLow=anchor.y+Math.min(feature.from.y,feature.to.y)-feature.point.y;
  const faceHigh=anchor.y+Math.max(feature.from.y,feature.to.y)-feature.point.y;
  const overlap=Math.max(0,Math.min(faceHigh,folded.faceHigh)-
   Math.max(faceLow,folded.faceLow));
  const minimum=Math.max(.5,Math.min(2,thickness*.25));
  const xError=Math.abs(anchor.x-folded.faceX);
  const seated=overlap+1e-8>=minimum&&xError<=Math.max(.12,thickness*.05);
  return {required:false,seated,
   reason:seated?'cara exterior del ala vertical contra frente del tope':
    'ala plegada sin cara frontal accesible o sin solape en altura',
   overlap,minimum,xError,flange:folded,vertical};
 }
 if(feature.surface!=='horizontal-top')
  return {required:false,seated:vertical.valid,
   reason:vertical.valid?'cara frontal de parada con solape de espesor':
    'cara frontal sin solape suficiente para detener el canto',
   vertical};
 // En el vídeo IMG_9033.mp4 la repisa BAJA sostiene la chapa y
 // una contrahuella vertical detrás SUBE para detener su canto.
 // No declarar "apoyado" si la cara de parada está ABAJO, desplazada
 // o ausente: ese fue el error de las versiones anteriores.
 const wall=feature.frontFace;
 const lip=feature.to;
 if(!wall||!lip||
  Math.abs(wall.from.x-lip.x)>.001||
  Math.abs(wall.from.y-lip.y)>.001||
  Math.abs(wall.to.x-wall.from.x)>.001||
  wall.to.y<=wall.from.y+.2)
  return {required:true,seated:false,reason:'escalón sin pared vertical ascendente de parada'};
 if(!vertical.valid)
  return {required:true,seated:false,
   reason:'contrahuella sin solape suficiente con el espesor',vertical};
 const sheet=scene?.sheet;
 if(!Array.isArray(sheet)||!Number.isInteger(index)||
   (index!==0&&index!==sheet.length-1))
  return {required:true,seated:false,reason:'sin extremo libre'};
 const edge=sheet[index],neighbour=sheet[index===0?1:index-1];
 const dx=edge?.x-neighbour?.x,ledge=feature.to.x-feature.from.x;
 const effective=Math.min(dx/2,ledge/2);
 const minSpan=Math.max(.7,Math.min(2,thickness));
 if(!Number.isFinite(dx)||!Number.isFinite(ledge)||
  dx<=0||ledge<=0||effective<minSpan)
  return {required:true,seated:false,reason:'sin ala horizontal suficiente'};
 const sampleY=edge.y+(neighbour.y-edge.y)*effective/dx;
 const deviation=Math.abs(sampleY-edge.y);
 const tolerance=Math.max(.2,Math.min(.7,thickness*.16));
 // La repisa queda a e/2 bajo la fibra de la chapa, ver contactAt.
 const seated=deviation<=tolerance &&
  Math.abs(feature.point.y-feature.to.y)<1e-8;
 return {required:true,seated,reason:seated?'apoyo horizontal y parada sobre contrahuella':
  'ala inclinada: no asienta sobre la repisa',
  overlap:effective,deviation,tolerance,vertical};
}
/** Mismo contacto nominal de la chapa, pero distinta cara física del dedo. */
export function gaugePlacement(scene,stopNumber=1){
 const points=(scene?.sheetDisplay||[]).filter(p=>
  Number.isFinite(p.x)&&Number.isFinite(p.y));
 const opening=Math.max(0,Number(scene?.die?.opening)||16);
 const thickness=Math.max(.2,Number(scene?.piece?.thickness)||2);
 const selected=stopNumber===2?2:1;
 const dimensions=selected===2?getV85().support:getV85().stop;
 const activeBend=scene?.stage?.activeBend??0;
 const contactMode=scene?.piece?.gaugeContactByBend?.[activeBend]==='shelf'?
  'shelf':'front';
 const feature=gaugeContactFeature(dimensions,selected,contactMode);
 // Revisar el sólido del dedo, no sólo la posición de su cara nominal.
 // La foto/vídeo mostró la chapa atravesando el perfil del tope aunque
 // el marcador verde siguiera anunciando contacto.
 const review=placement=>{
  const contour=gaugeContourAtContact(placement,dimensions);
  const result=inspectGaugeProfile(scene?.sheetDisplay||scene?.sheet,contour,
   thickness,placement.point);
  if(!result.warning)return {...placement,gaugeInterference:result,
   verified:false};
  return {...placement,alignedToSheet:false,contactEngaged:false,
   gaugeInterference:result,
   state:(placement.state||'Apoyo sin verificar')+
    ' · ⚠ Posible '+(result.kind==='penetracion'?'penetración':'falta de holgura')+
    ' 2D de chapa con el dedo '+selected+'; revisar apoyo y retirada del tope',
   verified:false};
 };
 const contactAt=edge=>{
  // En ambos dedos la cara de parada queda DELANTE del cuerpo.
  // Si toca un ala doblada edge.x ya es su cara EXTERIOR (fibra + e/2).
  const surface={x:edge.x,
   y:edge.y-(feature.surface==='horizontal-top'?thickness/2:0)};
  const origin={x:surface.x-feature.point.x,y:surface.y-feature.point.y};
  const toWorld=pt=>({x:origin.x+pt.x,y:origin.y+pt.y});
  return {kind:feature.kind,surface:feature.surface,
   label:feature.label,usable:feature.usable,
   origin,mirrorX:false,localContactX:feature.point.x,
   from:toWorld(feature.from),to:toWorld(feature.to),
   frontFace:feature.frontFace?{
    from:toWorld(feature.frontFace.from),to:toWorld(feature.frontFace.to)}:null,
   point:surface,verified:false};
 };
 // Nuevo modo: lado de apoyo elegido POR PLIEGUE, independiente de tipo
 // de dedo Stop/Support. La referencia es la chapa ANTES de deformarla:
 // la distancia nominal (p.ej. 50 mm) no salta a los 200 del otro extremo.
 if(scene?.gaugeReference&&scene?.gaugeAnchor){
  const reference=scene.gaugeReference;
  const original=scene.gaugeTransition?.point||scene.gaugeAnchor;
  const retreat=scene.gaugeTransition?0:Math.max(0,
   Number(scene.gaugeRetraction?.dxMm)||0);
  const a={x:original.x+retreat,y:original.y};
  const index=reference.sourceIndex;
  const freeEdge=index===0||index===(scene.sheet?.length||0)-1;
  const frontFlange=!freeEdge?gaugeFoldedFlangeFace(
   scene.gaugeSetupSheet||scene.sheet,index,thickness):null;
  const valid=[a.x,a.y,reference.distance].every(Number.isFinite);
  const edge=scene.sheet?.[index];
  const nominalSurfaceX=frontFlange?frontFlange.faceX:edge?.x;
  const gap=edge?Math.hypot(nominalSurfaceX-a.x,edge.y-a.y):Infinity;
  const approaching=['Posicionamiento','Aproximación'].includes(scene.stage?.phase);
  const sheetInFront=frontFlange?
   Math.abs(a.x-frontFlange.faceX)<=Math.max(.12,thickness*.05):
   sheetInFrontOfGauge(scene,index,a,thickness);
  const seat=gaugeSeatAssessment(
   frontFlange?{...scene,sheet:scene.gaugeSetupSheet||scene.sheet}:scene,
   index,a,thickness,feature);
  const accessibleFace=freeEdge||!!frontFlange;
  const contactEngaged=!scene.gaugeTransition&&retreat<=.001&&
    valid&&accessibleFace&&sheetInFront&&seat.seated&&
    feature.usable&&a.x>0&&approaching&&
    gap<=Math.max(.4,thickness*.28);
  return review({stopNumber:selected,profile:selected===2?'support':'stop',
   point:{x:a.x,y:a.y},contact:contactAt(a),contactMode,
   nominalDistance:reference.distance,
   referenceSide:reference.side,referenceLabel:reference.label,
   feedMirrored:!!scene.feedMirrored,sourceIndex:index,sheetInFront,
   moving:!!scene.gaugeTransition||retreat>.001,
   retracting:retreat>.001,retractDx:retreat,
   gaugeTransition:scene.gaugeTransition,
   seat,frontFlange,sheetEdgeFound:valid&&accessibleFace,alignedToSheet:contactEngaged,
   contactEngaged,contactGap:gap,
   freeEdge,referenceKind:freeEdge?'extremo libre':
    frontFlange?'cara frontal del ala plegada':'vértice interior sin apoyo',
   state:scene.gaugeTransition?'tope retirado y en traslación X/R al siguiente golpe':
    retreat>.001?'OPENING DX · retirada visual X '+retreat.toFixed(1)+
     ' mm. CNC real no verificado':
    !valid?'sin cota válida':!feature.usable?'sin cara física de apoyo definida':
    !accessibleFace?'apoyo sobre vértice interior: revisar':
    !sheetInFront?'⚠ La chapa llega por DETRÁS del tope; invertir la presentación':
    !seat.seated?'⚠ Sin contacto válido sobre la cara frontal del dedo':
    contactEngaged?frontFlange?'ala plegada contra cara frontal del tope':
     'borde presentado contra la cara frontal del tope':
    'referencia nominal fijada antes del golpe (sin contacto actual)',
   verified:false});
 }

 const ends=points.length>=2?[points[0],points.at(-1)]:[];
 // La foto de referencia muestra el tope DETRÁS del borde de chapa,
 // en el lado positivo del eje de alimentación. No confundir un nodo
 // interior plegado con un borde de apoyo.
 const rear=ends.filter(p=>p.x>opening/2+1).sort((a,b)=>b.x-a.x)[0];
 const visible=rear||points.filter(p=>p.x>opening/2+1).sort((a,b)=>b.x-a.x)[0];
 const validEdge=!!rear&&Math.abs(rear.y-thickness/2)<=Math.max(4,2*thickness);
 const parkedX=Math.max(opening/2+25,40);
 const edge=visible||{x:parkedX,y:thickness/2};
 const index=visible===points[0]?0:visible===points.at(-1)?points.length-1:-1;
 const neighbour=index===0?points[1]:index===points.length-1?points.at(-2):null;
 const sheetInFront=!!neighbour&&neighbour.x<edge.x-Math.max(.12,thickness*.12);
 const seat=gaugeSeatAssessment({sheet:points},index,edge,thickness,feature);
 return review({stopNumber:selected,profile:selected===2?'support':'stop',
  point:{...edge},contact:contactAt(edge),contactMode,sheetInFront,seat,
  sheetEdgeFound:!!rear,alignedToSheet:validEdge&&sheetInFront&&
   seat.seated&&feature.usable,
  state:!sheetInFront&&rear?'⚠ Chapa por detrás del dedo; revisar orientación':
   !seat.seated?'⚠ Chapa sin apoyo horizontal en el escalón':
   validEdge?'borde visible orientativo':rear?'borde inclinado o elevado':
   'sin borde trasero accesible',
  verified:false});
}

/**
 * Perfil métrico único usado por la cabina, la sección 2D y las pruebas.
 * La cara activa queda exactamente sobre la referencia de chapa; no
 * desplazamos la chapa ni cambiamos la longitud nominal del ala.
 */
export function gaugeContourAtContact(placement,values){
 const origin=placement.contact?.origin||placement.point;
 const selected=placement.stopNumber===2||placement.profile==='support'?2:1;
 return gaugeOutline(values,selected).map(p=>({
  x:origin.x+p.x,
  y:origin.y+p.y
 }));
}
