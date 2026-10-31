/**
 * Posición VISUAL del tope respecto al borde trasero de la chapa.
 * Sección 2D ilustrativa, no programa CNC X/R ni garantía de apoyo.
 */
export function gaugePlacement(scene,stopNumber=1){
 const points=(scene?.sheetDisplay||[]).filter(p=>
  Number.isFinite(p.x)&&Number.isFinite(p.y));
 const opening=Math.max(0,Number(scene?.die?.opening)||16);
 const thickness=Math.max(.2,Number(scene?.piece?.thickness)||2);
 const selected=stopNumber===2?2:1;
 // Nuevo modo: lado de apoyo elegido POR PLIEGUE, independiente de tipo
 // de dedo Stop/Support. La referencia es la chapa ANTES de deformarla:
 // la distancia nominal (p.ej. 50 mm) no salta a los 200 del otro extremo.
 if(scene?.gaugeReference&&scene?.gaugeAnchor){
  const reference=scene.gaugeReference,a=scene.gaugeAnchor;
  const index=reference.sourceIndex;
  const freeEdge=index===0||index===(scene.sheet?.length||0)-1;
  const valid=[a.x,a.y,reference.distance].every(Number.isFinite);
  return {stopNumber:selected,profile:selected===2?'support':'stop',
   point:{x:a.x,y:a.y},nominalDistance:reference.distance,
   referenceSide:reference.side,referenceLabel:reference.label,
   feedMirrored:!!scene.feedMirrored,sourceIndex:index,
   sheetEdgeFound:valid&&freeEdge,alignedToSheet:valid&&a.x>0&&freeEdge,
   freeEdge,referenceKind:freeEdge?'extremo libre':'vértice interior plegado',
   state:!valid?'sin cota válida':!freeEdge?'apoyo sobre vértice interior: revisar':'referencia nominal previa al golpe',
   verified:false};
 }

 const ends=points.length>=2?[points[0],points.at(-1)]:[];
 // La foto de referencia muestra el tope DETRÁS del borde de chapa,
 // en el lado positivo del eje de alimentación. No confundir un nodo
 // interior plegado con un borde de apoyo.
 const rear=ends.filter(p=>p.x>opening/2+1).sort((a,b)=>b.x-a.x)[0];
 const visible=rear||points.filter(p=>p.x>opening/2+1).sort((a,b)=>b.x-a.x)[0];
 const validEdge=!!rear&&Math.abs(rear.y-thickness/2)<=Math.max(4,2*thickness);
 const parkedX=Math.max(opening/2+25,40);
 return {stopNumber:selected,profile:selected===2?'support':'stop',
  point:visible?{x:visible.x,y:visible.y}:{x:parkedX,y:thickness/2},
  sheetEdgeFound:!!rear,alignedToSheet:validEdge,
  state:validEdge?'borde visible orientativo':rear?'borde inclinado o elevado':'sin borde trasero accesible',
  verified:false};
}
