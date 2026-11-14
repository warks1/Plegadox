/**
 * Plegadox · realismo visual de punzones y matrices (SOLO capa de dibujo).
 *
 * Todas las funciones reciben la MISMA poligonal en píxeles que ya usa la
 * cabina (machineToolProjection) y únicamente añaden sombreado: biseles con
 * luz direccional, rectificado, zona templada de la punta, oclusión en la V
 * y ranura de seguridad del amarre. Ninguna modifica el contorno en mm que
 * emplean la sección técnica, el detector 2D ni el motor volumétrico.
 */
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
// Dirección HACIA la luz en coordenadas de pantalla (arriba-izquierda).
export const LIGHT=Object.freeze((()=>{const x=-.55,y=-.83,m=Math.hypot(x,y);return {x:x/m,y:y/m};})());

export function polygonSignedArea(pts){
 let s=0;
 for(let i=0;i<pts.length;i++){
  const a=pts[i],b=pts[(i+1)%pts.length];
  s+=a[0]*b[1]-b[0]*a[1];
 }
 return s/2;
}
/**
 * Para cada arista: normal EXTERIOR unitaria e iluminación lambertiana
 * respecto a la luz. Independiente del sentido de giro del polígono.
 */
export function edgeLighting(pts,light=LIGHT){
 if(!Array.isArray(pts)||pts.length<3)return [];
 const area=polygonSignedArea(pts),sign=area>=0?1:-1,out=[];
 for(let i=0;i<pts.length;i++){
  const a=pts[i],b=pts[(i+1)%pts.length];
  const dx=b[0]-a[0],dy=b[1]-a[1],len=Math.hypot(dx,dy);
  if(!(len>1e-6))continue;
  const nx=sign*dy/len,ny=-sign*dx/len;
  out.push({a,b,nx,ny,len,lit:clamp(nx*light.x+ny*light.y,-1,1)});
 }
 return out;
}
function clipPath(ctx,pts){
 ctx.beginPath();
 pts.forEach((p,i)=>i?ctx.lineTo(p[0],p[1]):ctx.moveTo(p[0],p[1]));
 ctx.closePath();ctx.clip();
}
const litColor=(lit,strength)=>{
 if(Math.abs(lit)<.06)return 'rgba(0,0,0,0)';
 const bright=lit>0;
 const alpha=clamp((bright?.14+.7*lit:.12+.55*-lit)*strength,0,.85);
 return bright?'rgba(244,251,255,'+alpha.toFixed(3)+')':
  'rgba(3,12,22,'+alpha.toFixed(3)+')';
};
/**
 * Bisel perimetral: cada arista recibe un filo claro u oscuro según su cara.
 * La iluminación se suaviza entre aristas casi tangentes (radios de punta,
 * cuello de pata de cabra) para evitar el aspecto facetado; las esquinas
 * vivas (>~40°) conservan el contraste de cada cara.
 */
export function drawBevel(ctx,pts,{scale=1,width=3,strength=1}={}){
 const edges=edgeLighting(pts);
 if(!edges.length)return;
 const n=edges.length,w=Math.max(1.4,width*scale);
 const smooth=(e,o)=>e.nx*o.nx+e.ny*o.ny>.77?(e.lit+o.lit)/2:e.lit;
 ctx.save();clipPath(ctx,pts);
 ctx.lineCap='butt';ctx.lineJoin='round';
 edges.forEach((e,k)=>{
  const prev=edges[(k+n-1)%n],next=edges[(k+1)%n];
  const l0=smooth(e,prev),l1=smooth(e,next);
  if(Math.abs(l0)<.06&&Math.abs(l1)<.06)return;
  const g=ctx.createLinearGradient(e.a[0],e.a[1],e.b[0],e.b[1]);
  g.addColorStop(0,litColor(l0,strength));g.addColorStop(1,litColor(l1,strength));
  ctx.strokeStyle=g;ctx.lineWidth=w*2;
  ctx.beginPath();ctx.moveTo(e.a[0],e.a[1]);ctx.lineTo(e.b[0],e.b[1]);ctx.stroke();
 });
 // Reflejo especular fino, desplazado hacia dentro, en las caras que miran
 // a la luz: da la sensación de acero pulido y no de plástico plano.
 const inset=w*.55;
 for(const e of edges){
  if(e.lit<.55||e.len<2)continue;
  const alpha=clamp(.75*(e.lit-.55)/.45*strength,0,.8);
  ctx.strokeStyle='rgba(255,255,255,'+alpha.toFixed(3)+')';
  ctx.lineWidth=Math.max(.7,.8*scale);
  ctx.beginPath();
  ctx.moveTo(e.a[0]-e.nx*inset,e.a[1]-e.ny*inset);
  ctx.lineTo(e.b[0]-e.nx*inset,e.b[1]-e.ny*inset);ctx.stroke();
 }
 ctx.restore();
}
// Ruido determinista: el rectificado no debe parpadear entre fotogramas.
const hash=n=>{const s=Math.sin(n*12.9898+78.233)*43758.5453;return s-Math.floor(s);};
/** Rectificado fino horizontal (huella de la muela), recortado al útil. */
export function drawGrain(ctx,pts,{scale=1,seed=1,alpha=1}={}){
 if(!pts.length)return;
 const ys=pts.map(p=>p[1]),minY=Math.min(...ys),maxY=Math.max(...ys);
 const xs=pts.map(p=>p[0]),minX=Math.min(...xs),maxX=Math.max(...xs);
 const step=Math.max(1.3,(maxY-minY)/320,1.1*scale);
 ctx.save();clipPath(ctx,pts);
 let i=0;
 for(let y=minY;y<maxY;y+=step,i++){
  const h=hash(i+seed*131);
  ctx.globalAlpha=(.025+.07*h)*alpha;
  ctx.fillStyle=h>.5?'#ffffff':'#05121d';
  ctx.fillRect(minX,y,maxX-minX,Math.max(.6,.55*scale));
 }
 ctx.restore();
}
/** Sombra por oclusión ambiental en el fondo de la V de la matriz. */
export function drawVOcclusion(ctx,pts,{cx,cy,opening,depth,scale=1}){
 const r=Math.max(10,opening*.75*scale),bottomY=cy+depth*scale;
 ctx.save();clipPath(ctx,pts);
 const g=ctx.createRadialGradient(cx,bottomY,0,cx,bottomY,r);
 g.addColorStop(0,'rgba(0,6,14,.62)');g.addColorStop(.55,'rgba(0,10,20,.28)');
 g.addColorStop(1,'rgba(0,10,20,0)');
 ctx.fillStyle=g;ctx.fillRect(cx-r,bottomY-r,r*2,r*2);
 // Brillo de los hombros: arista viva donde la chapa apoya.
 const half=opening/2*scale;
 ctx.strokeStyle='rgba(240,250,255,.5)';ctx.lineWidth=Math.max(.8,.9*scale);
 for(const sx of [-1,1]){
  ctx.beginPath();ctx.moveTo(cx+sx*half,cy+.5);
  ctx.lineTo(cx+sx*(half+Math.max(5,10*scale)),cy+.5);ctx.stroke();
 }
 ctx.restore();
}
/** Cortes de una recta horizontal con el polígono: extremos izquierdo/derecho. */
export function horizontalSpan(pts,y){
 const xs=[];
 for(let i=0;i<pts.length;i++){
  const a=pts[i],b=pts[(i+1)%pts.length];
  if((a[1]>y)===(b[1]>y))continue;
  xs.push(a[0]+(y-a[1])*(b[0]-a[0])/(b[1]-a[1]));
 }
 return xs.length>=2?{min:Math.min(...xs),max:Math.max(...xs)}:null;
}
/** Zona templada por inducción de la punta y ranura de seguridad del amarre. */
export function drawPunchDetail(ctx,pts,{scale=1}={}){
 if(pts.length<3)return;
 const ys=pts.map(p=>p[1]),top=Math.min(...ys),tipY=Math.max(...ys);
 const height=tipY-top;
 ctx.save();clipPath(ctx,pts);
 // Templado: tono azulado desde la punta hasta ~16 mm; límite nítido.
 const hard=Math.min(height*.4,16*scale);
 if(hard>3){
  const g=ctx.createLinearGradient(0,tipY,0,tipY-hard);
  g.addColorStop(0,'rgba(86,150,214,.46)');g.addColorStop(.85,'rgba(86,150,214,.14)');
  g.addColorStop(1,'rgba(86,150,214,0)');
  ctx.fillStyle=g;ctx.fillRect(Math.min(...pts.map(p=>p[0])),tipY-hard,
   Math.max(...pts.map(p=>p[0]))-Math.min(...pts.map(p=>p[0])),hard);
  ctx.strokeStyle='rgba(30,70,110,.32)';ctx.lineWidth=Math.max(.7,.8*scale);
  const span=horizontalSpan(pts,tipY-hard);
  if(span){ctx.beginPath();ctx.moveTo(span.min,tipY-hard);ctx.lineTo(span.max,tipY-hard);ctx.stroke();}
 }
 // Ranura de seguridad (tipo Promecam/Amada) a ~9 mm del plano de amarre.
 if(height>45*scale){
  const y=top+9*scale,span=horizontalSpan(pts,y);
  if(span&&span.max-span.min>6){
   const x1=span.min+1.5,x2=span.max-1.5;
   ctx.strokeStyle='rgba(2,10,18,.78)';ctx.lineWidth=Math.max(1.4,1.9*scale);
   ctx.beginPath();ctx.moveTo(x1,y);ctx.lineTo(x2,y);ctx.stroke();
   ctx.strokeStyle='rgba(245,252,255,.7)';ctx.lineWidth=Math.max(.7,.9*scale);
   ctx.beginPath();ctx.moveTo(x1,y+Math.max(1.6,2*scale));
   ctx.lineTo(x2,y+Math.max(1.6,2*scale));ctx.stroke();
  }
 }
 ctx.restore();
}
/** Conjunto completo para el punzón (se llama tras rellenar la poligonal). */
export function enhancePunch(ctx,pts,{scale=1,transparent=false}={}){
 if(!Array.isArray(pts)||pts.length<3)return;
 ctx.save();
 if(transparent)ctx.globalAlpha=.4;
 drawGrain(ctx,pts,{scale,seed:3,alpha:.9});
 drawPunchDetail(ctx,pts,{scale});
 drawBevel(ctx,pts,{scale,width:3.2});
 ctx.restore();
}
/** Conjunto completo para la matriz (se llama tras rellenar la poligonal). */
export function enhanceDie(ctx,pts,{scale=1,cx,cy,opening,depth}={}){
 if(!Array.isArray(pts)||pts.length<3)return;
 ctx.save();
 drawGrain(ctx,pts,{scale,seed:7,alpha:1});
 if([cx,cy,opening,depth].every(Number.isFinite))
  drawVOcclusion(ctx,pts,{cx,cy,opening,depth,scale});
 drawBevel(ctx,pts,{scale,width:2.6});
 ctx.restore();
}
