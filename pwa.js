// PlegadoX · refresco seguro de la aplicación instalada.
// Si una revisión nueva asume el control, recargar la pantalla para que
// el diseño y el motor no mezclen versiones de caché.
if('serviceWorker' in navigator &&
 (location.protocol==='https:' ||
  ['localhost','127.0.0.1'].includes(location.hostname))){
 const previousController=navigator.serviceWorker.controller;
 if(previousController){
  navigator.serviceWorker.addEventListener('controllerchange',()=>{
   if(navigator.serviceWorker.controller &&
      navigator.serviceWorker.controller!==previousController)location.reload();
  });
 }
 window.addEventListener('load',()=>{
  navigator.serviceWorker.register('./sw.js',{scope:'./',updateViaCache:'none'})
   .then(reg=>reg.update())
   .catch(err=>console.info('PlegadoX sin caché offline:',err.message));
 },{once:true});
}
