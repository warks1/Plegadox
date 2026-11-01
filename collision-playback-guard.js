/**
 * Vista 2D: no reproducir automáticamente una penetración calculada entre
 * la chapa y el punzón. El aviso NO es un enclavamiento ni seguridad CNC.
 *
 * No cambia datos del programa, signos, lado/posición de tope o geometría.
 * El barrido es DISCRETO: no sustituye un comprobador continuo de sólidos.
 */
import {inspectToolContact} from './tool-collision.js';

export function guardPunchAdvance(piece,from,to,{inspect=inspectToolContact,maxStep=.025}={}){
 if(!Number.isFinite(from)||!Number.isFinite(to)||to<from)
  throw new Error('Intervalo de reproducción no válido');
 if(!Number.isFinite(maxStep)||maxStep<=0)
  throw new Error('Paso de comprobación no válido');
 const intrusion=time=>{
  const report=inspect(piece,time);
  return report?.issues?.find(issue=>issue.kind==='punch'&&issue.category==='penetration')||null;
 };
 const atStart=intrusion(from);
 if(atStart)return {time:from,blocked:true,issue:atStart,checked:1,verified:false};
 const frames=Math.max(1,Math.ceil((to-from)/maxStep));
 let safe=from,checked=1;
 for(let i=1;i<=frames;i++){
  const current=from+(to-from)*i/frames;
  const issue=intrusion(current);checked++;
  if(issue){
   let low=safe,high=current;
   for(let j=0;j<10;j++){
    const middle=(low+high)/2;
    if(intrusion(middle))high=middle;else low=middle;
    checked++;
   }
   return {time:low,blocked:true,issue,checked,verified:false};
  }
  safe=current;
 }
 return {time:to,blocked:false,issue:null,checked,verified:false};
}

/**
 * La vista previa es continua POR DEFECTO. Las colisiones del visor se
 * dibujan como avisos, pero un modelo 2D provisional no puede decidir por
 * sí solo que se interrumpa una demostración cinemática.
 *
 * El usuario puede activar explícitamente una pausa diagnóstica. Se reutiliza
 * entonces el barrido conservador sin cambiar los ángulos ni los útiles.
 * No habilita ni controla movimientos de una máquina real.
 */
export function advancePreview(piece,from,delta,duration,{
 pauseOnPenetration=false,guard=guardPunchAdvance
}={}){
 if(!Number.isFinite(from)||!Number.isFinite(delta)||delta<0||
    !Number.isFinite(duration)||duration<=0)
  throw new Error('Intervalo de vista previa inválido');
 const next=Math.min(duration,from+delta);
 const checked=pauseOnPenetration?
  guard(piece,from,next):
  {time:next,blocked:false,issue:null,checked:0,verified:false};
 return {...checked,looped:!checked.blocked&&checked.time>=duration,
  mode:pauseOnPenetration?'pausa-diagnostica':'vista-continua',verified:false};
}
