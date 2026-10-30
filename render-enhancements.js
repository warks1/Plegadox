// Plegadox Studio · capas decorativas parametrizadas de la máquina.
// Vista 2.5D ilustrativa: NO es una simulación de contacto, no aporta una
// verificación de colisiones ni una geometría CAD de herramienta.
const clamp=(x,min,max)=>Math.max(min,Math.min(max,x));
const grad=(ctx,x1,y1,x2,y2,stops)=>{
 const g=ctx.createLinearGradient(x1,y1,x2,y2);
 for(const [at,color]of stops)g.addColorStop(at,color);
 return g;
};
function path(ctx,points,fill,stroke,width=1){
 if(!points.length)return;
 ctx.beginPath();points.forEach(([x,y],i)=>i?ctx.lineTo(x,y):ctx.moveTo(x,y));
 ctx.closePath();if(fill){ctx.fillStyle=fill;ctx.fill();}
 if(stroke){ctx.strokeStyle=stroke;ctx.lineWidth=width;ctx.stroke();}
}
function line(ctx,pts,color,width=1,dash=null){
 ctx.save();if(dash)ctx.setLineDash(dash);
 ctx.beginPath();pts.forEach(([x,y],i)=>i?ctx.lineTo(x,y):ctx.moveTo(x,y));
 ctx.strokeStyle=color;ctx.lineWidth=width;ctx.stroke();ctx.restore();
}
function screw(ctx,x,y,r=3){
 ctx.save();ctx.shadowColor='#000';ctx.shadowBlur=6;
 ctx.fillStyle=grad(ctx,x-r,y-r,x+r,y+r,[[0,'#deebef'],[.35,'#667987'],[.8,'#1c3141'],[1,'#8fa9b9']]);
 ctx.beginPath();ctx.arc(x,y,r,0,Math.PI*2);ctx.fill();
 ctx.shadowBlur=0;ctx.strokeStyle='#152d3c';ctx.lineWidth=1;ctx.stroke();
 line(ctx,[[x-r*.54,y+r*.37],[x+r*.54,y-r*.37]],'#deebf5',.9);
 ctx.restore();
}
function addGleam(ctx,x,y,w,h,intensity=.28){
 ctx.save();ctx.globalAlpha=intensity;
 const g=grad(ctx,x,y,x+w,y,[[0,'#f6fdff00'],[.08,'#eaffff'],[.13,'#f6ffff00'],[.34,'#d6f2ff0a'],[.52,'#fff'],[.56,'#fff0'],[1,'#fff0']]);
 ctx.fillStyle=g;ctx.fillRect(x,y,w,h);ctx.restore();
}
function glow(ctx,x,y,r,color='#00aaff',alpha=.22){
 ctx.save();ctx.globalAlpha=alpha;
 const g=ctx.createRadialGradient(x,y,1,x,y,Math.max(r,1));g.addColorStop(0,color);g.addColorStop(.2,'#0e80c5a2');g.addColorStop(1,'#0e80c500');
 ctx.fillStyle=g;ctx.beginPath();ctx.arc(x,y,r,0,Math.PI*2);ctx.fill();ctx.restore();
}
export function sceneAtmosphere(ctx,w,h,location){
 const {cx,cy,s}=location;
 ctx.save();
 // Side pillars with depth and spotlight reflections.
 const left=w*.14,right=w*.89;
 for(const [x,width] of [[left,24*s],[right,37*s]]){
  ctx.fillStyle=grad(ctx,x,0,x+width,0,[[0,'#04101c'],[.19,'#1f425a'],[.32,'#54738b'],[.46,'#091d2e'],[1,'#020914']]);
  ctx.fillRect(x,-10,width,h*.78);
  addGleam(ctx,x,0,width,h*.7,.22);
 }
 // Recessed, blurred industrial heads and bracing.
 ctx.save();ctx.globalAlpha=.58;ctx.filter='blur(3px)';
 for(let i=0;i<6;i++){
  const xx=w*.15+i*w*.135;
  ctx.fillStyle='#091b29';ctx.fillRect(xx,h*.53,13*s,h*.24);
  ctx.fillStyle='#83a2b52a';ctx.fillRect(xx+2*s,h*.53,3*s,h*.24);
 }
 ctx.restore();
 // Floor rails left / right, approaching vanishing point.
 ctx.strokeStyle='#a0c4da22';ctx.lineWidth=3*s;
 for(let i=0;i<5;i++){
  const x=w*(i/4),origin=w*.48;
  ctx.beginPath();ctx.moveTo(origin,h*.65);ctx.lineTo(x,h);ctx.stroke();
 }
 glow(ctx,cx,cy+7*s,125*s,'#2aaafe',.12);
 ctx.restore();
}
export function dieDepth(ctx,location,opening,enabled){
 if(!enabled)return;
 const {cx,cy,s}=location,half=Math.max(28,opening*1.18+14)*s;
 const forward=33*s,up=20*s,depth=115*s;
 // Side and top exposed surfaces of the front V matrix.
 const sides=[
 [[cx+half,cy],[cx+half+forward,cy-up],[cx+half+forward,cy+depth-up],[cx+half,cy+depth]],
 [[cx-half,cy],[cx-half+forward,cy-up],[cx+half+forward,cy-up],[cx+half,cy]]
 ];
 ctx.save();ctx.shadowColor='#000b';ctx.shadowBlur=18*s;
 path(ctx,sides[0],grad(ctx,cx+half,cy,cx+half+forward,cy,[[0,'#637c8c'],[.35,'#b9cad4'],[1,'#273e50']]),'#0a2539',1.4*s);
 path(ctx,sides[1],grad(ctx,cx-half,cy,cx+half+forward,cy-up,[[0,'#d0dde5'],[.28,'#657c8b'],[.58,'#b2c4d1'],[1,'#355267']]),'#183b52',1.2*s);
 ctx.restore();
 for(const frac of [.2,.5,.8])screw(ctx,cx+half+forward*.65,cy+depth*frac-up*.65,2.2*s);
}
export function ramDepth(ctx,location,tipY,angle,enabled){
 if(!enabled)return;
 const {cx,s}=location,depth=30*s,raise=17*s,top=tipY-202*s;
 const shoulder=angle<=45?100:60;
 const side=[
 [cx+43*s,top+12*s],
 [cx+43*s+depth,top+(12*s-raise)],
 [cx+40*s+depth,top+shoulder*s-raise],
 [cx+depth*.45,tipY-raise],
 [cx,tipY],
 [cx+40*s,top+shoulder*s]
 ];
 ctx.save();ctx.shadowBlur=17*s;ctx.shadowColor='#000a';
 path(ctx,side,grad(ctx,cx+40*s,top,cx+43*s+depth,top,[[0,'#b8ccd9'],[.4,'#6c899e'],[1,'#142c40']]),'#2f5e79',1.3*s);
 ctx.restore();
 const housing=[
 [cx-57*s,top-65*s],
 [cx-57*s+depth,top-(65*s+raise)],
 [cx+63*s+depth,top-(65*s+raise)],
 [cx+63*s,top-65*s]
 ];
 path(ctx,housing,grad(ctx,cx,top-65*s,cx,top-95*s,[[0,'#edf6fa'],[.34,'#738b9e'],[1,'#284259']]),'#50718b',1.4*s);
}
export function sheetDepth(ctx,points,location,thickness,enabled){
 if(!enabled||points.length<2)return;
 const {s}=location,dx=23*s,dy=-13*s;
 ctx.save();ctx.shadowBlur=9*s;ctx.shadowColor='#000b';ctx.shadowOffsetY=3*s;
 for(let i=0;i<points.length-1;i++){
  const a=points[i],b=points[i+1];
  const p1=[a[0],a[1]],p2=[b[0],b[1]];
  const face=[p1,p2,[p2[0]+dx,p2[1]+dy],[p1[0]+dx,p1[1]+dy]];
  path(ctx,face,grad(ctx,p1[0],p1[1],p2[0]+dx,p2[1]+dy,
    [[0,'#ddeaf2'],[.18,'#849fad'],[.47,'#507284'],[.71,'#d3e3ed'],[1,'#355566']]),'#174968',1.3*s);
  line(ctx,[p1,[p1[0]+dx,p1[1]+dy]],'#d5eafa',1.5*s);
  line(ctx,[[p1[0]+dx,p1[1]+dy],[p2[0]+dx,p2[1]+dy]],'#c6edff',1*s);
 }
 ctx.restore();
}
export function surfaceDetail(ctx,location,tooling){
 const {cx,cy,s}=location,half=Math.max(28,(tooling?.opening||16)*1.18+14)*s;
 const y=cy+65*s;
 ctx.save();
 // Machined dark grooves, clamp blocks and machined pocket bolts.
 for(const sign of [-1,1]){
  const center=cx+sign*half*.84;
  ctx.fillStyle=grad(ctx,center-7*s,y,center+7*s,y,
    [[0,'#334b5c'],[.5,'#182e40'],[1,'#748f9c']]);
  ctx.fillRect(center-8*s,y,16*s,43*s);
  for(let i=0;i<3;i++)screw(ctx,center,cy+(49+i*15)*s,2.1*s);
 }
 ctx.strokeStyle='#e9f7ff6d';ctx.lineWidth=.65*s;
 for(let i=0;i<33;i++){
  const x=cx-half+i*(half*2/32);
  ctx.beginPath();ctx.moveTo(x,cy+6*s);ctx.lineTo(x+1*s,cy+36*s);ctx.stroke();
 }
 // Technical callout remains honest about nominal V and tool.
 if(tooling && s>.5){
  ctx.fillStyle='#96c9e4';ctx.font='700 '+Math.max(8,10*s)+'px system-ui';
  ctx.textAlign='left';ctx.fillText('V'+tooling.opening,cx+half+9*s,cy+8*s);
 }
 ctx.restore();
}
function arrow(ctx,from,to,shade='#f5b044',size=4){
 const a=Math.atan2(to[1]-from[1],to[0]-from[0]);
 ctx.save();ctx.translate(to[0],to[1]);ctx.rotate(a);
 path(ctx,[[0,0],[-size,-size*.55],[-size,size*.55]],shade,null);
 ctx.restore();
}
function measure(ctx,from,to,label,s,offset=-20){
 ctx.save();
 const vx=to[0]-from[0],vy=to[1]-from[1],mag=Math.max(1,Math.hypot(vx,vy));
 const ox=-vy/mag*offset,oy=vx/mag*offset;
 const p1=[from[0]+ox,from[1]+oy],p2=[to[0]+ox,to[1]+oy];
 line(ctx,[from,p1],'#9de0ff',.85*s);
 line(ctx,[to,p2],'#9de0ff',.85*s);
 line(ctx,[p1,p2],'#8bd7ff',1.15*s);
 arrow(ctx,p2,p1,'#8ad6fa',4*s);arrow(ctx,p1,p2,'#8ad6fa',4*s);
 ctx.font='600 '+Math.max(9,11*s)+'px system-ui';
 ctx.fillStyle='#a6e0ff';ctx.textAlign='center';
 ctx.shadowColor='#071a28';ctx.shadowBlur=6;
 ctx.fillText(label,(p1[0]+p2[0])/2,(p1[1]+p2[1])/2-4*s);
 ctx.restore();
}
export function sectionOverlay(ctx,location,opening,tipRadius,enabled){
 if(!enabled)return;
 const {cx,cy,s}=location;
 ctx.save();ctx.setLineDash([3*s,5*s]);ctx.lineWidth=1;
 line(ctx,[[cx,cy-130*s],[cx,cy+95*s]],'#1ab0ff90',1,[3*s,4*s]);
 line(ctx,[[cx-120*s,cy],[cx+130*s,cy]],'#86d3ff65',1,[3*s,4*s]);
 ctx.restore();
 const half=Math.min(39*s,Math.max(9*s,opening*s));
 measure(ctx,[cx-half,cy],[cx+half,cy],'V '+opening+' mm',s,-40*s);
 if(tipRadius>0){
  ctx.fillStyle='#8bd6ff';ctx.textAlign='left';
  ctx.font='600 '+Math.max(8,10*s)+'px system-ui';
  ctx.fillText('R '+Number(tipRadius).toFixed(1)+' mm',cx+15*s,cy-60*s);
 }
}
