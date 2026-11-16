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
export function gaugeRetractionPath({anchor,target=null,maxSheetX,fingerReach=0,opening=16,sub,enabled=true}){
 if(!enabled){
  if(!anchor||![anchor.x,anchor.y].every(Number.isFinite))
   throw new Error('Falta origen del dedo de tope');
  if(!target||![target.x,target.y].every(Number.isFinite))return null;
  // La referencia siguiente puede coincidir con la actual:
  // no dibujar una falsa carrera y tampoco marcar un retroceso.
  if(Math.hypot(target.x-anchor.x,target.y-anchor.y)<1e-7)return null;
  const t=clamp01(sub);
  if(t<GAUGE_REPOSITION_START)return null;
  const k=smooth((t-GAUGE_REPOSITION_START)/
   (GAUGE_REPOSITION_FINISH-GAUGE_REPOSITION_START));
  return {phase:'reubicacion-siguiente-golpe',
   point:{x:lerp(anchor.x,target.x,k),y:lerp(anchor.y,target.y,k)},
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
  return {phase:'retroceso-antes-plegado',point:{x:lerp(anchor.x,park.x,k),y:anchor.y},
   from:anchor,to:park,parkPoint:park,progress:k,moving:true,withdrawn:false,
   plannedRetraction:park.x-anchor.x,verified:false};
 }
 if(t<GAUGE_REPOSITION_START||!target){
  return {phase:'retirado-durante-plegado',point:park,from:anchor,to:park,
   parkPoint:park,progress:1,moving:false,withdrawn:true,
   plannedRetraction:park.x-anchor.x,verified:false};
 }
 const k=smooth((t-GAUGE_REPOSITION_START)/
  (GAUGE_REPOSITION_FINISH-GAUGE_REPOSITION_START));
 return {phase:'regreso-a-siguiente-referencia',
  point:{x:lerp(park.x,target.x,k),y:lerp(park.y,target.y,k)},
  // "from" identifica SIEMPRE la cota original del dedo, no el punto
  // temporal de aparcamiento. Es una referencia X/R invariable durante
  // el giro de la chapa; el inicio de este TRAMO es movementStart.
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
 const enabled=penetrations.length>0;
 return {enabled,known:true,geometryDocumented,verified:false,issues,
  penetrationCount:penetrations.length,clearanceWarnings:issues.length-penetrations.length,
  reason:enabled?'Retroceso sugerido: penetración 2D prevista contra el dedo inmóvil':
   issues.length?'Holgura 2D advertida, pero SIN penetración: mantener el tope en el golpe':
   'No se detecta penetración ni holgura 2D: mantener el tope durante este golpe'};
}
