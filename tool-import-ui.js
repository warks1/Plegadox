/** Interfaz de importación DXF de utillaje, completamente local. */
import {parseToolDxf,importedTool,inspectToolDxfLayers,
 inspectToolDxfContours} from './tool-dxf.js';
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
 const layerChoice=document.createElement('select');
 layerChoice.className='px-oem-layer-choice';
 layerChoice.setAttribute('aria-label','Elegir capa del contorno DXF original');
 layerChoice.hidden=true;zipChoice.insertAdjacentElement('afterend',layerChoice);
 const contourChoice=document.createElement('select');
 contourChoice.className='px-oem-contour-choice';
 contourChoice.setAttribute('aria-label','Elegir contorno cerrado original DXF');
 contourChoice.hidden=true;layerChoice.insertAdjacentElement('afterend',contourChoice);
 let zipBytes=null,zipLabel='';
 let layerContent=null,layerCad=null,layerLabel='';
 let contourContent=null,contourLayer=null,contourCad=null,contourLabel='';
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
    zipBytes=null;zipLabel='';zipChoice.hidden=true;zipChoice.replaceChildren();
    layerContent=null;layerChoice.hidden=true;layerChoice.replaceChildren();
    contourContent=null;contourChoice.hidden=true;contourChoice.replaceChildren();
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
      if(!isZip){
       const content=new TextDecoder('utf-8',{fatal:true}).decode(fileBytes);
       loadDxfContour(content,null,tool.reference+'.dxf');
      }else{
       const entries=await listDxfZipEntries(fileBytes);
       if(entries.length>1){
        // Exactamente igual que al subir un ZIP local: elegir la
        // variante OEM antes de analizar o guardar el contorno.
        showZipChoices(fileBytes,tool.reference+'.zip',entries);
       }else{
        const cad=await extractDxfFromZip(fileBytes,{selectName:entries[0].name});
        loadDxfContour(cad.content,cad,tool.reference+'.zip');
       }
      }
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
 const showZipChoices=(bytes,label,entries)=>{
  zipBytes=bytes;zipLabel=label;parsed=null;
  preview.hidden=true;save.disabled=true;
  const placeholder=document.createElement('option');
  placeholder.value='';placeholder.textContent=
   'Elegir DXF exacto del ZIP ('+entries.length+' perfiles)';
  zipChoice.replaceChildren(placeholder);
  for(const item of entries){
   const option=document.createElement('option');
   option.value=item.name;
   option.textContent=item.name+' · '+item.uncompressedBytes+' bytes';
   zipChoice.append(option);
  }
  zipChoice.hidden=false;zipChoice.value='';
  say('El ZIP OEM contiene '+entries.length+
   ' DXF. Selecciona la sección exacta de tu referencia y longitud; '+
   'ninguna variante se importa automáticamente ni se certifica.');
 };
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
 const showContourChoices=(content,cad,fileName,layer=null)=>{
  const outline=inspectToolDxfContours(content,{entityLayer:layer});
  if(!outline.candidates.length)return false;
  contourContent=content;contourLayer=layer;
  contourCad=cad;contourLabel=fileName;
  parsed=null;save.disabled=true;preview.hidden=true;
  const placeholder=document.createElement('option');
  placeholder.value='';placeholder.textContent=
   'Elegir contorno cerrado ORIGINAL ('+outline.candidates.length+')';
  contourChoice.replaceChildren(placeholder);
  for(const item of outline.candidates){
   const option=document.createElement('option');
   option.value=String(item.index);
   option.textContent='Ciclo '+(item.index+1)+' · '+
    item.widthMm.toFixed(2)+' × '+item.heightMm.toFixed(2)+' mm · '+
    item.segments+' segmentos';
   contourChoice.append(option);
  }
  contourChoice.hidden=false;contourChoice.value='';
  say('Se han localizado '+outline.candidates.length+
   ' contornos cerrados en el DXF OEM. Selecciona el del cuerpo REAL '+
   'y coteja el plano H y el amarre. NO se han cerrado huecos ni '+
   'fusionado cadenas abiertas: las otras entidades se descartan.');
  return true;
 };
 contourChoice.addEventListener('change',()=>{
  parsed=null;save.disabled=true;preview.hidden=true;
  if(contourChoice.value===''||!contourContent)return;
  try{
   const model=parseToolDxf(contourContent,{
    ...(contourLayer!==null?{entityLayer:contourLayer}:{}),
    contourIndex:Number(contourChoice.value)
   });
   acceptCad(model,contourCad,contourLabel);
  }catch(error){
   say('No se puede importar el contorno seleccionado: '+
    error.message,true);
  }
 });
 const loadDxfContour=(content,cad,fileName)=>{
  layerContent=null;layerChoice.hidden=true;layerChoice.replaceChildren();
  contourContent=null;contourChoice.hidden=true;contourChoice.replaceChildren();
  try{
   acceptCad(parseToolDxf(content),cad,fileName);
  }catch(error){
   // Un DXF OEM puede tener perfiles y DIMENSIONES en capas separadas.
   // El usuario debe elegir su capa: no se escoge la de mayor área
   // ni se fusionan líneas de referencia con el contorno material.
   const inventory=inspectToolDxfLayers(content);
   if(inventory.layers.length<=1){
    if(!showContourChoices(content,cad,fileName))throw error;
    return;
   }
   layerContent=content;layerCad=cad;layerLabel=fileName;
   const placeholder=document.createElement('option');
   placeholder.value='';placeholder.textContent=
    'Selecciona la capa CAD del contorno ('+inventory.layers.length+')';
   layerChoice.append(placeholder);
   for(const item of inventory.layers){
    const choice=document.createElement('option');
    choice.value=item.name;
    choice.textContent=item.name+' · '+item.total+' entidades';
    layerChoice.append(choice);
   }
   layerChoice.hidden=false;layerChoice.value='';
   say('El DXF contiene varias capas o anotaciones ('+
    inventory.layers.map(x=>x.name).join(', ')+'). '+
    'Selecciona explícitamente la capa del cuerpo cerrado OEM. '+
    'Las cotas auxiliares NO son metal de la herramienta.');
  }
 };
 layerChoice.addEventListener('change',()=>{
  parsed=null;save.disabled=true;preview.hidden=true;
  contourContent=null;contourChoice.hidden=true;contourChoice.replaceChildren();
  if(!layerChoice.value||!layerContent)return;
  try{
   const model=parseToolDxf(layerContent,{entityLayer:layerChoice.value});
   acceptCad(model,layerCad,layerLabel);
  }catch(error){
   try{
    if(!showContourChoices(layerContent,layerCad,layerLabel,layerChoice.value))
     throw error;
   }catch(failure){
    say('La capa '+layerChoice.value+' no contiene un contorno cerrado '+
     'o tiene geometría adicional: '+failure.message,true);
   }
  }
 });
 zipChoice.addEventListener('change',async()=>{
  parsed=null;save.disabled=true;preview.hidden=true;
  if(!zipChoice.value||!zipBytes)return;
  try{
   const cad=await extractDxfFromZip(zipBytes,{selectName:zipChoice.value});
   loadDxfContour(cad.content,cad,zipLabel);
  }catch(error){say('DXF del ZIP no utilizable: '+error.message,true);}
 });
 input.addEventListener('change',async()=>{
  parsed=null;save.disabled=true;preview.hidden=true;
  zipBytes=null;zipChoice.hidden=true;zipChoice.replaceChildren();
  layerContent=null;layerChoice.hidden=true;layerChoice.replaceChildren();
  contourContent=null;contourChoice.hidden=true;contourChoice.replaceChildren();
  const file=input.files?.[0];
  if(!file){say('Selecciona un .DXF ASCII o .DXF.ZIP del fabricante.');return;}
  try{
   if(!/\\.(dxf|zip)$/i.test(file.name))
    throw Error('Selecciona un archivo .DXF o .DXF.ZIP');
   const zipped=/\\.zip$/i.test(file.name);
   if(file.size>(zipped?8:1)*1024*1024)
    throw Error('DXF o ZIP fuera de tamaño permitido');
   if(!zipped){
    loadDxfContour(await file.text(),null,file.name);
    return;
   }
   const bytes=await file.arrayBuffer();
   const entries=await listDxfZipEntries(bytes);
   if(entries.length>1){
    showZipChoices(bytes,file.name,entries);
    return;
   }
   const cad=await extractDxfFromZip(bytes,{selectName:entries[0].name});
   loadDxfContour(cad.content,cad,file.name);
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
    cadHeightDatumPending:cadReview.cadHeightDatumPending===true,
    nominalHeightMm:cadReview.nominalHeightMm??null,
    mountingTangMm:cadReview.mountingTangMm??null,
    manufacturerVerified:false,
    mountVerified:false,datumVerified:false,
    sourceDescription:tool.sourceDescription+
     (cadReview.cadHeightDatumPending?
      ' · Altura total del dibujo '+cadReview.totalContourHeightMm+
      ' mm; H nominal '+cadReview.nominalHeightMm+
      ' mm + zanco '+cadReview.mountingTangMm+
      ' mm. POSICIÓN DE MONTAJE NO VERIFICADA.' :
      ' · Cotas de ficha comparadas (identidad OEM sin autenticar)')
   }:tool;
   add(record,kind.value);
   window.dispatchEvent(new Event('plegadox:toolingChanged'));
   say('✓ Perfil DXF añadido a la biblioteca y seleccionado. '+
    'La punta/V de trabajo queda en X=0 del dibujo geométrico. '+
    'El amarre seleccionado es una declaración del operador, no una certificación de compatibilidad con la máquina.'+
    (preparedSource?(cadReview.cadHeightDatumPending?
     ' Dibujo OEM con altura total y zanco cotejados. El cero de montaje '+
     'y la altura útil CNC siguen PENDIENTES; perfil no certificado.':
     ' Cotas nominales contrastadas; archivo OEM NO autenticado.'):'') );
   save.disabled=true;
  }catch(e){say('No se pudo guardar: '+e.message,true);}
 });
}
