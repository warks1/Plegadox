/**
 * Barrido TEMPORAL del conjunto chapa + dedo trasero en la sección 2D.
 * Comparte technicalScene/gaugePlacement con el visor; no altera movimiento.
 * NO es un barrido continuo 3D, no conoce ejes X/R/Z físicos ni calibra CNC.
 * La falta de CAD se avisa APARTE: no es una colisión en la sección 2D.
 */
import {normalized} from './engine.js';
import {technicalScene} from './technical-section.js';
import {gaugePlacement} from './backgauge-placement.js';
import {GAUGE_RETRACT_START,GAUGE_RETRACT_FINISH,
 GAUGE_REPOSITION_START} from './gauge-retract-motion.js';

// Primero las penetraciones, después los apoyos físicamente inválidos.
// La holgura SIN penetración es secundaria y nunca debe ocultar un
// error de cara frontal, asiento o referencia interior del mismo golpe.
const RANK={penetracion:5,'chapa-detras':4,'apoyo-invalido':4,
 'sin-asiento':4,'referencia-interior':4,holgura:2};
const make=(kind,time,scene,place)=>{
 const transition=scene.gaugeTransition;
 const movingFinger=transition?.moving===true;
 const motionPhase=transition?.phase||null;
 const movingLabel=movingFinger?' DURANTE el desplazamiento completo del tope':'';
 return {
  kind,time,phase:scene.stage.phase,stopNumber:place.stopNumber,
  point:place.gaugeInterference?.warning?place.gaugeInterference.point:null,
  distanceMm:kind==='holgura'?
   place.gaugeInterference?.distanceMm??null:null,
  requiredMm:kind==='holgura'?
   place.gaugeInterference?.requiredMm??null:null,
  deficitMm:kind==='holgura'?
   place.gaugeInterference?.deficitMm??null:null,
  bend:scene.stage.activeBend,operation:scene.stage.activeOperation,
  movingFinger,motionPhase,verified:false,
  reason:kind==='penetracion'?'Posible penetración 2D chapa/tope'+movingLabel:
   kind==='holgura'?'Holgura 2D medida: '+(
    Number.isFinite(place.gaugeInterference?.distanceMm)&&
    Number.isFinite(place.gaugeInterference?.requiredMm)?
     place.gaugeInterference.distanceMm.toFixed(2)+' mm / mín. '+
      place.gaugeInterference.requiredMm.toFixed(2)+' mm':
     'distancia no disponible')+movingLabel:
   kind==='chapa-detras'?'Chapa por detrás de la cara frontal del tope':
   kind==='apoyo-invalido'?'Apoyo inicial inválido: '+
    (place.setupReason||'la pieza no puede asentarse contra la cara de parada'):
   kind==='sin-asiento'?'Chapa sin contacto frontal fiable con el dedo':
   'La referencia recae en un vértice interior, no en un borde libre'
 };
};
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
 const all=[],kinds=new Map(),times=[],movementFindings=new Map();
 let contacted=false,withdrawn=false,cadPending=false;
 let movementWarnings=0,movementFirstTime=null;
 // Incluir el instante inicial, los extremos y la retirada final;
 // evitar tomar justo t=5,10,15 como si fuese el golpe anterior.
 const split=Math.floor(samples/2);
 // Separar los dos movimientos físicos de la vista: retirada preventiva
 // en 36-44 % y traslado a la siguiente referencia desde 84 %.
 // La segunda mitad de las muestras sigue cubriendo densamente el
 // final del golpe y se conserva el número de muestras contratado.
 const early=[0,.20,.34,GAUGE_RETRACT_START,.38,.40,.42,
  GAUGE_RETRACT_FINISH,.65,GAUGE_REPOSITION_START];
 const earlyAt=k=>{
  const f=Math.min(early.length-1,Math.max(0,k*(early.length-1)));
  const lo=Math.floor(f),hi=Math.min(lo+1,early.length-1);
  return early[lo]+(early[hi]-early[lo])*(f-lo);
 };
 for(let i=0;i<=samples;i++){
  const relative=5*(i<=split?
   earlyAt(i/split):
   GAUGE_REPOSITION_START+(1-GAUGE_REPOSITION_START)*
    (i-split)/(samples-split));
  const time=start+(i===samples?5-1e-6:relative);
  const {scene,place}=inspect(p,time);
  if(!scene||!place||!scene.stage||scene.stage.activeOperation!==operation)
   throw Error('El visor no corresponde al golpe solicitado en '+time);
  const phase=scene.stage.phase;
  const approaching=['Posicionamiento','Aproximación'].includes(phase);
  const transitioning=!!scene.gaugeTransition;
  if(place.contactEngaged)contacted=true;
  // Un render antiguo puede aportar la fase "Retirada" sin el campo
  // plannedRetraction. Reconocer esa retirada real representada;
  // NO marcar una simple reubicación X/R como retroceso por colisión.
  if(transitioning&&(
    scene.gaugeTransition?.plannedRetraction>0||
    scene.gaugeTransition?.withdrawn===true||
    (/(Retirada|Retroceso)/i.test(phase)&&
     scene.gaugeTransition?.phase!=='reubicacion-siguiente-golpe')
  ))withdrawn=true;
  const issue=place.gaugeInterference;
  if(place.geometryUnavailable)cadPending=true;
  const frameKinds=[];
  if(issue?.warning&&['penetracion','holgura'].includes(issue.kind))
   frameKinds.push(issue.kind);
  // Las causas del apoyo y de la holgura son independientes. Antes,
  // un único if/else descartaba "chapa detrás" o "sin asiento" cuando
  // coincidían con holgura en la misma muestra.
  if(approaching&&!transitioning){
   if(place.setupValid===false)frameKinds.push('apoyo-invalido');
   if(place.freeEdge&&place.sheetInFront===false)
    frameKinds.push('chapa-detras');
   if(place.freeEdge&&place.seat?.seated===false)
    frameKinds.push('sin-asiento');
   // Admitir una pestaña ya plegada SOLO si su cara exterior fue
   // reconocida explícitamente como apoyo por el solver 2D.
   if(place.freeEdge===false&&place.foldedWingContact!==true)
    frameKinds.push('referencia-interior');
  }
  times.push(time);
  for(const kind of new Set(frameKinds)){
   const found=make(kind,time,scene,place);
   all.push(found);
   if(!kinds.has(kind))kinds.set(kind,found);
   if(found.movingFinger&&['penetracion','holgura'].includes(kind)){
    movementWarnings++;
    if(movementFirstTime===null)movementFirstTime=time;
    if(!movementFindings.has(kind))movementFindings.set(kind,found);
   }
  }
 }
 const findings=[...kinds.values()].sort((a,b)=>(RANK[b.kind]||0)-(RANK[a.kind]||0)||
  a.time-b.time);
 return {operation,bend:p.order[operation],angle:p.angles[p.order[operation]],
  stopNumber:p.stopByBend[p.order[operation]],samples:times.length,
  warnings:all.length,findings,firstTime:all.length?all[0].time:null,
  example:findings[0]||null,contactObserved:contacted,
  withdrawalObserved:withdrawn,possibleInterference:all.length>0,
  movementWarnings,movementInterference:movementWarnings>0,movementFirstTime,
  movementFindings:[...movementFindings.values()],
  cadPending,geometryVerified:!cadPending,verified:false};
}
export function scanGaugeSequence(piece,{samplesPerOperation=18,inspect}={}){
 const p=normalized(piece);
 const operations=p.order.map((_,i)=>inspectGaugeOperation(p,i,{
  samples:samplesPerOperation,...(inspect?{inspect}:{})
 }));
 return {operations,warningCount:operations.filter(o=>o.possibleInterference).length,
  movementWarningCount:operations.filter(o=>o.movementInterference).length,
  movementWarningSamples:operations.reduce((n,o)=>n+o.movementWarnings,0),
  contactNotObserved:operations.filter(o=>!o.contactObserved).length,
  samplesPerOperation,verified:false,
  limitations:'Muestras discretas de sección 2D, incluidas transiciones del dedo; NO evalúa volumen, ejes reales, velocidad CNC, trayectoria continua ni distancias certificadas de seguridad.'};
}

/** Posición exacta a la que debe saltar la revisión al pulsar un aviso.
 * Si el tope penetra DURANTE su traslado, mostrar ese instante y no
 * un contacto estático más temprano de la misma operación.
 */
export function gaugeReviewTargetTime(operation){
 if(!operation||!Number.isInteger(operation.operation)||operation.operation<0)
  throw Error('Operación de tope no válida');
 if(operation.movementInterference&&Number.isFinite(operation.movementFirstTime))
  return operation.movementFirstTime;
 if(Number.isFinite(operation.example?.time))return operation.example.time;
 return operation.operation*5+.5;
}
