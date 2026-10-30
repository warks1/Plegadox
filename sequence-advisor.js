/**
 * PLEGADOX - sugeridor preliminar de secuencia de plegado.
 *
 * Sólo compara cruces, solapamientos y proximidades ENTRE ALAS de la chapa
 * en estados 2D muestreados. No verifica útiles, punzón, matriz, mesa,
 * reorientación/volteo, límites CNC ni accesibilidad física al golpe.
 * La recomendación jamás se aplica sin confirmación explícita.
 */
import {normalized,profile,stage} from './engine.js';
import {inspectProfile} from './validation.js';
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
export function suggestBendOrder(piece,options={}){
 const p=normalized(piece),maxCandidates=options.maxCandidates??60;
 const current=scoreBendOrder(p,p.order);
 let best=current;
 const candidates=sequenceCandidates(p.order,maxCandidates);
 for(const order of candidates){
  if(same(order,p.order))continue;
  const result=scoreBendOrder(p,order);
  if(result.score<best.score)best=result;
 }
 const improved=best.score<current.score;
 return {current,best,improved,order:improved?best.order:current.order,
  compared:candidates.length,exhaustive:p.order.length<=4&&candidates.length===
   Array.from({length:p.order.length},(_,i)=>i+1).reduce((a,b)=>a*b,1),
  method:'Muéstreos de fibra media 2D entre alas de chapa; útiles y volteos no evaluados',
  verified:false};
}
