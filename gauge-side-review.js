/**
 * Cribado opcional de dos presentaciones de chapa frente a los útiles 2D.
 * NO es un planificador CNC ni valida colisiones 3D, topes o volteos.
 */
import {normalized,stage,gaugeReference} from './engine.js';
import {inspectToolContact} from './tool-collision.js';
export function compareGaugeSides(piece,time=0,steps=5){
 const p=normalized(piece),st=stage(p,time);
 const count=Math.min(15,Math.max(2,Math.trunc(steps)||5));
 const current=gaugeReference(p,st.activeBend);
 const sides=['before','after'].map(side=>{
  const selected=[...p.gaugeSideByBend];selected[st.activeBend]=side;
  const candidate=normalized({...p,gaugeSideByBend:selected});
  let penetrations=0,warnings=0,toolMax=0;
  for(let i=0;i<count;i++){
   const tm=st.activeOperation*5+5*(i+.5)/count;
   const result=inspectToolContact(candidate,tm);
   penetrations+=Number(Boolean(result.hasPenetration));
   warnings+=Number(Boolean(result.hasWarning));
   toolMax=Math.max(toolMax,result.issues?.length||0);
  }
  const ref=gaugeReference(candidate,st.activeBend);
  return {side,nominalDistance:ref.distance,penetrations,warnings,
   toolMax,score:penetrations*100+warnings,verified:false};
 });
 const [a,b]=sides;
 const better=a.score===b.score?null:a.score<b.score?'before':'after';
 return {bend:st.activeBend,operation:st.activeOperation,
  samplesPerSide:count,currentSide:current.side,sides,better,
  verified:false,limitations:'Herramientas paramétricas, cinco posiciones 2D; no comprueba jorobas CAD exactas, topes, mordazas ni accesibilidad real'};
}
