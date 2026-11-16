/**
 * PlegadoX R109 · inventario de procedencia y cobertura de CAD.
 * Mostrar ENLACES no equivale a instalar archivos ni verificar montaje.
 */
import {CAD_EVIDENCE_SOURCES,cadCoverage} from './cad-evidence.js';
import {loadMachineCad,machineConfigurationKey} from './machine-cad.js';
import {getActiveMachineConfig} from './machine-config.js';
import {loadImportedTools} from './tool-dxf.js';
import {getActiveMachineProfile} from './machine-selection.js';

const $=id=>document.getElementById(id);
const ALL_LABELS={
 ram:'Trancha / viga superior',bed:'Mesa inferior',
 stop:'Dedo STOP',support:'Dedo SUPPORT',
 upperClamp:'Amarre superior',lowerClamp:'Amarre inferior',
 upperAdapter:'Adaptador superior',lowerAdapter:'Adaptador de matrices',
 frontSupport:'Soporte delantero',punch:'Punzón montado',
 die:'Matriz montada',axesXYZ:'Recorridos X/R/Z/Y',
 mountDatums:'Ceros y referencias de montaje'
};
export function renderCadEvidence(){
 const host=$('machineCadSourceInventory'),status=$('machineCadCoverage');
 if(!host||!status)return;
 const model=getActiveMachineProfile().id;
 let local={};
 try{
  const key=machineConfigurationKey(getActiveMachineConfig());
  // CAD importados para otra configuración NO cuentan como disponibles.
  local=Object.fromEntries(Object.entries(loadMachineCad(localStorage))
   .filter(([,record])=>record.machineConfigKey===key));
 }catch(error){
  status.textContent='Biblioteca CAD no legible: '+error.message;
  status.dataset.error='true';return;
 }
 // No contabilizar un DXF cualquiera como si fuera el punzón
 // realmente MONTADO en la pieza activa. La identidad de id importa.
 const activePiece=window.PLEGADOX_STATE?.()?.piece||null;
 const tools=loadImportedTools(localStorage).filter(t=>t.importedDxf===true);
 if(tools.some(t=>t.id===activePiece?.punch&&t.opening==null))
  local.punch={points:[[0,0]]};
 if(tools.some(t=>t.id===activePiece?.die&&t.opening!=null))
  local.die={points:[[0,0]]};
 let coverage=null;
 try{coverage=cadCoverage(model,local);}catch(error){
  status.textContent='No hay inventario CAD de esta familia: '+error.message;
  status.dataset.error='true';
 }
 const count=CAD_EVIDENCE_SOURCES.filter(s=>s.cadUrl).length;
 if(coverage){status.dataset.error='false';
 status.textContent='Cobertura CAD registrada: '+coverage.importedCount+'/'+
  coverage.requiredCount+' categorías de posible interferencia con algún perfil importado. '+
  (coverage.missing.length?'Sin CAD cargado o sin descartar su presencia: '+
   coverage.missing.map(k=>ALL_LABELS[k]||k).join(', ')+'. ':'')+
  count+' descargas directas confirmadas en fabricantes; '+ 
  'NO instaladas automáticamente. Los CAD de familias de máquina no sirven para certificar una unidad.';}
 const fragment=document.createDocumentFragment();
 for(const item of CAD_EVIDENCE_SOURCES){
  const card=document.createElement('article');
  card.className='px-oem-cad-source';
  const title=document.createElement('strong');
  title.textContent=item.title;
  const details=document.createElement('small');
  const values=Object.entries(item.dimensions).map(([k,v])=>k+': '+v).join(' · ');
  details.textContent=item.maker+' / '+item.reference+
   ' · '+item.status+' · '+values;
  const text=document.createElement('p');text.className='hint';
  text.textContent=item.note+
   (item.format==='DXF_ZIP'?
    ' Extraer el archivo .DXF del ZIP antes de importarlo en PlegadoX.':'');
  const links=document.createElement('div');links.className='px-oem-cad-actions';
  const ficha=document.createElement('a');ficha.href=item.sourceUrl;
  ficha.target='_blank';ficha.rel='noopener noreferrer';
  ficha.textContent='Ficha de procedencia';
  links.append(ficha);
  if(item.cadUrl){
   const file=document.createElement('a');
   file.href=item.cadUrl;file.target='_blank';
   file.rel='noopener noreferrer';
   file.textContent='Descargar '+item.format+' oficial';
   links.append(file);
  }
  // Preparar el editor correspondiente SIN afirmar que el fichero
  // está descargado, instalarlo, ni copiar datums de otra referencia.
  // El operario debe importar el DXF real, escoger montaje y ocupar Z.
  const machineTypes=['ram','bed','stop','support','upperClamp',
   'lowerClamp','upperAdapter','lowerAdapter','frontSupport'];
  if(item.cadUrl||item.format?.startsWith('DXF')){
   const prepare=document.createElement('button');
   prepare.type='button';prepare.textContent='Preparar importación CAD';
   prepare.addEventListener('click',()=>{
    if(machineTypes.includes(item.kind)){
     const kind=$('machineCadKind'),file=$('machineCadFile');
     if(!kind||!file)return;
     kind.value=item.kind;file.value='';
     const ref=$('machineCadSource');
     if(ref)ref.value=(item.maker+' '+item.reference+
      ' | '+item.sourceUrl).slice(0,160);
     const state=$('machineCadStatus');
     if(state)state.textContent='Referencia '+item.reference+
      ' preparada. Importa su DXF en milímetros y mide X/Y/Z en el montaje REAL. '+
      'No reutilices un perfil parecido para certificar esta máquina.';
     $('machineCadPanel')?.scrollIntoView({behavior:'smooth',block:'start'});
    }else if(item.kind==='punch'||item.kind==='die'){
     const kind=$('toolDxfKind'),file=$('toolDxfFile');
     if(!kind||!file)return;
     // El change del importador borra el contorno anterior antes
     // de preparar otra referencia, evitando mezclas accidentales.
     file.value='';file.dispatchEvent(new Event('change'));
     kind.value=item.kind;kind.dispatchEvent(new Event('change'));
     const name=$('toolDxfName');
     if(name)name.value=(item.maker+' '+item.reference).slice(0,65);
     const angle=$('toolDxfAngle');
     if(angle&&Number.isFinite(item.dimensions.angleDeg))
      angle.value=String(item.dimensions.angleDeg);
     const opening=$('toolDxfOpening');
     if(opening&&Number.isFinite(item.dimensions.vOpeningMm))
      opening.value=String(item.dimensions.vOpeningMm);
     const tip=$('toolDxfTip');
     if(tip&&Number.isFinite(item.dimensions.tipRadiusMm))
      tip.value=String(item.dimensions.tipRadiusMm*2);
     const mount=$('toolDxfMount');
     if(mount)mount.value=[...mount.options].some(x=>x.value===item.mount)?
      item.mount:'Desconocido';
     const state=$('toolDxfStatus');
     if(state)state.textContent='Referencia '+item.reference+
      ' preparada. Importa el DXF OEM, revisa H, el montaje y la longitud. '+
      'Una V reversible requiere elegir la cara efectiva.';
     $('toolDxfPanel')?.scrollIntoView({behavior:'smooth',block:'start'});
    }
   });
   links.append(prepare);
  }
  card.append(title,details,text,links);fragment.append(card);
 }
 host.replaceChildren(fragment);
}
export function installCadEvidence(){
 if(!$('machineCadSourceInventory'))return;
 renderCadEvidence();
 if(typeof window!=='undefined'){
  window.addEventListener('plegadox:machineChanged',renderCadEvidence);
  window.addEventListener('plegadox:toolingChanged',renderCadEvidence);
  window.addEventListener('storage',renderCadEvidence);
 }
}
installCadEvidence();
