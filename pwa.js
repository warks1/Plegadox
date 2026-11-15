// PlegadoX · refresco seguro de la aplicación instalada.
// Si una revisión nueva asume el control, recargar la pantalla para que
// el diseño y el motor no mezclen versiones de caché.
if('serviceWorker' in navigator &&
 (location.protocol==='https:' ||
  ['localhost','127.0.0.1'].includes(location.hostname))){
 // No recargar automáticamente una pieza mientras se programa o simula.
 // Una toma de control del nuevo SW sólo señala disponibilidad:
 // el botón «Actualizar software» comprueba release y conserva datos.
 const previousController=navigator.serviceWorker.controller;
 if(previousController){
  navigator.serviceWorker.addEventListener('controllerchange',()=>{
   if(navigator.serviceWorker.controller &&
      navigator.serviceWorker.controller!==previousController){
    window.dispatchEvent(new CustomEvent('plegadox:cacheControllerChanged'));
   }
  });
 }
 // Con carga dinámica, el evento load puede haber ocurrido ANTES de
 // importar pwa.js. Registrar inmediatamente si el documento ya acabó.
 const register=()=>{
  navigator.serviceWorker.register('./sw.js',{scope:'./',updateViaCache:'none'})
   .then(reg=>reg.update())
   .catch(err=>console.info('PlegadoX sin caché offline:',err.message));
 };
 if(document.readyState==='complete')register();
 else window.addEventListener('load',register,{once:true});
}
