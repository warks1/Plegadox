// Vista de cabina: boceto 2. La información industrial documentada
// se distingue de los perfiles tridimensionales aproximados.
import {DIES,PUNCHES,MATERIALS,normalized,development,stage,getTooling} from './engine.js';
import {CATALOG_SOURCES,toolMatchesBrand,selectionCompatibility} from './catalog.js';
const $=id=>document.getElementById(id);
const state={brand:'Trumpf',kind:'punch',search:'',selectedTool:null,yaw:-.6,pitch:.34,zoom:1};
const format=(n,d=1)=>Number(n).toLocaleString('es-ES',{minimumFractionDigits:d,maximumFractionDigits:d});
function current(){const s=window.PLEGADOX_STATE?.();if(s)return s;let p=null;try{p=JSON.parse(localStorage.getItem('plegadox:piece:v1'));}catch{}return {piece:normalized(p),sim:{time:0}};}
const kindList=()=>state.kind==='punch'?PUNCHES:DIES;
function filtered(){return kindList().filter(t=>toolMatchesBrand(t,state.brand)&&(!state.search||[t.name,t.reference,t.id,t.mount,t.angle,t.opening,t.height].join(' ').toLowerCase().includes(state.search)));}
function toolPicked(tool){
 const sel=$(state.kind==='punch'?'punch':'die');
 if(sel){sel.value=tool.id;sel.dispatchEvent(new Event('change',{bubbles:true}));}
 state.selectedTool=tool.id;renderCatalogue();refresh();
}
function renderCatalogue(){
 const p=current().piece,selected=state.kind==='punch'?p.punch:p.die;
 for(const b of document.querySelectorAll('#cpBrandTabs button')){b.classList.toggle('selected',b.dataset.brand===state.brand);b.setAttribute('aria-pressed',String(b.dataset.brand===state.brand));}
 for(const b of document.querySelectorAll('.cp-kind-tabs button')){b.classList.toggle('selected',b.dataset.kind===state.kind);b.setAttribute('aria-pressed',String(b.dataset.kind===state.kind));}
 const list=filtered();$('cpCatalogCount').textContent=list.length+' referencias';
 const container=$('cockpitTools');container.replaceChildren();
 for(const tool of list){
   const b=document.createElement('button');b.type='button';b.className='cp-tool-card'+(selected===tool.id?' selected':'');
   b.title=(tool.reference||tool.name)+(tool.verifiedSpecs?' · Especificaciones verificadas':' · Modelo provisional');
   const canvas=document.createElement('canvas');canvas.setAttribute('aria-hidden','true');
   const title=document.createElement('b');title.textContent=tool.reference||tool.name;
   const detail=document.createElement('small');detail.textContent=state.kind==='punch'?tool.angle+'° · R'+tool.tip+' · H'+tool.height:'V'+tool.opening+' · '+tool.angle+'° · H'+tool.height;
   const flag=document.createElement('em');flag.textContent=tool.verifiedSpecs?'Ficha documentada':'Geometría provisional';
   b.append(canvas,title,detail,flag);b.onclick=()=>toolPicked(tool);
   container.append(b);drawThumbnail(canvas,tool,state.kind);
 }
 if(!list.length){const msg=document.createElement('p');msg.className='hint';msg.textContent='No hay referencias que coincidan con la búsqueda. Prueba otro fabricante o término.';container.append(msg);}
 const chosen=kindList().find(t=>t.id===selected)||null;
 const shown=kindList().find(t=>t.id===state.selectedTool)||chosen;
 const info=$('cockpitToolInfo');info.replaceChildren();
 if(shown){
   const name=document.createElement('b');name.textContent=shown.name;info.append(name);
   const detail=document.createElement('div');detail.textContent=[shown.manufacturer||'Genérico',shown.mount||'Amarre por verificar',shown.length?'Longitud nominal: '+shown.length+' mm':'Longitud no registrada',shown.verifiedSpecs?'Datos parciales publicados':'Dimensiones no verificadas'].join(' · ');info.append(detail);
   const note=document.createElement('div');note.textContent='Perfil 2D/3D: PARAMÉTRICO, pendiente de cotas completas para comprobación de colisiones.';info.append(note);
   if(shown.source&&CATALOG_SOURCES[shown.source]?.url){const a=document.createElement('a');a.href=CATALOG_SOURCES[shown.source].url;a.target='_blank';a.rel='noreferrer noopener';a.textContent='Consultar fuente técnica';a.style.cssText='display:inline-block;color:#41c4ff;text-decoration:underline;margin-top:5px';info.append(a);}
 }
 drawToolViewer();
}
function shape(tool,kind){
 // Silueta orientativa de sección transversal, NO un CAD de fabricante.
 if(kind==='die'){
   const w=Math.max(32,(tool.opening||16)*2.2),h=62,v=(tool.opening||16)*.78;
   const half=(tool.opening||16)/2;
   return [[-w/2,h/2],[-half,h/2],[0,h/2-v*.58],[half,h/2],[w/2,h/2],[w/2,-h/2],[-w/2,-h/2]];
 }
 const height=88,tip=(tool.tip||1)/2;
 if(tool.type==='cabra'){
   return [[-25,44],[20,44],[20,30],[-4,30],[-4,12],[21,12],[21,-13],[8,-13],[4,-26],[tip,-44],[-tip,-44],[-7,-29],[-11,-15],[-25,-15],[-25,-2],[-8,5],[-25,21]];
 }
 if(tool.angle<=45){
   return [[-22,44],[22,44],[22,15],[9,-16],[tip,-44],[-tip,-44],[-9,-16],[-22,15]];
 }
 return [[-22,44],[22,44],[22,14],[16,-5],[tip,-44],[-tip,-44],[-16,-5],[-22,14]];
}
function drawThumbnail(canvas,tool,kind){
 const w=canvas.clientWidth||100,h=canvas.clientHeight||60,d=Math.min(2,devicePixelRatio||1);
 canvas.width=Math.round(w*d);canvas.height=Math.round(h*d);
 const ctx=canvas.getContext('2d');ctx.setTransform(d,0,0,d,0,0);
 const silhouette=shape(tool,kind),maxX=Math.max(...silhouette.map(p=>Math.abs(p[0]))),maxY=Math.max(...silhouette.map(p=>Math.abs(p[1])));
 const scale=Math.min((w-20)/(maxX*2),(h-9)/(maxY*2));
 const xy=([x,y])=>({x:w/2+x*scale,y:h/2-y*scale});
 ctx.shadowBlur=10;ctx.shadowColor='#31a8fe44';
 const g=ctx.createLinearGradient(0,0,w,h);g.addColorStop(0,'#f1f7fd');g.addColorStop(.25,'#8bafc7');g.addColorStop(.6,'#53748c');g.addColorStop(1,'#d4e3eb');
 ctx.beginPath();silhouette.forEach((p,i)=>{const q=xy(p);i?ctx.lineTo(q.x,q.y):ctx.moveTo(q.x,q.y);});ctx.closePath();ctx.fillStyle=g;ctx.fill();ctx.shadowBlur=0;ctx.strokeStyle='#a8d8f8';ctx.lineWidth=1.2;ctx.stroke();
}
function drawToolViewer(){
 let canvas=$('cockpitSelectedTool3D');
 if(!canvas){const wrap=document.createElement('div');wrap.className='cp-viewer-wrap';const header=document.createElement('div');header.className='cp-viewer-header';header.textContent='VISTA 3D DE LA HERRAMIENTA · GIRAR / ZOOM';canvas=document.createElement('canvas');canvas.id='cockpitSelectedTool3D';canvas.className='cp-3d-viewer';canvas.style.cssText='width:100%;height:170px;display:block;background:radial-gradient(ellipse,#153b59,#061626);border:1px solid #1b4968;border-radius:8px;touch-action:none';wrap.append(header,canvas);$('cockpitToolInfo').after(wrap);attachViewer(canvas);}
 const p=current().piece,tool=state.kind==='punch'?PUNCHES.find(t=>t.id===p.punch):DIES.find(t=>t.id===p.die);
 if(!tool)return;
 const w=canvas.clientWidth||260,h=canvas.clientHeight||170,d=Math.min(devicePixelRatio||1,2);canvas.width=Math.round(w*d);canvas.height=Math.round(h*d);
 const ctx=canvas.getContext('2d');ctx.setTransform(d,0,0,d,0,0);ctx.clearRect(0,0,w,h);
 const polygon=shape(tool,state.kind),depth=65;
 const project=(point)=>{
   const [xx,yy,zz]=point;
   const yaw=state.yaw,pitch=state.pitch;
   const x=xx*Math.cos(yaw)-zz*Math.sin(yaw),z=xx*Math.sin(yaw)+zz*Math.cos(yaw);
   return {x,y:yy*Math.cos(pitch)-z*Math.sin(pitch),z:yy*Math.sin(pitch)+z*Math.cos(pitch)};
 };
 const vertices=polygon.flatMap(([x,y])=>[project([x,y,-depth/2]),project([x,y,depth/2])]);
 const minX=Math.min(...vertices.map(v=>v.x)),maxX=Math.max(...vertices.map(v=>v.x)),minY=Math.min(...vertices.map(v=>v.y)),maxY=Math.max(...vertices.map(v=>v.y));
 const scale=Math.min((w-36)/Math.max(1,maxX-minX),(h-30)/Math.max(1,maxY-minY))*state.zoom;
 const pt=q=>({x:w/2+(q.x-(minX+maxX)/2)*scale,y:h/2-(q.y-(minY+maxY)/2)*scale});
 const faces=[];
 for(let i=0;i<polygon.length;i++){
   const j=(i+1)%polygon.length;
   const a=polygon[i],b=polygon[j];
   const vv=[project([a[0],a[1],-depth/2]),project([b[0],b[1],-depth/2]),project([b[0],b[1],depth/2]),project([a[0],a[1],depth/2])];
   faces.push({vv,depth:vv.reduce((s,p)=>s+p.z,0)/4,side:true});
 }
 for(const side of [-depth/2,depth/2]){const vv=polygon.map(([x,y])=>project([x,y,side]));faces.push({vv,depth:vv.reduce((s,p)=>s+p.z,0)/vv.length,side:false});}
 faces.sort((a,b)=>a.depth-b.depth);
 for(const f of faces){ctx.beginPath();f.vv.map(pt).forEach((v,i)=>i?ctx.lineTo(v.x,v.y):ctx.moveTo(v.x,v.y));ctx.closePath();const fill=ctx.createLinearGradient(0,30,w,h-25);if(f.side){fill.addColorStop(0,'#a5bbca');fill.addColorStop(.5,'#4c7089');fill.addColorStop(1,'#d3e3eb');}else{fill.addColorStop(0,'#e1eef5');fill.addColorStop(.5,'#88a9bc');fill.addColorStop(1,'#577e98');}ctx.fillStyle=fill;ctx.fill();ctx.strokeStyle='#a8cadd';ctx.lineWidth=.8;ctx.stroke();}
 ctx.font='10px system-ui';ctx.fillStyle='#81a8c4';ctx.fillText('Modelo paramétrico · no CAD de fábrica',9,h-8);
}
function attachViewer(canvas){
 const points=new Map();let lastDistance=0;
 canvas.addEventListener('pointerdown',e=>{canvas.setPointerCapture(e.pointerId);points.set(e.pointerId,{x:e.clientX,y:e.clientY});});
 canvas.addEventListener('pointermove',e=>{if(!points.has(e.pointerId))return;const p=points.get(e.pointerId);points.set(e.pointerId,{x:e.clientX,y:e.clientY});
 if(points.size===1){state.yaw+=(e.clientX-p.x)*.012;state.pitch=Math.max(-1.2,Math.min(1.2,state.pitch+(e.clientY-p.y)*.009));}
 else if(points.size===2){const xy=[...points.values()],dist=Math.hypot(xy[0].x-xy[1].x,xy[0].y-xy[1].y);if(lastDistance)state.zoom=Math.max(.3,Math.min(4,state.zoom*dist/lastDistance));lastDistance=dist;}
 drawToolViewer();});
 for(const name of ['pointerup','pointercancel','lostpointercapture'])canvas.addEventListener(name,e=>{points.delete(e.pointerId);lastDistance=0;});
 canvas.addEventListener('wheel',e=>{e.preventDefault();state.zoom=Math.max(.3,Math.min(4,state.zoom*Math.exp(-e.deltaY*.002)));drawToolViewer();},{passive:false});
}
function refresh(){
 const {piece,sim}=current(),st=stage(piece,sim.time),data=development(piece),{die,punch,material}=getTooling(piece);
 const top=[['cockpitPieceName',piece.name],['cockpitMaterial',material.name],['cockpitThickness',format(piece.thickness,2)+' mm'],['cockpitAngle',(piece.angles[st.activeBend]>0?'+':'')+piece.angles[st.activeBend]+'°'],['cockpitDie',die.name],['cpPunchLabel','Punzón: '+punch.name],['cpDieLabel','Matriz: '+die.name],['cpCurrentAngle',(piece.angles[st.activeBend]>0?'+':'')+piece.angles[st.activeBend]+'°']];
 for(const [id,value] of top)if($(id)&&$(id).textContent!==value)$(id).textContent=value;
 const ready=$('cockpitReady');ready.textContent=st.completed?'● Pieza simulada':'● '+st.phase;
 const comp=selectionCompatibility(punch,die),msg=comp.reason+(punch.profileAccuracy==='provisional'||die.profileAccuracy==='provisional'?' · Geometría paramétrica no validada':'');
 if($('cockpitCompatibility').textContent!==msg)$('cockpitCompatibility').textContent=msg;
 const results=[['Desarrollo estimado',format(data.length,2)+' mm'],['Radio interior aprox.',format(data.radius,2)+' mm'],['Pliegues realizados',st.finished+' / '+st.count],['Ángulo de operación',(piece.angles[st.activeBend]>0?'+':'')+piece.angles[st.activeBend]+'°']];
 const box=$('cockpitResults');if(box.dataset.key!==JSON.stringify(results)){box.dataset.key=JSON.stringify(results);box.replaceChildren(...results.map(([label,value])=>{const row=document.createElement('div');row.className='cp-result-line';const a=document.createElement('span');a.textContent=label;const b=document.createElement('strong');b.textContent=value;row.append(a,b);return row;}));}
}
function init(){
 if(!$('cockpitTools'))return;
 for(const button of document.querySelectorAll('#cpBrandTabs button'))button.addEventListener('click',()=>{state.brand=button.dataset.brand;state.selectedTool=null;renderCatalogue();});
 for(const button of document.querySelectorAll('.cp-kind-tabs button'))button.addEventListener('click',()=>{state.kind=button.dataset.kind;state.selectedTool=null;renderCatalogue();});
 $('cpToolSearch').addEventListener('input',e=>{state.search=e.target.value.trim().toLowerCase();renderCatalogue();});
 for(const [id,tab] of [['jumpToProgramming','programacion'],['jumpToDevelopment','desarrollo']])$(id).addEventListener('click',()=>document.querySelector('[data-tab="'+tab+'"]').click());
 window.addEventListener('plegadox:pieceChanged',()=>{renderCatalogue();refresh();});
 window.addEventListener('resize',()=>renderCatalogue());
 renderCatalogue();refresh();
 let prev=0;function animate(t){if(t-prev>130){refresh();prev=t;}requestAnimationFrame(animate);}requestAnimationFrame(animate);
}
init();
