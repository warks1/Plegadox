/**
 * PlegadoX R134 · acotar en el tiempo la PRIMERA penetración modelada
 * durante un intervalo documentado de posiciones CNC.
 *
 * Algoritmo: el barrido exacto para PRISMAS RÍGIDOS LINEALES se ejecuta
 * sobre la mitad inicial. Si allí existe penetración, la primera está
 * allí; en caso contrario está en la segunda mitad. Es una localización
 * de intervalo (bracket) y NO un instante de impacto físico.
 *
 * La prueba de intersección usa secciones 2,5D extruidas en Z. No se
 * modelan flexión, aceleración, apoyo tangencial, control PLC/CNC o
 * tolerancia de montaje. La palabra "contacto" se evita porque se
 * requiere penetración positiva, no un mero roce.
 */
import {prismOverlap} from './volume-engine.js';
import {prismTranslation,sweptPrismPair,translatePrism} from './swept-volume.js';
const ready=n=>typeof n==='number'&&Number.isFinite(n);
const boundedSteps=v=>Number.isInteger(v)&&v>=1&&v<=14?v:8;
const threshold=v=>ready(v)&&v>0&&v<=1?v:.02;
const result=(status,windowSeconds=null,iterations=0,detail='')=>({
 status,windowSeconds,iterations,
 widthSeconds:windowSeconds?windowSeconds[1]-windowSeconds[0]:null,
 detail,rigidLinearOnly:true,firstPhysicalContactVerified:false,
 industrialVerified:false,canApproveForMachine:false
});
export function locateFirstModeledPenetration(a0,a1,b0,b1,
 startTime,endTime,options={}){
 if(!ready(startTime)||!ready(endTime)||endTime<=startTime)
  return result('TIEMPOS_NO_VALIDOS',null,0,
   'Faltan marcas CNC en segundos estrictamente crecientes');
 const deltaA=prismTranslation(a0,a1),deltaB=prismTranslation(b0,b1);
 if(!deltaA.ok||!deltaB.ok)
  return result('GEOMETRIA_NO_RIGIDA',null,0,
   'No localizar si algún cuerpo gira, se deforma o carece de CAD');
 const original=sweptPrismPair(a0,a1,b0,b1);
 if(original.unknown)return result('BARRIDO_NO_RESUELTO',null,0,
  original.reason||'Barrer los sólidos no fue concluyente');
 if(!original.intersects)return result('SIN_PENETRACION_MODELADA',null,0,
  'Sin penetración positiva según el modelo lineal; no descarta tangencia');
 const at=(body,delta,t)=>translatePrism(body,
  delta.dx*t,delta.dy*t,delta.dz*t);
 const initial=prismOverlap(a0,b0);
 if(initial.unknown)return result('BARRIDO_NO_RESUELTO',null,0,
  'Solape de geometría inicial indeterminado');
 if(initial.intersects)return result('PENETRACION_PRESENTE_AL_INICIO',
  [startTime,startTime],0,
  'El modelo ya presenta penetración en la primera pose; inicio anterior desconocido');
 const maxSteps=boundedSteps(options.maxSteps);
 const targetSeconds=threshold(options.targetWindowSeconds);
 const duration=endTime-startTime;
 let lo=0,hi=1,iterations=0;
 let la=a0,lb=b0;
 while(iterations<maxSteps&&(hi-lo)*duration>targetSeconds){
  const middle=(lo+hi)/2;
  const ma=at(a0,deltaA,middle),mb=at(b0,deltaB,middle);
  // Inspección continua de TODA la primera mitad, NO fotogramas
  // equidistantes: captura penetraciones que desaparecen entre poses.
  const left=sweptPrismPair(la,ma,lb,mb);
  if(left.unknown)return result('LOCALIZACION_NO_RESUELTA',null,iterations,
   'Una subtrayectoria presenta incertidumbre; mantener el evento sin hora exacta');
  if(left.intersects)hi=middle;
  else{lo=middle;la=ma;lb=mb;}
  iterations++;
 }
 const windowSeconds=[startTime+duration*lo,startTime+duration*hi];
 return result('VENTANA_MODELADA_ACOTADA',windowSeconds,iterations,
  'Primera ventana con penetración de prismas en recorrido lineal declarado; '+
  'NO es tiempo real del primer contacto ni certificación física');
}
