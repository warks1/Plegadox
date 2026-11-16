/**
 * PlegadoX R109 · inventario de procedencia y cobertura de CAD.
 * Mostrar ENLACES no equivale a instalar archivos ni verificar montaje.
 */
import {CAD_EVIDENCE_SOURCES,cadCoverage} from './cad-evidence.js';
import {loadMachineCad} from './machine-cad.js';
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
 try{local=loadMachineCad(localStorage);}catch(error){
  status.textContent='Biblioteca CAD no legible: '+error.message;
  status.dataset.error='true';return;
 }
 // Un perfil personalizado no certifica el útil de la pieza activa.
 // Se contabiliza sólo que exista ALGÚN DXF real guardado, nunca
 // como ficha exacta del punzón/matriz montado.
 const tools=loadImportedTools(localStorage).filter(t=>t.importedDxf===true);
 if(tools.some(t=>t.opening==null))local.punch={points:[[0,0]]};
 if(tools.some(t=>t.opening!=null))local.die={points:[[0,0]]};
 const coverage=cadCoverage(model,local);
 const count=CAD_EVIDENCE_SOURCES.filter(s=>s.cadUrl).length;
 status.dataset.error='false';
 status.textContent='Cobertura CAD registrada: '+coverage.importedCount+'/'+
  coverage.requiredCount+' categorías con algún perfil importado. '+
  (coverage.missing.length?'Faltan: '+coverage.missing.map(k=>ALL_LABELS[k]||k).join(', ')+'. ':'')+
  count+' descargas directas confirmadas en fabricantes; '+ 
  'NO instaladas automáticamente. Los CAD de familias de máquina no sirven para certificar una unidad.';
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
  text.textContent=item.note;
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
