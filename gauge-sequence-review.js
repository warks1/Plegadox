/**
 * Barrido TEMPORAL del conjunto chapa + dedo trasero en la sección 2D.
 * Comparte technicalScene/gaugePlacement con el visor; no altera movimiento.
 * NO es un barrido continuo 3D, no conoce ejes X/R/Z físicos ni calibra CNC.
 */
import {normalized} from './engine.js';
import {technicalScene} from './technical-section.js';
import {gaugePlacement} from './backgauge-placement.js';

const RANK={penetracion:4,holgura:3,'chapa-detras':3,
 'sin-asiento':2,'referencia-interior':1};
const make=(kind,time,scene,place)=>({
 kind,time,phase:scene.stage.phase,stopNumber:place.stopNumber,
 point:place.gaugeInterference?.warning?place.gaugeInterference.point:null,
 bend:scene.stage.activeBend,operation:scene.stage.activeOperation,
 reason:kind==='penetracion'?'Posible penetración 2D chapa/tope':
  kind==='holgura'?'Posible holgura 2D menor que el espesor':
  kind==='chapa-detras'?'Chapa por detrás de la cara frontal del tope':
  kind==='sin-asiento'?'Chapa sin asiento válido en el escalón':
  'La referencia recae en un vértice interior, no en un borde libre'
});
/**
 * `inspect` está disponible como inyección para pruebas, no como
 * autorización de datos externos. Valores de tiempo en segundos del visor.
 */
export function inspectGaugeOperation(piece,operation,{
 samples=18,inspect=(p,t)=>{const scene=technicalScene(p,t);
  const bend=scene.stage.activeBend;
  const stopNumber=scene.piece.stopByBend[bend]===2?2:1;
  return {scene,place:gaugePlacement(scene,stopNumber)};
 }
}={}){
 const p=normalized(piece);
 if(!Number.isInteger(operation)||operation<0||operation>=p.order.length)
  throw Error('Número de operación de tope inválido');
 if(!Number.isInteger(samples)||samples<8||samples>100)
  throw Error('Muestreo de tope fuera de rango (8-100)');
 const start=operation*5;
 const all=[],kinds=new Map(),times=[];
 let contacted=false,withdrawn=false;
 // Incluir el instante inicial, los extremos y la retirada final;
 // evitar tomar justo t=5,10,15 como si fuese el golpe anterior.
 const split=Math.floor(samples/2);
 for(let i=0;i<=samples;i++){
  // Muestreo reforzado de la retirada: el dedo comienza a retroceder
  // al 84% del golpe. Un muestreo uniforme omitía transiciones breves.
  const relative=i<=split?
   4.2*i/split:
   4.2+.8*(i-split)/(samples-split);
  const time=start+(i===samples?5-1e-6:relative);
  const {scene,place}=inspect(p,time);
  if(!scene||!place||!scene.stage||scene.stage.activeOperation!==operation)
   throw Error('El visor no corresponde al golpe solicitado en '+time);
  const phase=scene.stage.phase;
  const approaching=['Posicionamiento','Aproximación'].includes(phase);
  const transitioning=!!scene.gaugeTransition;
  if(place.contactEngaged)contacted=true;
  if(transitioning)withdrawn=true;
  const issue=place.gaugeInterference;
  let kind=null;
  if(issue?.warning&&['penetracion','holgura'].includes(issue.kind))
   kind=issue.kind;
  else if(approaching&&!transitioning&&place.freeEdge&&place.sheetInFront===false)
   kind='chapa-detras';
  else if(approaching&&!transitioning&&place.freeEdge&&place.seat?.seated===false)
   kind='sin-asiento';
  else if(approaching&&!transitioning&&place.freeEdge===false)
   kind='referencia-interior';
  times.push(time);
  if(kind){
   const found=make(kind,time,scene,place);
   all.push(found);
   if(!kinds.has(kind))kinds.set(kind,found);
  }
 }
 const findings=[...kinds.values()].sort((a,b)=>(RANK[b.kind]||0)-(RANK[a.kind]||0)||
  a.time-b.time);
 return {operation,bend:p.order[operation],angle:p.angles[p.order[operation]],
  stopNumber:p.stopByBend[p.order[operation]],samples:times.length,
  warnings:all.length,findings,firstTime:all.length?all[0].time:null,
  example:findings[0]||null,contactObserved:contacted,
  withdrawalObserved:withdrawn,possibleInterference:all.length>0,
  verified:false};
}
export function scanGaugeSequence(piece,{samplesPerOperation=18,inspect}={}){
 const p=normalized(piece);
 const operations=p.order.map((_,i)=>inspectGaugeOperation(p,i,{
  samples:samplesPerOperation,...(inspect?{inspect}:{})
 }));
 return {operations,warningCount:operations.filter(o=>o.possibleInterference).length,
  contactNotObserved:operations.filter(o=>!o.contactObserved).length,
  samplesPerOperation,verified:false,
  limitations:'Muestras discretas de sección 2D. No evalúa volumen, ejes reales, distancia de seguridad ni movimiento CNC entre muestras.'};
}
