/** Interfaz de importación DXF de utillaje, completamente local. */
import {parseToolDxf,importedTool} from './tool-dxf.js';
const $=id=>document.getElementById(id);
function drawPreview(canvas,parsed){
 const rect=canvas.getBoundingClientRect();
 const w=Math.max(300,Math.round(rect.width||440)),h=220;
 const ratio=Math.min(window.devicePixelRatio||1,2);
 canvas.width=Math.round(w*ratio);canvas.height=h*ratio;
 const ctx=canvas.getContext('2d');ctx.setTransform(ratio,0,0,ratio,0,0);
 ctx.fillStyle='#061422';ctx.fillRect(0,0,w,h);
 const margin=24,scale=Math.min((w-margin*2)/parsed.width,(h-margin*2)/parsed.height);
 const map=([x,y])=>[w/2+x*scale,h-margin-(y*scale)];
 const poly=parsed.points.map(map);
 ctx.beginPath();poly.forEach(([x,y],i)=>i?ctx.lineTo(x,y):ctx.moveTo(x,y));
 ctx.closePath();ctx.fillStyle='#548daa';ctx.fill();
 ctx.lineWidth=2;ctx.strokeStyle='#b8eaff';ctx.stroke();
 ctx.fillStyle='#d9efff';ctx.font='12px system-ui';
 ctx.fillText('CONTORNO DXF 2D · mm',12,17);
 ctx.fillText('Ancho '+parsed.width.toFixed(2)+' mm · Alto '+parsed.height.toFixed(2)+' mm',12,h-7);
}
export function setupToolDxfImporter({add}){
 const input=$('toolDxfFile'),save=$('toolDxfCommit'),status=$('toolDxfStatus');
 if(!input||!save||!status)return;
 const kind=$('toolDxfKind'),name=$('toolDxfName'),preview=$('toolDxfCanvas');
 let parsed=null;
 const say=(message,error=false)=>{
  status.textContent=message;status.dataset.error=String(error);
 };
 const toggle=()=>{
  $('toolDxfDieOptions').hidden=kind.value!=='die';
  $('toolDxfPunchOptions').hidden=kind.value!=='punch';
 };
 kind.addEventListener('change',toggle);toggle();
 input.addEventListener('change',async()=>{
  parsed=null;save.disabled=true;preview.hidden=true;
  const file=input.files?.[0];
  if(!file){say('Selecciona un DXF ASCII de contorno cerrado.');return;}
  try{
   if(!/\.dxf$/i.test(file.name))throw Error('Selecciona un archivo .dxf');
   if(file.size>1024*1024)throw Error('Archivo superior a 1 MB');
   const model=parseToolDxf(await file.text());
   parsed=model;
   if(!name.value.trim())name.value=file.name.replace(/\.dxf$/i,'').slice(0,65);
   preview.hidden=false;
   drawPreview(preview,model);
   save.disabled=false;
   say('Contorno leído: '+model.points.length+' vértices · '+
    model.width.toFixed(2)+' × '+model.height.toFixed(2)+' mm. '+
    (model.unitsAssumed?'El archivo no declara mm: revisa la escala. ':'')+
    'Comprueba orientación, ángulo, apertura y amarre antes de guardar.');
  }catch(e){say('No se puede importar: '+e.message,true);}
 });
 save.addEventListener('click',()=>{
  if(!parsed)return;
  try{
   const tool=importedTool(parsed,{
    kind:kind.value,name:name.value,angle:$('toolDxfAngle').value,
    length:$('toolDxfLength').value,opening:$('toolDxfOpening').value,
    tip:$('toolDxfTip').value
   });
   add(tool,kind.value);
   say('✓ Perfil DXF añadido a la biblioteca y seleccionado. '+
    'Se utiliza su contorno 2D en el dibujo y cribado geométrico. '+
    'No está certificada su compatibilidad con la máquina.');
   save.disabled=true;
  }catch(e){say('No se pudo guardar: '+e.message,true);}
 });
}
