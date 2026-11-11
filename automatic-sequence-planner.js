/**
 * R30 · planificador 2D con evaluación conjunta de chapa, punzón/matriz y
 * tope trasero. No equivale a optimizador CNC/3D certificado.
 *
 * Hasta 4 pliegues: examina las 24 permutaciones completas con las mismas
 * muestras de herramienta y tope. Más pliegues: exploración acotada.
 * Si una comprobación no puede ejecutarse NO se aplica un orden automático.
 */
import {normalized,profile} from './engine.js';
import {inspectProfile} from './validation.js';
import {sequenceCandidates,scoreBendOrder,scoreToolOrder} from './sequence-advisor.js';
import {inspectSequenceTools} from './tool-collision.js';
import {scanGaugeSequence} from './gauge-sequence-review.js';

const same=(a,b)=>a.length===b.length&&a.every((v,i)=>v===b[i]);
const cmp=(a,b)=>{
 for(let i=0;i<Math.max(a.length,b.length);i++){
  const diff=(a[i]??0)-(b[i]??0);
  if(diff)return diff;
 }
 return 0;
};
export const SEQUENCE_LIMITATIONS=
 'Barrido temporal de secciones 2D y perfiles provisionales. No verifica '+
 'colisiones tridimensionales, mordazas, soportes, giro físico, '+
 'trayectorias continuas de ejes X/R/Z ni seguridad CNC.';

function gaugeCounts(report){
 const counts={penetracion:0,holgura:0,'chapa-detras':0,
  'sin-asiento':0,'referencia-interior':0};
 for(const op of report?.operations||[]){
  const kinds=new Set((op.findings||[]).map(f=>f.kind));
  for(const kind of kinds)if(Object.prototype.hasOwnProperty.call(counts,kind))counts[kind]++;
 }
 return counts;
}

function prepare(piece,options={}){
 const p=normalized(piece),maxCandidates=p.order.length<=4?
  24:Math.min(120,Math.max(1,Math.trunc(options.maxCandidates??60)));
 const all=sequenceCandidates(p.order,maxCandidates);
 const sheet=all.map((order,index)=>({order,index,score:scoreBendOrder(p,order)}));
 // Nunca discriminar por chapa si hay sólo 4 golpes: comparar TODOS los
 // órdenes también contra punzón/matriz/tope para hallar mejoría SOLO de útiles.
 if(p.order.length>4){
  sheet.sort((a,b)=>{
   const hardA=a.score.counts.cross+a.score.counts.overlap;
   const hardB=b.score.counts.cross+b.score.counts.overlap;
   return hardA-hardB||a.score.score-b.score.score||a.index-b.index;
  });
 }
 const limitedFour=options.deepLimitFour==null?null:
  Math.max(1,Math.min(24,Math.trunc(options.deepLimitFour)));
 const rated=limitedFour!=null&&p.order.length<=4?
  [sheet[0],...sheet.slice(1).sort((a,b)=>
   a.score.score-b.score.score||a.index-b.index)].slice(0,limitedFour):null;
 const reviewed=p.order.length<=4?(rated||sheet):
  [sheet.find(x=>x.index===0),
   ...sheet.filter(x=>x.index!==0)].slice(
    0,Math.min(16,Math.max(2,Math.trunc(options.maxDeepCandidates??10))));
 const final=inspectProfile(profile(p,p.angles.map(()=>1)).points,p.thickness);
 const finalCounts={cross:0,overlap:0,touch:0,close:0};
 for(const hit of final)if(Object.prototype.hasOwnProperty.call(finalCounts,hit.kind))finalCounts[hit.kind]++;
 return {p,all,reviewed,finalCounts,finalIssues:final.length,options};
}

function analyze(ctx,item){
 const {p,options}=ctx;
 const toolSamples=Math.max(1,Math.min(9,Math.trunc(options.toolSamples??3)));
 const gaugeSamples=Math.max(8,Math.min(40,Math.trunc(options.gaugeSamples??8)));
 const current=normalized({...p,order:item.order});
 let tool=null,gauge=null,error=null;
 try{
  // Un analizador que no devuelve todas las operaciones es DESCONOCIDO,
  // nunca una aprobación vacía de ausencia de colisiones.
  const evaluator=options.toolEvaluator||inspectSequenceTools;
  tool=scoreToolOrder(current,item.order,toolSamples,(candidate,samples)=>{
   const result=evaluator(candidate,samples);
   if(!result||!Array.isArray(result.operations)||
      result.operations.length!==current.order.length)
    throw Error('El cribado punzón/matriz no devolvió todos los golpes');
   return result;
  });
  gauge=(options.gaugeEvaluator||scanGaugeSequence)(current,
   {samplesPerOperation:gaugeSamples});
  if(!gauge||!Array.isArray(gauge.operations)||
     gauge.operations.length!==p.order.length)
   throw Error('El cribado del tope no devolvió todos los golpes');
 }catch(err){
  error=err instanceof Error?err.message:String(err);
 }
 const g=gaugeCounts(gauge),sheet=item.score;
 const hardSheet=sheet.counts.cross+sheet.counts.overlap;
 const hardTool=tool?.penetrationOperations??0;
 const hardGauge=g.penetracion+g['chapa-detras']+g['sin-asiento'];
 const hard=hardSheet+hardTool+hardGauge;
 const softSheet=sheet.counts.touch+sheet.counts.close;
 const softTool=tool?.warningOperations??0;
 const softGauge=g.holgura+g['referencia-interior'];
 const soft=softSheet+softTool+softGauge;
 // Objetivo lexicográfico: una penetración nueva no se compensa por cientos
 // de avisos menores. El resultado inicial gana siempre si empata.
 const riskVector=[
  error?1:0, hard,
  hardTool+g.penetracion,hardGauge,hardSheet,
  softTool,softGauge,softSheet
 ];
 return {
  order:[...item.order],sheet,tool,gauge:g,
  checks:{toolSamples,gaugeSamples,gaugeOperations:gauge?.operations.length||0},
  hard,soft,riskVector,unavailable:Boolean(error),error,
  status:error?'incompleto':hard?'conflictos-2d':soft?'avisos-2d':'sin-avisos-en-muestras',
  verified:false
 };
}

function finalize(ctx,results){
 const current=results.find(result=>same(result.order,ctx.p.order));
 const viable=results.filter(result=>!result.unavailable);
 const best=[...viable].sort((a,b)=>
  cmp(a.riskVector,b.riskVector)||
  (same(a.order,ctx.p.order)?-1:0)-(same(b.order,ctx.p.order)?-1:0)||
  a.order.join(',').localeCompare(b.order.join(',')))[0]||current;
 const improved=Boolean(best&&!best.unavailable&&current&&!current.unavailable&&
  cmp(best.riskVector,current.riskVector)<0);
 const nonIncreasingHard=Boolean(best&&current&&!best.unavailable&&!current.unavailable&&
  best.sheet.counts.cross<=current.sheet.counts.cross&&
  best.sheet.counts.overlap<=current.sheet.counts.overlap&&
  best.tool.penetrationOperations<=current.tool.penetrationOperations&&
  best.gauge.penetracion<=current.gauge.penetracion&&
  best.gauge['chapa-detras']<=current.gauge['chapa-detras']&&
  best.gauge['sin-asiento']<=current.gauge['sin-asiento']);
 // No sustituir automáticamente una penetración por otra en otra herramienta.
 const automaticApplicable=improved&&nonIncreasingHard&&
  best.hard<=current.hard&&ctx.finalCounts.cross===0&&ctx.finalCounts.overlap===0;
 return {
  current,best:best||current,order:improved?[...best.order]:[...ctx.p.order],
  improved,automaticApplicable,
  compared:ctx.all.length,deepChecked:results.length,
  exhaustive:ctx.p.order.length<=4&&ctx.all.length===
   Array.from({length:ctx.p.order.length},(_,i)=>i+1).reduce((a,b)=>a*b,1)&&
   results.length===ctx.all.length,
  finalRisks:ctx.finalCounts,finalGeometryAffected:ctx.finalIssues>0,
  unassessed:ctx.all.length-results.length,
  incomplete:results.some(r=>r.unavailable),
  toolSamples:Math.max(1,Math.min(9,Math.trunc(ctx.options.toolSamples??3))),
  gaugeSamples:Math.max(8,Math.min(40,Math.trunc(ctx.options.gaugeSamples??8))),
  method:SEQUENCE_LIMITATIONS,
  verified:false
 };
}

/** Motor síncrono para tests y piezas pequeñas. Nunca modifica piece. */
export function planBendSequence(piece,options={}){
 const ctx=prepare(piece,options);
 return finalize(ctx,ctx.reviewed.map(item=>analyze(ctx,item)));
}
/** Evaluación progresiva que libera el hilo entre alternativas (PC/móvil). */
export async function planBendSequenceAsync(piece,options={}){
 const ctx=prepare(piece,options),results=[];
 for(const item of ctx.reviewed){
  if(options.cancelled?.())return null;
  results.push(analyze(ctx,item));
  options.onProgress?.(results.length,ctx.reviewed.length);
  if(options.cancelled?.())return null;
  await new Promise(resolve=>setTimeout(resolve,0));
 }
 return finalize(ctx,results);
}
