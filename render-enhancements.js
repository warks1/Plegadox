import {sectionPunch,sectionDie} from './tool-profiles.js';
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
export function dieDepth(ctx,location,opening,enabled,profile=null){
 if(!enabled)return;
 const {cx,cy,s}=location,die=profile||sectionDie({opening,angle:88,height:80});
 const points=die.points.map(([x,y])=>[cx+x*s,cy+(die.height-y)*s]);
 const dx=33*s,dy=-20*s;
 ctx.save();ctx.shadowBlur=14*s;ctx.shadowColor='#000a';
 // Extruir la MISMA sección de la matriz que se dibuja en 2D.
 // El relieve de la V debe conservarse también en la perspectiva.
 const rear=points.map(([x,y])=>[x+dx,y+dy]);
 path(ctx,rear,grad(ctx,cx,cy,cx+dx,cy+dy,
  [[0,'#809aaa'],[.55,'#3e6075'],[1,'#172b3b']]),'#284e62',.7*s);
 for(let i=0;i<points.length;i++){
  const j=(i+1)%points.length;
  const side=[points[i],points[j],rear[j],rear[i]];
  path(ctx,side,grad(ctx,points[i][0],points[i][1],rear[j][0],rear[j][1],
   [[0,'#6c8799'],[.45,'#a0b8c6'],[1,'#29465b']]),'#25485d',.7*s);
 }
 ctx.restore();
}
export function ramDepth(ctx,location,tipY,punch,enabled){
 if(!enabled)return;
 const {cx,s}=location;
 const section=sectionPunch(punch);
 // Use the SAME section polygon as the 2D drawing, not a hard-coded
 // triangular side that incorrectly turns a gooseneck into a straight punch.
 const factor=s;
 const offsetX=25*s,offsetY=-15*s;
 const pts=section.points.map(([x,y])=>[cx+x*factor,tipY-y*factor]);
 ctx.save();ctx.shadowBlur=13*s;ctx.shadowColor='#000c';
 for(let i=0;i<pts.length;i++){
  const j=(i+1)%pts.length,a=pts[i],b=pts[j];
  // Extrusion gives genuine 3D depth while retaining the punch cutouts.
  const face=[a,b,[b[0]+offsetX,b[1]+offsetY],[a[0]+offsetX,a[1]+offsetY]];
  const g=grad(ctx,a[0],a[1],b[0]+offsetX,b[1]+offsetY,
      [[0,'#bbceda'],[.35,'#55778e'],[.75,'#29475e'],[1,'#a0c1d5']]);
  path(ctx,face,g,'#2a5871',.8*s);
 }
 ctx.restore();
 const top=tipY-section.height*factor;
 const housing=[
 [cx-57*s,top-65*s],
 [cx-57*s+offsetX,top-65*s+offsetY],
 [cx+63*s+offsetX,top-65*s+offsetY],
 [cx+63*s,top-65*s]
 ];
 path(ctx,housing,grad(ctx,cx,top-65*s,cx,top-80*s,
  [[0,'#edf6fa'],[.34,'#738b9e'],[1,'#284259']]),'#50718b',1.3*s);
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
