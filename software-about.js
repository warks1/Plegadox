import {validRelease,canInstallRelease} from './software-update-policy.js';
/**
 * PlegadoX · Centro de información y actualizaciones de la PWA.
 * Solo comprueba versiones publicadas en el MISMO origen.
 * No elimina piezas, proyectos, herramientas ni calibraciones locales.
 * No presume que actualizar la interfaz certifique el uso industrial.
 */
const BUILD='PLEGADOX-20261116-R104';
const VERSION='0.9.78';
const BASE=new URL('./',document.baseURI);
const CACHED_BUILD_KEY='plegadox:verified-loader-build';
const $=id=>document.getElementById(id);
const action=$('softwareUpdateBtn');
const topAction=$('forceUpdateBtn');
const status=$('softwareUpdateStatus');
const remoteVersion=$('softwarePublishedVersion');
const installed=$('softwareInstalledVersion');
const installedBuild=$('softwareInstalledBuild');
const currentVersion=$('softwareCurrentBuild');
if(installed)installed.textContent='v'+VERSION;
if(installedBuild)installedBuild.textContent=BUILD;
if(currentVersion)currentVersion.textContent='v'+VERSION;
function show(message,kind='info'){
 if(status){status.textContent=message;status.dataset.status=kind;}
 if(topAction)topAction.title=message;
}
function active(busy){
 for(const button of [action,topAction])if(button){
  button.disabled=busy;button.setAttribute('aria-busy',String(busy));
 }
}
async function publishedRelease(){
 const url=new URL('build-info.json',BASE);
 url.searchParams.set('from',BUILD);
 url.searchParams.set('t',Date.now().toString(36));
 const reply=await fetch(url.href,{cache:'no-store'});
 if(!reply.ok)throw Error('El servidor no responde a la consulta de versiones (HTTP '+reply.status+').');
 const data=await reply.json();
 if(!validRelease(data))throw Error('El servidor no devolvió una versión reconocible.');
 return data;
}
async function verifyPublishedHtml(expectedBuild){
 const url=new URL('index.html',BASE);
 url.searchParams.set('verify',expectedBuild);
 url.searchParams.set('t',Date.now().toString(36));
 const reply=await fetch(url.href,{cache:'no-store'});
 if(!reply.ok)throw Error('No se puede descargar la nueva aplicación (HTTP '+reply.status+').');
 const html=await reply.text();
 // Impide desinstalar la versión en caché mientras el servidor publica
 // un build-info.json nuevo pero todavía entrega index.html anterior.
 if(!html.includes('const BUILD="'+expectedBuild+'"'))
  throw Error('La última versión aún no está publicada completamente. Reintenta después.');
}
async function applyUpdate(release){
 show('Se ha encontrado la versión '+release.version+'. Verificando descarga…');
 await verifyPublishedHtml(release.build);
 show('Versión '+release.version+' disponible. Actualizando archivos; las piezas guardadas se conservan…');
 // Guardar los datos de usuario tal cual: sólo se invalidan cachés de
 // código PlegadoX, nunca localStorage/IndexedDB de piezas y perfiles.
 if('caches' in window){
  const keys=await caches.keys();
  await Promise.all(keys.filter(k=>k.startsWith('plegadox-static-'))
   .map(k=>caches.delete(k)));
 }
 try{localStorage.removeItem(CACHED_BUILD_KEY);}catch(error){
  // No bloquear la nueva descarga por restricciones al almacenamiento.
  console.warn('No se pudo invalidar la marca de versión:',error);
 }
 // Liberar worker viejo sin esperar a que cierre esta pantalla:
 // en la siguiente carga pwa.js registra el worker publicado.
 if('serviceWorker' in navigator){
  try{
   const reg=await navigator.serviceWorker.getRegistration(BASE.href);
   if(reg)await reg.unregister();
  }catch(error){console.warn('No se pudo retirar el worker anterior:',error);}
 }
 const next=new URL('index.html',BASE);
 next.searchParams.set('rev',release.build);
 next.searchParams.set('updated','1');
 window.location.replace(next.href);
}
let busy=false;
async function checkAndUpdate(){
 if(busy)return;
 document.querySelector('.nav[data-tab="acerca"]')?.click();
 if(!navigator.onLine){
  show('Sin conexión. Conéctate a Internet para buscar mejoras.','error');return;
 }
 busy=true;active(true);
 show('Consultando la versión publicada de PlegadoX…');
 try{
  const release=await publishedRelease();
  if(remoteVersion)remoteVersion.textContent='v'+release.version;
  if(!canInstallRelease(release,BUILD,VERSION)){
   show(release.build===BUILD?
    'PlegadoX ya está actualizado (v'+VERSION+'). No hay una versión posterior publicada.':
    'La versión publicada ('+release.version+') es anterior o no está identificada como una mejora. Se conserva la versión instalada.','ok');
   return;
  }
  show('Nueva versión detectada: v'+release.version+'. Preparando la instalación…');
  await applyUpdate(release);
 }catch(error){
  show('No se ha podido completar la actualización: '+(error?.message||String(error)), 'error');
 }finally{
  busy=false;active(false);
 }
}
window.addEventListener('plegadox:cacheControllerChanged',()=>{
 // No se pierden ajustes ni se reinicia la simulación por una instalación
 // silenciosa del worker. El operador decide CUÁNDO actualizar.
 show('Archivos de PlegadoX renovados en caché. Pulsa «Buscar e instalar actualizaciones» para comprobar la versión y aplicarla sin perder tus piezas.');
});
if(action)action.addEventListener('click',checkAndUpdate);
if(topAction)topAction.addEventListener('click',checkAndUpdate);

