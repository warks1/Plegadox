/**
 * Retroceso PREVENTIVO del dedo durante la sujeción y el plegado.
 * Animación cinemática 2D, NO trayectoria CNC certificada.
 * El cierre en la chapa se representa entre .36 y .44 del ciclo.
 */
export const GAUGE_RETRACT_START=.36;
export const GAUGE_RETRACT_FINISH=.44;
export const GAUGE_REPOSITION_START=.84;
export const GAUGE_REPOSITION_FINISH=.99;
const clamp01=n=>Math.max(0,Math.min(1,Number(n)||0));
const smooth=n=>{const t=clamp01(n);return t*t*(3-2*t);};
const lerp=(a,b,t)=>a+(b-a)*t;
export function gaugeRetractionPath({anchor,target=null,maxSheetX,fingerReach=0,opening=16,sub}){
 if(!anchor||!Number.isFinite(anchor.x)||!Number.isFinite(anchor.y))
  throw new Error('Falta origen del dedo de tope');
 const radius=Math.max(10,Number(opening)||16);
 // La chapa no debería alcanzar el cuerpo del dedo cuando este se aparca.
 // No afirma que la carrera X de la máquina alcance esta referencia.
 const parkX=Math.max(anchor.x,Number(maxSheetX)||anchor.x)+
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
  from:park,to:target,parkPoint:park,progress:k,moving:k>0&&k<1,
  withdrawn:k<1,plannedRetraction:park.x-anchor.x,verified:false};
}
