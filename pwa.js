// Registro local opcional de la PWA; nunca bloquea la carga del motor.
if('serviceWorker' in navigator &&
 (location.protocol==='https:' ||
  ['localhost','127.0.0.1'].includes(location.hostname))){
 window.addEventListener('load',()=>{
  navigator.serviceWorker.register('./sw.js',{scope:'./'})
   .catch(err=>console.info('PlegadoX sin caché offline:',err.message));
 },{once:true});
}
