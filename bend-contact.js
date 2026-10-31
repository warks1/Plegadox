/**
 * PLEGADOX · aproximación cinemática al plegado en V (2D).
 *
 * Durante el contacto, la punta empuja el centro de la fibra de la chapa,
 * mientras los extremos de la boca V sirven de apoyos. La vista muestra una
 * V progresiva y un radio de transición, no un triángulo que atraviesa la
 * herramienta. No simula tensiones, flexión real, recuperación ni bottoming
 * validado con poligonales CAD completas.
 */
import {clamp} from './engine.js';

const deg=Math.PI/180;
const dist=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
const lerp=(a,b,t)=>a+(b-a)*t;
export function contactKinematics({
 points,activeBend,angle=0,opening=16,dieDepth=8,thickness=2,
 phase='Posicionamiento',press=0,approachGap=null,presentationLift=0,
 insideRadius=null,feedMirrored=false
}){
 const input=Array.isArray(points)?points:[];
 if(input.length<2)return {sheet:[],rounded:[],tipHeight:0,
  sag:0,sagTarget:0,contact:false,dieLimit:false};
 const valid=Number.isInteger(activeBend)&&activeBend>=0&&activeBend+1<input.length?
  activeBend+1:1;
 const bend=input[valid],isTransition=phase==='Reposicionamiento'||phase==='Pieza terminada';
 const angleRad=Math.min(170,Math.max(0,Math.abs(angle)))*deg;
 const halfOpening=Math.max(.2,opening/2);
 const limit=Math.max(0,dieDepth-Math.max(.15,thickness*.3));
 // Depth that a sharp-corner V would require to put BOTH sides on the shoulders.
 const sagTarget=halfOpening*Math.tan(angleRad/2);
 const sag=isTransition?0:Math.min(sagTarget,limit);
 const dieLimit=!isTransition&&sagTarget>limit+1e-5;
 // A real V bend rotates BOTH sides around the nose. Incoming and outgoing
 // flats share a symmetric pair of slopes, unlike the old one-sided hinge.
 // Al alimentar desde el ala anterior se invierte X. Esa reflexión
 // cambia también el signo del giro local sobre la V: ambas alas deben
 // elevarse a cada lado de la punta, no barrer por dentro del punzón.
 // El signo del plano y el orden de los golpes NO se cambian.
 const theta=isTransition?0:(feedMirrored?1:-1)*angleRad/2;
 const c=Math.cos(theta),s=Math.sin(theta);
 const center={x:bend.x,y:bend.y};
 const moved=input.map(pt=>{
  const dx=pt.x-center.x,dy=pt.y-center.y;
  return {x:dx*c-dy*s,y:dx*s+dy*c};
 });
 // During return the piece stays folded; only its CENTER rises away from V.
 const recovery=phase==='Retorno'?clamp((1-press)/.8,0,1):0;
 const lift=sag*recovery;
 // Retirada de presentación: sólo representa un espacio libre esquemático
 // para girar la pieza entre golpes, nunca un movimiento CNC calculado.
 const repositionLift=isTransition&&phase==='Reposicionamiento'?
  Math.max(0,Number(presentationLift)||0):0;
 const centerHeight=thickness/2-sag+lift+repositionLift;
 const sheet=moved.map(pt=>({x:pt.x,y:pt.y+centerHeight}));
 const gap=approachGap??Math.max(14,opening*1.7);
 let tipHeight;
 if(phase==='Plegado')tipHeight=centerHeight+thickness/2;
 else if(phase==='Retorno')tipHeight=centerHeight+thickness/2+gap*clamp(1-press,0,1);
 else tipHeight=thickness+gap*clamp(1-press/.45,0,1);
 if(isTransition)tipHeight=thickness+gap;
 // La fibra media dibujada se desplaza aproximadamente medio espesor
 // desde el radio interior programado. La deformación real no se calcula.
 const requestedCenterlineRadius=insideRadius==null?
  Math.max(.2,thickness*.6):
  Math.max(.2,Number(insideRadius)||0)+thickness/2;
 const rounded=roundedCorner(sheet,valid,requestedCenterlineRadius);
 return {sheet,rounded,tipHeight,centerHeight,sag,sagTarget,
  limitedByDie:dieLimit,contact:phase==='Plegado',
  requestedCenterlineRadius,repositionLift,roundedApproximation:true};
}
/**
 * Fillet de sección: verdadero arco circular tangente a ambas fibras rectas,
 * muestreado con 12 divisiones. Se limita el radio si una de las alas es tan
 * corta que no caben sus puntos de tangencia; NO modela recuperación real.
 * Conserva todos los vértices y extremos salvo el vértice redondeado.
 */
export function roundedCorner(points,index,radius){
 if(!points.length||index<=0||index>=points.length-1)return points.slice();
 const v=points[index],prev=points[index-1],next=points[index+1];
 const vin={x:v.x-prev.x,y:v.y-prev.y},vout={x:next.x-v.x,y:next.y-v.y};
 const lenIn=dist(prev,v),lenOut=dist(v,next);
 if(lenIn<1e-6||lenOut<1e-6)return points.slice();
 const u={x:vin.x/lenIn,y:vin.y/lenIn},w={x:vout.x/lenOut,y:vout.y/lenOut};
 const turn=Math.atan2(u.x*w.y-u.y*w.x,u.x*w.x+u.y*w.y);
 const absTurn=Math.abs(turn);
 if(absTurn<.008||absTurn>=Math.PI-.008)return points.slice();
 const tanHalf=Math.tan(absTurn/2);
 if(tanHalf<=1e-9)return points.slice();
 const requested=Math.max(.05,Number(radius)||.05);
 const tangent=Math.min(lenIn*.38,lenOut*.38,requested*tanHalf);
 const effectiveRadius=tangent/tanHalf;
 const start={x:v.x-u.x*tangent,y:v.y-u.y*tangent};
 const sign=Math.sign(turn);
 const normal={x:-sign*u.y,y:sign*u.x};
 const center={x:start.x+normal.x*effectiveRadius,
               y:start.y+normal.y*effectiveRadius};
 const begin=Math.atan2(start.y-center.y,start.x-center.x);
 const result=[...points.slice(0,index),start];
 for(let i=1;i<=12;i++){
  const theta=begin+turn*i/12;
  result.push({x:center.x+effectiveRadius*Math.cos(theta),
               y:center.y+effectiveRadius*Math.sin(theta)});
 }
 result.push(...points.slice(index+1));
 return result;
}
