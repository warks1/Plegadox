import {MATERIALS,DIES,PUNCHES,EXAMPLE,normalized,profile,bounds,development,stage,orientedForMachine,getTooling,selfIntersects,clamp,finite} from './engine.js';
import {drawIndustrialMachine} from './machine-visual.js';
import {registerCatalogue} from './catalog.js';
registerCatalogue(DIES,PUNCHES);
const $=id=>document.getElementById(id);
const storeKey='plegadox:piece:v1';
let piece=restore();
let sim={playing:false,time:0,last:null,speed:1};
let camera={yaw:-.62,pitch:.45,zoom:1};
let machineView={panX:0,panY:0,zoom:1};
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
 $('newBtn').onclick=()=>changePiece({name:'Nueva pieza',flanges:[100,100],angles:[90],order:[0],material:'s235',thickness:2,width:500,die:'v16',punch:'straight88'},true);
 $('sampleBtn').onclick=()=>changePiece(EXAMPLE,true);
 $('addFlange').onclick=()=>{if(piece.flanges.length>=20)return;changePiece({...piece,flanges:[...piece.flanges,50],angles:[...piece.angles,90],order:[...piece.order,piece.angles.length]},true);};
 $('resetOrder').onclick=()=>changePiece({...piece,order:piece.angles.map((_,i)=>i)},true);
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
 if(!labels)text(ctx,'PIEZA EN PROCESO',14,23,'#8095a4',11);
}
function drawMachine(){
 const can=canvas2d('machineCanvas');
 if(!can)return;
 drawIndustrialMachine(can.ctx,can.w,can.h,piece,sim,machineView);
}

function drawScene(){
 const can=canvas2d('sceneCanvas');if(!can)return;const {ctx,w,h}=can;drawGrid(ctx,w,h,36);
 const st=stage(piece,sim.time),pts=profile(piece,piece.angles.map(()=>1)).points,b=bounds(pts),midX=(b.minX+b.maxX)/2,midY=(b.minY+b.maxY)/2;
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
 text(ctx,'PIEZA FINAL 3D · gira con el dedo',15,23,'#8ac7f6',12);text(ctx,'Anchura: '+numbers(piece.width,0)+' mm',w-14,h-15,'#648299',11,'right');
}
function toolDrawing(){
 const can=canvas2d('toolCanvas');if(!can)return;const {ctx,w,h}=can;drawGrid(ctx,w,h,36);
 const {die,punch}=getTooling(piece),scale=Math.min(h/220,w/260,2);
 const cx=w/2,cy=h*.54;
 const pt=(x,y)=>({x:cx+x*scale,y:cy-y*scale});
 function poly(arr,fill){ctx.beginPath();arr.map(([x,y])=>pt(x,y)).forEach((p,i)=>i?ctx.lineTo(p.x,p.y):ctx.moveTo(p.x,p.y));ctx.closePath();ctx.fillStyle=fill;ctx.fill();ctx.strokeStyle='#405e70';ctx.lineWidth=2;ctx.stroke();}
 poly([[-36,105],[36,105],[28,48],[punch.tip/2,4],[-punch.tip/2,4],[-28,48]],'#9db0bc');
 poly([[-65,-3],[-die.opening/2,-3],[0,-3-die.opening*.45],[die.opening/2,-3],[65,-3],[65,-40],[-65,-40]],'#657d8d');
 const a=pt(-die.opening/2,-2),b=pt(die.opening/2,-2);line(ctx,[{x:a.x,y:a.y-10},{x:b.x,y:b.y-10}],'#e1a24e',2);
 text(ctx,'V'+die.opening+' mm',cx,cy+70*scale,'#3a6e8d',14,'center');text(ctx,punch.name,cx,26,'#526e83',13,'center');
}
function renderToolCards(){
 const dies=$('dieCards');dies.replaceChildren(...DIES.map(d=>{const b=document.createElement('button');b.className='tool'+(d.id===piece.die?' selected':'');b.innerHTML='<b>'+d.name+'</b><span>Abertura '+d.opening+' mm</span>';b.onclick=()=>changePiece({...piece,die:d.id},true);return b;}));
 const punches=$('punchCards');punches.replaceChildren(...PUNCHES.map(p=>{const b=document.createElement('button');b.className='tool'+(p.id===piece.punch?' selected':'');b.innerHTML='<b>'+p.name+'</b><span>Altura nominal '+p.height+' mm</span>';b.onclick=()=>changePiece({...piece,punch:p.id},true);return b;}));
}
function renderDevelopment(){
 const d=development(piece),p=profile(piece,piece.angles.map(()=>1)),interference=selfIntersects(p.points);
 const items=[['Nominal',d.nominal],['Desarrollo',d.length],['Deducción total',d.totalBD],['Radio interior',d.radius]];
 $('devSummary').replaceChildren(...items.map(([name,val])=>{const el=document.createElement('div');el.className='result-item';const b=document.createElement('b');b.textContent=numbers(val,2)+' mm';const s=document.createElement('span');s.textContent=name;el.append(b,s);return el;}));
 $('devRows').replaceChildren(...d.perBend.map(b=>{const tr=document.createElement('tr');for(const val of [b.index+1,(b.angle>0?'+':'')+b.angle+'°',numbers(b.ba,2),numbers(b.bd,2)]){const td=document.createElement('td');td.textContent=val;tr.append(td);}return tr;}));
 const out=[['Alas',piece.flanges.length],['Pliegues',piece.angles.length],['L. nominal',numbers(d.nominal,1)+' mm']];
 $('geometrySummary').replaceChildren(...out.map(([name,val])=>{const e=document.createElement('div');e.className='stat';const b=document.createElement('b');b.textContent=String(val);const s=document.createElement('span');s.textContent=name;e.append(b,s);return e;}));
 $('validity').textContent=interference?'Revisar cruces':'Geometría calculada';
 $('validity').style.background=interference?'#fff1df':'#e6f5ef';
}
function renderSimulationText(){
 const st=stage(piece,sim.time),a=piece.angles[st.activeBend];
 $('simStatus').textContent=st.phase;
 $('phaseText').textContent=st.completed?'Pieza final · secuencia completada':st.phase+' · pliegue '+(st.activeBend+1)+' ('+(a>0?'+':'')+a+'°)';
 $('stepText').textContent='Golpe '+st.finished+'/'+st.count;
 $('foldedCount').textContent=st.finished+' de '+st.count+' pliegues';
 $('timeline').value=Math.round(1000*st.time/st.duration);
 const root=$('simSequence');
 const key=JSON.stringify({order:piece.order,angles:piece.angles,flanges:piece.flanges});
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
