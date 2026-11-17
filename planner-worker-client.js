// Only data used by geometry; never transfer project library or personal data.
const GEOMETRY_KEYS=new Set(['plegadox:active-machine:v1','plegadox:trumpf-v85:v1',
 'plegadox:machine-cad:v1','plegadox:machine-motion:v1','plegadox:axis-cad-mapping:v1']);
export function plannerStorageSnapshot(storage){
 const result={};if(!storage)return result;
 for(let i=0;i<storage.length;i++){
  const key=storage.key(i);
  if(GEOMETRY_KEYS.has(key)||key?.startsWith('plegadox:bystronic-fit:v1')){
   const value=storage.getItem(key);if(value!==null)result[key]=value;
  }
 }
 return result;
}
export function createPlannerRunner(makeWorker=()=>new Worker(new URL('./planner-worker.js',import.meta.url),{type:'module'})){
 let active=null;
 const cancel=()=>{
  if(!active)return;
  const old=active;active=null;clearTimeout(old.timer);old.worker.terminate();
  const error=new Error('Cálculo sustituido por parámetros nuevos.');error.name='AbortError';old.reject(error);
 };
 return {cancel,run(snapshot){
  cancel();
  return new Promise((resolve,reject)=>{
   let worker;
   try{worker=makeWorker();}catch{reject(new Error('El navegador no admite el cálculo en segundo plano. Usa HTTPS y un navegador actualizado.'));return;}
   const job={worker,reject,timer:null};active=job;
   const finish=(error,report)=>{
    if(active!==job)return;
    active=null;clearTimeout(job.timer);worker.terminate();
    error?reject(error):resolve(report);
   };
   worker.onmessage=event=>event.data?.ok?finish(null,event.data.report):finish(new Error(event.data?.error||'Respuesta de cálculo no válida.'));
   worker.onerror=()=>finish(new Error('No se pudo iniciar o completar el cálculo en segundo plano. La edición manual sigue disponible.'));
   worker.onmessageerror=()=>finish(new Error('No se pudo leer el resultado del cálculo.'));
   job.timer=setTimeout(()=>finish(new Error('El cálculo superó 45 segundos; se canceló para liberar recursos.')),45000);
   try{worker.postMessage(snapshot);}catch(error){finish(error);}
  });
 }};
}
