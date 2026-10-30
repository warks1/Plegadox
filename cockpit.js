// Vista de cabina: boceto 2. La información industrial documentada
// se distingue de los perfiles tridimensionales aproximados.
import {DIES,PUNCHES,MATERIALS,normalized,development,stage,getTooling} from './engine.js';
import {CATALOG_SOURCES,toolMatchesBrand,selectionCompatibility} from './catalog.js';
import {sectionPunch,sectionDie} from './tool-profiles.js';
const $=id=>document.getElementById(id);
const state={brand:'Todos',kind:'all',search:'',selectedTool:null,selectedToolKind:'punch',showAll:false,yaw:-.6,pitch:.34,zoom:1};
const format=(n,d=1)=>Number(n).toLocaleString('es-ES',{minimumFractionDigits:d,maximumFractionDigits:d});
function current(){const s=window.PLEGADOX_STATE?.();if(s)return s;let p=null;try{p=JSON.parse(localStorage.getItem('plegadox:piece:v1'));}catch{}return {piece:normalized(p),sim:{time:0}};}
const kindList=()=>{
 const punches=PUNCHES.map(tool=>({...tool,uiKind:'punch'}));
 const dies=DIES.map(tool=>({...tool,uiKind:'die'}));
 return state.kind==='all'?[...punches,...dies]:state.kind==='punch'?punches:dies;
};
function allMatches(){
 return kindList().filter(t=>toolMatchesBrand(t,state.brand)&&
 (!state.search||[t.name,t.reference,t.id,t.mount,t.angle,t.opening,t.height].join(' ').toLowerCase().includes(state.search)));
}
/**
 * Vista inicial representativa: los modelos de 30°, patas de cabra y
 * matrices de V estrecha deben ser visibles SIN abrir 'catálogo completo'.
 * Conserva además la herramienta activa incluso cuando quede fuera
 * de la selección de portada. Todos los modelos siguen en el catálogo.
 */
export const CATALOG_SHOWCASE_IDS=[
 'straight30','goose','ref-goose-50-100-r1',
 'conic-act-12-3006','conic-gn9-12-8806','conic-gn6-12-8806',
 'v16','v16-30','conic-v006-30-s','rolleri-tmr100-16-30'
];
export function initialToolSelection(items,selectedPunch,selectedDie){
 const featured=new Set([...CATALOG_SHOWCASE_IDS,selectedPunch,selectedDie]);
 let punches=0,dies=0;
 return items.filter(tool=>{
  const base=tool.uiKind==='punch'?punches++<4:dies++<8;
  return base||featured.has(tool.id);
 });
}
function filtered(){
 const items=allMatches();
 if(state.kind!=='all'||state.showAll||state.search)return items;
 const p=current().piece;
 return initialToolSelection(items,p.punch,p.die);
}
function toolPicked(tool){
 const kind=tool.uiKind||(tool.opening!=null?'die':'punch');
 const sel=$(kind==='punch'?'punch':'die');
 if(sel){sel.value=tool.id;sel.dispatchEvent(new Event('change',{bubbles:true}));}
 state.selectedTool=tool.id;state.selectedToolKind=kind;renderCatalogue();refresh();
}
function renderCatalogue(){
 const p=current().piece;
 for(const b of document.querySelectorAll('#cpBrandTabs button')){b.classList.toggle('selected',b.dataset.brand===state.brand);b.setAttribute('aria-pressed',String(b.dataset.brand===state.brand));}
 for(const b of document.querySelectorAll('.cp-kind-tabs button')){b.classList.toggle('selected',b.dataset.kind===state.kind);b.setAttribute('aria-pressed',String(b.dataset.kind===state.kind));}
 const all=allMatches(),list=filtered();
 $('cpCatalogCount').textContent=list.length===all.length?all.length+' herramientas':list.length+' / '+all.length;
 const expand=$('cpShowAllTools');
 if(expand){
  expand.hidden=state.kind!=='all'||!!state.search||list.length===all.length&&!state.showAll;
  expand.textContent=state.showAll?'Mostrar selección inicial':'Ver catálogo completo';
  expand.setAttribute('aria-expanded',String(state.showAll));
 }
 const container=$('cockpitTools');container.replaceChildren();
 for(const tool of list){
   const kind=tool.uiKind || (tool.opening!=null?'die':'punch');
   if(state.kind==='all' && !container.querySelector('[data-category="'+kind+'"]')){
     const group=document.createElement('div');
     group.className='cp-library-group-label';
     group.dataset.category=kind;
     group.textContent=kind==='punch'?'PUNZONES':'MATRICES';
     container.append(group);
   }
   const selected=kind==='punch'?p.punch:p.die;
   const b=document.createElement('button');b.type='button';b.className='cp-tool-card'+(selected===tool.id?' selected':'');
   b.title=(tool.reference||tool.name)+(tool.verifiedSpecs?' · Especificaciones verificadas':' · Modelo provisional');
   const canvas=document.createElement('canvas');canvas.setAttribute('aria-hidden','true');
   const title=document.createElement('b');title.textContent=tool.reference||tool.name;
   const detail=document.createElement('small');detail.textContent=kind==='punch'?tool.angle+'° · R'+tool.tip+' · H'+tool.height:'V'+tool.opening+' · '+tool.angle+'° · H'+tool.height;
   const flag=document.createElement('em');flag.textContent=tool.verifiedSpecs?'Ficha documentada':'Geometría provisional';
   b.append(canvas,title,detail,flag);b.onclick=()=>toolPicked(tool);
   container.append(b);drawThumbnail(canvas,tool,kind);
 }
 if(!list.length){const msg=document.createElement('p');msg.className='hint';msg.textContent='No hay referencias que coincidan con la búsqueda. Prueba otro fabricante o término.';container.append(msg);}
 const tools=kindList();
 const selected=state.selectedToolKind==='die'?p.die:p.punch;
 const chosen=tools.find(t=>t.id===selected)||tools.find(t=>t.id===(state.kind==='die'?p.die:p.punch))||null;
 const shown=tools.find(t=>t.id===state.selectedTool)||chosen;
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
 // Geometría realmente diferenciada por ángulo nominal y abertura V.
 // Sigue siendo un perfil PARAMÉTRICO, no una ficha CAD de fabricante.
 const section=kind==='die'?sectionDie(tool):sectionPunch(tool);
 return section.points.map(([x,y])=>[x,y-section.height/2]);
}

function drawThumbnail(canvas,tool,kind){
 // Modelado paramétrico 2.5D: la silueta depende de la herramienta seleccionada.
 // Ilustración, no CAD acotado ni documentación para mecanizado.
 const w=canvas.clientWidth||100,h=canvas.clientHeight||65,d=Math.min(2,devicePixelRatio||1);
 canvas.width=Math.round(w*d);canvas.height=Math.round(h*d);
 const ctx=canvas.getContext('2d');ctx.setTransform(d,0,0,d,0,0);ctx.clearRect(0,0,w,h);
 const silhouette=shape(tool,kind);
 const maxX=Math.max(1,...silhouette.map(p=>Math.abs(p[0])));
 const maxY=Math.max(1,...silhouette.map(p=>Math.abs(p[1])));
 const extrusion=Math.max(4,Math.min(12,w*.12)),rise=extrusion*.64;
 const scale=Math.min((w-12-extrusion)/(maxX*2),(h-8-rise)/(maxY*2));
 const xx=w/2-extrusion*.32,yy=h/2+rise*.25;
 const front=([x,y])=>({x:xx+x*scale,y:yy-y*scale});
 const shift=p=>({x:p.x+extrusion,y:p.y-rise});
 const polygon=(points,fill,stroke='#9abbd0',lw=.8)=>{
  ctx.beginPath();points.forEach((p,i)=>i?ctx.lineTo(p.x,p.y):ctx.moveTo(p.x,p.y));ctx.closePath();
  ctx.fillStyle=fill;ctx.fill();ctx.lineWidth=lw;ctx.strokeStyle=stroke;ctx.stroke();
 };
 const frontPoints=silhouette.map(front);
 ctx.save();ctx.shadowColor='#000c';ctx.shadowBlur=11;ctx.shadowOffsetX=3;ctx.shadowOffsetY=5;
 // Right side of extruded tool; make dark metal edges and brushed reflections.
 for(let i=0;i<frontPoints.length;i++){
  const next=(i+1)%frontPoints.length,a=frontPoints[i],b=frontPoints[next];
  const edgeX=b.x-a.x;
  const face=[a,b,shift(b),shift(a)];
  const side=ctx.createLinearGradient(a.x,a.y,b.x+extrusion,b.y-rise);
  if(edgeX>=0){side.addColorStop(0,'#bcd2df');side.addColorStop(.45,'#587991');side.addColorStop(1,'#182e42');}
  else{side.addColorStop(0,'#647f92');side.addColorStop(.5,'#29485d');side.addColorStop(1,'#9bb6c7');}
  polygon(face,side,'#2c536e',.9);
 }
 ctx.restore();
 ctx.save();ctx.shadowColor='#000b';ctx.shadowBlur=5;
 const steel=ctx.createLinearGradient(Math.min(...frontPoints.map(p=>p.x)),0,Math.max(...frontPoints.map(p=>p.x)),0);
 steel.addColorStop(0,'#6b869b');steel.addColorStop(.14,'#dceaf2');steel.addColorStop(.29,'#8fa8ba');
 steel.addColorStop(.46,'#eff7fa');steel.addColorStop(.66,'#5e7e91');steel.addColorStop(.87,'#c8dce8');steel.addColorStop(1,'#426179');
 polygon(frontPoints,steel,'#cfe9f5',1.1);
 ctx.restore();
 // fine texture, contained in actual front profile
 ctx.save();ctx.beginPath();frontPoints.forEach((p,i)=>i?ctx.lineTo(p.x,p.y):ctx.moveTo(p.x,p.y));ctx.closePath();ctx.clip();
 ctx.globalAlpha=.14;
 for(let i=0;i<Math.min(90,w);i+=2){
  const x=w*i/Math.min(90,w);
  ctx.strokeStyle=i%4===0?'#fff':'#16364a';ctx.lineWidth=.45;ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x+1,h);ctx.stroke();
 }
 ctx.restore();
 // slot in generic tooling is a visual cue, not a manufacturer-specific feature
 ctx.lineWidth=1;ctx.strokeStyle='#b4e8ff99';ctx.beginPath();
 const p=frontPoints[0];ctx.moveTo(p.x,p.y);ctx.lineTo(p.x+extrusion,p.y-rise);ctx.stroke();
}
function drawToolViewer(){
 let canvas=$('cockpitSelectedTool3D');
 if(!canvas){
  const wrap=document.createElement('div');wrap.className='cp-viewer-wrap';
  wrap.setAttribute('role','dialog');wrap.setAttribute('aria-label','Inspector 3D de herramienta');
  const header=document.createElement('div');header.className='cp-viewer-header';
  header.textContent='INSPECTOR 3D · GIRA PARA EXAMINAR EL PERFIL';
  const close=document.createElement('button');close.type='button';close.id='closeTool3D';
  close.textContent='✕ Cerrar';close.setAttribute('aria-label','Cerrar vista 3D');
  close.addEventListener('click',()=>$('showTool3D').click());
  const info=document.createElement('div');info.id='toolInspectorMeta';info.className='tool-inspector-meta';
  canvas=document.createElement('canvas');canvas.id='cockpitSelectedTool3D';
  canvas.className='cp-3d-viewer';
  canvas.style.cssText='width:100%;height:170px;display:block;background:radial-gradient(ellipse,#153b59,#061626);border:1px solid #1b4968;border-radius:8px;touch-action:none';
  const note=document.createElement('p');note.className='tool-inspector-note';
  note.textContent='Arrastra para girar · pellizca o usa la rueda para ampliar · perfil paramétrico, no CAD verificado';
  wrap.append(header,close,info,canvas,note);$('cockpitToolInfo').after(wrap);
  attachViewer(canvas);
 }
 const p=current().piece,kind=state.kind==='all'?state.selectedToolKind:state.kind;
 const tool=kind==='punch'?PUNCHES.find(t=>t.id===p.punch):DIES.find(t=>t.id===p.die);
 if(!tool)return;
 const meta=$('toolInspectorMeta');
 if(meta)meta.textContent=[tool.manufacturer||'Herramienta genérica',
  tool.reference||tool.name,kind==='punch'?'Ángulo '+tool.angle+'° · Altura '+tool.height+' mm · Punta R'+tool.tip:
  'V '+tool.opening+' mm · '+tool.angle+'° · Altura '+tool.height+' mm',
  tool.profileAccuracy==='verified'?'Geometría verificada':'Perfil provisional sin cotas CAD completas'
 ].join('  |  ');
 const w=canvas.clientWidth||260,h=canvas.clientHeight||170,d=Math.min(devicePixelRatio||1,2);canvas.width=Math.round(w*d);canvas.height=Math.round(h*d);
 const ctx=canvas.getContext('2d');ctx.setTransform(d,0,0,d,0,0);ctx.clearRect(0,0,w,h);
 const polygon=shape(tool,kind),depth=65;
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
/**
 * Los pictogramas de la cabina no son siluetas fijas: cambian al elegir
 * un punzón recto, de 30° o pata de cabra, y cada matriz V/ángulo.
 */
function updateFloatingToolIcon(kind,tool){
 const selector=kind==='punch'?'.cp-float-tool:first-child svg':
  '.cp-float-tool:nth-child(2) svg';
 const svg=document.querySelector(selector);
 if(!svg||svg.dataset.toolId===tool.id)return;
 const shape=kind==='punch'?sectionPunch(tool):sectionDie(tool),pts=shape.points;
 const x=pts.map(p=>p[0]),y=pts.map(p=>p[1]);
 const left=Math.min(...x),right=Math.max(...x),bottom=Math.min(...y),top=Math.max(...y);
 const scale=Math.min(74/Math.max(1,right-left),78/Math.max(1,top-bottom));
 const d=pts.map(([px,py],i)=>(i?'L':'M')+
  (45+(px-(left+right)/2)*scale).toFixed(2)+' '+
  (48-(py-(bottom+top)/2)*scale).toFixed(2)).join(' ')+' Z';
 // Conservar los degradados SVG originales; sustituir sólo la silueta.
 svg.querySelectorAll(':scope > path').forEach(path=>path.remove());
 const path=document.createElementNS('http://www.w3.org/2000/svg','path');
 path.setAttribute('d',d);path.setAttribute('fill','url(#'+(kind==='punch'?'mgt':'mgd')+')');
 path.setAttribute('stroke','#d6e9f7');path.setAttribute('stroke-width','1.2');
 svg.appendChild(path);svg.dataset.toolId=tool.id;
}
function refresh(){
 const {piece,sim}=current(),st=stage(piece,sim.time),data=development(piece),{die,punch,material}=getTooling(piece);
 const top=[['cockpitPieceName',piece.name],['cockpitMaterial',material.name],['cockpitThickness',format(piece.thickness,2)+' mm'],['cockpitAngle',(piece.angles[st.activeBend]>0?'+':'')+piece.angles[st.activeBend]+'°'],['cockpitDie',die.name],['cpPunchLabel','Punzón: '+punch.name],['cpDieLabel','Matriz: '+die.name],['cpCurrentAngle',(piece.angles[st.activeBend]>0?'+':'')+piece.angles[st.activeBend]+'°']];
 for(const [id,value] of top)if($(id)&&$(id).textContent!==value)$(id).textContent=value;
 updateFloatingToolIcon('punch',punch);
 updateFloatingToolIcon('die',die);
 const ready=$('cockpitReady');ready.textContent=st.completed?'● Pieza simulada':'● '+st.phase;
 const comp=selectionCompatibility(punch,die),msg=comp.reason+(punch.profileAccuracy==='provisional'||die.profileAccuracy==='provisional'?' · Geometría paramétrica no validada':'');
 if($('cockpitCompatibility').textContent!==msg)$('cockpitCompatibility').textContent=msg;
 const results=[['Desarrollo estimado',format(data.length,2)+' mm'],['Radio interior aprox.',format(data.radius,2)+' mm'],['Pliegues realizados',st.finished+' / '+st.count],['Ángulo de operación',(piece.angles[st.activeBend]>0?'+':'')+piece.angles[st.activeBend]+'°']];
 const box=$('cockpitResults');if(box.dataset.key!==JSON.stringify(results)){box.dataset.key=JSON.stringify(results);box.replaceChildren(...results.map(([label,value])=>{const row=document.createElement('div');row.className='cp-result-line';const a=document.createElement('span');a.textContent=label;const b=document.createElement('strong');b.textContent=value;row.append(a,b);return row;}));}
}
function init(){
 if(!$('cockpitTools'))return;
 for(const button of document.querySelectorAll('#cpBrandTabs button'))button.addEventListener('click',()=>{state.brand=button.dataset.brand;state.selectedTool=null;state.showAll=false;renderCatalogue();});
 for(const button of document.querySelectorAll('.cp-kind-tabs button'))button.addEventListener('click',()=>{state.kind=button.dataset.kind;state.selectedTool=null;state.selectedToolKind=state.kind==='die'?'die':'punch';state.showAll=false;renderCatalogue();});
 $('cpToolSearch').addEventListener('input',e=>{state.search=e.target.value.trim().toLowerCase();renderCatalogue();});
 $('cpShowAllTools')?.addEventListener('click',()=>{state.showAll=!state.showAll;renderCatalogue();});
 for(const [id,tab] of [['jumpToProgramming','programacion'],['jumpToDevelopment','desarrollo']])$(id).addEventListener('click',()=>document.querySelector('[data-tab="'+tab+'"]').click());
 window.addEventListener('plegadox:pieceChanged',()=>{renderCatalogue();refresh();});
 window.addEventListener('resize',()=>renderCatalogue());
 renderCatalogue();refresh();
 let prev=0;function animate(t){if(t-prev>130){refresh();prev=t;}requestAnimationFrame(animate);}requestAnimationFrame(animate);
}
init();
