import {PREFERENCE_FIELDS,normalizePreferences,parsePreferences} from './preferences-model.js';
import {normalizeMachineView} from './machine-view-options.js';
const KEY='plegadox:software-preferences:v1',VIEW_KEY='plegadox:visual-options:r124';
const $=id=>document.getElementById(id),root=document.documentElement;
let preferences=normalizePreferences(),loadError='';
try{preferences=normalizePreferences(JSON.parse(localStorage.getItem(KEY)||'{}'));}
catch{loadError='No se pudieron recuperar las preferencias. Se usan valores iniciales.';}
function status(text){$('preferencesStatus').textContent=text;}
for(const [key,field] of Object.entries(PREFERENCE_FIELDS)){
 const label=document.createElement('label'),select=document.createElement('select');
 label.textContent=field.label;select.id='pref-'+key;
 for(const [value,text] of Object.entries(field.values))select.add(new Option(text,value));
 label.append(select);$('softwareFields').append(label);
 select.addEventListener('change',()=>{preferences[key]=select.value;apply(key==='speed');save();});
}
function apply(updateSpeed=true){
 for(const key of Object.keys(PREFERENCE_FIELDS)){
  root.dataset['pref'+key[0].toUpperCase()+key.slice(1)]=preferences[key];
  $('pref-'+key).value=preferences[key];
 }
 const speed=$('speed');if(speed&&updateSpeed){speed.value=preferences.speed;speed.dispatchEvent(new Event('change',{bubbles:true}));}
}
function save(){
 try{localStorage.setItem(KEY,JSON.stringify(preferences));status('Preferencias guardadas.');}
 catch{status('Preferencias aplicadas en esta sesión; el navegador no permite guardarlas.');}
}
$('preferencesExport').onclick=()=>{
 const data={format:'plegadox-preferences',version:1,preferences,view:normalizeMachineView(window.PLEGADOX_MACHINE_VIEW)};
 const url=URL.createObjectURL(new Blob([JSON.stringify(data,null,2)],{type:'application/json'}));
 const a=document.createElement('a');a.href=url;a.download='PlegadoX-preferencias.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
};
$('preferencesImport').onchange=async event=>{
 const file=event.target.files?.[0];if(!file)return;
 try{
  if(file.size>65536)throw Error('El archivo supera 64 KB.');
  const incoming=parsePreferences(await file.text());
  const view=incoming.view?normalizeMachineView(incoming.view):null;
  // Persist both validated records before applying either; roll back on failure.
  const old=localStorage.getItem(KEY),oldView=localStorage.getItem(VIEW_KEY);
  try{localStorage.setItem(KEY,JSON.stringify(incoming.preferences));if(view)localStorage.setItem(VIEW_KEY,JSON.stringify(view));}
  catch(error){try{old===null?localStorage.removeItem(KEY):localStorage.setItem(KEY,old);oldView===null?localStorage.removeItem(VIEW_KEY):localStorage.setItem(VIEW_KEY,oldView);}catch{}throw error;}
  preferences=incoming.preferences;apply();
  if(view&&window.PLEGADOX_MACHINE_VIEW){Object.assign(window.PLEGADOX_MACHINE_VIEW,view);window.dispatchEvent(new Event('plegadox:viewPreferencesChanged'));}
  status('Preferencias importadas. La pantalla de inicio se aplicará al volver a abrir.');
 }catch(error){status('No se importó el archivo: '+error.message);}
 finally{event.target.value='';}
};
$('preferencesReset').onclick=()=>{preferences=normalizePreferences();apply();save();};
document.addEventListener('visibilitychange',()=>{if(document.hidden&&preferences.backgroundPause==='on')$('pauseBtn')?.click();});
document.addEventListener('keydown',event=>{
 if(preferences.shortcuts!=='on'||!event.altKey||event.ctrlKey||event.metaKey||event.repeat||event.target.closest?.('input,select,textarea,[contenteditable="true"]'))return;
 const actions={s:()=>$('saveBtn')?.click(),p:()=>$('pauseBtn')?.click(),v:()=>{document.querySelector('[data-tab="simulacion"]')?.click();$('machineOptionsButton')?.click();},o:()=>document.querySelector('[data-tab="software"]')?.click()};
 const action=actions[event.key.toLowerCase()];if(action){event.preventDefault();action();}
});
apply();document.querySelector('.nav[data-tab="'+preferences.startup+'"]')?.click();
status(loadError||'Preferencias listas.');
