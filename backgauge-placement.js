/**
 * Posición VISUAL del tope respecto al borde trasero de la chapa.
 * Sección 2D ilustrativa, no programa CNC X/R ni garantía de apoyo.
 */
import {getV85,gaugeContactFeature,gaugeOutline} from './machine-config.js';
import {inspectGaugeProfile} from './gauge-interference.js';

/** Mismo contacto nominal de la chapa, pero distinta cara física del dedo. */
export function gaugePlacement(scene,stopNumber=1){
 const points=(scene?.sheetDisplay||[]).filter(p=>
  Number.isFinite(p.x)&&Number.isFinite(p.y));
 const opening=Math.max(0,Number(scene?.die?.opening)||16);
 const thickness=Math.max(.2,Number(scene?.piece?.thickness)||2);
 const selected=stopNumber===2?2:1;
 const dimensions=selected===2?getV85().support:getV85().stop;
 const feature=gaugeContactFeature(dimensions,selected);
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
  // Mantener X del borde de chapa. Stop toca la cara frontal vertical;
  // Support apoya SOBRE el escalón, a e/2 bajo la fibra media de chapa.
  const support=selected===2;
  const surface={x:edge.x,y:edge.y-(support?thickness/2:0)};
  const origin={x:surface.x-feature.point.x,y:surface.y-feature.point.y};
  const toWorld=pt=>({x:origin.x+pt.x,y:origin.y+pt.y});
  return {kind:feature.kind,surface:feature.surface,
   label:feature.label,usable:feature.usable,
   origin,mirrorX:false,localContactX:feature.point.x,
   from:toWorld(feature.from),to:toWorld(feature.to),
   point:surface,verified:false};
 };
 // Nuevo modo: lado de apoyo elegido POR PLIEGUE, independiente de tipo
 // de dedo Stop/Support. La referencia es la chapa ANTES de deformarla:
 // la distancia nominal (p.ej. 50 mm) no salta a los 200 del otro extremo.
 if(scene?.gaugeReference&&scene?.gaugeAnchor){
  const reference=scene.gaugeReference,a=scene.gaugeAnchor;
  const index=reference.sourceIndex;
  const freeEdge=index===0||index===(scene.sheet?.length||0)-1;
  const valid=[a.x,a.y,reference.distance].every(Number.isFinite);
  const edge=scene.sheet?.[index];
  const gap=edge?Math.hypot(edge.x-a.x,edge.y-a.y):Infinity;
  const approaching=['Posicionamiento','Aproximación'].includes(scene.stage?.phase);
  const contactEngaged=valid&&freeEdge&&feature.usable&&a.x>0&&
    approaching&&gap<=Math.max(.4,thickness*.28);
  return review({stopNumber:selected,profile:selected===2?'support':'stop',
   point:{x:a.x,y:a.y},contact:contactAt(a),nominalDistance:reference.distance,
   referenceSide:reference.side,referenceLabel:reference.label,
   feedMirrored:!!scene.feedMirrored,sourceIndex:index,
   sheetEdgeFound:valid&&freeEdge,alignedToSheet:contactEngaged,
   contactEngaged,contactGap:gap,
   freeEdge,referenceKind:freeEdge?'extremo libre':'vértice interior plegado',
   state:!valid?'sin cota válida':!feature.usable?'sin cara física de apoyo definida':
    !freeEdge?'apoyo sobre vértice interior: revisar':
    contactEngaged?'borde presentado contra la cara seleccionada':
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
 return review({stopNumber:selected,profile:selected===2?'support':'stop',
  point:visible?{x:visible.x,y:visible.y}:{x:parkedX,y:thickness/2},
  contact:contactAt(visible||{x:parkedX,y:thickness/2}),
  sheetEdgeFound:!!rear,alignedToSheet:validEdge&&feature.usable,
  state:validEdge?'borde visible orientativo':rear?'borde inclinado o elevado':'sin borde trasero accesible',
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
