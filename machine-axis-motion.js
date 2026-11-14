/**
 * PlegadoX · evaluación de posiciones físicas de ejes Y1/Y2/X/R/Z1/Z2.
 *
 * No se inventan límites, velocidades ni ceros CNC. Sólo se valida un
 * recorrido aportado (o explícitamente programado) con rangos aportados.
 * Los segmentos se interpolan para revisión geométrica 3D opcional.
 * El control de ejes no reemplaza protecciones de máquina ni ensayo real.
 */
import {normalized} from './engine.js';
export const MOTION_AXES=Object.freeze(['Y1','Y2','X','R','Z1','Z2']);
export function motionPieceKey(input){
 const p=normalized(input);
 const data=JSON.stringify([p.flanges,p.angles,p.order,p.material,
  p.thickness,p.width,p.punch,p.die,p.punchOrientation,p.gaugeSideByBend,p.gaugeContactByBend]);
 // Clave de consistencia local (no firma criptográfica).
 let hash=2166136261;
 for(let i=0;i<data.length;i++){
  hash=Math.imul(hash^data.charCodeAt(i),16777619)>>>0;
 }
 return 'pieza-'+hash.toString(16).padStart(8,'0');
}
export const MOTION_KEY='plegadox:machine-motion:v1';
const finite=(n,label)=>{
 if(n===null||n===undefined||n==='')throw Error('Falta '+label);
 const x=Number(n);
 if(!Number.isFinite(x))throw Error('Valor no numérico de '+label);
 return x;
};
const tag=s=>String(s??'').trim().slice(0,80);
export function normalizeAxisMotion(raw){
 if(!raw||typeof raw!=='object')throw Error('Programa físico ausente');
 if(raw.unit!=='mm'||raw.timeUnit!=='s')
  throw Error('El recorrido debe declarar unit=mm y timeUnit=s');
 const source=raw.source;
 if(!['recorded','programmed'].includes(source))
  throw Error('Indicar source=recorded o programmed');
 if(!Array.isArray(raw.poses)||raw.poses.length<2||raw.poses.length>1500)
  throw Error('El recorrido requiere de 2 a 1500 poses');
 const limits={};
 for(const axis of MOTION_AXES){
  const range=raw.limits?.[axis];
  if(!range||typeof range!=='object')throw Error('Faltan límites de '+axis+' específicos de la máquina');
  const min=finite(range.min,axis+'.min'),max=finite(range.max,axis+'.max');
  if(min>=max)throw Error('Límites de '+axis+' invertidos o vacíos');
  const maxSpeed=range.maxSpeed==null?null:finite(range.maxSpeed,axis+'.maxSpeed');
  if(maxSpeed!==null&&maxSpeed<=0)throw Error('Velocidad máxima inválida de '+axis);
  limits[axis]={min,max,maxSpeed};
 }
 const poses=raw.poses.map((pose,index)=>{
  const time=finite(pose?.time,'tiempo '+index);
  if(time<0||index>0&&time<=Number(raw.poses[index-1].time))
   throw Error('Instantes de trayectoria sin orden creciente');
  const axes={};
  for(const axis of MOTION_AXES)
   axes[axis]=finite(pose?.axes?.[axis],axis+' en pose '+index);
  // El tiempo de la simulación sólo se conoce si el operario lo
  // vincula explícitamente al registro CNC; NO equivale a time en s.
  const sheetSceneTime=pose.sceneTime==null?null:
   finite(pose.sceneTime,'posición temporal de chapa '+index);
  if(sheetSceneTime!==null&&(sheetSceneTime<0||sheetSceneTime>100000))
   throw Error('Tiempo de simulación de chapa fuera de rango');
  return {time,phase:tag(pose.phase)||'sin-fase',axes,
   ...(sheetSceneTime===null?{}:{sceneTime:sheetSceneTime})};
 });
 const profile={format:'plegadox-axis-motion-v1',unit:'mm',timeUnit:'s',
  source,sourceDescription:tag(raw.sourceDescription)||'CNC sin procedencia documentada',
  machineId:tag(raw.machineId)||'Trumpf V85 (serie no cotejada)',
  pieceKey:tag(raw.pieceKey),limits,poses,
  industrialVerified:false,operatorSafetyVerified:false};
 return profile;
}
export function interpolateMotion(program,time){
 const p=normalizeAxisMotion(program);
 if(!Number.isFinite(Number(time)))throw Error('Instante no válido');
 const t=Number(time),samples=p.poses;
 if(t<=samples[0].time)return samples[0];
 if(t>=samples.at(-1).time)return samples.at(-1);
 let i=0;
 while(i<samples.length-2&&samples[i+1].time<t)i++;
 const a=samples[i],b=samples[i+1],u=(t-a.time)/(b.time-a.time);
 const axes={};
 for(const axis of MOTION_AXES)
  axes[axis]=a.axes[axis]+(b.axes[axis]-a.axes[axis])*u;
 return {time:t,phase:a.phase===b.phase?a.phase:a.phase+' → '+b.phase,axes};
}
export function assessAxisMotion(program,options={}){
 if(program==null)return {status:'EJES_SIN_PROGRAMA_FISICO',checked:false,
  violations:[],unknown:['No existen poses reales de Y1/Y2/X/R/Z1/Z2 para esta pieza'],
  verified:false,canApproveForMachine:false};
 let p;
 try{p=normalizeAxisMotion(program);}
 catch(error){return {status:'DATOS_EJES_INCORRECTOS',checked:false,
  violations:[],unknown:[String(error.message||error)],
  verified:false,canApproveForMachine:false};}
 const violations=[],samplesPerSegment=Math.max(2,Math.min(50,
  Math.trunc(Number(options.samplesPerSegment)||12)));
 let checked=0;
 const collisionAt=typeof options.collisionAt==='function'?options.collisionAt:null;
 const physicalSource=p.source==='recorded';
 for(let i=0;i<p.poses.length;i++){
  const pose=p.poses[i];
  for(const axis of MOTION_AXES){
   const v=pose.axes[axis],range=p.limits[axis];
   if(v<range.min-1e-7||v>range.max+1e-7)
    violations.push({kind:'travel-limit',axis,pose:i,value:v,
     min:range.min,max:range.max});
  }
  if(i===0)continue;
  const a=p.poses[i-1],b=pose,dt=b.time-a.time;
  for(const axis of MOTION_AXES){
   const speed=Math.abs(b.axes[axis]-a.axes[axis])/dt;
   const vmax=p.limits[axis].maxSpeed;
   if(vmax!=null&&speed>vmax+1e-7)
    violations.push({kind:'axis-speed',axis,pose:i,velocity:speed,max:vmax});
  }
  if(!collisionAt)continue;
  for(let step=0;step<=samplesPerSegment;step++){
   const t=a.time+dt*step/samplesPerSegment;
   const sample=interpolateMotionUnchecked(a,b,t);
   checked++;
   const collisions=collisionAt(sample);
   if(!Array.isArray(collisions))
    throw Error('El comprobador de sólidos debe devolver una lista');
   for(const item of collisions)
    if(item&&item.collision===true)
     violations.push({kind:'volume-contact',axis:null,pose:i,
      time:t,object:String(item.object||'desconocido')});
  }
 }
 const unknown=[
  'La comprobación se limita a los ejes y rangos DECLARADOS; no verifica el cero CNC ni la exactitud de sus medidas',
  'No se conocen por defecto todos los amarres, accesorios, espacios de manos ni el volumen CAD de la pieza en maniobras',
  ...(collisionAt?['Colisiones muestreadas: los intervalos entre muestras no se han certificado']:
   ['No se han proporcionado sólidos CAD vinculados a las posiciones de los ejes'])
 ];
 return {status:violations.length?'RECORRIDO_CON_INCIDENCIAS':
  physicalSource?'RECORRIDO_REGISTRADO_SIN_CERTIFICACION':
   'RECORRIDO_PROGRAMADO_SIN_CERTIFICACION',
  checked:true,source:p.source,posesChecked:p.poses.length,
  segmentCount:p.poses.length-1,framesChecked:checked,
  samplesPerSegment:collisionAt?samplesPerSegment:0,
  violations,unknown,verified:false,canApproveForMachine:false};
}
function interpolateMotionUnchecked(a,b,t){
 const f=(t-a.time)/(b.time-a.time),axes={};
 for(const axis of MOTION_AXES)
  axes[axis]=a.axes[axis]+(b.axes[axis]-a.axes[axis])*f;
 return {time:t,phase:a.phase===b.phase?a.phase:a.phase+' → '+b.phase,axes};
}
export function saveAxisMotion(storage,raw){
 if(!storage?.setItem)throw Error('Almacenamiento no disponible');
 const motion=normalizeAxisMotion(raw);
 storage.setItem(MOTION_KEY,JSON.stringify(motion));
 return motion;
}
export function loadAxisMotion(storage){
 if(!storage?.getItem)return null;
 const raw=storage.getItem(MOTION_KEY);
 if(raw==null)return null;
 let parsed;
 try{parsed=JSON.parse(raw);}catch{throw Error('Registro de ejes dañado');}
 return normalizeAxisMotion(parsed);
}
export function clearAxisMotion(storage){
 storage?.removeItem?.(MOTION_KEY);
}
