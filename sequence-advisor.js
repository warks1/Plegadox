/**
 * PLEGADOX - sugeridor preliminar de secuencia de plegado.
 *
 * Compara cruces, solapamientos y proximidades ENTRE ALAS y añade un
 * segundo filtro de avisos de herramienta PARAMÉTRICA en sección 2D.
 * NO verifica perfiles CAD, mesa, topes, reorientación/volteo, límites
 * CNC ni accesibilidad física al golpe.
 * La recomendación jamás se aplica sin confirmación explícita.
 */
import {normalized,profile,stage} from './engine.js';
import {inspectProfile} from './validation.js';
import {inspectSequenceTools} from './tool-collision.js';
const WEIGHTS=Object.freeze({cross:1000,overlap:650,touch:90,close:25});
const TIMES=[.14,.43,.60,.78,.94];
const same=(a,b)=>a.length===b.length&&a.every((v,i)=>v===b[i]);
const swap=(a,i,j)=>{const b=a.slice();[b[i],b[j]]=[b[j],b[i]];return b;};
export function scoreBendOrder(piece,order){
 const p=normalized({...piece,order});
 const counts={cross:0,overlap:0,touch:0,close:0};
 let affectedOperations=0;
 for(let op=0;op<p.order.length;op++){
  let hasWarning=false;
  for(const fraction of TIMES){
   const state=stage(p,5*(op+fraction));
   const hits=inspectProfile(profile(p,state.fractions).points,p.thickness);
   for(const hit of hits){
    counts[hit.kind]++;
    hasWarning=true;
   }
  }
  if(hasWarning)affectedOperations++;
 }
 return {order:[...p.order],counts,affectedOperations,
  sampledPositions:p.order.length*TIMES.length,
  score:Object.keys(counts).reduce((total,kind)=>total+counts[kind]*WEIGHTS[kind],0),
  verified:false};
}
export function sequenceCandidates(order,maxCandidates=60){
 const original=[...order],candidates=[],seen=new Set();
 const limit=Math.max(1,Math.min(120,Math.trunc(maxCandidates)||60));
 const add=seq=>{
  const key=seq.join(',');
  if(seen.has(key)||candidates.length>=limit)return;
  seen.add(key);candidates.push(seq);
 };
 add(original);
 if(original.length<=4){
  const recurse=(prefix,rest)=>{
   if(!rest.length){add(prefix);return;}
   for(let i=0;i<rest.length;i++)
    recurse([...prefix,rest[i]],rest.filter((_,j)=>j!==i));
  };
  recurse([],original);
 }else{
  add([...original].reverse());
  add([...original].sort((a,b)=>a-b));
  // Movimientos locales de bajo coste y distintos puntos de partida.
  for(const base of [original,[...original].reverse()]){
   for(let distance=1;distance<base.length;distance++)
    for(let i=0;i+distance<base.length;i++)
     add(swap(base,i,i+distance));
  }
  for(let shift=1;shift<original.length;shift++)
   add([...original.slice(shift),...original.slice(0,shift)]);
 }
 return candidates;
}
/**
 * Cribado adicional de punzón/matriz en tres poses por golpe. Un resultado
 * favorable no demuestra que no existan penetraciones entre muestras.
 */
export function scoreToolOrder(piece,order,samples=3,evaluator=inspectSequenceTools){
 const p=normalized({...piece,order});
 const result=evaluator(p,samples);
 const operations=result?.operations||[];
 return {order:[...p.order],
  penetrationOperations:operations.filter(op=>op.possibleToolIntrusion).length,
  warningOperations:operations.filter(op=>op.possibleToolInterference).length,
  sampledPositions:operations.reduce((sum,op)=>sum+(Number(op.samples)||0),0),
  verified:false};
}
export function suggestBendOrder(piece,options={}){
 const p=normalized(piece),maxCandidates=options.maxCandidates??60;
 const toolEvaluator=options.toolEvaluator||inspectSequenceTools;
 const toolSampleCount=Math.max(1,Math.min(5,Math.trunc(options.toolSamples??3)));
 // Evaluar como máximo cuatro propuestas con útiles: en piezas largas
 // cada comprobación puede ser costosa. Se indica el número real cribado.
 const maxToolCandidates=Math.max(0,Math.min(8,Math.trunc(options.maxToolCandidates??4)));
 const current=scoreBendOrder(p,p.order);
 const toolCurrent=scoreToolOrder(p,p.order,toolSampleCount,toolEvaluator);
 // La forma final NO depende del orden: si las alas acaban cruzadas,
 // ninguna permutación puede resolver ese defecto del diseño.
 const finalIssues=inspectProfile(profile(p,p.angles.map(()=>1)).points,p.thickness);
 const finalRisks={cross:0,overlap:0,touch:0,close:0};
 for(const hit of finalIssues)finalRisks[hit.kind]++;
 const candidates=sequenceCandidates(p.order,maxCandidates);
 const ranked=candidates.filter(order=>!same(order,p.order))
  .map(order=>scoreBendOrder(p,order))
  .filter(result=>result.score<current.score)
  .sort((a,b)=>a.score-b.score||
   a.order.join(',').localeCompare(b.order.join(',')));
 const bestSheet=ranked[0]||current;
 let best=current,bestTool=toolCurrent,blockedByTools=0,toolCandidatesChecked=0;
 for(const candidate of ranked.slice(0,maxToolCandidates)){
  const screening=scoreToolOrder(p,candidate.order,toolSampleCount,toolEvaluator);
  toolCandidatesChecked++;
  // Una mejora de chapa no puede esconder más penetraciones ni más
  // operaciones con holgura insuficiente respecto al programa actual.
  if(screening.penetrationOperations>toolCurrent.penetrationOperations||
     screening.warningOperations>toolCurrent.warningOperations){
   blockedByTools++;continue;
  }
  best=candidate;bestTool=screening;break;
 }
 const improved=best.score<current.score;
 return {current,best,bestSheet,improved,
  order:improved?best.order:current.order,
  toolScreen:{current:toolCurrent,best:bestTool,
   candidateChecks:toolCandidatesChecked,blockedByTools,
   samplesPerOperation:toolSampleCount,verified:false},
  finalRisks,finalGeometryAffected:finalIssues.length>0,
  compared:candidates.length,exhaustive:p.order.length<=4&&candidates.length===
   Array.from({length:p.order.length},(_,i)=>i+1).reduce((a,b)=>a*b,1),
  method:'Muestras de fibra media y perfiles paramétricos 2D. NO evalúa CAD exacto, topes, mesa ni volteos.',
  verified:false};
}
