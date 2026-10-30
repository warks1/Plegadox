/** Plegadox: núcleo geométrico determinista y sin dependencias. Unidades: mm y grados. */
export const MATERIALS = [
 {id:'s235',name:'Acero S235',k:0.36,springback:1.0},
 {id:'s275',name:'Acero S275',k:0.36,springback:1.1},
 {id:'s355',name:'Acero S355',k:0.35,springback:1.4},
 {id:'inox304',name:'Inoxidable AISI 304',k:0.38,springback:2.0},
 {id:'alu5754',name:'Aluminio 5754',k:0.40,springback:1.6},
 {id:'alu1050',name:'Aluminio 1050',k:0.41,springback:1.2},
 {id:'galva',name:'Acero galvanizado',k:0.36,springback:1.0},
 {id:'zincor',name:'Acero zincor',k:0.36,springback:1.0}
];
export const DIES = [6,10,12,16,22,24,32,35,40,50].map(v=>({id:'v'+v,name:'V'+v,opening:v,angle:88,height:80}));
DIES.push({id:'v16-30',name:'V16 / 30° · perfil de ensayo',opening:16,angle:30,height:80,verifiedSpecs:false,profileAccuracy:'provisional'});
export const PUNCHES = [
 {id:'straight88',name:'Recto 88°',angle:88,height:120,tip:0.8,type:'recto'},
 {id:'straight30',name:'Recto 30°',angle:30,height:120,tip:0.5,type:'recto'},
 {id:'straight60',name:'Recto 60°',angle:60,height:120,tip:0.6,type:'recto'},
 {id:'goose',name:'Pata de cabra 90°',angle:90,height:130,tip:1,type:'cabra'},
 // Referencia trazada de la foto enviada por el usuario; sólo tres cotas
 // inequívocas: ancho 50, altura 100, punta R1. El resto es proporcional.
 {id:'ref-goose-50-100-r1',name:'Pata de cabra · foto 50×100 R1',
  angle:88,height:100,topWidth:50,tip:2,type:'cabra',
  profileStyle:'user-photo',verifiedSpecs:false,profileAccuracy:'provisional'}
];
export const MACHINE = Object.freeze({name:'Trumpf V85',tonnage:85,workingWidth:2040,ram:[1340,28,2,25.4,20,30,125,20,39,28],bed:[820,80,25.25,25.25,50,20,20],stop:[70,100,18,25,12,0],support:[70,100,8,25,12,8]});
export const EXAMPLE = {name:'Omega · ejemplo geométrico',material:'s235',thickness:2,width:500,die:'v16',punch:'straight88',flanges:[50,50,50,50,50],angles:[90,-90,-90,90],order:[0,1,3,2],kFactor:null,radius:null,datum:'outside'};
export function clamp(x,a,b){return Math.min(b,Math.max(a,x));}
export function finite(v,fallback=0){const n=typeof v==='string'&&v.trim()===''?NaN:Number(v);return Number.isFinite(n)?n:fallback;}
export function normalized(input){
 const f=Array.isArray(input?.flanges)?input.flanges.map(v=>clamp(finite(v,50),1,10000)).slice(0,20):[50,50];
 if(f.length<2)f.push(50);
 const a=Array.from({length:f.length-1},(_,i)=>clamp(finite(input?.angles?.[i],90),-179,179));
 const n=a.length,requested=Array.isArray(input?.order)?input.order:[];
 const order=[...new Set(requested.filter(i=>Number.isInteger(i)&&i>=0&&i<n))];
 for(let i=0;i<n;i++)if(!order.includes(i))order.push(i);
 const id= MATERIALS.some(m=>m.id===input?.material)?input.material:'s235';
 return {name:String(input?.name||'Nueva pieza').slice(0,80),material:id,thickness:clamp(finite(input?.thickness,2),0.2,30),width:clamp(finite(input?.width,500),1,10000),die:DIES.some(d=>d.id===input?.die)?input.die:'v16',punch:PUNCHES.some(p=>p.id===input?.punch)?input.punch:'straight88',flanges:f,angles:a,order,kFactor:input?.kFactor==null?null:clamp(finite(input.kFactor,.36),.15,.6),radius:input?.radius==null?null:clamp(finite(input.radius,2),.1,100),datum:input?.datum==='neutral'?'neutral':'outside'};
}
/** Todos los pliegues parten de una chapa recta. +90 y -90 giran en sentidos contrarios. */
export function profile(piece,fractions=[]){
 const p=normalized(piece),points=[{x:0,y:0}],directions=[],bendPositions=[];
 let x=0,y=0,theta=0;
 for(let i=0;i<p.flanges.length;i++){
   if(i>0){bendPositions.push({x,y});theta+=p.angles[i-1]*clamp(finite(fractions[i-1],0),0,1)*Math.PI/180;}
   directions.push(theta);
   x+=p.flanges[i]*Math.cos(theta);
   y+=p.flanges[i]*Math.sin(theta);
   points.push({x,y});
 }
 return {points,bendPositions,directions};
}
export function bounds(points){const x=points.map(p=>p.x),y=points.map(p=>p.y);return {minX:Math.min(...x),maxX:Math.max(...x),minY:Math.min(...y),maxY:Math.max(...y)};}
export function angleToRadians(d){return d*Math.PI/180;}
export function getTooling(p){const n=normalized(p);return {die:DIES.find(d=>d.id===n.die),punch:PUNCHES.find(t=>t.id===n.punch),material:MATERIALS.find(m=>m.id===n.material)};}
export function development(piece){
 const p=normalized(piece),t=p.thickness,{die,material}=getTooling(p);
 const r=p.radius??Math.max(t*.6,die.opening*(material.id.startsWith('alu')?.18:.16));
 const k=p.kFactor??material.k;
 const perBend=p.angles.map((a,i)=>{
   const magnitude=Math.abs(a),rad=angleToRadians(magnitude),ba=rad*(r+k*t);
   const setback=(r+t)*Math.tan(rad/2),bd=2*setback-ba;
   return {index:i,angle:a,ba,bd};
 });
 const nominal=p.flanges.reduce((a,b)=>a+b,0),totalBA=perBend.reduce((a,b)=>a+b.ba,0),totalBD=perBend.reduce((a,b)=>a+b.bd,0);
 return {radius:r,k,nominal,totalBA,totalBD,length:p.datum==='neutral'?nominal+totalBA:nominal-totalBD,perBend,estimated:true};
}
export function stage(piece,time){
 const p=normalized(piece),count=p.order.length,loop=count*5,t=clamp(finite(time,0),0,loop),index=Math.min(count-1,Math.floor(t/5)),sub=t===loop?1:(t%5)/5;
 const fractions=Array(count).fill(0);
 for(let i=0;i<index;i++)fractions[p.order[i]]=1;
 let phase='Preparación',press=0;
 if(sub<.16){phase='Posicionamiento';press=0;}
 else if(sub<.36){phase='Aproximación';press=(sub-.16)/.2*.45;}
 else if(sub<.68){phase='Plegado';const f=clamp((sub-.36)/.32,0,1);press=.45+.55*f;fractions[p.order[index]]=f*f*(3-2*f);}
 else if(sub<.84){phase='Retorno';press=1-(sub-.68)/.16;fractions[p.order[index]]=1;}
 else{phase='Reposicionamiento';press=0;fractions[p.order[index]]=1;}
 if(t===loop){for(const id of p.order)fractions[id]=1;phase='Pieza terminada';press=0;}
 const finished=fractions.filter(x=>x>=1-1e-6).length;
 return {fractions,phase,press,activeBend:p.order[index],activeOperation:index,finished,count,time:t,duration:loop,completed:t===loop};
}
export function orientedForMachine(piece,fractions,activeBend){
 const {points}=profile(piece,fractions),pivot=points[activeBend+1],before=points[activeBend],theta=Math.atan2(pivot.y-before.y,pivot.x-before.x),c=Math.cos(-theta),s=Math.sin(-theta);
 // La orientación se calcula desde la arista de apoyo, pero NO se refleja
 // artificialmente la pieza para los ángulos negativos. Reflejar Y convertía
 // −90° en +90° en la vista de máquina, contradiciendo la pieza programada.
 // El volteo físico real es otra operación, aún pendiente de modelar.
 return points.map(pt=>{const x=pt.x-pivot.x,y=pt.y-pivot.y;return {x:x*c-y*s,y:x*s+y*c};});
}
/**
 * Presentación ilustrativa en una plegadora con el punzón superior.
 * El signo geométrico sigue siendo propio de la pieza; para −90° se
 * representa un volteo alrededor del eje de alimentación antes del golpe.
 * El volteo se indica explícitamente; no se calcula una trayectoria real
 * de retirada, rotación ni límites de carrera.
 */
export function presentedForMachine(piece,fractions,activeBend){
 const p=normalized(piece);
 const points=orientedForMachine(p,fractions,activeBend);
 const flipped=p.angles[activeBend]<0;
 return {flipped,points:flipped?points.map(pt=>({x:pt.x,y:-pt.y})):points,
         sign:p.angles[activeBend]<0?-1:1,
         label:flipped?'Presentar chapa volteada para pliegue negativo':'Presentación normal'};
}
/**
 * Reorientación gráfica entre golpes sin deformar las longitudes de las alas.
 * Se interpola un cambio de sistema de referencia rígido. Si hace falta
 * voltear la pieza, su profundidad 3D se proyecta temporalmente en 2D.
 * PREVISUALIZACIÓN: todavía no calcula brazos del operario ni trayectoria
 * libre de colisiones de la chapa a través del espacio.
 */
export function presentedAtStage(piece,st){
 const p=normalized(piece);
 const current=presentedForMachine(p,st.fractions,st.activeBend);
 if(st.phase!=='Reposicionamiento'||st.activeOperation>=p.order.length-1)
  return {...current,repositioning:false,progress:0};
 const pts=profile(p,st.fractions).points;
 function frame(bend){
  const pivot=pts[bend+1],before=pts[bend];
  return {pivot,theta:Math.atan2(pivot.y-before.y,pivot.x-before.x),
          flip:p.angles[bend]<0?-1:1,bend};
 }
 const old=frame(st.activeBend),next=frame(p.order[st.activeOperation+1]);
 const sub=(st.time/5)%1;
 const raw=clamp((sub-.84)/.16,0,1),u=raw*raw*(3-2*raw);
 const angleDiff=Math.atan2(Math.sin(next.theta-old.theta),Math.cos(next.theta-old.theta));
 const theta=old.theta+angleDiff*u;
 const pivot={x:old.pivot.x+(next.pivot.x-old.pivot.x)*u,
              y:old.pivot.y+(next.pivot.y-old.pivot.y)*u};
 const flip=old.flip===next.flip?old.flip:old.flip*Math.cos(Math.PI*u);
 const c=Math.cos(-theta),s=Math.sin(-theta);
 const points=pts.map(pt=>{
  const x=pt.x-pivot.x,y=pt.y-pivot.y;
  return {x:x*c-y*s,y:(x*s+y*c)*flip};
 });
 return {points,flipped:flip<0,sign:next.flip,label:'Reposicionamiento ilustrativo',
         repositioning:true,progress:u,nextBend:next.bend};
}
function cross(a,b,c){return (b.x-a.x)*(c.y-a.y)-(b.y-a.y)*(c.x-a.x);}
export function selfIntersects(points){
 for(let i=0;i<points.length-1;i++)for(let j=i+2;j<points.length-1;j++){
   if(i===0&&j===points.length-2&&points[0].x===points.at(-1).x&&points[0].y===points.at(-1).y)continue;
   const a=points[i],b=points[i+1],c=points[j],d=points[j+1];
   const ab1=cross(a,b,c),ab2=cross(a,b,d),cd1=cross(c,d,a),cd2=cross(c,d,b);
   if(ab1*ab2< -1e-8 && cd1*cd2< -1e-8)return true;
 }
 return false;
}
