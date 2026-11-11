/**
 * PlegadoX R31 · comparador de matriz + punzón + orientación + orden.
 *
 * Dos fases:
 * (1) excluir parejas imposibles con las cotas documentadas y la guía de
 *     presión/longitud/V, SIN declarar compatible el amarre no verificado;
 * (2) cribar secciones 2D por algunas poses de las mejores combinaciones.
 * El modo rápido está acotado para móviles. Un resultado NO es un CAD 3D,
 * una validación CNC, una instrucción de montaje ni una garantía de seguridad.
 */
import {normalized} from './engine.js';
import {recommendTooling} from './tooling-advisor.js';
import {planBendSequenceAsync,SEQUENCE_LIMITATIONS} from './automatic-sequence-planner.js';

export const SETUP_LIMITATIONS=
 'Selección orientativa basada en apertura V, ángulo, ala mínima, fuerza '+
 'estimada, ancho de útil y barridos discretos 2D. Falta comprobar '+
 'perfil CAD de cada punzón/matriz, adaptadores y amarres reales, '+
 'mesa/trancha, trayectorias de ejes, volteo completo, cargas por metro '+
 'y colisiones volumétricas 3D. NO garantiza una secuencia fabricable.';

const same=(a,b)=>a.dieId===b.dieId&&a.punchId===b.punchId&&
 a.orientation===b.orientation;
const compare=(a,b)=>{
 const va=a.plan?.best?.riskVector||[Infinity],vb=b.plan?.best?.riskVector||[Infinity];
 for(let i=0;i<Math.max(va.length,vb.length);i++){
  const d=(va[i]??0)-(vb[i]??0);
  if(d)return d;
 }
 return (a.preliminaryScore??Infinity)-(b.preliminaryScore??Infinity);
};

/** Crea combinaciones distintas; evita confundir un punzón recto con gooseneck. */
export function setupCandidates(input,{pairs,limit=4,includeReverse=true}={}){
 const p=normalized(input),advice=pairs||recommendTooling(p);
 const candidates=advice.candidates||[advice.choice,...advice.alternatives].filter(Boolean);
 const all=[],seen=new Set();
 const add=(dieId,punchId,orientation,preliminaryScore,eligible,manual)=>{
  const key=[dieId,punchId,orientation].join('|');
  if(seen.has(key))return;seen.add(key);
  all.push({dieId,punchId,orientation,preliminaryScore,eligible,manual});
 };
 const baseline=candidates.find(pair=>pair.dieId===p.die&&pair.punchId===p.punch);
 add(p.die,p.punch,p.punchOrientation,baseline?.score??1e6,!!baseline,true);
 for(const pair of candidates){
  add(pair.dieId,pair.punchId,'normal',pair.score,true,false);
  if(includeReverse) {
   // La orientación invertida SOLO aporta diferencias en útiles asimétricos.
   if(pair.goose)add(pair.dieId,pair.punchId,'reversed',pair.score+.01,true,false);
  }
 }
 const selected=[all[0],...all.slice(1).filter(item=>item.eligible).slice(
  0,Math.max(0,Math.min(20,Math.trunc(limit)||4)-1))];
 return {selected,available:all.length,eligiblePairs:candidates.length,
  targetOpening:advice.targetOpening,reasons:advice.reasons,verified:false};
}

/**
 * Devuelve la mejor preselección provisional sin modificar el objeto pieza.
 * Permite inyección de motor para pruebas; no interpreta respuestas ausentes
 * o incompletas como ausencia de colisiones.
 */
export async function planCompleteSetup(input,options={}){
 const original=normalized(input),baselineKey=JSON.stringify(original);
 const availableSetups=setupCandidates(original,{pairs:options.toolPairs,
  limit:options.maxSetups??3,includeReverse:options.includeReverse!==false});
 const candidates=options.lockTools===true?{
  ...availableSetups,selected:availableSetups.selected.slice(0,1)
 }:availableSetups;
 const results=[];
 const evaluate=options.plan||planBendSequenceAsync;
 const cap=options.full===true?24:Math.max(1,Math.min(8,options.ordersPerSetup??2));
 for(const pair of candidates.selected){
  if(options.cancelled?.())return null;
  const trial=normalized({...original,die:pair.dieId,punch:pair.punchId,
   punchOrientation:pair.orientation});
  let plan=null,error=null;
  if(pair.eligible){
   try{
    plan=await evaluate(trial,{deepLimitFour:cap,maxDeepCandidates:cap,
     lockOrder:options.lockOrder===true,
     maxCandidates:options.maxCandidates??60,
     toolSamples:options.toolSamples??2,gaugeSamples:options.gaugeSamples??8,
     cancelled:options.cancelled});
    if(!plan||!plan.current||!plan.best||plan.incomplete||
       plan.best.unavailable)throw Error('Evaluación de interferencias incompleta');
   }catch(err){error=err instanceof Error?err.message:String(err);}
  }else error='La pareja seleccionada no cumple todas las condiciones de preselección';
  const evaluated={...pair,plan,error,usable:!error&&!!plan&&pair.eligible};
  results.push(evaluated);
  options.onProgress?.(results.length,candidates.selected.length);
  if(options.cancelled?.())return null;
  await new Promise(resolve=>setTimeout(resolve,0));
 }
 if(JSON.stringify(original)!==baselineKey)throw Error('Mutación inesperada de pieza');
 const baseline=results[0],viable=results.filter(r=>r.usable);
 const best=[...viable].sort((a,b)=>compare(a,b)||
   (a.manual?-1:0)-(b.manual?-1:0)||
   [a.dieId,a.punchId,a.orientation].join(':').localeCompare(
    [b.dieId,b.punchId,b.orientation].join(':')))[0]||null;
 const resultBest=best?.plan?.best;
 const chosen=best?{
  die:best.dieId,punch:best.punchId,punchOrientation:best.orientation,
  order:[...resultBest.order],preliminaryScore:best.preliminaryScore
 }:null;
 const changes=chosen?{
  die:chosen.die!==original.die,punch:chosen.punch!==original.punch,
  orientation:chosen.punchOrientation!==original.punchOrientation,
  order:chosen.order.some((id,i)=>id!==original.order[i])
 }:{die:false,punch:false,orientation:false,order:false};
 const foundAlternative=Object.values(changes).some(Boolean);
 // Incluso cuando mejora un aviso, se mantiene estado "no verificado".
 const canPropose=Boolean(best&&best.usable&&
  best.plan.best.hard===0&&best.plan.finalRisks.cross===0&&
  best.plan.finalRisks.overlap===0);
 return {input:original,baseline,best,results,chosen,changes,foundAlternative,
  canPropose,checked:results.length,available:candidates.available,
  eligiblePairs:candidates.eligiblePairs,coverage:{
   ordersPerSetup:cap,fullRequested:options.full===true,
   setupsChecked:results.length,setsAvailable:candidates.available
  },limitations:SETUP_LIMITATIONS+' '+SEQUENCE_LIMITATIONS,
  status:best?'PRESELECCION_2D_PENDIENTE_DE_VALIDACION':'NO_PRESELECCION_VERIFICABLE',
  verified:false,canApproveForMachine:false};
}
