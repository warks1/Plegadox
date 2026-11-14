/**
 * PlegadoX R37: aviso y retirada X en la SIMULACIÓN, inspirados en
 * OPENING DX / pinching point de TrumaBend V (manual TRUMPF).
 *
 * No crea órdenes CNC. El valor DX es una DISTANCIA GRÁFICA
 * provisional derivada de la geometría de la chapa; no se comprueban
 * límites X, fijación del punzón, velocidad real ni sujeción.
 *
 * La consulta de geometría se hace en escenas sin retirada para evitar
 * realimentación. Caché invalidada por geometría, orden, modo y V85.
 */
import {normalized} from './engine.js';
import {getV85} from './machine-config.js';
import {gaugePlacement} from './backgauge-placement.js';

const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
const smooth=v=>{const p=clamp(v,0,1);return p*p*(3-2*p);};
const memo=new Map();
export const PINCH_FRACTION=.36;
export const GAUGE_OUT_FRACTION=.46;
export const FORM_END_FRACTION=.68;
const riskTimes=[.39,.47,.55,.64,.71];
/**
 * Devuelve un PLAN DE VISTA PREVIA con dirección y longitud X estimadas.
 * La desaparición de avisos de sección no acredita ausencia de colisión.
 */
export function predictGaugeRetract(piece,operation,sceneAt,{machine=getV85()}={}){
 const p=normalized(piece);
 if(!Number.isInteger(operation)||operation<0||operation>=p.order.length)
  throw Error('Operación de retirada X inválida');
 const key=JSON.stringify([p.flanges,p.angles,p.order,p.thickness,p.width,
  p.die,p.punch,p.stopByBend,p.gaugeSideByBend,p.gaugeContactByBend,
  p.punchOrientation,machine.stop,machine.support]);
 const cacheKey=key+'|'+operation;
 if(memo.has(cacheKey))return memo.get(cacheKey);
 let risk=false,maxX=-Infinity,contactX=null,warningCount=0;
 const details=[];
 try{
  for(const relative of riskTimes){
   const time=operation*5+relative*5,scene=sceneAt(time);
   if(scene.stage.activeOperation!==operation)
    throw Error('El visor devolvió otro golpe');
   const stopNumber=p.stopByBend[scene.stage.activeBend]===2?2:1;
   const place=gaugePlacement(scene,stopNumber);
   if(!Number.isFinite(place.point.x))throw Error('Tope sin punto X definido');
   if(contactX===null)contactX=place.contact?.point?.x??place.point.x;
   maxX=Math.max(maxX,...(scene.sheetDisplay||scene.sheet).map(pt=>pt.x));
   if(place.gaugeInterference?.warning){
    risk=true;warningCount++;
    details.push({fraction:relative,kind:place.gaugeInterference.kind});
   }
  }
 }catch(error){
  return {required:false,checked:false,warningCount:0,distanceMm:null,
   state:'No se ha podido calcular retirada X: '+String(error.message||error),
   provisional:true,verified:false};
 }
 const nominal=Math.max(0,maxX-contactX);
 // Mayor que el extremo más alejado de la chapa, con holgura de dibujo.
 // NO es un DX validado de la máquina.
 const distanceMm=risk?Math.ceil(nominal+Math.max(3,p.thickness*2)):0;
 const result={required:risk,checked:true,warningCount,distanceMm,
  operation,bend:p.order[operation],details,
  state:risk?'Riesgo geométrico en el golpe: proponer retirada X después del punto de sujeción':
   'Sin penetración detectada en muestras; no descarta choque real',
  source:'OPENING DX / pinching point · TrumaBend V · simulación',
  provisional:true,verified:false,canApproveForMachine:false};
 // Evitar crecimiento sin límite al editar miles de piezas.
 if(memo.size>80)memo.clear();
 memo.set(cacheKey,result);
 return result;
}
export function previewGaugeRetractState(plan,sub){
 if(!plan?.required)return null;
 const progress=smooth((sub-PINCH_FRACTION)/(GAUGE_OUT_FRACTION-PINCH_FRACTION));
 return {required:true,afterPinch:sub>=PINCH_FRACTION,
  progress,dxMm:plan.distanceMm*progress,
  distanceMm:plan.distanceMm,provisional:true,
  phase:sub<GAUGE_OUT_FRACTION?'Retirada X tras sujetar chapa':
   'Tope retirado · plegado en curso',
  verified:false};
}
export function adjustStageForPinch(st,plan){
 if(!plan?.required||!st||st.completed)return st;
 const sub=(st.time%5)/5;
 if(sub<PINCH_FRACTION||sub>=FORM_END_FRACTION)return st;
 const next={...st,fractions:[...st.fractions]};
 if(sub<GAUGE_OUT_FRACTION){
  next.fractions[st.activeBend]=0;
  next.press=.45;
  next.phase='Plegado';
  next.gaugePhase='Sujeción · retirada X simulada';
 }else{
  const bending=smooth((sub-GAUGE_OUT_FRACTION)/
   (FORM_END_FRACTION-GAUGE_OUT_FRACTION));
  next.fractions[st.activeBend]=bending;
  next.press=.45+.55*bending;
  next.phase='Plegado';
  next.gaugePhase='Plegado tras retirada X';
 }
 return next;
}
