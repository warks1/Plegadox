import {MATERIALS,DIES,PUNCHES,EXAMPLE,normalized,profile,bounds,development,estimateAirBendForce,REFERENCE_RM_MPA,stage,orientedForMachine,getTooling,selfIntersects,clamp,finite} from './engine.js';
import {drawIndustrialMachine} from './machine-visual.js';
import {registerCatalogue} from './catalog.js';
import {analyzeSequence} from './validation.js';
import {inspectSequenceTools,currentToolContact,describeToolIssue} from './tool-collision.js';
import {sectionPunch,sectionDie} from './tool-profiles.js';
import {getV85} from './machine-config.js';
registerCatalogue(DIES,PUNCHES);
const $=id=>document.getElementById(id);
const storeKey='plegadox:piece:v1';
let piece=restore();
let sim={playing:false,time:0,last:null,speed:1};
let camera={yaw:-.62,pitch:.45,zoom:1};
let machineView={panX:0,panY:0,zoom:1};
let touchOrderEnabled=false,chosenTouchOrder=[];
const geometryCache={key:null,result:null};
function geometryReport(){
 const key=JSON.stringify([piece.flanges,piece.angles,piece.order,piece.thickness,piece.width,piece.material,piece.rmMPa,piece.punch,piece.die,getV85().ramWidth]);
 if(key!==geometryCache.key){geometryCache.key=key;geometryCache.result={...analyzeSequence(piece),tools:inspectSequenceTools(piece,6)};}
 return geometryCache.result;
}
const numbers=(n,d=1)=>Number(n).toLocaleString('es-ES',{maximumFractionDigits:d,minimumFractionDigits:d});
function restore(){try{const saved=localStorage.getItem(storeKey);return normalized(saved?JSON.parse(saved):EXAMPLE);}catch{return normalized(EXAMPLE);}}
function persist(){try{localStorage.setItem(storeKey,JSON.stringify(piece));}catch{}}
function save(){persist();$('saveBtn').textContent='✓';$('saveBtn').title='Guardado en este dispositivo';setTimeout(()=>{$('saveBtn').textContent='▣';$('saveBtn').title='Guardar pieza';},1500);}
function resetPlayback(){sim.time=0;sim.last=null;sim.playing=false;$('playBtn').textContent='▶';$('playBtn').title='Reproducir simulación';}
function changePiece(p,structural=false){piece=normalized(p);persist();if(structural)resetPlayback();renderEditor();renderSetup();paintAll();window.dispatchEvent(new CustomEvent('plegadox:pieceChanged',{detail:piece}));}
function configure(){
 const options=(select,items,current)=>{select.replaceChildren(...items.map(item=>{const o=document.createElement('option');o.value=item.id;o.textContent=item.name;return o;}));select.value=current;};
 options($('material'),MATERIALS,piece.material);options($('die'),DIES,piece.die);options($('punch'),PUNCHES,piece.punch);
 document.querySelectorAll('.nav').forEach(btn=>btn.addEventListener('click',()=>{document.querySelectorAll('.nav').forEach(n=>n.classList.toggle('active',n===btn));document.querySelectorAll('.panel').forEach(p=>p.classList.toggle('active',p.id==='tab-'+btn.dataset.tab));paintAll();}));
 const entries=[['pieceName','name'],['material','material'],['thickness','thickness'],['width','width'],['die','die'],['punch','punch'],['datum','datum']];
 for(const [id,key] of entries)$(id).addEventListener('change',e=>{const v=key==='thickness'||key==='width'?finite(e.target.value,2):e.target.value;changePiece({...piece,[key]:v},true);});
 $('kFactor').addEventListener('change',e=>changePiece({...piece,kFactor:e.target.value===''?null:finite(e.target.value,.36)}));
 $('insideRadius').addEventListener('change',e=>changePiece({...piece,radius:e.target.value===''?null:finite(e.target.value,2)}));
 $('rmMPa').addEventListener('change',e=>{
  const raw=e.target.value.trim().replace(',','.');
  if(raw!==''&&(!Number.isFinite(Number(raw))||Number(raw)<50||Number(raw)>1800)){
   e.target.value=piece.rmMPa==null?'':String(piece.rmMPa);return;
  }
  changePiece({...piece,rmMPa:raw===''?null:Number(raw)});
 });
 $('newBtn').onclick=()=>changePiece({name:'Nueva pieza',flanges:[100,100],angles:[90],order:[0],material:'s235',thickness:2,width:500,die:'v16',punch:'straight88'},true);
 $('sampleBtn').onclick=()=>changePiece(EXAMPLE,true);
 $('addFlange').onclick=()=>{if(piece.flanges.length>=20)return;changePiece({...piece,flanges:[...piece.flanges,50],angles:[...piece.angles,90],order:[...piece.order,piece.angles.length]},true);};
 $('resetOrder').onclick=()=>changePiece({...piece,order:piece.angles.map((_,i)=>i)},true);
 $('touchOrderMode').onclick=toggleTouchOrder;
 $('finalCanvas').addEventListener('pointerdown',pickBendFromDrawing);
 $('saveBtn').onclick=save;
 $('exportBtn').onclick=()=>{
 const blob=new Blob([JSON.stringify({...piece,format:'plegadox-piece-v1'},null,2)],{type:'application/json'});
 const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=(piece.name.replace(/[^a-z0-9áéíóú_-]+/gi,'-').slice(0,55)||'pieza')+'.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),4000);
 };
 $('loadBtn').onclick=()=>$('fileInput').click();
 $('fileInput').onchange=async e=>{
 const file=e.target.files?.[0];if(!file)return;
 try{if(file.size>1024*1024)throw new Error('Archivo demasiado grande');const data=JSON.parse(await file.text());if(!Array.isArray(data.flanges)||!Array.isArray(data.angles))throw new Error('El JSON no contiene alas y pliegues');changePiece(data,true);}catch(err){alert('No se pudo cargar la pieza: '+err.message);}e.target.value='';
 };
 $('playBtn').onclick=()=>{if(sim.time>=piece.order.length*5)sim.time=0;sim.playing=true;sim.last=null;$('playBtn').textContent='▶';$('playBtn').title='Reproduciendo';};
 $('pauseBtn').onclick=()=>{sim.playing=false;sim.last=null;$('playBtn').textContent='▶';$('playBtn').title='Continuar simulación';};
 $('restartBtn').onclick=()=>{resetPlayback();paintAll();};
 $('stepBtn').onclick=()=>{sim.playing=false;sim.last=null;const i=Math.floor(sim.time/5);sim.time=Math.min(piece.order.length*5,(i+1)*5);paintAll();};
 $('timeline').oninput=e=>{sim.playing=false;sim.last=null;sim.time=piece.order.length*5*Number(e.target.value)/1000;paintAll();};
 $('speed').onchange=e=>sim.speed=Number(e.target.value)||1;
 $('viewIsometric').onclick=()=>{camera={yaw:-.62,pitch:.45,zoom:1};paintAll();};
 $('viewFront').onclick=()=>{camera={yaw:0,pitch:0,zoom:1};paintAll();};
 $('zoomIn').onclick=()=>{camera.zoom=clamp(camera.zoom*1.18,.35,6);paintAll();};
 $('zoomOut').onclick=()=>{camera.zoom=clamp(camera.zoom/1.18,.35,6);paintAll();};
 bindViewport($('sceneCanvas'),'scene');
 bindViewport($('machineCanvas'),'machine');
 window.addEventListener('resize',paintAll);
 if('ResizeObserver' in window)new ResizeObserver(paintAll).observe(document.querySelector('main'));
 setInterval(()=>$('clock').textContent=new Date().toLocaleTimeString('es-ES',{hour:'2-digit',minute:'2-digit'}),30000);
 $('clock').textContent=new Date().toLocaleTimeString('es-ES',{hour:'2-digit',minute:'2-digit'});
 renderEditor();renderSetup();paintAll();requestAnimationFrame(tick);
}
function bindViewport(canvas,kind){
 let last=null,dist=null;const points=new Map();
 const zoom=f=>{if(kind==='scene')camera.zoom=clamp(camera.zoom*f,.35,6);else machineView.zoom=clamp(machineView.zoom*f,.4,5);paintAll();};
 canvas.addEventListener('wheel',e=>{e.preventDefault();zoom(Math.exp(-e.deltaY*.0015));},{passive:false});
 canvas.addEventListener('pointerdown',e=>{canvas.setPointerCapture(e.pointerId);points.set(e.pointerId,{x:e.clientX,y:e.clientY});if(points.size===1)last={x:e.clientX,y:e.clientY};});
 canvas.addEventListener('pointermove',e=>{
 if(!points.has(e.pointerId))return;
 const p=points.get(e.pointerId),dx=e.clientX-p.x,dy=e.clientY-p.y;points.set(e.pointerId,{x:e.clientX,y:e.clientY});
 if(points.size===2){const pp=[...points.values()],d=Math.hypot(pp[0].x-pp[1].x,pp[0].y-pp[1].y);if(dist)zoom(d/dist);dist=d;last=null;}
 else if(last){if(kind==='scene'){camera.yaw+=dx*.009;camera.pitch=clamp(camera.pitch+dy*.009,-1.45,1.45);}else{machineView.panX+=dx;machineView.panY+=dy;}paintAll();last={x:e.clientX,y:e.clientY};}
 });
 for(const ev of ['pointerup','pointercancel','lostpointercapture'])canvas.addEventListener(ev,e=>{points.delete(e.pointerId);dist=null;last=null;});
}
function renderSetup(){
 for(const id of ['pieceName','material','thickness','width','die','punch'])$(id).value=piece[{pieceName:'name'}[id]||id];
 $('datum').value=piece.datum;
 $('kFactor').value=piece.kFactor??getTooling(piece).material.k;
 $('insideRadius').value=piece.radius??numbers(development(piece).radius,2).replace(',','.');
 $('rmMPa').value=piece.rmMPa??'';
 $('rmMPa').placeholder=String(REFERENCE_RM_MPA[piece.material]||450)+' (referencia)';
}
function renderEditor(){
 const tb=$('flangeRows');tb.replaceChildren();
 piece.flanges.forEach((v,i)=>{
 const row=document.createElement('tr');const label=document.createElement('td');label.textContent=String(i+1);row.append(label);
 const lenCell=document.createElement('td'),len=document.createElement('input');len.type='number';len.min='1';len.max='10000';len.step='0.1';len.inputMode='decimal';len.value=v;len.setAttribute('aria-label','Longitud ala '+(i+1));len.addEventListener('change',()=>{const f=[...piece.flanges];f[i]=finite(len.value,v);changePiece({...piece,flanges:f},true);});lenCell.append(len);row.append(lenCell);
 const angleCell=document.createElement('td');
 if(i){const wrap=document.createElement('div');wrap.style.cssText='display:flex;align-items:center;gap:5px';const a=document.createElement('input');a.className='angle-input';a.type='text';a.inputMode='text';a.value=String(piece.angles[i-1]);a.setAttribute('aria-label','Ángulo firmado pliegue '+i);a.addEventListener('change',()=>{const val=Number(a.value.replace(',','.'));if(!Number.isFinite(val)){a.value=String(piece.angles[i-1]);return;}const angles=[...piece.angles];angles[i-1]=val;changePiece({...piece,angles},true);});const flip=document.createElement('button');flip.type='button';flip.textContent='±';flip.title='Cambiar sentido del pliegue';flip.addEventListener('click',()=>{const angles=[...piece.angles];angles[i-1]=-angles[i-1];changePiece({...piece,angles},true);});wrap.append(a,flip);angleCell.append(wrap);}else angleCell.textContent='—';
 row.append(angleCell);const orderCell=document.createElement('td');orderCell.textContent=i?String(piece.order.indexOf(i-1)+1):'—';row.append(orderCell);
 const actionCell=document.createElement('td');if(i>=2){const remove=document.createElement('button');remove.className='mini';remove.textContent='×';remove.title='Eliminar ala';remove.onclick=()=>{const flanges=[...piece.flanges],angles=[...piece.angles];flanges.splice(i,1);angles.splice(i-1,1);const order=piece.order.filter(x=>x!==i-1).map(x=>x>i-1?x-1:x);changePiece({...piece,flanges,angles,order},true);};actionCell.append(remove);}row.append(actionCell);tb.append(row);
 });
 const seq=$('sequence');seq.replaceChildren();
 piece.order.forEach((id,i)=>{const c=document.createElement('div');c.className='seq-card';const text=document.createElement('div');const b=document.createElement('b');b.textContent=(i+1)+'. Pliegue '+(id+1);const small=document.createElement('span');small.textContent=' '+(piece.angles[id]>0?'+':'')+piece.angles[id]+'°';text.append(b,small);const up=document.createElement('button');up.textContent='←';up.title='Hacer antes';up.disabled=!i;up.onclick=()=>reorder(i,-1);const down=document.createElement('button');down.textContent='→';down.title='Hacer después';down.disabled=i===piece.order.length-1;down.onclick=()=>reorder(i,1);c.append(text,up,down);seq.append(c);});
}
function reorder(i,delta){const order=[...piece.order];[order[i],order[i+delta]]=[order[i+delta],order[i]];changePiece({...piece,order},true);}
function touchOrderMessage(message){
 const hint=$('touchOrderHint');
 if(hint)hint.textContent=message;
 const btn=$('touchOrderMode');
 if(btn){btn.setAttribute('aria-pressed',String(touchOrderEnabled));btn.classList.toggle('selected',touchOrderEnabled);}
}
function toggleTouchOrder(){
 touchOrderEnabled=!touchOrderEnabled;chosenTouchOrder=[];
 touchOrderMessage(touchOrderEnabled
   ?'Toca en el dibujo el pliegue 1, después el 2… (los puntos amarillos).'
   :'Modo de selección por toques desactivado.');
 drawProfile('finalCanvas',piece.angles.map(()=>1),true);
}
function pickBendFromDrawing(e){
 if(!touchOrderEnabled)return;
 const rect=$('finalCanvas').getBoundingClientRect();
 if(!rect.width||!rect.height)return;
 const points=profile(piece,piece.angles.map(()=>1)).points;
 const map=fit(points,rect.width,rect.height,43);
 const x=e.clientX-rect.left,y=e.clientY-rect.top;
 let picked=-1,distance=Infinity;
 for(let i=0;i<piece.angles.length;i++){
   if(chosenTouchOrder.includes(i))continue;
   const pt=map(points[i+1]),d=Math.hypot(pt.x-x,pt.y-y);
   if(d<distance){distance=d;picked=i;}
 }
 if(picked<0||distance>32){
   touchOrderMessage('Toca un punto amarillo del pliegue, no la línea del ala.');
   return;
 }
 chosenTouchOrder.push(picked);
 if(chosenTouchOrder.length===piece.angles.length){
   const order=[...chosenTouchOrder];touchOrderEnabled=false;chosenTouchOrder=[];
   changePiece({...piece,order},true);
   touchOrderMessage('Secuencia aplicada: '+order.map((id,i)=>(i+1)+'→pliegue '+(id+1)).join(' · '));
 }else{
   touchOrderMessage('Seleccionados: '+chosenTouchOrder.length+'/'+piece.angles.length+
     '. Ahora toca el pliegue '+(chosenTouchOrder.length+1)+'.');
   drawProfile('finalCanvas',piece.angles.map(()=>1),true);
 }
}
function canvas2d(id){
 const c=$(id);if(!c||c.offsetParent===null)return null;const r=c.getBoundingClientRect();if(!r.width||!r.height)return null;
 const dpr=Math.min(window.devicePixelRatio||1,2);const w=r.width,h=r.height;
 if(c.width!==Math.round(w*dpr)||c.height!==Math.round(h*dpr)){c.width=Math.round(w*dpr);c.height=Math.round(h*dpr);}
 const ctx=c.getContext('2d');ctx.setTransform(dpr,0,0,dpr,0,0);ctx.clearRect(0,0,w,h);
 return {ctx,w,h};
}
function roundRect(ctx,x,y,w,h,r,fill,stroke){ctx.beginPath();ctx.roundRect(x,y,w,h,r);if(fill){ctx.fillStyle=fill;ctx.fill();}if(stroke){ctx.strokeStyle=stroke;ctx.lineWidth=1;ctx.stroke();}}
function line(ctx,pts,color,width=2){if(pts.length<2)return;ctx.beginPath();ctx.moveTo(pts[0].x,pts[0].y);for(let i=1;i<pts.length;i++)ctx.lineTo(pts[i].x,pts[i].y);ctx.strokeStyle=color;ctx.lineWidth=width;ctx.lineCap='round';ctx.lineJoin='round';ctx.stroke();}
function text(ctx,s,x,y,color='#49667b',size=12,align='left'){ctx.fillStyle=color;ctx.font='600 '+size+'px system-ui';ctx.textAlign=align;ctx.fillText(s,x,y);}
function drawGrid(ctx,w,h,space=32){ctx.beginPath();for(let x=0;x<=w;x+=space){ctx.moveTo(x,0);ctx.lineTo(x,h);}for(let y=0;y<=h;y+=space){ctx.moveTo(0,y);ctx.lineTo(w,y);}ctx.strokeStyle='#dbeaf366';ctx.lineWidth=1;ctx.stroke();}
function fit(points,w,h,padding=42){const b=bounds(points),rw=Math.max(b.maxX-b.minX,25),rh=Math.max(b.maxY-b.minY,25),sc=Math.min((w-2*padding)/rw,(h-2*padding)/rh,5);return pt=>({x:w/2+(pt.x-(b.minX+b.maxX)/2)*sc,y:h/2-(pt.y-(b.minY+b.maxY)/2)*sc});}
function drawProfile(id,fractions,labels=false){
 const canvas=canvas2d(id);if(!canvas)return;const {ctx,w,h}=canvas;drawGrid(ctx,w,h);
 const p=profile(piece,fractions),map=fit(p.points,w,h,43),pts=p.points.map(map);
 line(ctx,pts,'#9ab3c5',Math.max(6,piece.thickness+5));line(ctx,pts,'#257fb6',Math.max(3,piece.thickness));
 ctx.fillStyle='#fff';ctx.strokeStyle='#1a79b1';ctx.lineWidth=2;
 for(let i=1;i<pts.length-1;i++){ctx.beginPath();ctx.arc(pts[i].x,pts[i].y,4,0,Math.PI*2);ctx.fill();ctx.stroke();}
 if(labels)for(let i=0;i<pts.length-1;i++){const x=(pts[i].x+pts[i+1].x)/2,y=(pts[i].y+pts[i+1].y)/2;text(ctx,numbers(piece.flanges[i],0),x,y-11,'#467187',11,'center');}
 if(labels)for(let i=1;i<pts.length-1;i++){const a=piece.angles[i-1];text(ctx,(a>0?'+':'')+numbers(a,0)+'°',pts[i].x+9,pts[i].y+18,a<0?'#ad5b36':'#267da9',11);}
 // Destacar los tramos geométricos conflictivos; no son contactos CAD de máquina.
 if(labels){
  const check=geometryReport(),segments=new Set();
  for(const warn of check.issues){
   if((warn.code==='final-cross'||warn.code==='final-clearance')&&warn.segments)
    for(const id of warn.segments)segments.add(id);
  }
  if(segments.size){
   ctx.save();ctx.setLineDash([7,4]);ctx.strokeStyle='#f3a248';ctx.lineWidth=4;
   for(const index of segments){
    const a=pts[index],b=pts[index+1];if(!a||!b)continue;
    ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(b.x,b.y);ctx.stroke();
   }
   ctx.restore();
   text(ctx,'⚠ Revisar tramos señalados · comprobación 2D',12,h-12,'#f0b569',11);
  }
 }
 if(labels&&touchOrderEnabled){
  for(let i=1;i<pts.length-1;i++){
   const index=chosenTouchOrder.indexOf(i-1),selected=index>=0,pt=pts[i];
   ctx.save();ctx.beginPath();ctx.arc(pt.x,pt.y,13,0,Math.PI*2);
   ctx.fillStyle=selected?'#1787c8':'#ffc155';ctx.fill();
   ctx.strokeStyle=selected?'#bef0ff':'#8f5b17';ctx.lineWidth=2;ctx.stroke();
   ctx.font='900 12px system-ui';ctx.textAlign='center';ctx.textBaseline='middle';
   ctx.fillStyle=selected?'#fff':'#37200a';ctx.fillText(selected?String(index+1):String(i),pt.x,pt.y);
   ctx.restore();
  }
 }
 if(!labels)text(ctx,'PIEZA EN PROCESO',14,23,'#8095a4',11);
}
function drawMachine(){
 const can=canvas2d('machineCanvas');
 if(!can)return;
 drawIndustrialMachine(can.ctx,can.w,can.h,piece,sim,machineView);
}

function drawScene(){
 const can=canvas2d('sceneCanvas');if(!can)return;const {ctx,w,h}=can;drawGrid(ctx,w,h,36);
 // El modelo 3D usa exactamente las fracciones de la secuencia animada.
  // Antes se dibujaba siempre la pieza FINAL, incluso en el instante cero.
  const st=stage(piece,sim.time),pts=profile(piece,st.fractions).points,b=bounds(pts),midX=(b.minX+b.maxX)/2,midY=(b.minY+b.maxY)/2;
 const d=Math.min(piece.width,1500),yaw=camera.yaw,pitch=camera.pitch;
 function coords(x,y,z){const xx=x-midX,yy=y-midY,zz=z;const rX=xx*Math.cos(yaw)-zz*Math.sin(yaw),depth=xx*Math.sin(yaw)+zz*Math.cos(yaw);
 return {x:rX,y:yy*Math.cos(pitch)-depth*Math.sin(pitch),depth:yy*Math.sin(pitch)+depth*Math.cos(pitch)};}
 const faces=[];
 for(let i=0;i<pts.length-1;i++){const a=pts[i],bb=pts[i+1],z=d/2;const corners=[coords(a.x,a.y,-z),coords(bb.x,bb.y,-z),coords(bb.x,bb.y,z),coords(a.x,a.y,z)];faces.push({corners,depth:corners.reduce((v,p)=>v+p.depth,0)/4,index:i});}
 const all=faces.flatMap(f=>f.corners),bound=bounds(all),width=bound.maxX-bound.minX||1,height=bound.maxY-bound.minY||1;
 const sc=Math.min((w-75)/width,(h-65)/height,7)*camera.zoom,offX=(bound.minX+bound.maxX)/2,offY=(bound.minY+bound.maxY)/2;
 const project=p=>({x:w/2+(p.x-offX)*sc,y:h/2-(p.y-offY)*sc});
 faces.sort((a,b)=>a.depth-b.depth);
 for(const f of faces){
   const corners=f.corners.map(project);
   const xs=corners.map(p=>p.x),ys=corners.map(p=>p.y);
   const left=Math.min(...xs),right=Math.max(...xs),top=Math.min(...ys),bottom=Math.max(...ys);
   ctx.save();ctx.shadowColor='#000a';ctx.shadowBlur=10;ctx.shadowOffsetY=4;
   ctx.beginPath();corners.forEach((p,i)=>i?ctx.lineTo(p.x,p.y):ctx.moveTo(p.x,p.y));ctx.closePath();
   const steel=ctx.createLinearGradient(left,top,right,bottom);
   steel.addColorStop(0,f.index%2?'#e2eef5':'#b7c8d5');
   steel.addColorStop(.18,'#a8bdcd');
   steel.addColorStop(.42,f.index%2?'#456980':'#668ca2');
   steel.addColorStop(.69,'#c7d9e5');
   steel.addColorStop(1,'#38556b');
   ctx.fillStyle=steel;ctx.fill();ctx.shadowBlur=0;ctx.lineWidth=1.4;
   ctx.strokeStyle='#dceefa';ctx.stroke();ctx.restore();
 }
 for(const z of [-d/2,d/2]){
  const edge=pts.map(pt=>project(coords(pt.x,pt.y,z)));
  line(ctx,edge,'#183c55',5);
  line(ctx,edge,'#e7f3f8',1.25);
 }
 const sceneLabel=st.completed?'PIEZA FINAL 3D · gira con el dedo':
   st.finished===0&&st.phase==='Posicionamiento'?'CHAPA PLANA · VISTA 3D':
   'PIEZA EN PROCESO 3D · GOLPE '+(st.activeOperation+1)+' / '+st.count;
  text(ctx,sceneLabel,15,23,'#8ac7f6',12);text(ctx,'Anchura: '+numbers(piece.width,0)+' mm',w-14,h-15,'#648299',11,'right');
}
function toolDrawing(){
 const can=canvas2d('toolCanvas');if(!can)return;
 const {ctx,w,h}=can;drawGrid(ctx,w,h,36);
 const {die,punch}=getTooling(piece);
 // La ficha y la vista de máquina comparten los mismos perfiles paramétricos.
 const punchSection=sectionPunch(punch),dieSection=sectionDie(die);
 const pPts=punchSection.points.map(([x,y])=>({x,y:y+14}));
 const dPts=dieSection.points.map(([x,y])=>({x,y:y-dieSection.height}));
 const all=[...pPts,...dPts],bb=bounds(all),spanX=Math.max(25,bb.maxX-bb.minX),
       spanY=Math.max(80,bb.maxY-bb.minY);
 const scale=Math.min((w-36)/spanX,(h-56)/spanY,3),
       mx=(bb.minX+bb.maxX)/2,my=(bb.minY+bb.maxY)/2;
 const pt=q=>({x:w/2+(q.x-mx)*scale,y:h/2-(q.y-my)*scale});
 function drawPolygon(pts,fill,stroke){
  const projected=pts.map(pt);
  ctx.save();ctx.shadowBlur=8;ctx.shadowColor='#0008';
  ctx.beginPath();projected.forEach((q,i)=>i?ctx.lineTo(q.x,q.y):ctx.moveTo(q.x,q.y));
  ctx.closePath();
  const grad=ctx.createLinearGradient(w*.33,0,w*.67,0);
  grad.addColorStop(0,fill);grad.addColorStop(.43,'#dceaf1');grad.addColorStop(.7,fill);
  ctx.fillStyle=grad;ctx.fill();ctx.strokeStyle=stroke;ctx.lineWidth=1.2;ctx.stroke();
  ctx.restore();
 }
 drawPolygon(dPts,'#587c91','#b6e8ff');
 drawPolygon(pPts,'#849bac','#d7f1ff');
 const vLeft=pt({x:-die.opening/2,y:0}),vRight=pt({x:die.opening/2,y:0});
 line(ctx,[{x:vLeft.x,y:vLeft.y-8},{x:vRight.x,y:vRight.y-8}],'#e1a24e',2);
 text(ctx,'V'+die.opening+' / '+die.angle+'°',w/2,h-11,'#8bd3ff',12,'center');
 text(ctx,punch.name,10,18,'#9ecfee',12);
 text(ctx,'MODELO PARAMÉTRICO · NO CAD',w-9,18,'#c49b65',9,'right');
}
/**
 * Cada ficha de la biblioteca usa la MISMA sección del útil que la máquina,
 * la cabina y el inspector orbital. No confundir "ficha documentada" con
 * polígono CAD completo: los perfiles actuales siguen siendo provisionales.
 */
function toolCardPreview(tool,kind){
 const section=kind==='punch'?sectionPunch(tool):sectionDie(tool);
 const pts=section.points;
 const xs=pts.map(p=>p[0]),ys=pts.map(p=>p[1]);
 const minX=Math.min(...xs),maxX=Math.max(...xs),minY=Math.min(...ys),maxY=Math.max(...ys);
 const padX=Math.max(3,(maxX-minX)*.12),padY=Math.max(3,(maxY-minY)*.09);
 const svg=document.createElementNS('http://www.w3.org/2000/svg','svg');
 svg.setAttribute('class','tool-geometry');
 svg.setAttribute('viewBox',[minX-padX,-maxY-padY,maxX-minX+padX*2,maxY-minY+padY*2].join(' '));
 svg.setAttribute('preserveAspectRatio','xMidYMid meet');
 svg.setAttribute('aria-hidden','true');
 const path=document.createElementNS('http://www.w3.org/2000/svg','path');
 path.setAttribute('d',pts.map(([x,y],i)=>(i?'L':'M')+x.toFixed(3)+' '+(-y).toFixed(3)).join(' ')+' Z');
 path.setAttribute('fill',kind==='punch'?'#86b6d1':'#688fa8');
 path.setAttribute('stroke','#e4f7ff');
 path.setAttribute('stroke-width',String(Math.max(.4,Math.min(1.5,(maxX-minX)/55))));
 path.setAttribute('stroke-linejoin','round');
 svg.append(path);
 return svg;
}
function toolCard(tool,kind){
 const selected=kind==='punch'?piece.punch===tool.id:piece.die===tool.id;
 const button=document.createElement('button');
 button.type='button';
 button.className='tool'+(selected?' selected':'');
 button.dataset.toolId=tool.id;
 button.dataset.toolKind=kind;
 button.setAttribute('aria-pressed',String(selected));
 button.setAttribute('aria-label',(kind==='punch'?'Elegir punzón ':'Elegir matriz ')+
  (tool.reference||tool.name));
 const image=toolCardPreview(tool,kind);
 const title=document.createElement('b');title.textContent=tool.reference||tool.name;
 const meta=document.createElement('span');meta.className='tool-card-measure';
 meta.textContent=kind==='punch'?
  tool.angle+'° · R'+numbers((Number(tool.tip)||0)/2,2)+' · H'+tool.height+' mm'+(tool.type==='cabra'?' · Pata de cabra':''):
  'V'+tool.opening+' · '+tool.angle+'°'+
  (tool.shoulderRadius?' · R'+numbers(tool.shoulderRadius,2):'')+
  ' · H'+tool.height+' mm';
 const brand=document.createElement('span');brand.className='tool-card-brand';
 brand.textContent=tool.manufacturer||'Genérico';
 const notice=document.createElement('span');notice.className='tool-card-notice';
 notice.textContent='Contorno provisional · no CAD';
 button.append(image,title,meta,brand,notice);
 button.onclick=()=>changePiece({...piece,[kind==='punch'?'punch':'die']:tool.id},true);
 return button;
}
function renderToolCards(){
 const dies=$('dieCards'),punches=$('punchCards');
 dies.replaceChildren(...DIES.map(d=>toolCard(d,'die')));
 punches.replaceChildren(...PUNCHES.map(p=>toolCard(p,'punch')));
}
function renderDevelopment(){
 const d=development(piece),check=geometryReport(),force=estimateAirBendForce(piece);
 const items=[['Nominal',d.nominal,'mm'],['Desarrollo',d.length,'mm'],
  ['Deducción total',d.totalBD,'mm'],['Radio interior',d.radius,'mm'],
  ['Fuerza aire aprox.',force.tonneForce,'t'],
  ['Carga lineal aprox.',force.kNPerMetre,'kN/m']];
 $('devSummary').replaceChildren(...items.map(([name,val,unit])=>{
  const el=document.createElement('div');el.className='result-item';
  const b=document.createElement('b');b.textContent=Number.isFinite(val)?numbers(val,2)+' '+unit:'—';
  const s=document.createElement('span');s.textContent=name;el.append(b,s);return el;
 }));
 const notes=[
  'Rm '+numbers(force.rmMPa,0)+' MPa ('+(force.materialReference?'SUPUESTA de referencia':'introducida')+')',
  'V'+numbers(force.opening,1)+' · espesor '+numbers(force.thickness,2)+' mm · longitud '+numbers(force.width,0)+' mm',
  force.conventionalAirBend90?'Referencia de aire a 90°':'FUERA del método típico de aire 90°',
  force.exceedsNominal?'⚠ Supera las '+numbers(force.nominalCapacity,0)+' t nominales de V85':
   'Comparación con '+numbers(force.nominalCapacity,0)+' t nominales; NO certifica la operación',
  'Verificar carga por metro y límites de todas las herramientas.'
 ].join(' · ');
 if($('forceDetails').textContent!==notes)$('forceDetails').textContent=notes;
 $('forceDetails').style.color=force.exceedsNominal?'#ffbd90':'';

 $('devRows').replaceChildren(...d.perBend.map(b=>{const tr=document.createElement('tr');for(const val of [b.index+1,(b.angle>0?'+':'')+b.angle+'°',numbers(b.ba,2),numbers(b.bd,2)]){const td=document.createElement('td');td.textContent=val;tr.append(td);}return tr;}));
 const out=[['Alas',piece.flanges.length],['Pliegues',piece.angles.length],['L. nominal',numbers(d.nominal,1)+' mm']];
 $('geometrySummary').replaceChildren(...out.map(([name,val])=>{const e=document.createElement('div');e.className='stat';const b=document.createElement('b');b.textContent=String(val);const s=document.createElement('span');s.textContent=name;e.append(b,s);return e;}));
 $('validity').textContent=check.hasGeometryWarning?'Revisar geometría 2D':'Perfil calculado · sin validación física';
 $('validity').style.background=check.hasGeometryWarning?'#5b351b':'#173c54';
 $('validity').style.color=check.hasGeometryWarning?'#ffd89c':'#b9e5ff';
}
function renderSimulationText(){
 const st=stage(piece,sim.time),a=piece.angles[st.activeBend],check=geometryReport(),toolNow=currentToolContact(piece,sim.time);
 $('simStatus').textContent=st.phase;
 $('phaseText').textContent=st.completed?'Pieza final · secuencia completada':st.phase+' · pliegue '+(st.activeBend+1)+' ('+(a>0?'+':'')+a+'°)';
 $('stepText').textContent='Golpe '+st.finished+'/'+st.count;
 $('foldedCount').textContent=st.finished+' de '+st.count+' pliegues';
 $('timeline').value=Math.round(1000*st.time/st.duration);
 const root=$('simSequence');
 const key=JSON.stringify({order:piece.order,angles:piece.angles,flanges:piece.flanges,issues:check.perOperation.map((x,i)=>x.potentialInterference||x.toolAngleWarning||x.vSupportWarning||check.tools.operations[i]?.possibleToolInterference)});
 if(root.dataset.key!==key){
   root.dataset.key=key;
   root.replaceChildren(...piece.order.map((bend,i)=>{
     const el=document.createElement('button');
     el.type='button';el.className='op';el.dataset.step=String(i);
     el.setAttribute('aria-label','Ver golpe '+(i+1)+' · pliegue '+(bend+1));
     const n=document.createElement('span');n.className='op-num';n.textContent=String(i+1);
     const visual=document.createElement('span');visual.className='op-preview';
     const angle=piece.angles[bend];
     visual.innerHTML='<svg viewBox="0 0 70 52" aria-hidden="true" focusable="false"><defs><linearGradient id="pgrad'+i+'" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#e8f6ff"/><stop offset=".45" stop-color="#7897ae"/><stop offset="1" stop-color="#3f566b"/></linearGradient></defs><path d="'+(angle<0?'M8 13 L8 40 L61 40':'M8 40 L61 40 L61 12')+'" stroke="url(#pgrad'+i+')" stroke-width="9" stroke-linejoin="round" fill="none"/><path d="'+(angle<0?'M8 13 L8 40 L61 40':'M8 40 L61 40 L61 12')+'" stroke="#a9e4ff" stroke-width="1.5" fill="none"/></svg>';
     const values=document.createElement('span');values.className='op-values';
     const a=document.createElement('strong');a.textContent=(angle>0?'+':'')+angle+'°';
     const l=document.createElement('small');l.textContent='L = '+numbers(piece.flanges[bend+1],1)+' mm';
     values.append(a,l);const menu=document.createElement('span');menu.className='op-more';menu.textContent='⋮';
     if(check.perOperation[i]?.potentialInterference||check.perOperation[i]?.toolAngleWarning||check.perOperation[i]?.vSupportWarning||check.tools.operations[i]?.possibleToolInterference){
       el.classList.add('suspect');el.title=check.perOperation[i]?.toolAngleWarning?
          'Revisar apertura nominal de punzón/matriz para este ángulo':
          check.perOperation[i]?.vSupportWarning?
           'Revisar ala mínima y hombros de la V':
           'Posible interferencia geométrica 2D: comprobar antes de plegar';
       const mark=document.createElement('span');mark.className='op-alert';mark.textContent='!';mark.setAttribute('aria-label','Advertencia geométrica');values.append(mark);
     }
     el.append(n,visual,values,menu);
     el.addEventListener('click',()=>{sim.playing=false;sim.last=null;sim.time=i*5;paintAll();});
     return el;
   }));
 }
 for(const el of root.children){
  const i=Number(el.dataset.step),bend=piece.order[i];
  el.classList.toggle('done',st.fractions[bend]>=1-1e-6);
  el.classList.toggle('current',!st.completed&&i===st.activeOperation);
  el.setAttribute('aria-current',String(!st.completed&&i===st.activeOperation));
 }
 const details=$('collisionDetails');
 if(details){
   const active=check.issues.filter(x=>x.bend===st.activeBend);
   const main=active.length?active[0].message:check.summary;
   const other=check.issues.filter(x=>x.code!=='provisional-tools'&&x.bend==null).slice(0,1).map(x=>x.message);
   const toolStep=check.tools.operations[st.activeOperation];
   const currentIssue=toolNow.issues[0];
   const toolWarning=currentIssue?describeToolIssue(currentIssue):
     toolStep?.possibleToolInterference?
       '⚠ En este golpe aparecen posibles interferencias con herramientas en otras posiciones.':
       describeToolIssue(null);
   const messages=[toolWarning,main,...other];
   const signature=JSON.stringify(messages);
   if(details.dataset.signature!==signature){
     details.dataset.signature=signature;
     details.replaceChildren(...messages.map((m,i)=>{const line=document.createElement('p');line.textContent=(i?'• ':'')+m;return line;}));
     details.title=check.limitations;
   }
   details.classList.toggle('has-warning',check.hasGeometryWarning||toolNow.hasWarning||!!toolStep?.possibleToolInterference);
 }
}
function paintAll(){drawProfile('finalCanvas',piece.angles.map(()=>1),true);drawMachine();drawProfile('progressCanvas',stage(piece,sim.time).fractions,false);drawScene();toolDrawing();renderDevelopment();renderToolCards();renderSimulationText();}
function tick(now){
 if(sim.playing){if(sim.last!=null){const dt=Math.min((now-sim.last)/1000,.12)*sim.speed;sim.time+=dt;if(sim.time>=piece.order.length*5){sim.time=0;sim.last=null;}}sim.last=now;drawMachine();drawProfile('progressCanvas',stage(piece,sim.time).fractions);drawScene();renderSimulationText();}
 requestAnimationFrame(tick);
}
configure();
window.PLEGADOX_STATE=()=>({piece,sim});
window.PLEGADOX_MACHINE_VIEW=machineView;
window.PLEGADOX_REDRAW=()=>paintAll();
