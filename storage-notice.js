/** Avisos no descartables automáticamente ante riesgo de pérdida de datos locales. */
export function notifyStorageFailure(action,error){
 console.error('[PlegadoX] '+action,error);
 if(typeof document==='undefined')return;
 const show=()=>{
  let banner=document.getElementById('px-storage-error');
  if(!banner){
   banner=document.createElement('div');
   banner.id='px-storage-error';
   banner.className='px-storage-error';
   banner.setAttribute('role','alert');
   banner.setAttribute('aria-live','assertive');
   const description=document.createElement('span');
   description.className='px-storage-error-message';
   const dismiss=document.createElement('button');
   dismiss.type='button';dismiss.textContent='Cerrar aviso';
   dismiss.setAttribute('aria-label','Cerrar aviso de error de almacenamiento');
   dismiss.addEventListener('click',()=>banner.remove());
   banner.append(description,dismiss);
   (document.body||document.documentElement).append(banner);
  }
  const detail=error instanceof Error?error.message:String(error||'error desconocido');
  banner.querySelector('.px-storage-error-message').textContent=
   '⚠ '+action+'. Es posible que los cambios no estén guardados. '+
   'Exporta una copia del proyecto antes de cerrar la aplicación. Detalle: '+detail;
 };
 if(document.body)show();
 else document.addEventListener('DOMContentLoaded',show,{once:true});
}
