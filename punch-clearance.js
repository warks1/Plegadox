/** Cota constante del punzón en cada transición de volteo.
 * Barrido de posiciones 2D; no es una trayectoria CNC certificada.
 */
import {normalized,stage,presentedAtStage} from './engine.js';
import {contactKinematics} from './bend-contact.js';
/**
 * Presentación única para render y barrido de aparcamiento: reflejo de
 * alimentación, giro visible y elevación de la chapa. NO es una ruta CNC.
 */
export function sectionPresentation(piece,st,from,feedMirrored=false,nextFeedMirrored=feedMirrored){
 const changingSide=Boolean(from.repositioning&&nextFeedMirrored!==feedMirrored);
 const spin=changingSide?Math.cos(Math.PI*(from.feedProgress??from.progress??0)):1;
 const reflect=pt=>({...pt,x:(feedMirrored?-pt.x:pt.x)*spin});
 const presentation={...from,points:from.points.map(reflect),
  points3D:from.points3D?.map(reflect),
  gaugeSide:feedMirrored?'before':'after',
  feedMirrored,changingFeedSide:changingSide};
 if(presentation.repositioning){
  const half=Math.abs(piece.angles[st.activeBend]*st.fractions[st.activeBend])*Math.PI/360;
  const theta=(feedMirrored?1:-1)*half*(1-(presentation.progress??0));
  const c=Math.cos(theta),s=Math.sin(theta);
  const pivot=presentation.points[st.activeBend+1];
  const low=Math.min(...presentation.points.map(pt=>(pt.x-pivot.x)*s+(pt.y-pivot.y)*c));
  const factor=Math.max(0,Math.min(1,presentation.liftFactor??0));
  presentation.clearanceLift=Math.max(presentation.clearanceLift??0,Math.max(0,5-low)*factor);
 }
 return presentation;
}
const cache=new Map();
export function punchParkHeight(piece,operation,opening=16,dieDepth=8){
 const p=normalized(piece),op=Math.max(-1,Math.min(p.order.length-1,Math.trunc(operation)));
 const key=JSON.stringify([p.flanges,p.angles,p.order,p.thickness,
  p.radius,p.kFactor,p.gaugeSideByBend,opening,dieDepth,op]);
 if(cache.has(key))return cache.get(key);
 const t=p.thickness,gap=Math.max(14,opening*1.7),margin=Math.max(5,t*2);
 let height=t+gap;
 const samples=op<0?[0]:Array.from({length:41},(_,k)=>
  Math.min(p.order.length*5-1e-6,op*5+5*(.84+.16*k/40)));
 for(const time of samples){
  const st=stage(p,time),from=presentedAtStage(p,st);
  for(const feedMirrored of [false,true]){
   // El tope seleccionado puede cambiar el lado de alimentación.
   // Se consideran ambos sentidos incluso durante el volteo.
   const nextFeeds=from.repositioning?[false,true]:[feedMirrored];
   for(const nextFeedMirrored of nextFeeds){
    const presentation=sectionPresentation(p,st,from,feedMirrored,nextFeedMirrored);
    const kin=contactKinematics({
     points:presentation.points,activeBend:st.activeBend,
     angle:p.angles[st.activeBend]*st.fractions[st.activeBend],
     opening,dieDepth,thickness:t,phase:st.phase,press:st.press,
     feedMirrored,presentationLift:presentation.clearanceLift??0,
     repositionProgress:presentation.repositioning?presentation.progress:1
    });
    const top=Math.max(...kin.sheet.map(q=>q.y))+t/2;
    if(Number.isFinite(top))height=Math.max(height,top+margin);
   }
  }
 }
 cache.set(key,height);
 if(cache.size>40)cache.delete(cache.keys().next().value);
 return height;
}
