// PlegadoX · caché offline estática. Se versiona para no arrastrar JS obsoleto.
const CACHE='plegadox-static-0.9.0-playback-continuous-14';
const APP_FILES=[
 "./",
 "./app.js",
 "./backgauge-placement.js",
 "./build-info.json",
 "./bend-contact.js",
 "./boceto2.js",
 "./canvas-path.js",
 "./catalog.js",
 "./cockpit.js",
 "./collision-playback-guard.js",
 "./dxf-export.js",
 "./engine.js",
 "./favicon.svg",
 "./flat-layout.js",
 "./gauge-side-review.js",
 "./gauge-interference.js",
 "./icons.svg",
 "./incident-navigation.js",
 "./index.html",
 "./machine-config.js",
 "./machine-editor.js",
 "./machine-visual.js",
 "./manifest.webmanifest",
 "./pwa.js",
 "./render-enhancements.js",
 "./responsive.js",
 "./sequence-advisor.js",
 "./sheet-interference.js",
 "./sheet-solid.js",
 "./studio.js",
 "./styles.css",
 "./sw.js",
 "./technical-section.js",
 "./tool-collision.js",
 "./tool-profiles.js",
 "./tooling-advisor.js",
 "./tool-dxf.js",
 "./tool-import-ui.js",
 "./validation.js",
 "./viewer-profile.js"
];
self.addEventListener('install',event=>{
 event.waitUntil((async()=>{
  const cache=await caches.open(CACHE);
  await cache.addAll(APP_FILES);
  await self.skipWaiting();
 })());
});
self.addEventListener('activate',event=>{
 event.waitUntil((async()=>{
  const keys=await caches.keys();
  await Promise.all(keys.filter(key=>key.startsWith('plegadox-static-')&&key!==CACHE)
   .map(key=>caches.delete(key)));
  await self.clients.claim();
 })());
});
self.addEventListener('fetch',event=>{
 const request=event.request;
 if(request.method!=='GET'||new URL(request.url).origin!==self.location.origin)return;
 if(request.mode==='navigate'){
  event.respondWith((async()=>{
   try{return await fetch(request);}
   catch{return (await caches.match(request))||
      (await caches.match('./index.html'))||Response.error();}
  })());
  return;
 }
 // Estrategia network-first para los módulos de la app: el navegador
 // obtiene la versión actual cuando hay red, con respaldo offline.
 // Antes se servía siempre desde caché y podía mostrar un tope antiguo.
 event.respondWith((async()=>{
  try{
   const response=await fetch(request);
   if(response.ok){
    const cache=await caches.open(CACHE);
    await cache.put(request,response.clone());
   }
   return response;
  }catch{
   return (await caches.match(request))||Response.error();
  }
 })());
});
