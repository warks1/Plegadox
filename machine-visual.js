// Plegadox · Render de taller en vista lateral con materiales pulidos.
// Geometría ilustrativa, no modelo CAD certificado ni calculador de colisiones.
import {stage,orientedForMachine,getTooling} from './engine.js';

const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
function gradient(ctx,x1,y1,x2,y2,colors){
 const g=ctx.createLinearGradient(x1,y1,x2,y2);
 for(const [at,color] of colors)g.addColorStop(at,color);
 return g;
}
function poly(ctx,pts,fill,stroke='#6c8596',line=1){
 ctx.beginPath();
 pts.forEach((p,i)=>i?ctx.lineTo(p[0],p[1]):ctx.moveTo(p[0],p[1]));
 ctx.closePath();
 if(fill){ctx.fillStyle=fill;ctx.fill();}
 if(stroke){ctx.strokeStyle=stroke;ctx.lineWidth=line;ctx.stroke();}
}
function shape(ctx,x,y,w,h,fill,stroke='#283a49',r=0){
 ctx.beginPath();
 if(r)ctx.roundRect(x,y,w,h,r);else ctx.rect(x,y,w,h);
 ctx.fillStyle=fill;ctx.fill();
 if(stroke){ctx.strokeStyle=stroke;ctx.lineWidth=1;ctx.stroke();}
}
function radial(ctx,x,y,r,colors){
 const g=ctx.createRadialGradient(x,y,0,x,y,r);
 for(const [at,color]of colors)g.addColorStop(at,color);
 return g;
}
function bolt(ctx,x,y,r=3){
 ctx.save();ctx.shadowBlur=4;ctx.shadowColor='#000';ctx.beginPath();ctx.arc(x,y,r,0,Math.PI*2);ctx.fillStyle='#233341';ctx.fill();ctx.strokeStyle='#9fb1bb';ctx.lineWidth=.9;ctx.stroke();
 ctx.beginPath();ctx.moveTo(x-r*.5,y+r*.4);ctx.lineTo(x+r*.5,y-r*.4);ctx.strokeStyle='#c3cdd6';ctx.stroke();ctx.restore();
}
function steelRect(ctx,x,y,w,h,bright=true,vertical=false){
 const colors=bright?[[0,'#d1dce5'],[.13,'#8d9da9'],[.26,'#becad3'],[.45,'#6d7c86'],[.52,'#b7c7d0'],[.76,'#4c5e6b'],[1,'#9baebd']]:
 [[0,'#84929e'],[.22,'#475663'],[.46,'#778a96'],[.65,'#293a47'],[.9,'#667c8d'],[1,'#243849']];
 shape(ctx,x,y,w,h,vertical?gradient(ctx,x,y,x,y+h,colors):gradient(ctx,x,y,x+w,y,colors),'#213647',1);
 ctx.save();ctx.beginPath();ctx.rect(x,y,w,h);ctx.clip();ctx.globalAlpha=.16;
 for(let i=0;i<Math.ceil(h);i+=3){ctx.fillStyle=i%6===0?'#e2f2fc':'#152e40';ctx.fillRect(x,y+i,w,.36);}
 ctx.restore();
 ctx.strokeStyle='#d8e8f1aa';ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(x+1,y+1);ctx.lineTo(x+w-1,y+1);ctx.stroke();
}
function backdrop(ctx,w,h){
 const b=gradient(ctx,0,0,w,h,[[0,'#020b14'],[.25,'#0a1a2a'],[.65,'#061726'],[1,'#091f33']]);
 shape(ctx,0,0,w,h,b,null);
 // Industrial interior out of focus
 ctx.save();ctx.globalAlpha=.64;ctx.filter='blur(10px)';
 for(let k=0;k<12;k++){
   const x=(k/11)*w*1.2-w*.1,barw=10+(k%4)*14;
   shape(ctx,x,-20,barw,h*.95,gradient(ctx,x,0,x+barw,0,[[0,'#02070c'],[.38,k%2?'#45607b':'#142638'],[1,'#010710']]),null);
 }
 for(let k=0;k<7;k++){
   shape(ctx,w*.5+k*37,h*.46+k*6,w*.65,5,'#667f963b',null);
 }
 ctx.restore();
 ctx.save();ctx.globalAlpha=.5;
 shape(ctx,0,h*.78,w,h*.22,gradient(ctx,0,h*.78,0,h,[[0,'#0d243a'],[1,'#020b15']]),null);
 for(let k=0;k<8;k++){
  const x=(k/7)*w;
  ctx.beginPath();ctx.moveTo(w*.56,h*.75);ctx.lineTo(x,h);ctx.strokeStyle='#22476766';ctx.lineWidth=1;ctx.stroke();
 }
 ctx.restore();
 // Ambient cyan illumination around tool
 shape(ctx,0,0,w,h,radial(ctx,w*.53,h*.48,w*.6,[[0,'#0b4b7c48'],[.45,'#0e285b24'],[1,'#02081400']]),null);
}
function rearMachine(ctx,w,h,cx,cy,scale){
 ctx.save();
 // Horizontal steel rails across the background
 const y=cy+18*scale;
 steelRect(ctx,w*.02,y,w*.98,14*scale,false,true);
 steelRect(ctx,w*.02,y+13*scale,w*.98,17*scale,false);
 shape(ctx,w*.03,y+31*scale,w*.94,9*scale,'#0c253b',null);
 // Massive rear side bracket
 poly(ctx,[[w*.63,cy-8*scale],[w*.96,cy-12*scale],[w*.97,cy+43*scale],[w*.68,cy+57*scale]],gradient(ctx,w*.63,cy,w*.97,cy+55,[[0,'#a6b5c2'],[.3,'#546d7f'],[.75,'#1d3144'],[1,'#566e7c']]),'#0c2435',2);
 for(let i=0;i<5;i++){
  const x=w*.69+(w*.26*i/4);
  steelRect(ctx,x,cy+23*scale,4*scale,25*scale,false);
 }
 // Tope trasero visible
 const x=cx+145*scale;
 steelRect(ctx,x,cy-24*scale,90*scale,9*scale,true,true);
 steelRect(ctx,x+19*scale,cy-38*scale,22*scale,23*scale,false);
 steelRect(ctx,x+73*scale,cy-27*scale,12*scale,12*scale,false);
 bolt(ctx,x+31*scale,cy-24*scale,2.4*scale);
 // Left support and machine rails
 steelRect(ctx,0,cy+26*scale,w*.3,40*scale,false);
 for(let i=0;i<4;i++){shape(ctx,20+i*32*scale,cy+28*scale,8*scale,34*scale,'#20394e','#435b6b');}
 ctx.restore();
}
function drawDie(ctx,cx,cy,scale,opening){
 // Main die: frontal metallic block, concave groove physically open in V.
 const half=88*scale,top=cy,width=half*2,body=120*scale;
 const v=clamp(opening*1.95*scale,19*scale,76*scale),depth=clamp(opening*1.18*scale,15*scale,45*scale);
 const left=cx-half,right=cx+half;
 ctx.save();
 ctx.shadowColor='#000d';ctx.shadowBlur=28*scale;ctx.shadowOffsetY=12*scale;
 poly(ctx,[[left,top],[cx-v/2,top],[cx,top+depth],[cx+v/2,top],[right,top],[right,top+body],[left,top+body]],gradient(ctx,left,0,right,0,[[0,'#c1cad0'],[.2,'#8496a5'],[.48,'#6d7d8b'],[.65,'#a9b7c2'],[1,'#344c5d']]),'#152636',2*scale);
 ctx.restore();
 // die inner groove shadow
 ctx.beginPath();ctx.moveTo(cx-v/2,top);ctx.lineTo(cx,top+depth);ctx.lineTo(cx+v/2,top);
 ctx.strokeStyle='#020d1a';ctx.lineWidth=8*scale;ctx.lineJoin='round';ctx.stroke();
 ctx.strokeStyle='#e0edf4';ctx.lineWidth=2.5*scale;ctx.stroke();
 ctx.beginPath();ctx.moveTo(cx-v/2,top);ctx.lineTo(cx,top+depth);ctx.lineTo(cx+v/2,top);
 ctx.strokeStyle='#195b99';ctx.lineWidth=1*scale;ctx.stroke();
 // front vertical metal brushing
 ctx.save();ctx.beginPath();ctx.rect(left+2,top+depth+1,width-4,body-depth-1);ctx.clip();
 ctx.globalAlpha=.11;
 for(let k=0;k<80;k++){let x=left+(k*.13%1)*width;ctx.strokeStyle=k%4?'#edf3f6':'#0c273d';ctx.lineWidth=.55;ctx.beginPath();ctx.moveTo(x,top+depth);ctx.lineTo(x+3,top+body);ctx.stroke();}
 ctx.restore();
 for(const x of [left+15*scale,right-15*scale]){bolt(ctx,x,cy+body-13*scale,2.8*scale);}
 ctx.strokeStyle='#e8f6ff';ctx.lineWidth=1.5*scale;ctx.beginPath();ctx.moveTo(left+2,top+1);ctx.lineTo(cx-v/2,top+1);ctx.moveTo(cx+v/2,top+1);ctx.lineTo(right-2,top+1);ctx.stroke();
 // Table lower clamps
 const baseY=cy+body;
 steelRect(ctx,cx-half-14*scale,baseY,(half+14*scale)*2,15*scale,false,true);
 ctx.save();ctx.fillStyle='#041624';ctx.fillRect(cx-half-19*scale,baseY+16*scale,(half+19*scale)*2,10*scale);ctx.restore();
 return {top:cy,depth};
}
function drawRam(ctx,cx,cy,scale,tipY,punch){
 const top=tipY-202*scale;
 // upper ram 3D metal assembly
 const ramW=125*scale;
 steelRect(ctx,cx-ramW*.48,top-65*scale,ramW,75*scale,false);
 poly(ctx,[[cx+ramW*.52,top-65*scale],[cx+ramW*.66,top-76*scale],[cx+ramW*.66,top+5*scale],[cx+ramW*.52,top+10*scale]],'#2a4250','#647e8d',1.5);
 steelRect(ctx,cx-38*scale,top-10*scale,76*scale,27*scale,true);
 const h=tipY-top,tipR=Math.max(.75,(punch.tip||1)*.65)*scale;
 let pts;
 if(punch.type==='cabra'){
  pts=[[cx-41*scale,top+12*scale],[cx+44*scale,top+12*scale],[cx+44*scale,top+60*scale],[cx+15*scale,top+60*scale],[cx+15*scale,top+91*scale],[cx+43*scale,top+91*scale],[cx+43*scale,top+119*scale],[cx+17*scale,top+119*scale],[cx+12*scale,tipY-41*scale],[cx+tipR,tipY],[cx-tipR,tipY],[cx-28*scale,tipY-46*scale],[cx-42*scale,top+108*scale]];
 }else{
  let bevel=(punch.angle<=45?100:60)*scale;
  pts=[[cx-43*scale,top+12*scale],[cx+43*scale,top+12*scale],[cx+40*scale,top+bevel],[cx+tipR,tipY],[cx-tipR,tipY],[cx-40*scale,top+bevel]];
 }
 ctx.save();ctx.shadowColor='#000e';ctx.shadowBlur=25*scale;ctx.shadowOffsetX=8*scale;
 poly(ctx,pts,gradient(ctx,cx-43*scale,0,cx+48*scale,0,[[0,'#a0afba'],[.17,'#f0f7fa'],[.34,'#889cab'],[.52,'#d0dbe1'],[.7,'#536776'],[.95,'#c0d3e2'],[1,'#5c6c7b']]),'#1f3c51',1.8*scale);
 ctx.restore();
 ctx.save();ctx.globalAlpha=.23;ctx.lineWidth=.5*scale;
 for(let k=0;k<70;k++){const x=cx-43*scale+k*.55*scale;ctx.beginPath();ctx.moveTo(x,top+12*scale);ctx.lineTo(x+2*scale,tipY);ctx.strokeStyle=k%3?'#e6f7ff':'#244763';ctx.stroke();}
 ctx.restore();
 // polished working edges, highlights
 ctx.beginPath();ctx.moveTo(cx-41*scale,top+13*scale);ctx.lineTo(cx-39*scale,top+(punch.angle<=45?100:60)*scale);ctx.lineTo(cx-tipR,tipY);ctx.strokeStyle='#e2f5ff';ctx.lineWidth=2.5*scale;ctx.stroke();
 ctx.beginPath();ctx.moveTo(cx+42*scale,top+13*scale);ctx.lineTo(cx+39*scale,top+(punch.angle<=45?100:60)*scale);ctx.lineTo(cx+tipR,tipY);ctx.strokeStyle='#49677d';ctx.lineWidth=3*scale;ctx.stroke();
 // laser-blue active pressure glow
 ctx.shadowColor='#00baff';ctx.shadowBlur=13*scale;
 ctx.beginPath();ctx.moveTo(cx-4*scale,tipY);ctx.lineTo(cx+4*scale,tipY);ctx.strokeStyle='#1fb8ff';ctx.lineWidth=3*scale;ctx.stroke();
 ctx.shadowBlur=0;
}
function drawSheet(ctx,pts,thickness,scale,active){
 if(pts.length<2)return;
 ctx.save();ctx.lineJoin='round';ctx.lineCap='round';
 ctx.shadowColor='#030e19';ctx.shadowBlur=10*scale;ctx.shadowOffsetY=6*scale;
 ctx.beginPath();pts.forEach(([x,y],i)=>i?ctx.lineTo(x,y):ctx.moveTo(x,y));
 ctx.strokeStyle='#091b27';ctx.lineWidth=Math.max(6,thickness*scale+5);ctx.stroke();
 ctx.shadowBlur=0;ctx.shadowOffsetY=0;
 const steel=gradient(ctx,0,pts[0][1]-15*scale,0,pts[0][1]+14*scale,[[0,'#ecf4f8'],[.3,'#9ebac8'],[.58,'#486979'],[1,'#b2c3cf']]);
 ctx.strokeStyle=steel;ctx.lineWidth=Math.max(4,thickness*scale+3.3);ctx.stroke();
 ctx.strokeStyle=active?'#23bdff':'#79c5f7';ctx.lineWidth=1.55*scale;ctx.shadowColor='#00a7ff';ctx.shadowBlur=9*scale;ctx.stroke();
 ctx.restore();
}
function stageScene(ctx,w,h,piece,sim,machineView){
 const st=stage(piece,sim.time),{punch,die}=getTooling(piece),t=piece.thickness;
 const scale=Math.min(w/740,h/510)* (machineView?.zoom||1);
 const cx=w*.48+(machineView?.panX||0),baseY=h*.665+(machineView?.panY||0);
 const opening=die.opening||16;
 backdrop(ctx,w,h);rearMachine(ctx,w,h,cx,baseY,scale);
 const dieResult=drawDie(ctx,cx,baseY,scale,opening);
 // Ram advances to the sheet and descends while deforming it.
 const travel=st.press<=.45?66*(1-st.press/.45)+12:12-(st.press-.45)/.55*19;
 const tipY=baseY-travel*scale;
 // draw punch after machine background, before sheet
 drawRam(ctx,cx,baseY,scale,tipY,punch);
 const fractions=st.fractions;
 const points=orientedForMachine(piece,fractions,st.activeBend);
 const maxExtent=Math.max(...points.map(pt=>Math.abs(pt.x)),50);
 const span=Math.min(w*.78/(2*maxExtent),scale*1.35);
 const depression=Math.max(0,(st.press-.45)/.55)*8*scale;
 const sheetY=baseY-2*scale+depression;
 const transformed=points.map(pt=>[cx+pt.x*span,sheetY-pt.y*span]);
 drawSheet(ctx,transformed,t,scale,st.press>.4);
 // Workpiece shadow and hot contact glow along the working tool tip
 if(st.press>.36){
  ctx.save();ctx.globalAlpha=(st.press-.35)*.7;
  ctx.fillStyle=radial(ctx,cx,sheetY,33*scale,[[0,'#13c8ffdd'],[.12,'#16a7ff6d'],[1,'#00aaff00']]);
  ctx.beginPath();ctx.ellipse(cx,sheetY,33*scale,14*scale,0,0,Math.PI*2);ctx.fill();ctx.restore();
 }
 // Functional overlay decorative: orientation angle marker
 const a=piece.angles[st.activeBend]||0;
 ctx.save();
 ctx.strokeStyle='#ff9c28';ctx.fillStyle='#ffad4c';ctx.lineWidth=2.5;
 ctx.beginPath();ctx.arc(cx+48*scale,sheetY-22*scale,34*scale,-1.55,-.45, a<0);ctx.stroke();
 ctx.font='900 '+Math.max(12,17*scale)+'px system-ui';
 ctx.textAlign='left';ctx.fillText((a>0?'+':'')+a+'°',cx+72*scale,sheetY-37*scale);
 ctx.restore();
 // tiny badges in-frame visual signifiers
 ctx.font='700 10px system-ui';
 ctx.fillStyle='#87b6d6';ctx.textAlign='left';
 ctx.fillText('SIMULACIÓN · PERFIL',12,h-14);
 ctx.textAlign='right';ctx.fillStyle='#6f94ad';ctx.fillText('MODELO PARAMÉTRICO · NO CONTROL CNC',w-12,h-14);
}
// Entrypoint used from app.js drawMachine without changing the core timing engine.
export function drawIndustrialMachine(ctx,w,h,piece,sim,machineView){
 stageScene(ctx,w,h,piece,sim,machineView);
}
