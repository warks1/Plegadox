/** Cota constante del punzón en cada transición de volteo.
 * Barrido de posiciones 2D; no es una trayectoria CNC certificada.
 */
import {normalized,stage,presentedAtStage} from './engine.js';
import {contactKinematics} from './bend-contact.js';
const cache=new Map();
export function punchParkHeight(piece,operation,opening=16,dieDepth=8){
 const p=normalized(piece),op=Math.max(-1,Math.min(p.order.length-1,Math.trunc(operation)));
 const key=JSON.stringify([p.flanges,p.angles,p.order,p.thickness,
  p.radius,p.kFactor,p.gaugeSideByBend,opening,dieDepth,op]);
 if(cache.has(key))return cache.get(key);
 const t=p.thickness,gap=Math.max(14,opening*1.7),margin=Math.max(5,t*2);
 let height=t+gap;
 const samples=op<0?[0]:Array.from({length:21},(_,k)=>
  Math.min(p.order.length*5-1e-6,op*5+5*(.84+.16*k/20)));
 for(const time of samples){
  const st=stage(p,time),presentation=presentedAtStage(p,st);
  for(const feedMirrored of [false,true]){
   const kin=contactKinematics({
    points:presentation.points,activeBend:st.activeBend,
    angle:p.angles[st.activeBend]*st.fractions[st.activeBend],
    opening,dieDepth,thickness:t,phase:st.phase,press:st.press,
    feedMirrored,presentationLift:(presentation.clearanceLift??0)+5,
    repositionProgress:presentation.repositioning?presentation.progress:1
   });
   const top=Math.max(...kin.sheet.map(q=>q.y))+t/2;
   if(Number.isFinite(top))height=Math.max(height,top+margin);
  }
 }
 cache.set(key,height);
 if(cache.size>40)cache.delete(cache.keys().next().value);
 return height;
}
