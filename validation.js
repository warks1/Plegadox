/**
 * PLEGADOX · Verificaciones geométricas preliminares (2D)
 *
 * No valida colisiones contra máquina o perfiles CAD. Detecta cruces entre
 * tramos no adyacentes y proximidades inferiores al espesor durante la
 * secuencia seleccionada. No certifica que una operación sea segura.
 */
import { normalized, profile, stage, getTooling, toolAngleCompatibility } from './engine.js';
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
/**
 * Relaciones entre segmentos NO adyacentes de fibra media:
 * - cross: atraviesan el INTERIOR de ambos;
 * - overlap: comparten un tramo colineal de longitud positiva;
 * - touch: sólo comparten un punto (incluido extremo).
 * No confundir un extremo que toca con dos alas que se atraviesan.
 */
export function segmentContactKind(a,b,c,d){
 const s1=orient(a,b,c),s2=orient(a,b,d),s3=orient(c,d,a),s4=orient(c,d,b);
 if(((s1>EPS&&s2< -EPS)||(s1< -EPS&&s2>EPS)) &&
    ((s3>EPS&&s4< -EPS)||(s3< -EPS&&s4>EPS)))return 'cross';
 const collinear=[s1,s2,s3,s4].every(v=>Math.abs(v)<=EPS);
 if(collinear){
  const useX=Math.max(Math.abs(b.x-a.x),Math.abs(d.x-c.x))>=
    Math.max(Math.abs(b.y-a.y),Math.abs(d.y-c.y));
  const v=p=>useX?p.x:p.y;
  const lo=Math.max(Math.min(v(a),v(b)),Math.min(v(c),v(d)));
  const hi=Math.min(Math.max(v(a),v(b)),Math.max(v(c),v(d)));
  return hi-lo>EPS?'overlap':hi-lo>=-EPS?'touch':null;
 }
 if(Math.abs(s1)<=EPS&&onSegment(a,b,c))return 'touch';
 if(Math.abs(s2)<=EPS&&onSegment(a,b,d))return 'touch';
 if(Math.abs(s3)<=EPS&&onSegment(c,d,a))return 'touch';
 if(Math.abs(s4)<=EPS&&onSegment(c,d,b))return 'touch';
 return null;
}
/** Compatibilidad: las tres relaciones suponen intersección geométrica. */
export function segmentsIntersect(a,b,c,d){
 return segmentContactKind(a,b,c,d)!==null;
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
/**
 * Localización geométrica de incidencia entre dos segmentos 2D, en mm.
 * - cross/touch: un punto de intersección;
 * - overlap: centro del solapamiento (no se confunde con una penetración);
 * - sin intersección: par más próximo entre las dos fibras.
 * Sólo sirve para diagnóstico de fibra media; NO es contacto de sólidos 3D.
 */
export function segmentContactGeometry(a,b,c,d){
 const kind=segmentContactKind(a,b,c,d);
 const ab=subtract(b,a),cd=subtract(d,c);
 const denom=cross(ab,cd);
 const mix=(p,v,t)=>({x:p.x+v.x*t,y:p.y+v.y*t});
 const project=(p,u,v)=>{
  const vec=subtract(v,u),l2=dot(vec,vec);
  const t=l2<=EPS*EPS?0:Math.max(0,Math.min(1,dot(subtract(p,u),vec)/l2));
  return mix(u,vec,t);
 };
 if(kind==='cross'){
  const t=cross(subtract(c,a),cd)/denom;
  const point=mix(a,ab,t);
  return {kind,clearance:0,point,pointA:point,pointB:point};
 }
 if(kind==='overlap'){
  const useX=Math.max(Math.abs(ab.x),Math.abs(cd.x))>=
   Math.max(Math.abs(ab.y),Math.abs(cd.y));
  const scalar=p=>useX?p.x:p.y;
  const lo=Math.max(Math.min(scalar(a),scalar(b)),Math.min(scalar(c),scalar(d)));
  const hi=Math.min(Math.max(scalar(a),scalar(b)),Math.max(scalar(c),scalar(d)));
  const mid=(lo+hi)/2,axis=useX?'x':'y';
  const t=Math.abs(ab[axis])>EPS?(mid-a[axis])/ab[axis]:
    Math.abs(cd[axis])>EPS?(mid-c[axis])/cd[axis]:0;
  const point=Math.abs(ab[axis])>EPS?mix(a,ab,t):mix(c,cd,t);
  return {kind,clearance:0,point,pointA:point,pointB:point};
 }
 if(kind==='touch'){
  const candidates=[c,d,a,b];
  const point=candidates.find(p=>onSegment(a,b,p)&&onSegment(c,d,p));
  if(point){
   const located={x:point.x,y:point.y};
   return {kind,clearance:0,point:located,pointA:located,pointB:located};
  }
  // Si el umbral de orientación detectó contacto, pero ningún vértice
  // coincide exactamente, proyectar el extremo más cercano.
 }
 const choices=[
  {pointA:a,pointB:project(a,c,d)},
  {pointA:b,pointB:project(b,c,d)},
  {pointA:project(c,a,b),pointB:c},
  {pointA:project(d,a,b),pointB:d}
 ];
 choices.sort((u,v)=>dist(u.pointA,u.pointB)-dist(v.pointA,v.pointB));
 const {pointA,pointB}=choices[0];
 const point={x:(pointA.x+pointB.x)/2,y:(pointA.y+pointB.y)/2};
 return {kind,clearance:kind?0:dist(pointA,pointB),point,pointA,pointB};
}
/** Ignore neighboring lengths sharing the intended bend vertex. */
export function inspectProfile(points,thickness=0){
 const findings=[],n=points.length-1,t=Math.max(0,Number(thickness)||0);
 for(let i=0;i<n;i++){
  for(let j=i+2;j<n;j++){
   const a=points[i],b=points[i+1],c=points[j],d=points[j+1];
   const geometry=segmentContactGeometry(a,b,c,d);
   if(geometry.kind){
    findings.push({kind:geometry.kind,segments:[i,j],clearance:0,
     point:geometry.point,pointA:geometry.pointA,pointB:geometry.pointB});
   }else if(t>0&&geometry.clearance<t-EPS){
    findings.push({kind:'close',segments:[i,j],
     clearance:round(geometry.clearance,3),
     point:geometry.point,pointA:geometry.pointA,pointB:geometry.pointB});
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
  // Dos avisos de "longitud" pueden corresponder a un punzón y una
  // matriz distintos: no borrar el segundo por compartir código y pliegue.
  const key=[x.code,x.bend??'overall',x.kind||'',x.reference||'',
    x.segments?.join(',')||''].join(':');
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
  const category={
   cross:['final-cross','Cruce real de fibras'],
   overlap:['final-overlap','Solapamiento colineal de alas'],
   touch:['final-touch','Contacto puntual de alas'],
   close:['final-clearance','Separación menor que el espesor']
  }[finding.kind];
  issues.push(issue(category[0],'warning',null,
   category[1]+' entre tramos '+segments.join(' y ')+
    ' en la pieza final (perfil 2D preliminar).',{...finding}));
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
  // En una V convencional simétrica, los hombros están a V/2 del eje
  // central. Una ala nominal menor no alcanza su hombro correspondiente.
  // No es el cálculo de ala mínima de catálogo ni considera radio/amarre.
  const halfV=die.opening/2;
  const shortWings=[
   {side:'anterior',length:p.flanges[bend]},
   {side:'posterior',length:p.flanges[bend+1]}
  ].filter(item=>item.length+1e-7<halfV);
  if(shortWings.length){
   issues.push(issue('v-support','warning',bend,
    'Pliegue '+(bend+1)+': ala '+shortWings.map(w=>w.side+' '+round(w.length,1)+' mm').join(' y ')+
    ' menor que V/2 ('+round(halfV,1)+' mm). No alcanza el apoyo nominal del hombro; revisar utillaje o método.',
    {operation:op,halfV,shortWings}));
  }
  const compatibility=toolAngleCompatibility(p,bend);
  if(compatibility.warning){
   issues.push(issue('tool-angle','warning',bend,
    'Revisar pliegue '+(bend+1)+': ángulo interior programado '+
    round(compatibility.interiorAngle,1)+'°, inferior a la abertura nominal de '+
    compatibility.limitingTools.join(' y ')+' ('+round(compatibility.limitingAngle,1)+
    '°). El dibujo no valida este plegado.',{operation:op,compatibility}));
  }
  perOperation.push({operation:op,bend,angle:p.angles[bend],
    sampledStates:samples.length,potentialInterference:problemSamples.length>0,
    toolAngleWarning:compatibility.warning,vSupportWarning:shortWings.length>0});
 }
 const ratio=die.opening/p.thickness;
 // V/t is guidance only; no physical tonnage or tooling certification.
 if(ratio<5||ratio>14){
  issues.push(issue('v-to-thickness','advisory',null,
   'Relación V/espesor '+round(ratio,1)+' fuera del intervalo orientativo 5–14; revisar matriz, material y radio.',
   {ratio:round(ratio,2)}));
 }
 // Las longitudes en catálogo describen UNA sola pieza de útil. No
 // afirmar que pueda cubrirse una longitud mayor sin un montaje segmentado.
 for(const [kind,tool] of [['punzón',punch],['matriz',die]]){
  const length=Number(tool.length);
  if(Number.isFinite(length)&&length>0&&p.width>length+1e-6){
   issues.push(issue('tool-length','warning',null,
    'La pieza mide '+round(p.width,1)+' mm; un único segmento de '+
    kind+' '+(tool.reference||tool.name)+' tiene '+round(length,1)+
    ' mm nominales. Se requiere comprobar montaje de varios segmentos, amarre y reparto de carga.',
    {kind,reference:tool.reference||tool.name,availableLength:length,requiredLength:p.width}));
  }
 }
 const machine=getV85();
 if(p.width>machine.ramWidth){
  issues.push(issue('machine-width','warning',null,
   'La pieza excede el ancho configurado de la trancha: '+machine.ramWidth+' mm.'));
 }
 if(p.width>machine.holderWidth){
  issues.push(issue('machine-holder-width','warning',null,
   'La pieza excede el ancho configurado del portaútiles: '+machine.holderWidth+' mm.'));
 }
 if(!die.verifiedSpecs||!punch.verifiedSpecs||die.profileAccuracy==='provisional'||punch.profileAccuracy==='provisional'){
  issues.push(issue('provisional-tools','advisory',null,
    'Geometría de herramientas provisional: colisiones con punzón y matriz sin verificar.'));
 }
 const dedup=unique(issues);
 return {
  piece:p.name,issues:dedup,perOperation,
  hasGeometryWarning:dedup.some(x=>x.level==='warning'&&
    ['final-cross','final-overlap','final-touch','final-clearance','operation-geometry','machine-width','machine-holder-width','tool-angle','v-support','tool-length'].includes(x.code)),
  verifiedMachineClearance:false,
  summary:dedup.some(x=>x.code==='operation-geometry'||x.code==='final-cross'||x.code==='final-overlap'||x.code==='final-touch'||x.code==='final-clearance')
    ?'Posibles interferencias geométricas 2D. Revisar operaciones.'
    :dedup.some(x=>['tool-angle','v-support','tool-length','machine-width','machine-holder-width'].includes(x.code))
      ?'Revisar la configuración de máquina, longitud de herramientas y geometría de los pliegues.'
      :'Sin cruces 2D detectados en las posiciones muestreadas. Colisiones físicas no verificadas.',
  limitations:'No considera deformación plástica, radio real, cinemática de volteo, profundidad de mordazas, herramientas CAD ni todas las posiciones entre muestras.'
 };
}
