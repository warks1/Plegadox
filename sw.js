// PlegadoX · caché offline estática. Se versiona para no arrastrar JS obsoleto.
const CACHE='plegadox-static-0.9.96-safe-sw-r122';
const APP_FILES=[
 "./",
 "./app.js",
 "./cybelec-reference.js",
 "./backgauge-placement.js",
 "./build-info.json",
 "./bend-contact.js",
 "./boceto2.js",
 "./canvas-path.js",
 "./catalog.js",
 "./cad-evidence.js",
 "./cad-zip-reader.js",
 "./cad-import-sources.js",
 "./planner-evidence-integrity.js",
 "./tool-cad-oem-audit.js",
 "./cad-evidence-ui.js",
 "./cockpit.js",
 "./collision-playback-guard.js",
 "./dxf-export.js",
 "./engine.js",
 "./favicon.svg",
 "./icon-180.png",
 "./icon-192.png",
 "./icon-512.png",
 "./icon-premium-180.png",
 "./icon-premium-192.png",
 "./icon-premium-512.png",
 "./flat-layout.js",
 "./gauge-side-review.js",
 "./gauge-contact-advisor.js",
 "./gauge-interference.js",
 "./gauge-risk-status.js",
 "./punch-clearance.js",
 "./gauge-sequence-review.js",
 "./gauge-contact-solver.js",
 "./sample-gauge-migration.js",
 "./icons.svg",
 "./incident-navigation.js",
 "./index.html",
 "./titanium-loading-original.html",
 "./splash-foto-premium.html",
 "./splash-machine-assembly.svg",
 "./plegadox-premium-selected.png",
 "./bystronic-fit.js",
 "./machine-mounting.js",
 "./machine-config.js",
 "./machine-selection.js",
 "./gauge-motion-diagnostic.js",
 "./gauge-retract-motion.js",
 "./machine-editor.js",
 "./machine-cad.js",
 "./machine-ram-envelope.js",
 "./machine-cad-ui.js",
 "./machine-axis-motion.js",
 "./machine-axis-geometry.js",
 "./swept-volume.js",
 "./machine-visual.js",
 "./industrial-tool-finish.js",
 "./manifest.webmanifest",
 "./pwa.js",
 "./render-enhancements.js",
 "./responsive.js",
 "./software-about.js",
 "./software-update-policy.js",
 "./sequence-advisor.js",
 "./integrated-bend-planner.js",
 "./volume-engine.js",
 "./volume-trajectory-review.js",
 "./sheet-interference.js",
 "./sheet-solid.js",
 "./studio.js",
 "./storage-notice.js",
 "./styles.css",
 "./sw.js",
 "./technical-section.js",
 "./tool-collision.js",
 "./tool-profiles.js",
 "./tool-height-audit.js",
 "./tooling-advisor.js",
 "./touch-programmer.js",
 "./mouse-programmer.js",
 "./workshop-audit.js",
 "./project-backup.js",
 "./project-library.js",
 "./workshop-measurements.js",
 "./tool-cad-datum.js",
 "./tool-dxf.js",
 "./tool-dxf-export.js",
 "./tool-import-ui.js",
 "./custom-tool-geometry.js",
 "./custom-tool-builder.js",
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
 // Nunca almacenar en caché el token privado ni la respuesta de copias USB.
 if(new URL(request.url).pathname.startsWith('/__plegadox_usb__/'))return;
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
