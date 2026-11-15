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
export function evaluateGaugeSetup(piece,st,ref,config,stopNumber=1){
 const p=normalized(piece);
 const finger=stopNumber===2?config.support:config.stop;
 const feature=gaugeContactFeature(finger,stopNumber);
 const base=[...st.fractions];base[st.activeBend]=0;
 const setup=presentedForMachine(p,base,st.activeBend);
 const mirror=ref.side==='before'?-1:1;
 const positions=setup.points.map(q=>({x:q.x*mirror,y:q.y+p.thickness/2}));
 const point=gaugePointOnProfile(positions,ref);
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
 const fullContact=!!(ref.freeEdge&&neighbour&&
  neighbour.x<=point.x-margin&&point.x>0);
 const wall=feature.surface==='horizontal-top'?feature.frontFace:feature;
 const surface=!!wall?.from&&!!wall?.to&&feature.usable&&
  Math.abs(wall.from.x-wall.to.x)<1e-6;
 // Support 2 apoya POR DEBAJO de la chapa en la repisa y su canto
 // coincide con pared ascendente, nunca encima del bloque trasero.
 const shelfSeat=feature.surface!=='horizontal-top'||(
  !!neighbour&&(point.x-neighbour.x)>Math.max(.7,Math.min(2,p.thickness))&&
  Math.abs(point.y-neighbour.y)<=Math.max(.35,p.thickness*.22)
 );
 const collision=inspectGaugeProfile(positions,poly,p.thickness,point);
 const valid=fullContact&&surface&&shelfSeat&&!collision.warning;
 return {valid,ref,stopNumber,point,polygon:poly,warning:collision.warning,
  interference:collision,freeEdge:ref.freeEdge,faceAccessible:fullContact,
  geometryVerified:config.gaugeGeometryDocumented===true,
  verified:false,reason:!ref.freeEdge?'Referencia sobre vértice interior sin canto libre':
   !fullContact?'El borde no llega por delante de la cara frontal del tope':
   !surface?'La cara del dedo no puede detener el canto':
   !shelfSeat?'Support 2: la chapa inclinada no se apoya correctamente sobre la repisa inferior':
   collision.warning?'La chapa invade o roza el sólido del dedo ANTES del plegado':
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
 possible.sort((a,b)=>{
  const aDistance=a.ref.distance,bDistance=b.ref.distance;
  return aDistance-bDistance||a.ref.segmentIndex-b.ref.segmentIndex;
 });
 const best=possible[0]??first;
 return {...best,manual:false,candidates,autoSelected:best!==first,
  noSafeContact:possible.length===0};
}
