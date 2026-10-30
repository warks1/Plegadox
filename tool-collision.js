/**
 * PLEGADOX — cribado de penetraciones en sección 2D.
 * Detecta si la fibra media o el espesor nominal de la chapa se superponen
 * con siluetas de herramientas PARAMÉTRICAS en una presentación concreta.
 *
 * NO certifica colisiones ni calcula deformación plástica, holgura,
 * cinemática 3D, soportes, profundidad de mordazas ni esfuerzos.
 */
import {technicalScene} from './technical-section.js';
import {normalized,stage} from './engine.js';

const EPS=1e-8;
const distance=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
function distanceSegment(p,a,b){
 const vx=b.x-a.x,vy=b.y-a.y,len=vx*vx+vy*vy;
 if(len<EPS)return distance(p,a);
 const t=Math.max(0,Math.min(1,((p.x-a.x)*vx+(p.y-a.y)*vy)/len));
 return Math.hypot(p.x-a.x-t*vx,p.y-a.y-t*vy);
}
export function insidePolygon(p,verts){
 let inside=false;
 for(let i=0,j=verts.length-1;i<verts.length;j=i++){
  const a=verts[i],b=verts[j];
  const d=distanceSegment(p,a,b);
  if(d<EPS)return true;
  if((a.y>p.y)!==(b.y>p.y) &&
    p.x < (b.x-a.x)*(p.y-a.y)/(b.y-a.y)+a.x)inside=!inside;
 }
 return inside;
}
function polygonDistance(p,verts){
 let closest=Infinity;
 for(let i=0;i<verts.length;i++)
  closest=Math.min(closest,distanceSegment(p,verts[i],verts[(i+1)%verts.length]));
 return closest;
}
function sampleSheet(sheet,step){
 const samples=[];
 for(let i=0;i<sheet.length-1;i++){
  const a=sheet[i],b=sheet[i+1],d=distance(a,b);
  const n=Math.max(2,Math.min(100,Math.ceil(d/step)));
  for(let k=0;k<=n;k++){
   const u=k/n;
   samples.push({point:{x:a.x+(b.x-a.x)*u,y:a.y+(b.y-a.y)*u},
    segment:i,u});
  }
 }
 return samples;
}
function classifySample(sample,scene,kind){
 const {point:p,segment}=sample;
 const polygon=kind==='punch'?scene.punchPolygon:scene.diePolygon;
 const inside=insidePolygon(p,polygon),boundaryDistance=polygonDistance(p,polygon);
 const half=scene.piece.thickness/2;
 const active=scene.stage.activeBend;
 const contactNearBend=(segment===active||segment===active+1) &&
   Math.abs(p.x)<Math.max(half*1.3,1.2);
 // Inside the solid with a positive margin: impossible even for the
 // zero-thickness centreline. Do not exempt it as "normal bending".
 if(inside && boundaryDistance>0.18)return {
  kind,category:'penetration',point:p,segment,
  depth:boundaryDistance+half
 };
 // On the intended punch-to-sheet contact line, a tiny mismatch in the
 // simplified sharp-tip model must not claim a real 3D collision.
 if(kind==='punch'&&contactNearBend && !inside)return null;
 // On the flat shoulders of the V, contact at underside y=0 is intended.
 if(kind==='die' && p.y>=half-0.12 && !inside)return null;
 if(!inside && boundaryDistance<half-0.18){
  return {kind,category:'clearance',point:p,segment,
   depth:half-boundaryDistance};
 }
 return null;
}
export function inspectToolContact(piece,instant=0){
 const scene=technicalScene(piece,instant),samples=sampleSheet(scene.sheet,
  Math.max(.5,Math.min(3,scene.piece.thickness*.65)));
 const all=[];
 for(const sample of samples){
  for(const kind of ['punch','die']){
   const found=classifySample(sample,scene,kind);
   if(found)all.push(found);
  }
 }
 // Keep the deepest issue per tool and segment, avoiding dozens of repeated
 // warnings and huge per-frame DOM updates.
 const grouped=new Map();
 for(const issue of all){
  const key=issue.kind+':'+issue.segment;
  const old=grouped.get(key);
  if(!old||issue.depth>old.depth)grouped.set(key,issue);
 }
 const warnings=[...grouped.values()].sort((a,b)=>b.depth-a.depth);
 const hard=warnings.filter(i=>i.category==='penetration');
 const result={
  stage:scene.stage,issues:warnings,
  hasPenetration:hard.length>0,hasWarning:warnings.length>0,
  checkedSamples:samples.length,
  limits:'Siluetas 2D paramétricas y espesor nominal; no colisión 3D certificada',
  verified:false
 };
 return result;
}
export function inspectSequenceTools(piece,samplesPerOperation=9){
 const p=normalized(piece),out=[];
 for(let op=0;op<p.order.length;op++){
  let worst=null,firstTime=null,checked=0;
  for(let n=0;n<samplesPerOperation;n++){
   const time=op*5+(n+.5)/samplesPerOperation*5;
   const result=inspectToolContact(p,time);checked++;
   if(result.issues.length){
    const deepest=result.issues[0];
    if(!worst||deepest.depth>worst.depth){worst={...deepest};firstTime=time;}
   }
  }
  out.push({operation:op,bend:p.order[op],angle:p.angles[p.order[op]],
   possibleToolIntrusion:!!worst,example:worst,exampleTime:firstTime,
   samples:checked,verified:false});
 }
 return {operations:out,verified:false,warningCount:out.filter(x=>x.possibleToolIntrusion).length};
}
