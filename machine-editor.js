// Plegadox · editor funcional de las cotas de Cybelec 30a / 29.
// Las dimensiones editadas también actualizan la máquina dibujada en cabina.
import {V85_FACTORY,getV85,updateV85,resetV85,gaugeOutline,gaugeBounds,gaugeContactFeature} from './machine-config.js';
import {roundedRectPath} from './canvas-path.js';

const $=id=>document.getElementById(id);
const locale=n=>Number(n).toLocaleString('es-ES',{minimumFractionDigits:0,maximumFractionDigits:2});
const groups=[
 {id:'machineRamFields',part:'ram',labels:Array.from({length:10},(_,i)=>'L'+(i+1)),extra:[
  ['ramWidth','Ancho trancha'],['holderWidth','Ancho portaútil'],
  ['ramOrigin','Origen trancha'],['holderOrigin','Origen portaútil'],
  ['toolWorkingDistance','Distancia de trabajo']]},
 {id:'machineBedFields',part:'bed',labels:Array.from({length:7},(_,i)=>'L'+(i+1))},
 {id:'machineStopFields',part:'stop',labels:Array.from({length:6},(_,i)=>'L'+(i+1)),
  extra:[['stopL6Max','L6 máximo'],['stopL6Min','L6 mínimo'],['stopOx','Ox'],['stopOz','Oz']]},
 {id:'machineSupportFields',part:'support',labels:Array.from({length:6},(_,i)=>'L'+(i+1)),
  extra:[['supportL6Max','L6 máximo'],['supportL6Min','L6 mínimo'],
   ['supportOx','Ox'],['supportOz','Oz'],['preferredDistance','Distancia preferida (%)']]}
];
let dirty=false;
function control(label,value,path){
 const holder=document.createElement('label');holder.className='machine-number-field';
 const title=document.createElement('span');title.textContent=label;
 const input=document.createElement('input');
 input.type='number';input.step='0.01';input.inputMode='decimal';
 input.value=String(value);
 input.dataset.lastValue=String(value);
 input.dataset.path=path;
 input.setAttribute('aria-label',label+(path.includes('.')?' de '+path.split('.')[0]:'')+' en '+(label.includes('%')?'porcentaje':'milímetros'));
 input.addEventListener('change',()=>{
  const next=getV85();
  const raw=input.value.trim().replace(',','.');
  const n=raw===''?NaN:Number(raw);
  if(!Number.isFinite(n)){input.value=input.dataset.lastValue;return;}
  const parts=path.split('.');
  if(parts.length===2){
   const key=parts[0],index=Number(parts[1]);next[key][index]=n;
  }else next[parts[0]]=n;
  const actual=updateV85(next);dirty=true;
  input.value=String(parts.length===2?actual[parts[0]][Number(parts[1])]:actual[parts[0]]);
  input.dataset.lastValue=input.value;
  render(false); // No sustituir el campo enfocado en cada cambio.
  const state=$('machineSaveState');
  if(state)state.textContent='Configuración guardada en este dispositivo. Comprueba las cotas antes de trabajar.';
 });
 holder.append(title,input);return holder;
}
function fields(){
 const cfg=getV85();
 for(const group of groups){
  const box=$(group.id);if(!box)continue;
  box.replaceChildren();
  for(let i=0;i<group.labels.length;i++)
   box.append(control(group.labels[i],cfg[group.part][i],group.part+'.'+i));
  for(const [key,label] of group.extra||[])
   box.append(control(label,cfg[key],key));
 }
}
function roundedRect(ctx,x,y,w,h,r){
 ctx.beginPath();
 roundedRectPath(ctx,x,y,w,h,r);
}
function label(ctx,text,x,y,size=11,color='#b9ddf2',align='left'){
 ctx.fillStyle=color;ctx.font='600 '+size+'px system-ui';ctx.textAlign=align;ctx.fillText(text,x,y);
}
function arrow(ctx,a,b,color='#91d7ff'){
 ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(b.x,b.y);
 ctx.strokeStyle=color;ctx.lineWidth=1;ctx.stroke();
}
function gaugeCanvas(ctx,w,h,cfg,key){
 const values=cfg[key],stopNumber=key==='support'?2:1;
 const outline=gaugeOutline(values,stopNumber),bounds=gaugeBounds(values,stopNumber);
 // L1 y L3 también pueden ser mayores que L2 y L4 tras editar Cybelec.
 // Ajustar a la envolvente REAL del esquema evita cortar el tope en pantalla.
 const pad=46,plotW=Math.max(1,w-2*pad),plotH=Math.max(1,h-2*pad);
 const s=Math.min(plotW/Math.max(1,bounds.width),plotH/Math.max(1,bounds.height));
 const ox=pad+(plotW-bounds.width*s)/2,oy=pad+(plotH-bounds.height*s)/2;
 const xy=p=>({x:ox+(p.x-bounds.minX)*s,y:oy+(bounds.maxY-p.y)*s});
 ctx.save();
 ctx.beginPath();outline.forEach((p,i)=>{const q=xy(p);i?ctx.lineTo(q.x,q.y):ctx.moveTo(q.x,q.y);});
 ctx.closePath();const g=ctx.createLinearGradient(ox,0,ox+bounds.width*s,h);
 g.addColorStop(0,'#b4d8e5');g.addColorStop(.45,'#31556a');g.addColorStop(1,'#163249');
 ctx.fillStyle=g;ctx.fill();ctx.strokeStyle='#bfe9fa';ctx.lineWidth=2;ctx.stroke();
 // Las cotas siguen al mismo giro horizontal que la geometría.
 // En Support se toma la referencia desde el extremo DERECHO;
 // en Stop se conserva la referencia izquierda previa.
 const drawingX=x=>stopNumber===2?bounds.maxX-x:x;
 const x0=xy({x:drawingX(0),y:0}).x,
  x1=xy({x:drawingX(values[0]),y:0}).x,
  x2=xy({x:drawingX(values[1]),y:0}).x;
 const yy=xy({x:0,y:0}).y;
 arrow(ctx,{x:x0,y:yy+16},{x:x2,y:yy+16});
 label(ctx,'L2 '+locale(values[1]),(x0+x2)/2,yy+30,10,'#8edbfa','center');
 arrow(ctx,{x:x0,y:pad-16},{x:x1,y:pad-16});
 label(ctx,'L1 '+locale(values[0]),(x0+x1)/2,pad-20,10,'#8edbfa','center');
 const dimensionLeft=stopNumber===2;
 label(ctx,'L3 '+locale(values[2]),dimensionLeft?8:w-8,pad+24,10,
  '#d9eef8',dimensionLeft?'left':'right');
 label(ctx,'L4 '+locale(values[3]),dimensionLeft?8:w-8,pad+40,10,
  '#d9eef8',dimensionLeft?'left':'right');
 label(ctx,'L5 '+locale(values[4])+' · L6 '+locale(values[5]),
  dimensionLeft?w-pad-8:pad+8,Math.max(pad+15,yy-6),10,
  '#b9ddf2',dimensionLeft?'right':'left');
 // Señalar la superficie activa, no el origen genérico del dibujo.
 const finger=gaugeContactFeature(values,stopNumber);
 const a=xy(finger.from),b=xy(finger.to),p=xy(finger.point);
 ctx.save();ctx.lineCap='round';ctx.shadowBlur=8;ctx.shadowColor='#4dfabd';
 ctx.lineWidth=4;ctx.strokeStyle='#b4ffe3';
 ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(b.x,b.y);ctx.stroke();
 ctx.shadowBlur=0;ctx.beginPath();ctx.arc(p.x,p.y,3.2,0,Math.PI*2);
 ctx.fillStyle='#d4ffe9';ctx.fill();ctx.restore();
 label(ctx,key==='support'?'2 · CONTACTO EN ESCALÓN · ORIENTACIÓN CORREGIDA':'1 · CONTACTO EN CARA STOP',
  w/2,h-10,Math.min(11,Math.max(8,w/40)),'#b8ffe0','center');
 ctx.restore();
}
function barCanvas(ctx,w,h,cfg,key){
 const values=cfg[key],max=Math.max(...values,1),left=37,right=18,
  top=30,bottom=17,gap=4;
 const rowHeight=Math.max(16,(h-top-bottom)/values.length-gap);
 for(let i=0;i<values.length;i++){
  const v=values[i],y=top+i*(rowHeight+gap),maxW=w-left-right-56;
  label(ctx,'L'+(i+1),8,y+rowHeight*.73,11,'#d0e7f5');
  const g=ctx.createLinearGradient(left,y,left+maxW,y);
  g.addColorStop(0,'#426f8c');g.addColorStop(1,'#89cae7');
  roundedRect(ctx,left,y,Math.max(.5,v/max*maxW),Math.max(6,rowHeight*.72),2);
  ctx.fillStyle=g;ctx.fill();
  label(ctx,locale(v)+' mm',left+maxW+6,y+rowHeight*.7,10);
 }
 label(ctx,key==='ram'?'TRANCHA · L1–L10':'MESA · L1–L7',10,18,11,'#9ddaf5');
}
function draw(canvas,key){
 if(!canvas||!canvas.clientWidth)return;
 const rect=canvas.getBoundingClientRect(),w=rect.width,h=rect.height;
 const dpr=Math.min(devicePixelRatio||1,2);
 canvas.width=Math.max(2,Math.round(w*dpr));canvas.height=Math.max(2,Math.round(h*dpr));
 const ctx=canvas.getContext('2d');ctx.setTransform(dpr,0,0,dpr,0,0);
 const g=ctx.createLinearGradient(0,0,w,h);
 g.addColorStop(0,'#0c263d');g.addColorStop(1,'#061524');
 ctx.fillStyle=g;ctx.fillRect(0,0,w,h);
 const cfg=getV85();
 if(key==='ram'||key==='bed')barCanvas(ctx,w,h,cfg,key);
 else gaugeCanvas(ctx,w,h,cfg,key);
}
function render(refreshFields=true){
 if(refreshFields)fields();const cfg=getV85();
 const text=$('machineSummary');
 if(text){
  text.replaceChildren(...[
   ['Trancha / portaútil',locale(cfg.ramWidth)+' / '+locale(cfg.holderWidth)+' mm'],
   ['Trabajo punzón',locale(cfg.toolWorkingDistance)+' mm'],
   ['Stop / Support',locale(cfg.stop[0])+' / '+locale(cfg.support[0])+' mm'],
   ['Distancia preferida',locale(cfg.preferredDistance)+' %']
  ].map(([n,v])=>{
   const b=document.createElement('div');b.className='machine-summary-item';
   const span=document.createElement('span');span.textContent=n;
   const strong=document.createElement('strong');strong.textContent=v;
   b.append(span,strong);return b;
  }));
 }
 redraw();
}
function redraw(){
 for(const [id,key] of [['machineRamProfile','ram'],['machineBedProfile','bed'],
  ['machineStopProfile','stop'],['machineSupportProfile','support']])
  draw($(id),key);
}
function exportConfig(){
 const data=JSON.stringify({format:'Plegadox V85 configuración 1.0',
  unit:'mm',source:'fotografías Cybelec de usuario',machine:getV85()},null,2);
 const blob=new Blob([data],{type:'application/json'});
 const url=URL.createObjectURL(blob),link=document.createElement('a');
 link.href=url;link.download='Plegadox-Trumpf-V85-configuracion.json';
 document.body.append(link);link.click();link.remove();
 setTimeout(()=>URL.revokeObjectURL(url),1200);
}
if($('machineRamFields')){
 $('machineResetValues')?.addEventListener('click',()=>{
  resetV85();dirty=false;render();
  $('machineSaveState').textContent='Restauradas las cotas de las fotografías Cybelec.';
 });
 $('machineExport')?.addEventListener('click',exportConfig);
 window.addEventListener('plegadox:machineChanged',()=>{redraw();window.PLEGADOX_REDRAW?.();});
 if('ResizeObserver' in window){
  const obs=new ResizeObserver(redraw);
  for(const id of ['machineRamProfile','machineBedProfile','machineStopProfile','machineSupportProfile']){
   const target=$(id);if(target)obs.observe(target);
  }
 }
 render();
}
