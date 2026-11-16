/**
 * Retroceso CONDICIONAL del dedo tras sujetar y antes del plegado.
 * Animación cinemática 2D, NO trayectoria CNC certificada.
 * El cierre en la chapa se representa entre .36 y .44 del ciclo.
 */
import {inspectGaugeProfile} from './gauge-interference.js';
export const GAUGE_RETRACT_START=.36;
export const GAUGE_RETRACT_FINISH=.44;
export const GAUGE_REPOSITION_START=.84;
export const GAUGE_REPOSITION_FINISH=.99;
const clamp01=n=>Math.max(0,Math.min(1,Number(n)||0));
const smooth=n=>{const t=clamp01(n);return t*t*(3-2*t);};
const lerp=(a,b,t)=>a+(b-a)*t;
const AXIS_EPS=1e-7;
/**
 * R108 · Cambio de referencia ilustrativo por EJES, sin diagonales.
 * Si X y R difieren, primero se ajusta R y luego se acerca X.
 * No es una ruta anticolisión ni una orden CNC: las carreras físicas
 * y el espacio disponible aún requieren verificación volumétrica.
 */
export function stagedGaugeAxes(from,to,progress,{order='R-then-X'}={}){
 if(!from||!to||![from.x,from.y,to.x,to.y].every(Number.isFinite))
  throw Error('Faltan coordenadas X/R de los topes');
 const t=clamp01(progress),dx=Math.abs(to.x-from.x),dy=Math.abs(to.y-from.y);
 if(dx<AXIS_EPS&&dy<AXIS_EPS)
  return {point:{...to},axisPhase:'sin-cambio',progress:t,verified:false};
 if(dx<AXIS_EPS)
  return {point:{x:from.x,y:lerp(from.y,to.y,smooth(t))},
   axisPhase:'R',progress:t,verified:false};
 if(dy<AXIS_EPS)
  return {point:{x:lerp(from.x,to.x,smooth(t)),y:from.y},
   axisPhase:'X',progress:t,verified:false};
 if(order!=='R-then-X'&&order!=='X-then-R')
  throw Error('Orden de ejes de tope inválido');
 const firstFraction=.42;
 if(order==='X-then-R'){
  if(t<firstFraction)
   return {point:{x:lerp(from.x,to.x,smooth(t/firstFraction)),y:from.y},
    axisPhase:'X',progress:t,verified:false};
  return {point:{x:to.x,
   y:lerp(from.y,to.y,smooth((t-firstFraction)/(1-firstFraction)))},
   axisPhase:'R',progress:t,verified:false};
 }
 if(t<firstFraction)
  return {point:{x:from.x,y:lerp(from.y,to.y,smooth(t/firstFraction))},
   axisPhase:'R',progress:t,verified:false};
 return {point:{x:lerp(from.x,to.x,smooth((t-firstFraction)/(1-firstFraction))),y:to.y},
  axisPhase:'X',progress:t,verified:false};
}
/**
 * R108 · Comparar alternativas de retorno usando un barrido de la
 * MISMA sección 2D que usa el visor. Evitar imponer R→X a todas las
 * piezas: algunas alas plegadas sólo permiten X→R en la previsualización.
 * No constituye autorización de eje real, CAD OEM ni CNC.
 */
export function chooseGaugeAxisOrder(inspect,{preferred='R-then-X'}={}){
 if(typeof inspect!=='function'||!['R-then-X','X-then-R'].includes(preferred))
  throw Error('Evaluador de rutas X/R no válido');
 const candidates=['R-then-X','X-then-R'].map(order=>{
  const value=inspect(order);
  if(!value||typeof value!=='object')throw Error('Falta evaluación 2D de ruta');
  const count=n=>Number.isInteger(n)&&n>=0?n:Infinity;
  const penetrations=count(value.penetrations);
  const clearances=count(value.clearances);
  const incomplete=count(value.incomplete??0);
  return {order,penetrations,clearances,incomplete,
   checkedFrames:count(value.checkedFrames),verified:false};
 });
 candidates.sort((a,b)=>
  a.penetrations-b.penetrations||
  a.incomplete-b.incomplete||
  a.clearances-b.clearances||
  Number(b.order===preferred)-Number(a.order===preferred));
 const best=candidates[0];
 return {axisOrder:best.order,options:candidates,
  selectedPenetrations:best.penetrations,
  selectedClearances:best.clearances,
  unresolvedPenetration:best.penetrations>0||!Number.isFinite(best.penetrations),
  geometryIncomplete:best.incomplete>0,
  verified:false,
  limitations:'Comparación discreta 2D; sin ejes calibrados ni trayectoria física certificada'};
}
export function gaugeRetractionPath({anchor,target=null,maxSheetX,fingerReach=0,opening=16,sub,enabled=true,axisOrder='R-then-X'}){
 if(!enabled){
  if(!anchor||![anchor.x,anchor.y].every(Number.isFinite))
   throw new Error('Falta origen del dedo de tope');
  if(!target||![target.x,target.y].every(Number.isFinite))return null;
  // La referencia siguiente puede coincidir con la actual:
  // no dibujar una falsa carrera y tampoco marcar un retroceso.
  if(Math.hypot(target.x-anchor.x,target.y-anchor.y)<1e-7)return null;
  const t=clamp01(sub);
  if(t<GAUGE_REPOSITION_START)return null;
  const k=(t-GAUGE_REPOSITION_START)/
   (GAUGE_REPOSITION_FINISH-GAUGE_REPOSITION_START);
  const moved=stagedGaugeAxes(anchor,target,k,{order:axisOrder});
  // Un cambio nominal de cota NO se llama retroceso preventivo.
  return {phase:'reubicacion-siguiente-golpe',
   point:moved.point,axisPhase:moved.axisPhase,
   from:anchor,to:target,parkPoint:null,progress:k,moving:k>0&&k<1,
   withdrawn:false,plannedRetraction:0,verified:false};
 }
 if(!anchor||!Number.isFinite(anchor.x)||!Number.isFinite(anchor.y))
  throw new Error('Falta origen del dedo de tope');
 const radius=Math.max(10,Number(opening)||16);
 // La chapa no debería alcanzar el cuerpo del dedo cuando este se aparca.
 // No afirma que la carrera X de la máquina alcance esta referencia.
 // Cuando se prevé choque, el aparcamiento queda detrás de la
 // envolvente futura de la chapa Y de la posición nominal siguiente.
 // De otro modo la vuelta podía cruzar X en sentido contrario al real.
 const parkX=Math.max(anchor.x,Number(maxSheetX)||anchor.x,
    Number.isFinite(target?.x)?target.x:anchor.x)+
  Math.max(1,Number(fingerReach)||0)+radius+8;
 const park={x:parkX,y:anchor.y};
 const t=clamp01(sub);
 if(t<GAUGE_RETRACT_START)return null;
 if(t<GAUGE_RETRACT_FINISH){
  const k=smooth((t-GAUGE_RETRACT_START)/(GAUGE_RETRACT_FINISH-GAUGE_RETRACT_START));
  return {phase:'retroceso-antes-plegado',axisPhase:'X',
   point:{x:lerp(anchor.x,park.x,k),y:anchor.y},
   from:anchor,to:park,parkPoint:park,progress:k,moving:true,withdrawn:false,
   plannedRetraction:park.x-anchor.x,verified:false};
 }
 if(t<GAUGE_REPOSITION_START||!target){
  return {phase:'retirado-durante-plegado',axisPhase:'aparcado',
   point:park,from:anchor,to:park,
   parkPoint:park,progress:1,moving:false,withdrawn:true,
   plannedRetraction:park.x-anchor.x,verified:false};
 }
 const k=(t-GAUGE_REPOSITION_START)/
  (GAUGE_REPOSITION_FINISH-GAUGE_REPOSITION_START);
 // Primero ajustar la cota R mientras el dedo está APARCADO detrás;
 // después regresar en X. La trayectoria diagonal anterior cruzaba
 // simultáneamente X/R y daba una representación engañosa del regreso.
 const moved=stagedGaugeAxes(park,target,k,{order:axisOrder});
 return {phase:'regreso-a-siguiente-referencia',
  point:moved.point,axisPhase:moved.axisPhase,
  // "from" identifica SIEMPRE la cota original del dedo, no el punto
  // temporal de aparcamiento. El inicio de este TRAMO es movementStart.
  from:anchor,to:target,movementStart:park,
  parkPoint:park,progress:k,moving:k>0&&k<1,
  withdrawn:k<1,plannedRetraction:park.x-anchor.x,verified:false};
}

/**
 * Compara el dedo QUIETO en la posición de contacto inicial con las
 * secciones futuras de chapa durante el mismo golpe. Sólo solicita
 * retroceso cuando se detecta penetración/holgura. No certifica el 3D,
 * ni inventa una distancia X CNC, ni cambia la selección del operario.
 * Importante: la referencia de apoyo inicial se comprueba aparte.
 */
export function planGaugeRetraction({sheetSamples,polygon,thickness=2,contact,
 inspect=null,geometryDocumented=true}={}){
 if(!Array.isArray(sheetSamples)||!sheetSamples.length||
  !Array.isArray(polygon)||polygon.length<3||
  sheetSamples.some(s=>!Array.isArray(s?.sheet)||s.sheet.length<2))
  return {enabled:false,known:false,reason:'Faltan secciones para decidir retroceso',
   geometryDocumented,verified:false,issues:[]};
 const issues=[];
 for(const sample of sheetSamples){
  const assessment=inspect?inspect(sample,polygon,thickness,contact):
   inspectGaugeProfile(sample.sheet,polygon,thickness,contact);
  if(!assessment)continue;
  if(assessment.warning){
   issues.push({at:sample.at??null,kind:assessment.kind,
    point:assessment.point??null,segment:assessment.segment??null,
    fingerEdge:assessment.fingerEdge??null,
    distanceMm:assessment.distanceMm??null,
    requiredMm:assessment.requiredMm??null,
    deficitMm:assessment.deficitMm??null});
  }
 }
 // La holgura nominal próxima al canto NO es prueba de colisión con
 // el cuerpo del dedo. Sin penetración geométrica prevista, no ordenamos
 // apartar el tope ni convertimos una alerta en un movimiento CNC.
 const penetrations=issues.filter(item=>item.kind==='penetracion');
 const measuredClearances=issues.filter(item=>item.kind==='holgura'&&
  Number.isFinite(item.distanceMm)&&Number.isFinite(item.deficitMm));
 const minClearanceMm=measuredClearances.length?
  Math.min(...measuredClearances.map(x=>x.distanceMm)):null;
 const maxDeficitMm=measuredClearances.length?
  Math.max(...measuredClearances.map(x=>x.deficitMm)):null;
 const enabled=penetrations.length>0;
 return {enabled,known:true,geometryDocumented,verified:false,issues,
  minClearanceMm,maxDeficitMm,
  penetrationCount:penetrations.length,clearanceWarnings:issues.length-penetrations.length,
  reason:enabled?'Retroceso sugerido: penetración 2D prevista contra el dedo inmóvil':
   issues.length?'Holgura 2D advertida, pero SIN penetración: mantener el tope en el golpe':
   'No se detecta penetración ni holgura 2D: mantener el tope durante este golpe'};
}
