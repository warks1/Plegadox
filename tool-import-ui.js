/** Interfaz de importación DXF de utillaje, completamente local. */
import {parseToolDxf,importedTool} from './tool-dxf.js';
import {CATALOG_PUNCHES,CATALOG_DIES} from './catalog.js';
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
 const cadSources=$('toolCadSources');
 if(cadSources){
  const records=[
   ...CATALOG_PUNCHES.filter(x=>x.cadSourceUrl).map(x=>({tool:x,kind:'punch'})),
   ...CATALOG_DIES.filter(x=>x.cadSourceUrl).map(x=>({tool:x,kind:'die'}))
  ];
  const display=records.map(({tool,kind:toolKind})=>{
   const card=document.createElement('article');card.className='px-oem-cad-source';
   const title=document.createElement('strong');
   title.textContent=(tool.manufacturer||'OEM')+' · '+(tool.reference||tool.name);
   const details=document.createElement('small');
   details.textContent=(toolKind==='punch'?'Punzón':'Matriz')+' · '+tool.angle+'°'+
    (toolKind==='die'?' · V'+tool.opening:' · R'+(tool.tip/2))+
    ' · H nominal '+tool.height+' mm · DXF todavía sin importar';
   const actions=document.createElement('div');actions.className='px-oem-cad-actions';
   const preset=document.createElement('button');preset.type='button';
   preset.textContent='Preparar importación';
   preset.addEventListener('click',()=>{
    parsed=null;input.value='';save.disabled=true;preview.hidden=true;
    kind.value=toolKind;toggle();name.value=tool.reference||tool.name;
    $('toolDxfAngle').value=String(tool.angle);
    $('toolDxfLength').value=String(tool.length||415);
    if(toolKind==='die')$('toolDxfOpening').value=String(tool.opening);
    else $('toolDxfTip').value=String(tool.tip||1);
    say('Referencia '+tool.reference+' preparada. Descarga el DXF OEM y súbelo a este formulario. El contorno y el amarre quedan pendientes de comprobación.');
   });
   const ref=document.createElement('a');ref.href=tool.cadSourceUrl;
   ref.target='_blank';ref.rel='noopener noreferrer';
   ref.textContent='Ficha + DXF del fabricante';
   actions.append(preset,ref);
   if(tool.cadDownloadUrl){
    const direct=document.createElement('a');
    direct.href=tool.cadDownloadUrl;direct.target='_blank';direct.rel='noopener noreferrer';
    direct.textContent='Archivo DXF directo';actions.append(direct);
    const tryImport=document.createElement('button');
    tryImport.type='button';tryImport.textContent='Cargar DXF desde web';
    tryImport.addEventListener('click',async()=>{
     try{
      preset.click();tryImport.disabled=true;
      say('Consultando DXF del fabricante…');
      const response=await fetch(tool.cadDownloadUrl,{mode:'cors',credentials:'omit'});
      if(!response.ok)throw Error('HTTP '+response.status);
      const advertised=Number(response.headers.get('content-length')||0);
      if(advertised>1024*1024)throw Error('DXF superior a 1 MB');
      const source=await response.text();
      const model=parseToolDxf(source);
      parsed=model;save.disabled=false;preview.hidden=false;
      drawPreview(preview,model);
      say('DXF del fabricante analizado: '+model.points.length+
       ' vértices. Confirma la V activa, orientación, escala y fijación antes de guardar.');
     }catch(error){
      say('No se pudo cargar el DXF directamente: '+error.message+
       '. Descárgalo desde la ficha y selecciona el archivo en el campo superior.',true);
     }finally{tryImport.disabled=false;}
    });
    actions.append(tryImport);
   }
   card.append(title,details,actions);return card;
  });
  cadSources.replaceChildren(...display);
 }
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
    'Comprueba la orientación (punta del punzón abajo, V de la matriz arriba), ángulo, apertura, longitud y amarre antes de guardar.');
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
