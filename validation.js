/**
 * PLEGADOX · Verificaciones geométricas preliminares (2D)
 *
 * No valida colisiones contra máquina o perfiles CAD. Detecta cruces entre
 * tramos no adyacentes y proximidades inferiores al espesor durante la
 * secuencia seleccionada. No certifica que una operación sea segura.
 */
import { normalized, profile, stage, getTooling, MACHINE } from './engine.js';
import {getV85} from './machine-config.js';

const EPS=1e-7;
const round=(x,n=2)=>Number(x.toFixed(n));
const dist=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
const subtract=(a,b)=>({x:a.x-b.x,y:a.y-b.y});
const cross=(a,b)=>a.x*b.y-a.y*b.x;
const dot=(a,b)=>a.x*b.x+a.y*b.y;
const orient=(a,b,c)=>cross(subtract(b,a),subtract(c,a));

function between(a,b,v){
 return v>=Math.min(a,b)-EPS && v<=Math.max(a,b)+EPS;
}
function onSegment(a,b,p){
 return Math.abs(orient(a,b,p))<EPS && between(a.x,b.x,p.x) && between(a.y,b.y,p.y);
}
/** Includes real crossing, collinear overlap and endpoint contact. */
export function segmentsIntersect(a,b,c,d){
 const s1=orient(a,b,c),s2=orient(a,b,d),s3=orient(c,d,a),s4=orient(c,d,b);
 if(((s1>EPS&&s2< -EPS)||(s1< -EPS&&s2>EPS)) &&
    ((s3>EPS&&s4< -EPS)||(s3< -EPS&&s4>EPS)))return true;
 if(Math.abs(s1)<=EPS&&onSegment(a,b,c))return true;
 if(Math.abs(s2)<=EPS&&onSegment(a,b,d))return true;
 if(Math.abs(s3)<=EPS&&onSegment(c,d,a))return true;
 if(Math.abs(s4)<=EPS&&onSegment(c,d,b))return true;
 return false;
}
function pointToSegment(p,a,b){
 const ab=subtract(b,a),ap=subtract(p,a),len2=dot(ab,ab);
 if(len2<=EPS)return dist(p,a);
 const t=Math.max(0,Math.min(1,dot(ap,ab)/len2));
 return dist(p,{x:a.x+t*ab.x,y:a.y+t*ab.y});
}
export function segmentClearance(a,b,c,d){
 if(segmentsIntersect(a,b,c,d))return 0;
 return Math.min(pointToSegment(a,c,d),pointToSegment(b,c,d),
                 pointToSegment(c,a,b),pointToSegment(d,a,b));
}
/** Ignore neighboring lengths sharing the intended bend vertex. */
export function inspectProfile(points,thickness=0){
 const findings=[],n=points.length-1,t=Math.max(0,Number(thickness)||0);
 for(let i=0;i<n;i++){
  for(let j=i+2;j<n;j++){
   const a=points[i],b=points[i+1],c=points[j],d=points[j+1];
   const intersect=segmentsIntersect(a,b,c,d);
   const clearance=intersect?0:segmentClearance(a,b,c,d);
   if(intersect){
    findings.push({kind:'cross',segments:[i,j],clearance:0});
   }else if(t>0&&clearance<t-EPS){
    findings.push({kind:'close',segments:[i,j],clearance:round(clearance,3)});
   }
  }
 }
 return findings;
}
function issue(code,level,bend,message,extra={}){
 return {code,level,bend,message,...extra};
}
function unique(issues){
 const map=new Map();
 for(const x of issues){
  const key=x.code+':'+(x.bend??'overall')+':'+(x.segments?.join(',')||'');
  if(!map.has(key))map.set(key,x);
 }
 return [...map.values()];
}
/**
 * Analyze finished geometry plus sampled intermediate poses in the user's
 * actual operation order. "Interferencia posible" is a geometric screen,
 * not contact simulation or certified machine clearance.
 */
export function analyzeSequence(raw){
 const p=normalized(raw),{die,punch}=getTooling(p);
 const issues=[];
 const finished=profile(p,p.angles.map(()=>1));
 for(const finding of inspectProfile(finished.points,p.thickness)){
  const segments=finding.segments.map(i=>i+1);
  issues.push(issue(finding.kind==='cross'?'final-cross':'final-clearance','warning',null,
    finding.kind==='cross'
      ?'Cruce de tramos '+segments.join(' y ')+' en la pieza final (perfil 2D).'
      :'Separación menor que el espesor entre tramos '+segments.join(' y ')+'.',
    {...finding}));
 }
 const perOperation=[];
 for(let op=0;op<p.order.length;op++){
  const bend=p.order[op];
  const samples=[.06,.25,.48,.60,.76,.91].map(f=>stage(p,op*5+f*5));
  const problemSamples=[];
  for(const st of samples){
   const hits=inspectProfile(profile(p,st.fractions).points,p.thickness);
   if(hits.length)problemSamples.push({phase:st.phase,hits});
  }
  if(problemSamples.length){
   const first=problemSamples[0];
   issues.push(issue('operation-geometry','warning',bend,
    'Posible interferencia de chapa durante el pliegue '+(bend+1)+
    ' (comprobar '+first.phase.toLowerCase()+').',
    {operation:op,example:first}));
  }
  perOperation.push({operation:op,bend,angle:p.angles[bend],
    sampledStates:samples.length,potentialInterference:problemSamples.length>0});
 }
 const ratio=die.opening/p.thickness;
 // V/t is guidance only; no physical tonnage or tooling certification.
 if(ratio<5||ratio>14){
  issues.push(issue('v-to-thickness','advisory',null,
   'Relación V/espesor '+round(ratio,1)+' fuera del intervalo orientativo 5–14; revisar matriz, material y radio.',
   {ratio:round(ratio,2)}));
 }
 const configuredWidth=getV85().ramWidth;
 if(p.width>configuredWidth){
  issues.push(issue('machine-width','warning',null,
   'La pieza excede la anchura configurada de la trancha: '+configuredWidth+' mm.'));
 }
 if(!die.verifiedSpecs||!punch.verifiedSpecs||die.profileAccuracy==='provisional'||punch.profileAccuracy==='provisional'){
  issues.push(issue('provisional-tools','advisory',null,
    'Geometría de herramientas provisional: colisiones con punzón y matriz sin verificar.'));
 }
 const dedup=unique(issues);
 return {
  piece:p.name,issues:dedup,perOperation,
  hasGeometryWarning:dedup.some(x=>x.level==='warning'&&
    ['final-cross','final-clearance','operation-geometry','machine-width'].includes(x.code)),
  verifiedMachineClearance:false,
  summary:dedup.some(x=>x.code==='operation-geometry'||x.code==='final-cross'||x.code==='final-clearance')
    ?'Posibles interferencias geométricas 2D. Revisar operaciones.'
    :'Sin cruces 2D detectados en las posiciones muestreadas. Colisiones físicas no verificadas.',
  limitations:'No considera deformación plástica, radio real, cinemática de volteo, profundidad de mordazas, herramientas CAD ni todas las posiciones entre muestras.'
 };
}
