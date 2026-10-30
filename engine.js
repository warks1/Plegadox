/** Plegadox: núcleo geométrico determinista. Unidades: mm y grados. */
import {registerCatalogue} from './catalog.js';
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
// Registro único al inicializar el núcleo. La selección de herramientas
// documentadas NO depende de importar app.js (UI) o cockpit.js.
// registerCatalogue es idempotente para los módulos que lo reutilizan.
registerCatalogue(DIES,PUNCHES);
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
 return {name:String(input?.name||'Nueva pieza').slice(0,80),material:id,thickness:clamp(finite(input?.thickness,2),0.2,30),width:clamp(finite(input?.width,500),1,10000),die:DIES.some(d=>d.id===input?.die)?input.die:'v16',punch:PUNCHES.some(p=>p.id===input?.punch)?input.punch:'straight88',flanges:f,angles:a,order,kFactor:input?.kFactor==null?null:clamp(finite(input.kFactor,.36),.15,.6),radius:input?.radius==null?null:clamp(finite(input.radius,2),.1,100),rmMPa:input?.rmMPa==null||input.rmMPa===''?null:clamp(finite(input.rmMPa,450),50,1800),datum:input?.datum==='neutral'?'neutral':'outside'};
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
/**
 * Vista previa angular del golpe. No confundir con el perfil completo de la
 * pieza; conserva el ángulo firmado que se introdujo en programación.
 * El plano de pantalla tiene Y descendente (+90 se ve hacia arriba).
 */
export function bendPreviewPath(angle){
 const a=angleToRadians(clamp(finite(angle,0),-179,179));
 const x=35+26*Math.cos(a),y=26-22*Math.sin(a);
 return 'M 9 26 L 35 26 L '+x.toFixed(2)+' '+y.toFixed(2);
}
export function getTooling(p){const n=normalized(p);return {die:DIES.find(d=>d.id===n.die),punch:PUNCHES.find(t=>t.id===n.punch),material:MATERIALS.find(m=>m.id===n.material)};}
/**
 * Prechequeo geométrico de apertura nominal de útiles.
 * Ángulo programado = GIRO desde chapa plana; el ángulo interior resultante
 * es 180° - |giro|. Si el interior solicitado es más cerrado que la cuña
 * nominal del punzón o de la matriz, no se debe presentar la simulación como
 * una fabricación geométricamente contrastada.
 * No contempla radios, montaje, luz, deformación ni recuperación.
 */
export function toolAngleCompatibility(piece,bendIndex){
 const p=normalized(piece),{die,punch}=getTooling(p);
 const requested=Math.abs(p.angles[bendIndex]??0);
 const interior=180-requested;
 const limitingAngle=Math.max(die.angle,punch.angle);
 const limitingTools=[
  ...(Math.abs(die.angle-limitingAngle)<1e-8?['matriz']:[]),
  ...(Math.abs(punch.angle-limitingAngle)<1e-8?['punzón']:[])
 ];
 return {bend:bendIndex,requestedAngle:requested,interiorAngle:interior,
  dieAngle:die.angle,punchAngle:punch.angle,limitingAngle,limitingTools,
  warning:interior+1e-6<limitingAngle,verified:false};
}
/** Estimación no certificada para aire a ~90°: F(kN)=1,42 Rm L t²/(1000 V).
 * Rm por material son HIPÓTESIS editables, no datos certificados del lote.
 */
export const REFERENCE_RM_MPA=Object.freeze({
 s235:450,s275:500,s355:550,inox304:620,alu5754:260,
 alu1050:110,galva:450,zincor:450
});
export function estimateAirBendForce(piece,options={}){
 const p=normalized(piece),{die}=getTooling(p);
 const override=options.rmMPa??p.rmMPa;
 const rm=override==null?REFERENCE_RM_MPA[p.material]:Number(override);
 if(!Number.isFinite(rm)||rm<=0||die.opening<=0)
  return {estimated:false,verified:false,reason:'Rm/V no válidos'};
 const kN=1.42*rm*p.width*p.thickness**2/(1000*die.opening);
 const tonneForce=kN/9.80665;
 const nominalCapacity=Number(options.tonnage??MACHINE.tonnage);
 const ratio=die.opening/p.thickness;
 const conventional=p.angles.every(a=>Math.abs(Math.abs(a)-90)<=5)&&
  die.angle>=80&&die.angle<=100&&ratio>=5&&ratio<=14;
 return {estimated:true,kN,tonneForce,kNPerMetre:kN*1000/p.width,
  rmMPa:rm,materialReference:override==null,width:p.width,
  thickness:p.thickness,opening:die.opening,
  nominalCapacity,loadPercent:100*tonneForce/nominalCapacity,
  exceedsNominal:tonneForce>nominalCapacity,
  conventionalAirBend90:conventional,verified:false};
}
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
 * Reorientación en tres etapas: retirar de V, reorientar mientras la
 * pieza está elevada y volver a apoyar. La rotación para invertir la cara
 * se calcula también en 3D y luego se PROYECTA en la sección 2D.
 * PREVISUALIZACIÓN: no calcula trayectorias mecánicas ni valida holguras
 * reales frente a topes, mesa, trancha, punzón o mordazas.
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
 const raw=clamp((sub-.84)/.16,0,1);
 const ease=t=>t*t*(3-2*t);
 // 0–22 %: sacar chapa de V · 22–78 %: girarla fuera de la matriz
 // 78–100 %: volver a presentarla al siguiente punto de plegado.
 const liftFactor=raw<.22?ease(raw/.22):raw>.78?ease((1-raw)/.22):1;
 const u=ease(clamp((raw-.22)/.56,0,1));
 const angleDiff=Math.atan2(Math.sin(next.theta-old.theta),Math.cos(next.theta-old.theta));
 const theta=old.theta+angleDiff*u;
 const pivot={x:old.pivot.x+(next.pivot.x-old.pivot.x)*u,
              y:old.pivot.y+(next.pivot.y-old.pivot.y)*u};
 const flipAngle=old.flip===next.flip?0:Math.PI*u;
 const projectionY=old.flip*Math.cos(flipAngle);
 const projectionZ=old.flip*Math.sin(flipAngle);
 const c=Math.cos(-theta),s=Math.sin(-theta);
 const points3D=pts.map(pt=>{
  const x=pt.x-pivot.x,y=pt.y-pivot.y;
  const localX=x*c-y*s,localY=x*s+y*c;
  return {x:localX,y:localY*projectionY,z:localY*projectionZ};
 });
 const points=points3D.map(({x,y})=>({x,y}));
 // Sólo para la vista: la cara INFERIOR de la chapa queda al menos 5 mm
 // encima del plano de hombros durante el tramo central de giro.
 // No es una distancia segura ni una trayectoria mecanizable.
 const clearanceLift=Math.max(0,5-Math.min(...points.map(pt=>pt.y)))*liftFactor;
 return {points,points3D,clearanceLift,
  flipped:projectionY<0,sign:next.flip,label:'Retirada, giro y presentación orientativos',
  repositioning:true,progress:u,nextBend:next.bend,liftFactor};
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
