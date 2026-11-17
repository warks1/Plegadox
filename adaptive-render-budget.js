/** PlegadoX R125 · presupuesto gráfico, no modifica cálculos físicos. */
export const QUALITY_MODES=Object.freeze(['auto','eco','balanced','high']);
export function renderBudget(device={},mode='auto'){
 const width=Math.max(1,Number(device.width)||800);
 const height=Math.max(1,Number(device.height)||600);
 const dpr=Math.max(1,Math.min(4,Number(device.dpr)||1));
 const memory=Number(device.memory)||0;
 const cores=Number(device.cores)||0;
 const android=!!device.android;
 const largePixels=width*height*dpr*dpr>1800000;
 const constrained=(memory>0&&memory<=4)||(cores>0&&cores<=4)||(android&&largePixels);
 const tier=mode==='eco'?'eco':mode==='balanced'?'balanced':mode==='high'?'high':constrained?'eco':'balanced';
 return Object.freeze({tier,dpr:Math.min(dpr,tier==='eco'?1:tier==='balanced'?1.5:2),
  machineIntervalMs:tier==='eco'?140:tier==='balanced'?80:64,
  sceneIntervalMs:tier==='eco'?230:tier==='balanced'?130:100,
  statusIntervalMs:tier==='eco'?400:250,
  maxFaces:tier==='eco'?1200:tier==='balanced'?2500:4200,
  // Cap de píxeles: tablet Galaxy con UHD nunca reserva decenas de MB
  // solo para redibujar el visor. El modo alto también está acotado.
  maxCanvasPixels:tier==='eco'?1200000:tier==='balanced'?2200000:3600000,
  maxCachedFrames:tier==='eco'?2:tier==='balanced'?3:4,
  reason:mode==='auto'?(constrained?'dispositivo/contenido de alta densidad':'rendimiento normal'):'selección manual'});
}
export const QUALITY_STORAGE_KEY='plegadox:render-quality:r125';
export function readQuality(storage){
 try{
  const value=storage?.getItem?.(QUALITY_STORAGE_KEY)||'auto';
  return QUALITY_MODES.includes(value)?value:'auto';
 }catch{return 'auto';}
}
export function saveQuality(storage,mode){
 if(!QUALITY_MODES.includes(mode))throw Error('Calidad gráfica desconocida');
 storage?.setItem?.(QUALITY_STORAGE_KEY,mode);
 return mode;
}
export function browserRenderBudget(win,mode='auto'){
 const nav=win?.navigator||{};
 return renderBudget({width:win?.innerWidth,height:win?.innerHeight,
  dpr:win?.devicePixelRatio,cores:nav.hardwareConcurrency,
  memory:nav.deviceMemory,android:/Android/i.test(nav.userAgent||'')},mode);
}
