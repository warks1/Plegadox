/** PlegadoX R48 · editor táctil/ratón por cotas de herramientas en mm. */
import {buildCustomTool,customToolRecord} from './custom-tool-geometry.js';
const $=id=>document.getElementById(id);
const formId='customToolForm';
const defaults={
 kind:'punch',name:'Nuevo útil personalizado',mount:'WILA',
 angle:'88',height:'120',width:'50',length:'415',
 shape:'straight',shankWidth:'20',shankHeight:'20',tipRadius:'1',
 neckDepth:'18',opening:'16',shoulderRadius:'1.5',offset:'0'
};
const val=number=>Number(number).toLocaleString('es-ES',{maximumFractionDigits:2});
function getValues(form){
 return Object.fromEntries(new FormData(form).entries());
}
function draw(canvas,geometry){
 if(!canvas||!geometry)return;
 const w=Math.max(250,Math.round(canvas.clientWidth||560));
 const h=Math.max(250,Math.round(canvas.clientHeight||420));
 const ratio=Math.min(window.devicePixelRatio||1,2);
 canvas.width=Math.round(w*ratio);canvas.height=Math.round(h*ratio);
 const ctx=canvas.getContext('2d');
 ctx.setTransform(ratio,0,0,ratio,0,0);
 const bg=ctx.createLinearGradient(0,0,w,h);
 bg.addColorStop(0,'#0e2439');bg.addColorStop(1,'#030f1d');
 ctx.fillStyle=bg;ctx.fillRect(0,0,w,h);
 ctx.strokeStyle='#1d4764';ctx.lineWidth=.7;
 for(let x=0;x<w;x+=28){ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x,h);ctx.stroke();}
 for(let y=0;y<h;y+=28){ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(w,y);ctx.stroke();}
 const xs=geometry.points.map(p=>p[0]),ys=geometry.points.map(p=>p[1]);
 const minX=Math.min(...xs),maxX=Math.max(...xs),minY=Math.min(...ys),maxY=Math.max(...ys);
 const padL=65,padR=60,padT=48,padB=66;
 const scale=Math.min((w-padL-padR)/Math.max(1,maxX-minX),
  (h-padT-padB)/Math.max(1,maxY-minY));
 const ox=padL+(w-padL-padR-(maxX-minX)*scale)/2;
 const oy=padT+(h-padT-padB-(maxY-minY)*scale)/2;
 const xy=([x,y])=>[ox+(x-minX)*scale,oy+(maxY-y)*scale];
 const pts=geometry.points.map(xy);
 ctx.beginPath();pts.forEach(([x,y],i)=>i?ctx.lineTo(x,y):ctx.moveTo(x,y));ctx.closePath();
 const metal=ctx.createLinearGradient(ox,0,ox+(maxX-minX)*scale,h);
 metal.addColorStop(0,'#8fd3ee');metal.addColorStop(.28,'#284e6b');
 metal.addColorStop(.61,'#bedced');metal.addColorStop(1,'#295170');
 ctx.fillStyle=metal;ctx.fill();
 ctx.lineWidth=2;ctx.strokeStyle='#b8efff';ctx.stroke();
 const txt=(value,x,y,align='center',size=12)=>{
  ctx.fillStyle='#d7f5ff';ctx.font='600 '+size+'px system-ui, sans-serif';
  ctx.textAlign=align;ctx.fillText(value,x,y);
 };
 const line=(x1,y1,x2,y2)=>{
  ctx.beginPath();ctx.moveTo(x1,y1);ctx.lineTo(x2,y2);
  ctx.strokeStyle='#39baf3';ctx.lineWidth=1;ctx.stroke();
 };
 const xLeft=ox,xRight=ox+(maxX-minX)*scale;
 const yTop=oy,yBottom=oy+(maxY-minY)*scale;
 line(xLeft,yBottom+15,xRight,yBottom+15);
 line(xLeft,yBottom+10,xLeft,yBottom+21);
 line(xRight,yBottom+10,xRight,yBottom+21);
 txt('B '+val(geometry.width)+' mm',(xLeft+xRight)/2,yBottom+33);
 line(xLeft-20,yTop,xLeft-20,yBottom);
 line(xLeft-25,yTop,xLeft-15,yTop);line(xLeft-25,yBottom,xLeft-15,yBottom);
 txt('H '+val(geometry.height)+' mm',xLeft-24,(yTop+yBottom)/2,'right',11);
 txt(geometry.kind==='die'?
  'V '+val(geometry.dimensions.opening)+' · '+val(geometry.angle)+'°':
  (geometry.shape==='gooseneck'?'PATA DE CABRA':'RECTO')+
   ' · '+val(geometry.angle)+'° · R'+val(geometry.dimensions.tip/2),
  w/2,24,'center',Math.min(12,Math.max(9,w/36)));
 if(geometry.kind==='die'){
  txt('Profundidad V nominal '+val(geometry.dimensions.vDepth)+' mm',
   w/2,h-15,'center',10);
 }else{
  txt('Vástago '+val(geometry.dimensions.shankWidth)+' × '+
   val(geometry.dimensions.shankHeight)+' mm'+
   (geometry.shape==='gooseneck'?' · cuello '+val(geometry.dimensions.neckDepth)+' mm':''),
   w/2,h-15,'center',Math.min(11,Math.max(8,w/52)));
 }
}
export function setupCustomToolBuilder({add}){
 const form=$(formId),canvas=$('customToolCanvas'),status=$('customToolStatus');
 if(!form||!canvas||!status)return;
 const values=[
  'kind','name','mount','angle','height','width','length',
  'shape','shankWidth','shankHeight','tipRadius','neckDepth',
  'opening','shoulderRadius','offset'
 ];
 function updateSections(){
  const die=$('customToolKind').value==='die';
  const goose=!die&&$('customToolShape').value==='gooseneck';
  for(const section of form.querySelectorAll('[data-custom-kind]')){
   const k=section.dataset.customKind;
   section.hidden=k==='die'?!die:k==='punch'?die:!goose;
  }
 }
 let model=null;
 function refresh(){
  updateSections();
  try{
   model=buildCustomTool(getValues(form));
   draw(canvas,model);
   status.dataset.error='false';
   status.textContent='Contorno válido · '+model.points.length+' vértices · '+
    val(model.width)+' × '+val(model.height)+
    ' mm · longitud '+val(model.length)+' mm. Dibujo paramétrico 2D, sin certificar.';
   $('customToolSave').disabled=false;
  }catch(error){
   model=null;$('customToolSave').disabled=true;
   status.dataset.error='true';
   status.textContent='⚠ Revisa las cotas: '+error.message;
   const ctx=canvas.getContext('2d');
   ctx.clearRect(0,0,canvas.width,canvas.height);
  }
 }
 for(const name of values){
  const node=form.elements.namedItem(name);
  if(node)node.addEventListener('input',refresh);
  if(node)node.addEventListener('change',refresh);
 }
 $('customToolReset')?.addEventListener('click',()=>{
  for(const [name,value] of Object.entries(defaults)){
   const node=form.elements.namedItem(name);if(node)node.value=value;
  }
  refresh();
 });
 form.addEventListener('submit',event=>{
  event.preventDefault();refresh();if(!model)return;
  try{
   const tool=customToolRecord(model);
   add(tool,model.kind);
   status.dataset.error='false';
   status.textContent='✓ '+tool.name+
    ' guardado en la biblioteca y seleccionado. Sus cotas pueden revisarse y crearse de nuevo; no es CAD OEM ni validación de colisiones.';
  }catch(error){
   status.dataset.error='true';
   status.textContent='No se pudo guardar: '+error.message;
  }
 });
 if('ResizeObserver' in window)new ResizeObserver(()=>{if(model)draw(canvas,model);}).observe(canvas);
 refresh();
}
