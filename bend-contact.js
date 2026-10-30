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
 phase='Posicionamiento',press=0,approachGap=null
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
 const theta=isTransition?0:-angleRad/2;
 const c=Math.cos(theta),s=Math.sin(theta);
 const center={x:bend.x,y:bend.y};
 const moved=input.map(pt=>{
  const dx=pt.x-center.x,dy=pt.y-center.y;
  return {x:dx*c-dy*s,y:dx*s+dy*c};
 });
 // During return the piece stays folded; only its CENTER rises away from V.
 const recovery=phase==='Retorno'?clamp((1-press)/.8,0,1):0;
 const lift=sag*recovery;
 const centerHeight=thickness/2-sag+lift;
 const sheet=moved.map(pt=>({x:pt.x,y:pt.y+centerHeight}));
 const gap=approachGap??Math.max(14,opening*1.7);
 let tipHeight;
 if(phase==='Plegado')tipHeight=centerHeight+thickness/2;
 else if(phase==='Retorno')tipHeight=centerHeight+thickness/2+gap*clamp(1-press,0,1);
 else tipHeight=thickness+gap*clamp(1-press/.45,0,1);
 if(isTransition)tipHeight=thickness+gap;
 const rounded=roundedCorner(sheet,valid,Math.max(.2,thickness*.6));
 return {sheet,rounded,tipHeight,centerHeight,sag,sagTarget,
  limitedByDie:dieLimit,contact:phase==='Plegado',
  roundedApproximation:true};
}
/** Visual quadratic transition through the corner with its adjacent flats. */
export function roundedCorner(points,index,radius){
 if(!points.length||index<=0||index>=points.length-1)return points.slice();
 const v=points[index],prev=points[index-1],next=points[index+1];
 const vin={x:v.x-prev.x,y:v.y-prev.y},vout={x:next.x-v.x,y:next.y-v.y};
 const lenIn=dist(prev,v),lenOut=dist(v,next);
 if(lenIn<1e-6||lenOut<1e-6)return points.slice();
 const dot=clamp((vin.x*vout.x+vin.y*vout.y)/(lenIn*lenOut),-1,1);
 const turn=Math.acos(dot);
 if(turn<.008)return points.slice();
 const tangent=Math.min(lenIn*.38,lenOut*.38,Math.max(.05,radius)*Math.tan(turn/2));
 const dirIn={x:vin.x/lenIn,y:vin.y/lenIn};
 const dirOut={x:vout.x/lenOut,y:vout.y/lenOut};
 const start={x:v.x-dirIn.x*tangent,y:v.y-dirIn.y*tangent};
 const end={x:v.x+dirOut.x*tangent,y:v.y+dirOut.y*tangent};
 const result=[...points.slice(0,index),start];
 for(let i=1;i<=12;i++){
  const t=i/12,u=1-t;
  result.push({x:u*u*start.x+2*u*t*v.x+t*t*end.x,
               y:u*u*start.y+2*u*t*v.y+t*t*end.y});
 }
 result.push(...points.slice(index+1));
 return result;
}
