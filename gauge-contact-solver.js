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
 * ESTUDIO R94 · Sólo referencias MANUALES contra la cara externa de una
 * pestaña que YA ESTABA PLEGADA antes de este golpe. No modifica el
 * seleccionador automático ni convierte cualquier vértice en apoyo.
 * Esta detección es 2D provisional, sin ejes X/R/Z ni CAD de máquina.
 */
export function foldedStopFaceCandidate(positions,ref,st,feature,thickness,manual){
 if(!manual||ref?.freeEdge||ref?.atEnd!==true||
   feature?.surface!=='vertical-front'||!Number.isInteger(ref?.sourceIndex)||
   ref.sourceIndex<=0||ref.sourceIndex>=positions.length-1)return null;
 const idx=ref.sourceIndex,nominal=positions[idx],pivot=positions[ref.pivotIndex];
 if(!nominal||!pivot||pivot.x>=nominal.x-Math.max(.12,thickness*.12))return null;
 const allowance=Math.max(.1,thickness/2),tol=Math.max(.08,thickness*.10);
 for(const ni of [idx-1,idx+1]){
  if(ni===ref.pivotIndex||!positions[ni])continue;
  const bend=Math.min(idx,ni);
  if(!Number.isFinite(st?.fractions?.[bend])||st.fractions[bend]<.999)return null;
  const other=positions[ni];
  if(Math.abs(other.x-nominal.x)>tol||
     Math.abs(other.y-nominal.y)<Math.max(2,thickness*2))continue;
  const lo=nominal.y+Math.min(feature.from.y,feature.to.y)-feature.point.y;
  const hi=nominal.y+Math.max(feature.from.y,feature.to.y)-feature.point.y;
  const overlap=Math.max(0,Math.min(hi,Math.max(other.y,nominal.y))-
    Math.max(lo,Math.min(other.y,nominal.y)));
  if(overlap<Math.max(.5,thickness*.25))continue;
  return {point:{x:nominal.x+allowance,y:nominal.y},
   legSegment:bend,overlap,verified:false,
   reason:'cara exterior de pestaña preplegada contra pared STOP · cálculo 2D'};
 }
 return null;
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
 const bend=st.activeBend;
 const manual=p.gaugeSideByBend[bend]!=='auto'||
  p.gaugeSegmentByBend[bend]!==null||p.gaugePointByBend[bend]!==null;
 const foldedFace=foldedStopFaceCandidate(positions,ref,st,feature,p.thickness,manual);
 const point=foldedFace?.point||nominalPoint;
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
  (foldedFace&&point.x>0));
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
 // Distinguir referencia nominal viable de separación insuficiente.
 // La HOLGURA no elimina el contacto frontal: es una advertencia distinta.
 // Una penetración o geometría inexistente sí impiden declarar apoyo 2D.
 const nominalContact=collision.kind==='sin-interferencia-detectada'||
  collision.kind==='holgura';
 const valid=fullContact&&surface&&shelfSeat&&nominalContact;
 return {valid,ref,stopNumber,point,polygon:poly,warning:collision.warning,
  interference:collision,freeEdge:ref.freeEdge,
  foldedWingContact:!!foldedFace,foldedWingCandidate:foldedFace,
  faceAccessible:fullContact,
  geometryVerified:config.gaugeGeometryDocumented===true,
  clearanceWarning:collision.kind==='holgura',
  verified:false,reason:!ref.freeEdge&&!foldedFace?
   'Referencia sobre vértice interior sin canto libre':
   !fullContact?'El borde no llega por delante de la cara frontal del tope':
   !surface?'La cara del dedo no puede detener el canto':
   !shelfSeat?'Support 2: la chapa inclinada no se apoya correctamente sobre la repisa inferior':
   collision.kind==='penetracion'?'La chapa penetra el sólido del dedo ANTES del plegado':
   collision.kind==='holgura'?'Apoyo frontal nominal 2D; falta holgura por espesor y debe revisarse':
   collision.warning||collision.kind==='sin-geometria'?'No se pudo comprobar la geometría del dedo':
   foldedFace?'Cara lateral de pestaña preplegada · 2D provisional':
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
