/**
 * R50 · Resuelve el apoyo en la CARA FRONTAL del dedo, antes de ordenar
 * cualquier retroceso. Sección 2D orientativa, sin CAD volumétrico CNC.
 *
 * La opción automática examina los dos bordes libres físicos de la pieza,
 * NO los extremos de los segmentos que terminan en vértices interiores.
 * La selección MANUAL del operario no se modifica ni se sustituye.
 */
import {normalized,gaugeReference,gaugePointOnProfile,presentedForMachine} from './engine.js';
import {gaugeOutline,gaugeContactFeature} from './machine-config.js';
import {inspectGaugeProfile} from './gauge-interference.js';
const validNumber=x=>Number.isFinite(x);
/**
 * Apoyo lateral de una pestaña YA PLEGADA. Un vértice interior también
 * puede presentar una cara vertical física delante del Stop 1.
 * Sólo se admite en la sección 2D si el ala seleccionada llega desde
 * la izquierda, la pestaña adyacente es vertical y la pared del dedo
 * solapa una longitud real de esa pestaña. NO certifica contacto 3D.
 */
export function nominalFoldedWingSeat(positions,ref,feature,thickness=2){
 const index=ref?.sourceIndex,pivotIndex=ref?.pivotIndex;
 if(ref?.freeEdge||ref?.atEnd!==true||feature?.surface!=='vertical-front'||
    !Number.isInteger(index)||index<=0||index>=positions?.length-1||
    !Number.isInteger(pivotIndex))return false;
 const end=positions[index],pivot=positions[pivotIndex];
 if(!end||!pivot||pivot.x>end.x-Math.max(.12,thickness*.12))return false;
 const tolerance=Math.max(.08,Math.min(.3,thickness*.1));
 const candidates=[index-1,index+1].filter(i=>i!==pivotIndex);
 for(const i of candidates){
  const leg=positions[i];
  if(!leg||Math.abs(leg.x-end.x)>tolerance||
     Math.abs(leg.y-end.y)<Math.max(2,thickness*2))continue;
  const faceLo=end.y+Math.min(feature.from.y,feature.to.y)-feature.point.y;
  const faceHi=end.y+Math.max(feature.from.y,feature.to.y)-feature.point.y;
  const overlap=Math.max(0,Math.min(faceHi,Math.max(end.y,leg.y))-
   Math.max(faceLo,Math.min(end.y,leg.y)));
  if(overlap>=Math.max(.35,thickness*.25))return true;
 }
 return false;
}
export function evaluateGaugeSetup(piece,st,ref,config,stopNumber=1){
 const p=normalized(piece);
 const finger=stopNumber===2?config.support:config.stop;
 const feature=gaugeContactFeature(finger,stopNumber);
 const base=[...st.fractions];base[st.activeBend]=0;
 const setup=presentedForMachine(p,base,st.activeBend);
 const mirror=ref.side==='before'?-1:1;
 const positions=setup.points.map(q=>({x:q.x*mirror,y:q.y+p.thickness/2}));
 const nominalPoint=gaugePointOnProfile(positions,ref);
 const foldedWingContact=nominalPoint&&
  nominalFoldedWingSeat(positions,ref,feature,p.thickness);
 // La cara real de la pestaña ya plegada está e/2 a la derecha
 // de la fibra media. Sin este desfase el dedo invadía la chapa.
 const point=foldedWingContact?
  {x:nominalPoint.x+p.thickness/2,y:nominalPoint.y}:nominalPoint;
 const clearInvalid={valid:false,verified:false,reason:'sin cara frontal accesible',
  warning:true,polygon:[],point:null,ref,geometryVerified:false};
 if(!point||!validNumber(point.x)||!validNumber(point.y))
  return {...clearInvalid,reason:'punto de referencia no válido'};
 const surfaceY=point.y-(feature.surface==='horizontal-top'?p.thickness/2:0);
 const poly=gaugeOutline(finger,stopNumber).map(q=>({
  x:point.x-feature.point.x+q.x,y:surfaceY-feature.point.y+q.y
 }));
 const neighbourIndex=ref.sourceIndex===0?1:
  ref.sourceIndex===positions.length-1?positions.length-2:null;
 const neighbour=neighbourIndex==null?null:positions[neighbourIndex];
 const margin=Math.max(.12,Math.min(.5,p.thickness*.12));
 const fullContact=!!((ref.freeEdge&&neighbour&&
  neighbour.x<=point.x-margin&&point.x>0)||
  (foldedWingContact&&point.x>0));
 const wall=feature.surface==='horizontal-top'?feature.frontFace:feature;
 const surface=!!wall?.from&&!!wall?.to&&feature.usable&&
  Math.abs(wall.from.x-wall.to.x)<1e-6;
 // Support 2 apoya POR DEBAJO de la chapa en la repisa y su canto
 // coincide con pared ascendente, nunca encima del bloque trasero.
 const shelfSeat=feature.surface!=='horizontal-top'||(
  !!neighbour&&(point.x-neighbour.x)>Math.max(.7,Math.min(2,p.thickness))&&
  Math.abs(point.y-neighbour.y)<=Math.max(.35,p.thickness*.22)
 );
 const toWorld=q=>({x:point.x-feature.point.x+q.x,
   y:surfaceY-feature.point.y+q.y});
 const collision=inspectGaugeProfile(positions,poly,p.thickness,point,{
  supportShelf:feature.surface==='horizontal-top'?
   {seated:shelfSeat,from:toWorld(feature.from),to:toWorld(feature.to)}:null
 });
 const valid=fullContact&&surface&&shelfSeat&&!collision.warning;
 return {valid,ref,stopNumber,point,polygon:poly,warning:collision.warning,
  interference:collision,freeEdge:ref.freeEdge,
  foldedWingContact:!!foldedWingContact,
  contactMode:foldedWingContact?'pestana-plegada-lateral':'canto-libre',
  faceAccessible:fullContact,
  geometryVerified:config.gaugeGeometryDocumented===true,
  verified:false,reason:!ref.freeEdge&&!foldedWingContact?
    'Referencia interior sin cara vertical de pestaña accesible':
   !fullContact?'El borde no llega por delante de la cara frontal del tope':
   !surface?'La cara del dedo no puede detener el canto':
   !shelfSeat?'Support 2: la chapa inclinada no se apoya correctamente sobre la repisa inferior':
   collision.warning?'La chapa invade o roza el sólido del dedo ANTES del plegado':
   foldedWingContact?'Cara lateral de pestaña plegada contra Stop 1 · sección 2D provisional':
   'Canto libre contra cara frontal sin interferencia 2D en preparación'};
}
export function resolveGaugeSetup(piece,st,config){
 const p=normalized(piece),bend=st.activeBend;
 const stopNumber=p.stopByBend[bend]===2?2:1;
 const original=gaugeReference(p,bend);
 const isManual=p.gaugeSideByBend[bend]!=='auto'||
  p.gaugeSegmentByBend[bend]!==null||p.gaugePointByBend[bend]!==null;
 const first=evaluateGaugeSetup(p,st,original,config,stopNumber);
 if(isManual)return {...first,manual:true,candidates:[first],autoSelected:false};
 const candidates=[first];
 for(const segment of [0,p.flanges.length-1]){
  if(segment===original.segmentIndex&&original.freeEdge)continue;
  const draft={...p,gaugeSegmentByBend:[...p.gaugeSegmentByBend]};
  draft.gaugeSegmentByBend[bend]=segment;
  const reference=gaugeReference(draft,bend);
  candidates.push(evaluateGaugeSetup(draft,st,reference,config,stopNumber));
 }
 // Sólo aceptar selección automática si hay contacto FRONTAL sin invasión.
 // Si ninguno pasa, preservar referencia y mostrar ERROR (no un verde falso).
 const possible=candidates.filter(x=>x.valid);
 // La referencia automática original representa la primera opción de
 // presentación, definida por extremo libre y orden del programa.
 // NO cambiar de cara si ya es válida: el selector anterior ordenaba por
 // segmento 0 en caso de empate y volteaba G3->P4 de la Omega sin razón.
 const best=first.valid?first:possible.sort((a,b)=>{
  const aDistance=a.ref.distance,bDistance=b.ref.distance;
  return aDistance-bDistance||a.ref.segmentIndex-b.ref.segmentIndex;
 })[0]??first;
 return {...best,manual:false,candidates,autoSelected:best!==first,
  noSafeContact:possible.length===0};
}
