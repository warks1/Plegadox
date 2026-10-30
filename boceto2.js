// Plegadox · Adaptación de datos a la pantalla Boceto 2.
import {development,getTooling,stage,profile,normalized} from './engine.js';
const $=id=>document.getElementById(id);
const fmt=(n,d=1)=>Number(n).toLocaleString('es-ES',{minimumFractionDigits:d,maximumFractionDigits:d});
let lastPiece='',lastDev='',lastTop='',lastDims='',lastSize='';
function screenData(){
 const state=window.PLEGADOX_STATE?.();
 return state||{piece:normalized(null),sim:{time:0}};
}
function compactLabel(t){return t?.reference||t?.name||'—';}
function topbar(){
 const {piece,sim}=screenData(),tools=getTooling(piece),st=stage(piece,sim.time);
 const angle=piece.angles[st.activeBend]||0;
 const newKey=JSON.stringify([piece.name,piece.material,piece.thickness,piece.die,piece.punch,angle,st.phase]);
 if(lastTop===newKey)return;
 lastTop=newKey;
 const entries={
 topProject:piece.name,
 topMaterial:tools.material.name,
 topThickness:fmt(piece.thickness,2)+' mm',
 topAngle:(angle>0?'+':'')+angle+'°',
 topV:tools.die.opening+' mm',
 topPunch:compactLabel(tools.punch),
 topDie:compactLabel(tools.die),
 topState:st.completed?'Pieza simulada':st.phase
 };
 for(const [id,text] of Object.entries(entries)){const el=$(id);if(el)el.textContent=text;}
}
function dimensions(){
 const {piece}=screenData();
 const key=JSON.stringify(piece.flanges);
 if(lastDims===key)return;
 lastDims=key;
 const target=$('cpDimensions');if(!target)return;
 target.replaceChildren(...piece.flanges.slice(0,8).map((value,i)=>{
  const row=document.createElement('div');row.className='cp-dimension-row';
  const l=document.createElement('span');l.textContent='L'+(i+1);
  const v=document.createElement('strong');v.textContent=fmt(value,2);
  row.append(l,v);return row;
 }));
}
function drawDevelopment(){
 const el=$('developmentCanvas');if(!el||!el.clientWidth||!el.clientHeight)return;
 const {piece}=screenData(),d=development(piece),w=el.clientWidth,h=el.clientHeight;
 const device=Math.min(devicePixelRatio||1,2),cw=Math.round(w*device),ch=Math.round(h*device);
 if(el.width!==cw||el.height!==ch){el.width=cw;el.height=ch;}
 const ctx=el.getContext('2d');ctx.setTransform(device,0,0,device,0,0);ctx.clearRect(0,0,w,h);
 const g=ctx.createLinearGradient(0,0,w,h);g.addColorStop(0,'#091d30');g.addColorStop(1,'#02101c');ctx.fillStyle=g;ctx.fillRect(0,0,w,h);
 const L=d.length,marginX=25,barX=marginX,barW=Math.max(40,w-marginX*2),barY=h*.38,barH=57;
 const steel=ctx.createLinearGradient(barX,barY,barX,barY+barH);
 steel.addColorStop(0,'#a2b6c4');steel.addColorStop(.15,'#6e8ba0');steel.addColorStop(.48,'#506b7f');steel.addColorStop(.7,'#7796a9');steel.addColorStop(1,'#2a4f68');
 ctx.fillStyle=steel;ctx.strokeStyle='#bed6e6';ctx.lineWidth=1.2;ctx.fillRect(barX,barY,barW,barH);ctx.strokeRect(barX,barY,barW,barH);
 const sum=piece.flanges.reduce((a,b)=>a+b,0)||1;
 let running=0;
 for(let i=0;i<piece.flanges.length-1;i++){
  running+=piece.flanges[i];const x=barX+barW*running/sum;
  ctx.setLineDash([4,3]);ctx.beginPath();ctx.moveTo(x,barY-7);ctx.lineTo(x,barY+barH+7);ctx.strokeStyle='#c9eaffcc';ctx.lineWidth=1;ctx.stroke();ctx.setLineDash([]);
  if(piece.flanges.length<=6){
   ctx.font='500 9px system-ui';ctx.fillStyle='#d8eaf5';ctx.textAlign='center';ctx.fillText((piece.angles[i]>0?'+':'')+piece.angles[i]+'°',x,barY+barH+19);
  }
 }
 // Engraved top dimension line with arrows.
 const top=barY-18;
 ctx.strokeStyle='#dcefff';ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(barX,top);ctx.lineTo(barX+barW,top);ctx.moveTo(barX,top-5);ctx.lineTo(barX,barY-3);ctx.moveTo(barX+barW,top-5);ctx.lineTo(barX+barW,barY-3);ctx.stroke();
 ctx.fillStyle='#dcefff';ctx.beginPath();ctx.moveTo(barX,top);ctx.lineTo(barX+7,top-3);ctx.lineTo(barX+7,top+3);ctx.fill();
 ctx.beginPath();ctx.moveTo(barX+barW,top);ctx.lineTo(barX+barW-7,top-3);ctx.lineTo(barX+barW-7,top+3);ctx.fill();
 ctx.fillStyle='#e5f3ff';ctx.font='bold 12px system-ui';ctx.textAlign='center';ctx.fillText(fmt(L,2)+' mm',w/2,top-7);
 ctx.fillStyle='#84a9c6';ctx.textAlign='left';ctx.font='10px system-ui';ctx.fillText('DESARROLLO PLANO · ESTIMADO',12,h-9);
 $('cpDevTotal').textContent='Longitud estimada '+fmt(L,2)+' mm · K='+fmt(d.k,2);
}
function setup(){
 $('sideSave')?.addEventListener('click',()=>$('saveBtn').click());
 $('sideImport')?.addEventListener('click',()=>$('loadBtn').click());
 $('cpStartButton')?.addEventListener('click',()=>$('playBtn').click());
 $('machineZoomIn')?.addEventListener('click',()=>camera('zoomIn'));
 $('machineZoomOut')?.addEventListener('click',()=>camera('zoomOut'));
 $('machineReset')?.addEventListener('click',()=>camera('reset'));
 $('machineView3D')?.addEventListener('click',()=>$('sceneCanvas')?.scrollIntoView({behavior:'smooth',block:'center'}));
 const viewer=$('showTool3D');
 if(viewer)viewer.addEventListener('click',()=>{
  const panel=$('tab-simulacion').querySelector('.cp-library');
  const open=panel.classList.toggle('viewer-open');viewer.setAttribute('aria-expanded',String(open));viewer.textContent=open?'✕ CERRAR 3D':'◈ VER EN 3D';
 });
 window.addEventListener('resize',()=>{lastSize='';drawDevelopment();});
 window.addEventListener('plegadox:pieceChanged',()=>{lastTop='';lastDims='';drawDevelopment();});
 function loop(){topbar();dimensions();if($('developmentCanvas')?.clientWidth)drawDevelopment();requestAnimationFrame(loop);}
 requestAnimationFrame(loop);
}
function camera(action){
 const view=window.PLEGADOX_MACHINE_VIEW,redraw=window.PLEGADOX_REDRAW;
 if(!view)return;
 if(action==='zoomIn')view.zoom=Math.min(4,view.zoom*1.2);
 if(action==='zoomOut')view.zoom=Math.max(.5,view.zoom/1.2);
 if(action==='reset'){view.zoom=1;view.panX=0;view.panY=0;}
 redraw?.();
}
setup();
