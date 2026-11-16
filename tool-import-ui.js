/** Interfaz de importación DXF de utillaje, completamente local. */
import {parseToolDxf,importedTool} from './tool-dxf.js';
import {extractDxfFromZip,listDxfZipEntries} from './cad-zip-reader.js';
import {auditImportedCadDimensions,catalogCadAuditReference} from './tool-cad-oem-audit.js';
import {inspectPunchWorkingAxis,inspectDieWorkingAxis} from './tool-cad-datum.js';
import {listCadImportSources,suggestedMountFamily} from './cad-import-sources.js';
import {drawMachinedToolSection} from './industrial-tool-finish.js';
const $=id=>document.getElementById(id);
function drawPreview(canvas,parsed,axisReview=null,manualAxis=null){
 const rect=canvas.getBoundingClientRect();
 const w=Math.max(300,Math.round(rect.width||440)),h=220;
 const ratio=Math.min(window.devicePixelRatio||1,2);
 canvas.width=Math.round(w*ratio);canvas.height=h*ratio;
 const ctx=canvas.getContext('2d');ctx.setTransform(ratio,0,0,ratio,0,0);
 ctx.fillStyle='#061422';ctx.fillRect(0,0,w,h);
 const margin=24,scale=Math.min((w-margin*2)/parsed.width,(h-margin*2)/parsed.height);
 const map=([x,y])=>[w/2+x*scale,h-margin-(y*scale)];
 // Cuadrícula y acero industriales, SOLO DECORATIVOS.
 ctx.save();ctx.lineWidth=.6;ctx.strokeStyle='#2b57704a';
 for(let x=12;x<w;x+=24){ctx.beginPath();ctx.moveTo(x,10);
  ctx.lineTo(x,h-12);ctx.stroke();}
 for(let y=10;y<h;y+=24){ctx.beginPath();ctx.moveTo(12,y);
  ctx.lineTo(w-12,y);ctx.stroke();}
 ctx.restore();
 const poly=parsed.points.map(map);
 drawMachinedToolSection(ctx,poly,{kind:$('toolDxfKind')?.value==='punch'?
  'punch':'die',scale:1.2});
 // R111: la línea de trabajo de la pata de cabra NO es el centro
 // de la caja del dibujo. Si hay dos V, dibujar ambas candidatas.
 const selected=manualAxis!==null&&String(manualAxis).trim()!==''?
  Number(manualAxis):axisReview?.axisX;
 const marks=axisReview?.vCenters?.length>1?
  axisReview.vCenters.map(v=>v.x):
  (Number.isFinite(selected)?[selected]:[]);
 for(const axis of marks){
  const x=map([axis,0])[0];
  ctx.beginPath();ctx.setLineDash([5,5]);ctx.lineWidth=1.4;
  ctx.moveTo(x,25);ctx.lineTo(x,h-22);
  ctx.strokeStyle=Number.isFinite(selected)&&Math.abs(axis-selected)<.75?
   '#81f3ce':'#ffc66b';
  ctx.stroke();ctx.setLineDash([]);
 }
 ctx.fillStyle='#d9efff';ctx.font='12px system-ui';
 ctx.fillText('CONTORNO DXF 2D · mm',12,17);
 ctx.fillText('Ancho '+parsed.width.toFixed(2)+' mm · Alto '+parsed.height.toFixed(2)+' mm',12,h-7);
 if(axisReview){
  ctx.fillStyle=axisReview.datumEstablished||Number.isFinite(selected)?
   '#8ff6d1':'#ffd08a';
  const annotation=Number.isFinite(selected)?
   'PUNTA / V · X='+selected.toFixed(3)+' mm':
   'EJE AMBIGUO · ELEGIR V / PUNTA';
  ctx.fillText(annotation,12,34);
 }
}
export function setupToolDxfImporter({add}){
 const input=$('toolDxfFile'),save=$('toolDxfCommit'),status=$('toolDxfStatus');
 if(!input||!save||!status)return;
 const kind=$('toolDxfKind'),name=$('toolDxfName'),preview=$('toolDxfCanvas');
 const axisInput=$('toolDxfAxisX');
 const axisReview=parsed=>parsed?(kind.value==='die'?
  inspectDieWorkingAxis(parsed.points):inspectPunchWorkingAxis(parsed.points)):null;
 const mount=$('toolDxfMount');
 // Los ZIP OEM suelen traer VARIOS DXF (longitudes y variantes).
 // Ninguna se elige automáticamente sin decir cuál es el archivo.
 const zipChoice=document.createElement('select');
 zipChoice.className='px-oem-zip-choice';
 zipChoice.setAttribute('aria-label','Seleccionar contorno DXF del ZIP OEM');
 zipChoice.hidden=true;input.insertAdjacentElement('afterend',zipChoice);
 let zipBytes=null,zipLabel='';
 let parsed=null,preparedSource=null;
 const say=(message,error=false)=>{
  status.textContent=message;status.dataset.error=String(error);
 };
 const reviewCad=()=>{
  if(!parsed){save.disabled=true;return null;}
  const review=auditImportedCadDimensions(parsed,preparedSource,{
   kind:kind.value,
   angleDeg:Number($('toolDxfAngle').value),
   openingMm:Number($('toolDxfOpening').value),
   tipDiameterMm:Number($('toolDxfTip').value)
  });
  save.disabled=!review.canRegister;
  if(!review.canRegister){
   const differences=review.conflicts.map(x=>x.field+': '+
    String(x.actual)+' frente a '+x.expected).join(' · ');
   say('IMPORTACIÓN BLOQUEADA: la ficha '+review.reference+
    ' no coincide con el DXF o con las cotas declaradas ('+
    differences+'). Comprueba la referencia y el archivo OEM.',true);
  }
  return review;
 };
 for(const id of ['toolDxfAngle','toolDxfOpening','toolDxfTip'])
  $(id)?.addEventListener('input',()=>{
   if(parsed){
    const audit=reviewCad();
    if(audit?.canRegister&&preparedSource)
     say('Cotas nominales cotejadas con la ficha '+audit.reference+
      '. Esto NO acredita el fabricante ni el montaje.');
   }
  });
 const toggle=()=>{
  $('toolDxfDieOptions').hidden=kind.value!=='die';
  $('toolDxfPunchOptions').hidden=kind.value!=='punch';
 };
 kind.addEventListener('change',()=>{
  preparedSource=null;
  toggle();
  if(parsed)reviewCad();
  if(parsed)drawPreview(preview,parsed,axisReview(parsed),axisInput?.value||null);
 });toggle();
 axisInput?.addEventListener('input',()=>{
  if(parsed)drawPreview(preview,parsed,axisReview(parsed),axisInput.value);
 });
 const cadSources=$('toolCadSources');
 if(cadSources){
  const records=listCadImportSources();
  const display=records.map(({tool,kind:toolKind})=>{
   const card=document.createElement('article');card.className='px-oem-cad-source';
   const title=document.createElement('strong');
   title.textContent=(tool.manufacturer||'OEM')+' · '+(tool.reference||tool.name);
   const details=document.createElement('small');
   const angle=Number.isFinite(tool.angle)?tool.angle+'°':'ángulo pendiente';
   const throat=toolKind==='die'?
    (Number.isFinite(tool.opening)?'V'+tool.opening:'V pendiente'):
    (Number.isFinite(tool.tip)?'R'+(tool.tip/2):'R pendiente');
   details.textContent=(toolKind==='punch'?'Punzón':'Matriz')+' · '+angle+
    ' · '+throat+' · H nominal '+
    (Number.isFinite(tool.height)?tool.height+' mm':'sin cota')+
    ' · DXF todavía sin importar';
   const actions=document.createElement('div');actions.className='px-oem-cad-actions';
   const preset=document.createElement('button');preset.type='button';
   preset.textContent='Preparar importación';
   preset.addEventListener('click',()=>{
    preparedSource=catalogCadAuditReference(tool,toolKind);
    parsed=null;input.value='';save.disabled=true;preview.hidden=true;
    if(axisInput)axisInput.value='';
    kind.value=toolKind;toggle();name.value=tool.reference||tool.name;
    // Las familias de amarre se proponen desde catálogo, pero la
    // fijación física debe comprobarla el operador antes de guardar.
    const declared=suggestedMountFamily(tool.mount);
    if(mount)mount.value=declared;
    $('toolDxfAngle').value=Number.isFinite(tool.angle)?String(tool.angle):'';
    $('toolDxfLength').value=Number.isFinite(tool.length)&&tool.length>0?
     String(tool.length):'';
    if(toolKind==='die')$('toolDxfOpening').value=
     Number.isFinite(tool.opening)?String(tool.opening):'';
    else $('toolDxfTip').value=Number.isFinite(tool.tip)?String(tool.tip):'';
    say('Referencia '+tool.reference+' preparada. Descarga el DXF OEM y súbelo a este formulario. Indica la longitud real del segmento Z, confirma el amarre exacto y comprueba las cotas; ningún enlace equivale a CAD certificado.');
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
      if(advertised>8*1024*1024)throw Error('Archivo CAD superior a 8 MB');
      const fileBytes=await response.arrayBuffer();
      if(fileBytes.byteLength>8*1024*1024)
       throw Error('Archivo CAD superior a 8 MB');
      const isZip=/\.zip(?:$|[?#])/i.test(tool.cadDownloadUrl);
      const source=isZip?
       (await extractDxfFromZip(fileBytes)).content:
       new TextDecoder('utf-8',{fatal:true}).decode(fileBytes);
      const model=parseToolDxf(source);
      parsed=model;preview.hidden=false;
      drawPreview(preview,model,axisReview(model),axisInput?.value||null);
      const audit=axisReview(model);
      say('DXF del fabricante: '+model.points.length+' vértices. '+
       'Eje X '+(audit.datumEstablished?
        audit.axisX.toFixed(3)+' mm (inferido)':
        'AMBIGUO: indica X de la punta/V seleccionada')+'. '+
       'Confirma orientación, escala y sistema de amarre antes de guardar.');
      reviewCad();
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
 const acceptCad=(model,cad,fileName)=>{
  parsed=model;
  if(!name.value.trim())
   name.value=fileName.replace(/(?:\\.dxf)?\\.(?:dxf|zip)$/i,'').slice(0,65);
  preview.hidden=false;
  drawPreview(preview,model,axisReview(model),axisInput?.value||null);
  const audit=axisReview(model);
  say((cad?'ZIP comprobado (CRC correcto), DXF '+cad.name+'. ':'')+
   'Contorno leído: '+model.points.length+' vértices · '+
   model.width.toFixed(2)+' × '+model.height.toFixed(2)+' mm · '+
   (audit.datumEstablished?'Eje de trabajo X '+audit.axisX.toFixed(3)+
    ' mm inferido; ':audit.status+'; introduce la X de la punta/V; ')+
   (model.unitsAssumed?'El archivo no declara mm: revisa la escala. ':'')+
   'Comprueba orientación (punta abajo, V arriba), ángulo, '+
   'apertura, longitud Z y amarre ANTES de guardar.');
  reviewCad();
 };
 zipChoice.addEventListener('change',async()=>{
  parsed=null;save.disabled=true;preview.hidden=true;
  if(!zipChoice.value||!zipBytes)return;
  try{
   const cad=await extractDxfFromZip(zipBytes,{selectName:zipChoice.value});
   const model=parseToolDxf(cad.content);
   acceptCad(model,cad,zipLabel);
  }catch(error){say('DXF del ZIP no utilizable: '+error.message,true);}
 });
 input.addEventListener('change',async()=>{
  parsed=null;save.disabled=true;preview.hidden=true;
  zipBytes=null;zipChoice.hidden=true;zipChoice.replaceChildren();
  const file=input.files?.[0];
  if(!file){say('Selecciona un .DXF ASCII o .DXF.ZIP del fabricante.');return;}
  try{
   if(!/\\.(dxf|zip)$/i.test(file.name))
    throw Error('Selecciona un archivo .DXF o .DXF.ZIP');
   const zipped=/\\.zip$/i.test(file.name);
   if(file.size>(zipped?8:1)*1024*1024)
    throw Error('DXF o ZIP fuera de tamaño permitido');
   if(!zipped){
    acceptCad(parseToolDxf(await file.text()),null,file.name);
    return;
   }
   const bytes=await file.arrayBuffer();
   const entries=await listDxfZipEntries(bytes);
   if(entries.length>1){
    zipBytes=bytes;zipLabel=file.name;
    const placeholder=document.createElement('option');
    placeholder.value='';placeholder.textContent=
     'Elegir DXF exacto del ZIP ('+entries.length+' perfiles)';
    zipChoice.append(placeholder);
    for(const item of entries){
     const option=document.createElement('option');
     option.value=item.name;
     option.textContent=item.name+' · '+item.uncompressedBytes+' bytes';
     zipChoice.append(option);
    }
    zipChoice.hidden=false;zipChoice.value='';
    say('El ZIP contiene '+entries.length+
     ' archivos DXF: selecciona el perfil EXACTO de tu referencia.'+
     ' No unir geometrías de distintas longitudes, variantes o amarres.');
    return;
   }
   const cad=await extractDxfFromZip(bytes,{selectName:entries[0].name});
   acceptCad(parseToolDxf(cad.content),cad,file.name);
  }catch(e){say('No se puede importar: '+e.message,true);}
 });
 save.addEventListener('click',()=>{
  if(!parsed)return;
  try{
   const cadReview=reviewCad();
   if(!cadReview?.canRegister)
    throw Error('El perfil no coincide con las cotas de la ficha seleccionada');
   const tool=importedTool(parsed,{
    kind:kind.value,name:name.value,angle:$('toolDxfAngle').value,
    length:$('toolDxfLength').value,opening:$('toolDxfOpening').value,
    tip:$('toolDxfTip').value,mount:mount?.value||'Desconocido',
    axisX:axisInput?.value?.trim()||null
   });
   const record=preparedSource?{...tool,
    cadSourceReference:cadReview.reference,
    cadSourcePage:cadReview.sourceUrl,
    cadNominalReviewStatus:cadReview.status,
    cadNominalChecks:cadReview.checks,
    manufacturerVerified:false,
    sourceDescription:tool.sourceDescription+
     ' · Cotas de ficha comparadas (identidad OEM sin autenticar)'
   }:tool;
   add(record,kind.value);
   window.dispatchEvent(new Event('plegadox:toolingChanged'));
   say('✓ Perfil DXF añadido a la biblioteca y seleccionado. '+
    'La punta/V de trabajo queda en X=0 del dibujo geométrico. '+
    'El amarre seleccionado es una declaración del operador, no una certificación de compatibilidad con la máquina.'+
    (preparedSource?' Cotas nominales contrastadas; archivo OEM NO autenticado.':''));
   save.disabled=true;
  }catch(e){say('No se pudo guardar: '+e.message,true);}
 });
}
