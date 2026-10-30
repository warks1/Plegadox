/**
 * Plegadox · sección técnica paramétrica con una única escala en mm.
 *
 * IMPORTANTE: esto NO es CAD certificado ni un solver FEM. Las siluetas de
 * punzón/matriz se calculan a partir de los datos que sí conocemos. La chapa
 * es un perfil de fibra media con espesor nominal; el contacto es orientativo.
 * No usar esta vista para verificar colisiones o seguridad de máquina.
 */
import {normalized,stage,presentedAtStage,getTooling,clamp} from './engine.js';
import {sectionPunch,sectionDie,sectionBounds} from './tool-profiles.js';

const mm=v=>Number.isFinite(+v)?+v:0;
const mPoint=(x,y)=>({x:mm(x),y:mm(y)});

export function technicalScene(piece,instant=0){
 const p=normalized(piece),st=typeof instant==='number'?stage(p,instant):instant;
 const tooling=getTooling(p),die=sectionDie(tooling.die),punch=sectionPunch(tooling.punch);
 const t=p.thickness;
 // A common physical coordinate system, in mm: matrix upper plane is y=0.
 const forming=clamp((st.press-.45)/.55,0,1);
 const maxEngagement=Math.min(die.depth*.82,Math.max(t*.4,die.opening*.16));
 const engagement=maxEngagement*forming;
 const centerHeight=t*.5-engagement;
 const approachGap=Math.max(14,die.opening*1.7);
 const tipHeight=st.press<.45
   ?t+Math.max(0,1-st.press/.45)*approachGap
   :centerHeight+t*.5;
 const presentation=presentedAtStage(p,st);
 const sheet=presentation.points.map(pt=>mPoint(pt.x,pt.y+centerHeight));
 const diePolygon=die.points.map(([x,y])=>mPoint(x,y-die.height));
 const punchPolygon=punch.points.map(([x,y])=>mPoint(x,y+tipHeight));
 // Include the selected punch, the V and all sheet wings in view bounds.
 const all=[...sheet,...diePolygon,...punchPolygon];
 const bx=all.map(q=>q.x),by=all.map(q=>q.y);
 const world={minX:Math.min(...bx),maxX:Math.max(...bx),
   minY:Math.min(...by),maxY:Math.max(...by)};
 return {piece:p,stage:st,presentation,sheet,diePolygon,punchPolygon,die,punch,
         dimensions:{opening:die.opening,dieAngle:die.angle,depth:die.depth,
           punchAngle:punch.angle,punchHeight:punch.height,
           punchTipDiameter:tooling.punch.tip,thickness:t,engagement},
         world,verified:false};
}

function gradient(ctx,x,y,w,h,colors){
 const g=ctx.createLinearGradient(x,y,x+w,y+h);
 colors.forEach(([stop,c])=>g.addColorStop(stop,c));return g;
}
function polygon(ctx,points,fill,stroke,width=1.5){
 ctx.beginPath();points.forEach((p,i)=>i?ctx.lineTo(p.x,p.y):ctx.moveTo(p.x,p.y));
 ctx.closePath();ctx.fillStyle=fill;ctx.fill();ctx.strokeStyle=stroke;
 ctx.lineWidth=width;ctx.stroke();
}
function drawLabel(ctx,text,x,y,color='#c7e7f8',size=12,align='left'){
 ctx.font='600 '+size+'px system-ui';ctx.fillStyle=color;ctx.textAlign=align;
 ctx.fillText(text,x,y);
}
function dimLine(ctx,a,b,caption,scale,color='#66ccff',vertical=false){
 const off=18,pa=vertical?{x:a.x-off,y:a.y}:{x:a.x,y:a.y-off};
 const pb=vertical?{x:b.x-off,y:b.y}:{x:b.x,y:b.y-off};
 ctx.strokeStyle=color;ctx.lineWidth=1;ctx.beginPath();
 ctx.moveTo(a.x,a.y);ctx.lineTo(pa.x,pa.y);
 ctx.moveTo(b.x,b.y);ctx.lineTo(pb.x,pb.y);
 ctx.moveTo(pa.x,pa.y);ctx.lineTo(pb.x,pb.y);ctx.stroke();
 const len=Math.hypot(pb.x-pa.x,pb.y-pa.y),dx=(pb.x-pa.x)/(len||1),dy=(pb.y-pa.y)/(len||1);
 for(const [end,sign] of [[pa,1],[pb,-1]]){
  ctx.beginPath();ctx.moveTo(end.x,end.y);
  ctx.lineTo(end.x+dx*sign*6+dy*3,end.y+dy*sign*6-dx*3);
  ctx.lineTo(end.x+dx*sign*6-dy*3,end.y+dy*sign*6+dx*3);
  ctx.fillStyle=color;ctx.fill();
 }
 drawLabel(ctx,caption,(pa.x+pb.x)/2+(vertical?-5:0),(pa.y+pb.y)/2+(vertical?-3:-7),color,10,vertical?'right':'center');
}
export function drawTechnicalSection(ctx,w,h,piece,sim,view={}){
 const result=technicalScene(piece,sim.time),{stage:st,dimensions:d,presentation}=result;
 ctx.save();
 const bg=gradient(ctx,0,0,w,h,[[0,'#071c2f'],[.45,'#0d3046'],[1,'#061322']]);
 ctx.fillStyle=bg;ctx.fillRect(0,0,w,h);
 // En móvil la fila de mandos ocupa la parte inferior del visor.
 // Se resta esa franja ANTES de ajustar la escala, evitando cortar la matriz.
 const controlsReserve=w<500?67:0,drawHeight=h-controlsReserve;
 const bounds=result.world,padW=Math.max(28,w*.07),padH=Math.max(30,drawHeight*.095);
 const xRange=Math.max(60,bounds.maxX-bounds.minX),yRange=Math.max(100,bounds.maxY-bounds.minY);
 const scale=Math.max(.08,Math.min((w-padW*2)/xRange,(drawHeight-padH*2)/yRange))*(view.zoom||1);
 const mx=(bounds.minX+bounds.maxX)/2,my=(bounds.minY+bounds.maxY)/2;
 const map=pt=>({x:w*.5+(pt.x-mx)*scale+(view.panX||0),
  y:drawHeight*.5-(pt.y-my)*scale+(view.panY||0)});
 const poly=pts=>pts.map(map),origin=map(mPoint(0,0));
 // 10 mm metric grid. Draw only the visible grid; no browser zoom.
 const step=10;ctx.save();ctx.lineWidth=.55;ctx.strokeStyle='#83b2d920';
 let minX=Math.floor((mx-w/scale)*.1)*10,maxX=Math.ceil((mx+w/scale)*.1)*10;
 let minY=Math.floor((my-h/scale)*.1)*10,maxY=Math.ceil((my+h/scale)*.1)*10;
 for(let x=minX,c=0;x<=maxX&&c++<120;x+=step){
  const at=map(mPoint(x,0)).x;ctx.beginPath();ctx.moveTo(at,0);ctx.lineTo(at,h);ctx.stroke();
 }
 for(let y=minY,c=0;y<=maxY&&c++<120;y+=step){
  const at=map(mPoint(0,y)).y;ctx.beginPath();ctx.moveTo(0,at);ctx.lineTo(w,at);ctx.stroke();
 }
 ctx.restore();
 // Bed top / datum.
 ctx.setLineDash([6,5]);ctx.lineWidth=1;
 ctx.strokeStyle='#65a7ce5c';ctx.beginPath();ctx.moveTo(0,origin.y);
 ctx.lineTo(w,origin.y);ctx.stroke();ctx.setLineDash([]);
 // Tool contour is derived from die opening and included V-angle in mm.
 const dp=poly(result.diePolygon),dieFill=gradient(ctx,dp[0].x,0,dp.at(5).x,0,
 [[0,'#24576b'],[.24,'#85b6c5'],[.52,'#356e82'],[.75,'#9bcbd5'],[1,'#244359']]);
 ctx.save();ctx.shadowBlur=16;ctx.shadowColor='#000b';
 polygon(ctx,dp,dieFill,'#a2d5e9',1.7);ctx.restore();
  const pp=poly(result.punchPolygon),punchFill=gradient(ctx,pp[0].x,0,pp[1].x,0,
 [[0,'#435d6f'],[.17,'#d7ebf2'],[.4,'#809cac'],[.55,'#e7f5f9'],[.8,'#637f95'],[1,'#253f57']]);
 ctx.save();ctx.globalAlpha=view.transparent?.34:1;
 ctx.shadowColor='#000b';ctx.shadowBlur=11;
 polygon(ctx,pp,punchFill,'#d8f1ff',1.35);ctx.restore();
 // Sheet from the current accumulated bend state, not a finished omega.
 const sp=poly(result.sheet);
 ctx.save();ctx.beginPath();sp.forEach((p,i)=>i?ctx.lineTo(p.x,p.y):ctx.moveTo(p.x,p.y));
 ctx.lineJoin='round';ctx.lineCap='round';ctx.lineWidth=Math.max(1.4,d.thickness*scale);
 ctx.strokeStyle='#f6aa4e';ctx.shadowColor='#ffb15377';ctx.shadowBlur=5;
 ctx.stroke();ctx.lineWidth=.9;ctx.strokeStyle='#ffe7aa';ctx.stroke();ctx.restore();
 // Contact marker: graphic, not a load/force calculation.
 if(st.press>=.45&&st.press<.84){
  const cp=map(mPoint(0,result.sheet[st.activeBend+1]?.y??d.thickness/2));
  ctx.fillStyle='#ffbd51';ctx.beginPath();ctx.arc(cp.x,cp.y,Math.max(2.5,3*scale),0,Math.PI*2);ctx.fill();
 }
 if(w>300&&scale>0.22){
  const left=map(mPoint(-d.opening/2,0)),right=map(mPoint(d.opening/2,0));
  dimLine(ctx,left,right,'V '+d.opening+' mm',scale);
 }
 // On-screen legends are separated from the tool contact area.
 const badge=(text,x,y,fill)=>{
  ctx.font='700 11px system-ui';const width=ctx.measureText(text).width+16;
  ctx.fillStyle=fill;ctx.fillRect(x,y-13,width,20);
  drawLabel(ctx,text,x+8,y+1,'#f2f9ff',11);
 };
 if(w<500){
  // Fichas reducidas sin tapar la cabeza del punzón en pantallas estrechas.
  badge('P '+d.punchAngle+'°',9,17,'#315878de');
  badge('V'+d.opening+'/'+d.dieAngle+'°',9,39,'#1a5a69db');
  badge('e '+d.thickness+' mm',9,61,'#7c531cdb');
 }else{
  badge('PUNZÓN '+d.punchAngle+'°',9,22,'#315878de');
  badge('MATRIZ V'+d.opening+' / '+d.dieAngle+'°',9,49,'#1a5a69db');
  badge('CHAPA '+d.thickness+' mm',9,76,'#7c531cdb');
 }
 drawLabel(ctx,st.phase+' · pliegue '+(st.activeBend+1),w-11,18,'#d6eefb',11,'right');
 // En móvil se reserva una banda inferior para los mandos táctiles:
 // ni la escala ni la advertencia quedan debajo de los botones.
 const compact=w<500,footerY=compact?h-58:h-8,scaleBarY=compact?h-76:h-23;
 if(presentation.flipped)drawLabel(ctx,'Presentación volteada: '+result.piece.angles[st.activeBend]+'°',
  w-10,compact?h-103:h-33,'#ffca79',10,'right');
 if(w>=310){
  const x=14,y=scaleBarY,bar=20*scale;
  ctx.strokeStyle='#e5f4ff';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x+bar,y);ctx.stroke();
  drawLabel(ctx,'20 mm',x+bar/2,y-6,'#b9dbee',10,'center');
 }
 drawLabel(ctx,'SECCIÓN PARAMÉTRICA · CONTACTO NO CERTIFICADO',
  w/2,footerY,'#93bbcc',Math.max(8,Math.min(11,w/44)),'center');
 ctx.restore();
 return result;
}
