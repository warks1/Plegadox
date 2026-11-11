/**
 * PlegadoX · planificador conjunto de útiles y secuencia.
 *
 * Compara pares PRESELECCIONADOS (geometría, fuerza, longitud, familia de
 * amarre), permutaciones de plegado, orientación del punzón y muestras de
 * interferencia chapa/útiles/topes. Mantiene el programa del operario intacto.
 *
 * AVISO: NO modela volúmenes CAD de trancha, mesa, amarres y topes; tampoco
 * CNC, recorrido real ni envolvente temporal continua. No certifica ausencia
 * de colisiones ni autoriza producción en máquina real.
 */
import {normalized,DIES,PUNCHES,MACHINE} from './engine.js';
import {recommendTooling} from './tooling-advisor.js';
import {scoreBendOrder,scoreToolOrder,sequenceCandidates} from './sequence-advisor.js';
import {scanGaugeSequence} from './gauge-sequence-review.js';

const integer=(value,fallback,min,max)=>{
 const n=Number(value);
 return Number.isFinite(n)?Math.min(max,Math.max(min,Math.trunc(n))):fallback;
};
const same=(a,b)=>a.length===b.length&&a.every((x,i)=>x===b[i]);
const keyOf=p=>[p.dieId,p.punchId,p.orientation,p.order.join(',')].join('|');
const weight=plan=>
  plan.toolPenetrations*1000000+
  plan.sheetCross*100000+
  plan.sheetOverlap*60000+
  plan.gaugePenetrations*100000+
  plan.toolWarnings*3000+
  plan.gaugeWarnings*1200+
  plan.sheetWarnings*50+
  plan.sheetScore+
  plan.pairScore;
const compare=(a,b)=>weight(a)-weight(b)||keyOf(a).localeCompare(keyOf(b));
const stopProblems=scan=>{
 const operations=Array.isArray(scan?.operations)?scan.operations:[];
 let severe=0;
 for(const op of operations)
  for(const finding of op.findings||[])
   if(['penetracion','chapa-detras','holgura'].includes(finding.kind))severe++;
 return {warnings:Number(scan?.warningCount)||0,penetrations:severe,
  contactNotObserved:Number(scan?.contactNotObserved)||0};
};
export function optimizeBendPlan(input,options={}){
 const p=normalized(input);
 const dies=options.dies||DIES,punches=options.punches||PUNCHES;
 const maxPairs=integer(options.maxPairs,6,1,20);
 const maxOrders=integer(options.maxOrders,3,1,12);
 const maxFinalists=integer(options.maxFinalists,6,1,20);
 const samples=integer(options.toolSamples,3,1,7);
 const gaugeSamples=integer(options.gaugeSamples,8,8,50);
 const tooling=options.toolingAdvice||recommendTooling(p,{dies,punches});
 const candidates=(tooling.candidates||[tooling.choice,...(tooling.alternatives||[])].filter(Boolean));
 const pairCandidates=candidates.slice(0,maxPairs);
 const scoring=options.sheetEvaluator||scoreBendOrder;
 const toolEvaluator=options.toolEvaluator;
 const gaugeEvaluator=options.gaugeEvaluator||
  ((part)=>scanGaugeSequence(part,{samplesPerOperation:gaugeSamples}));
 const seen=new Set(),rankedOrders=[];
 for(const order of sequenceCandidates(p.order,Math.max(24,maxOrders*4))){
  if(seen.has(order.join(',')))continue;
  seen.add(order.join(','));
  const sheet=scoring(p,order);
  rankedOrders.push({order:[...order],sheet});
 }
 rankedOrders.sort((a,b)=>a.sheet.score-b.sheet.score||
  a.order.join(',').localeCompare(b.order.join(',')));
 const selectedOrders=rankedOrders.slice(0,maxOrders);
 if(!selectedOrders.some(item=>same(item.order,p.order))){
  const original=rankedOrders.find(item=>same(item.order,p.order));
  if(original)selectedOrders.push(original);
 }
 const machineWidth=Math.min(
  Number(options.machine?.ramWidth)||MACHINE.workingWidth,
  Number(options.machine?.holderWidth)||MACHINE.workingWidth
 );
 const widthExceeded=p.width>machineWidth+1e-7;
 const makePlan=(pair,orderData,orientation,source)=>{
  const candidate={...p,punch:pair.punchId,die:pair.dieId,
   order:orderData.order,punchOrientation:orientation};
  const checked=scoreToolOrder(candidate,candidate.order,samples,
   toolEvaluator||undefined);
  const counts=orderData.sheet.counts||{};
  return {
   dieId:pair.dieId,punchId:pair.punchId,orientation,order:[...orderData.order],
   dieName:pair.dieName,punchName:pair.punchName,source,
   sheetScore:Number(orderData.sheet.score)||0,
   sheetCross:counts.cross||0,sheetOverlap:counts.overlap||0,
   sheetWarnings:Object.values(counts).reduce((sum,n)=>sum+(Number(n)||0),0),
   toolPenetrations:checked.penetrationOperations,
   toolWarnings:checked.warningOperations,
   toolSamples:checked.sampledPositions,
   gaugeWarnings:0,gaugePenetrations:0,gaugeContactNotObserved:0,
   gaugeChecked:false,gaugeError:null,
   machineWidthExceeded:widthExceeded,pairScore:Number(pair.score)||0,
   preliminary:true,verified:false
  };
 };
 const plans=[];
 for(const pair of pairCandidates){
  const tool=punches.find(item=>item.id===pair.punchId);
  const orientations=tool?.type==='cabra'||tool?.importedDxf?
   ['normal','reversed']:[p.punchOrientation];
  for(const data of selectedOrders)
   for(const orientation of orientations)
    plans.push(makePlan(pair,data,orientation,'automatico'));
 }
 plans.sort(compare);
 // El plan manual se analiza SIEMPRE, incluso cuando no cumple la
 // preselección y por ello no puede aparecer como recomendación.
 const currentDie=dies.find(d=>d.id===p.die);
 const currentPunch=punches.find(t=>t.id===p.punch);
 const originalOrder=rankedOrders.find(item=>same(item.order,p.order));
 let current=null;
 if(currentDie&&currentPunch&&originalOrder){
  const pair=candidates.find(c=>c.dieId===p.die&&c.punchId===p.punch)||
   {dieId:p.die,punchId:p.punch,dieName:currentDie.name,
    punchName:currentPunch.name,score:100};
  current=makePlan(pair,originalOrder,p.punchOrientation,'manual');
 }
 // Reservar una evaluación de tope para cada pareja preseleccionada
 // antes de llenar las plazas restantes: las variantes de una sola V
 // no deben desplazar del cotejo a las demás matrices/punzones.
 const finalists=[],coveredPairs=new Set(),selectedPlans=new Set();
 for(const plan of plans){
  const pairKey=plan.dieId+'|'+plan.punchId;
  if(coveredPairs.has(pairKey))continue;
  coveredPairs.add(pairKey);selectedPlans.add(keyOf(plan));finalists.push(plan);
  if(finalists.length>=maxFinalists)break;
 }
 for(const plan of plans){
  if(finalists.length>=maxFinalists)break;
  if(selectedPlans.has(keyOf(plan)))continue;
  selectedPlans.add(keyOf(plan));finalists.push(plan);
 }
 if(current&&!finalists.some(plan=>keyOf(plan)===keyOf(current)))
  finalists.push(current);
 for(const plan of finalists){
  const candidate={...p,die:plan.dieId,punch:plan.punchId,
   order:plan.order,punchOrientation:plan.orientation};
  try{
   const gauge=stopProblems(gaugeEvaluator(candidate));
   plan.gaugeWarnings=gauge.warnings;
   plan.gaugePenetrations=gauge.penetrations;
   plan.gaugeContactNotObserved=gauge.contactNotObserved;
   plan.gaugeChecked=true;
  }catch(error){
   plan.gaugeError=error instanceof Error?error.message:String(error);
  }
  plan.preliminary=false;
  plan.score=weight(plan);
  plan.possibleInterference=widthExceeded||plan.toolPenetrations>0||
   plan.sheetCross>0||plan.sheetOverlap>0||plan.gaugePenetrations>0||
   plan.toolWarnings>0||plan.gaugeWarnings>0||!plan.gaugeChecked;
 }
 finalists.sort((a,b)=>{
  if(a.gaugeChecked!==b.gaugeChecked)return a.gaugeChecked?-1:1;
  return compare(a,b);
 });
 const best=finalists.find(plan=>plan.source==='automatico')||null;
 const manual=finalists.find(plan=>current&&keyOf(plan)===keyOf(current))||current;
 return {
  best,manual,
  alternatives:finalists.filter(plan=>plan.source==='automatico'&&plan!==best).slice(0,3),
  candidatePairs:candidates.length,
  pairsScreened:pairCandidates.length,
  ordersCompared:rankedOrders.length,
  ordersScreened:selectedOrders.length,
  planVariantsChecked:plans.length,
  finalistsGaugeChecked:finalists.filter(plan=>plan.gaugeChecked).length,
  machineWidthExceeded:widthExceeded,
  status:!best?'SIN_PAREJA_PRESELECCIONADA':
   best.possibleInterference?'INCIDENCIAS_2D_O_DATOS_PENDIENTES':
   'SIN_AVISOS_EN_MUESTRAS_2D',
  reasons:tooling.reasons||[],
  truncated:candidates.length>pairCandidates.length||
   rankedOrders.length>selectedOrders.length,
  verified:false,canApproveForMachine:false,
  limitations:'Comparación limitada y discreta en sección 2D. Sin CAD sólido real de mesa, trancha, punzón, matriz, mordazas y topes ni comprobación de cinemática 3D/CNC. La ausencia de avisos NO garantiza ausencia de colisiones.'
 };
}
/** Aplicación explícita: ningún cálculo modifica por sí solo la pieza. */
export function applyBendPlan(input,plan){
 const p=normalized(input);
 if(!plan||!DIES.some(t=>t.id===plan.dieId)||
  !PUNCHES.some(t=>t.id===plan.punchId)||
  !Array.isArray(plan.order)||plan.order.length!==p.angles.length||
  new Set(plan.order).size!==p.angles.length||
  plan.order.some(id=>!Number.isInteger(id)||id<0||id>=p.angles.length)||
  !['normal','reversed'].includes(plan.orientation))
  throw new Error('Plan incompatible con la pieza o el catálogo activo');
 return normalized({...p,die:plan.dieId,punch:plan.punchId,
  order:[...plan.order],punchOrientation:plan.orientation});
}
