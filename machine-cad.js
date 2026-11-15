/**
 * PlegadoX · biblioteca CAD 2D para componentes de máquina.
 *
 * Un contorno importado mantiene escala real en milímetros; el operario
 * declara la referencia local de montaje y la ocupación Z en la V85.
 * El DXF no acredita por sí solo amarre, plano de referencia, tolerancias,
 * límites de carrera ni verificación física. Nunca se marca certificado.
 */
import {parseToolDxf,validateContour} from './tool-dxf.js';

export const MACHINE_CAD_KEY='plegadox:machine-cad:v1';
export const MACHINE_CAD_KINDS=Object.freeze(['ram','bed','stop','support']);
/** Clave local de revisión de configuración: invalida un montaje CAD
 * cuando el operario modifica las cotas Cybelec a las que fue asociado. */
export function machineConfigurationKey(cfg){
 if(!cfg||typeof cfg!=='object')throw Error('Configuración de máquina ausente');
 const data=JSON.stringify([cfg.ram,cfg.bed,cfg.stop,cfg.support,
  cfg.ramOrigin,cfg.holderOrigin,cfg.ramWidth,cfg.holderWidth,
  cfg.toolWorkingDistance,
  // La misma longitud de mesa NO convierte PR100, EP II y AFM EP
  // en máquinas intercambiables; las fijaciones y el montaje mandan.
  ...(cfg.profileId?[cfg.profileId,cfg.upperClampingSystem,cfg.lowerDieSystem,
   cfg.daylightMeasured,cfg.upperAssemblyProjection,
   cfg.lowerAdapterHeight,cfg.lowerDieProjection]:[])]);
 let hash=2166136261;
 for(let i=0;i<data.length;i++)hash=Math.imul(hash^data.charCodeAt(i),16777619)>>>0;
 return (cfg.profileId?'machine-':'v85-')+hash.toString(16).padStart(8,'0');
}
const MAX_WIDTH=4000,MAX_HEIGHT=4000;
const finite=(n,min,max,label)=>{
 const v=Number(n);
 if(n==null||n===''||!Number.isFinite(v)||v<min||v>max)
  throw Error(label+' debe ser un número entre '+min+' y '+max+' mm');
 return v;
};
const typed=(value,len,label)=>{
 const text=String(value??'').trim();
 if(!text||text.length>len)throw Error(label+' obligatorio (máx. '+len+' caracteres)');
 return text;
};
export function machineCadDatum(kind){
 if(kind==='ram')return 'punta del punzón (se mueve con Y)';
 if(kind==='bed')return 'superficie nominal superior de la V (fija)';
 if(kind==='stop'||kind==='support')return 'origen del dedo de tope (se mueve con X/R)';
 throw Error('Componente no identificado');
}
export function machineCadFromDXF(dxf,options){
 const parsed=parseToolDxf(dxf,{maxWidth:MAX_WIDTH,maxHeight:MAX_HEIGHT});
 return normalizeMachineCad({
  ...options,points:parsed.points,
  unitsAssumed:parsed.unitsAssumed,sourceFormat:'DXF_ASCII_MM'
 });
}
export function normalizeMachineCad(raw){
 if(!raw||typeof raw!=='object')throw Error('Registro CAD incorrecto');
 const kind=raw.kind;
 if(!MACHINE_CAD_KINDS.includes(kind))throw Error('Tipo CAD no reconocido');
 const contour=validateContour(raw.points,{maxWidth:MAX_WIDTH,maxHeight:MAX_HEIGHT});
 const offsetX=finite(raw.offsetX,-4000,4000,'Referencia X');
 const offsetY=finite(raw.offsetY,-4000,4000,'Referencia Y');
 const zMin=finite(raw.zMin,-5000,5000,'Z mínimo');
 const zMax=finite(raw.zMax,-5000,5000,'Z máximo');
 if(zMax-zMin<.1)throw Error('El segmento ocupa una longitud Z positiva (mín. 0,1 mm)');
 const source=typed(raw.source,160,'Referencia del documento CAD');
 // Las coordenadas se conservan exactas; no derivar la geometría de
 // una foto o convertir una cota L* en un polígono ficticio.
 const points=contour.points.map(([x,y])=>[x,y]);
 return {format:'plegadox-machine-cad-v1',kind,points,offsetX,offsetY,
  zMin,zMax,source,sourceFormat:raw.sourceFormat==='DXF_ASCII_MM'?
   'DXF_ASCII_MM':'COORDENADAS_MM',
  unitsAssumed:raw.unitsAssumed===true,
  machineConfigKey:typeof raw.machineConfigKey==='string'?raw.machineConfigKey.slice(0,32):'',
  coordinateDatum:machineCadDatum(kind),
  dimensionWidth:contour.width,dimensionHeight:contour.height,
  // Una geometría CAD no equivale a conocer su registro en máquina.
  industrialVerified:false,cncKinematicsVerified:false,physicalTestVerified:false};
}
export function loadMachineCad(storage){
 if(!storage?.getItem)return {};
 const raw=storage.getItem(MACHINE_CAD_KEY);
 if(raw==null)return {};
 let saved;
 try{saved=JSON.parse(raw);}catch{throw Error('Biblioteca CAD dañada; no se modifica');}
 if(!saved||typeof saved!=='object'||Array.isArray(saved))
  throw Error('Biblioteca CAD incorrecta');
 const result={};
 for(const kind of MACHINE_CAD_KINDS){
  if(saved[kind]==null)continue;
  const p=normalizeMachineCad(saved[kind]);
  if(p.kind!==kind)throw Error('Componente CAD guardado bajo clave incorrecta');
  result[kind]=p;
 }
 return result;
}
export function saveMachineCad(storage,record){
 if(!storage?.setItem)throw Error('Almacenamiento CAD no disponible');
 const item=normalizeMachineCad(record),library=loadMachineCad(storage);
 const updated={...library,[item.kind]:item};
 storage.setItem(MACHINE_CAD_KEY,JSON.stringify(updated));
 return item;
}
export function removeMachineCad(storage,kind){
 if(!MACHINE_CAD_KINDS.includes(kind))throw Error('Tipo CAD desconocido');
 const library=loadMachineCad(storage);
 delete library[kind];storage.setItem(MACHINE_CAD_KEY,JSON.stringify(library));
 return library;
}
/** Puntos en la convención de escena: X profundidad, Y altura y Z transversal.
 * La traslación de la trancha conserva la referencia real de la punta.
 */
export function positionMachineCad(record,origin,options={}){
 const p=normalizeMachineCad(record);
 if(p.machineConfigKey&&options.machine&&
  p.machineConfigKey!==machineConfigurationKey(options.machine))
  throw Error('CAD de '+p.kind+' no coincide con la revisión actual de cotas de máquina');
 if(!origin||!Number.isFinite(origin.x)||!Number.isFinite(origin.y))
  throw Error('Origen real de colocación no definido');
 return {
  kind:p.kind,
  polygon:p.points.map(([x,y])=>({
   x:x+p.offsetX+origin.x,y:y+p.offsetY+origin.y
  })),
  zMin:p.zMin,zMax:p.zMax,
  provenance:'perfil CAD importado '+p.sourceFormat+' · '+p.source+
   ' · montaje, escala, ejes y referencia sin certificar',
  industrialVerified:false
 };
}
