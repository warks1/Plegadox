/**
 * PlegadoX R128 · declaración explícita de dos dedos Z1 y Z2.
 * No se deducen sus centros, anchuras ni ceros CNC de las cotas L
 * Cybelec, del largo de mesa ni del ancho de chapa.
 *
 * Una calibración vincula DOS bandas Z documentadas a UN contorno
 * DXF compartido o a DOS perfiles independientes por dedo, en UNA pose.
 * Fuera de dicha pose la posición se considera DESCONOCIDA.
 */
export const GAUGE_FINGERS_KEY='plegadox:machine-gauge-fingers:v1';
/**
 * Identificador local exacto del DXF y montaje activo. Si la geometría,
 * fuente o offsets del dedo cambian, sus cotas Z se invalidan. No es
 * una firma criptográfica ni demuestra autenticidad del fabricante.
 */
export function gaugeSectionFingerprint(record){
 if(!record||!/^(?:stop|support)(?:Z1|Z2)?$/.test(record.kind)||
  !Array.isArray(record.points))return null;
 const data=JSON.stringify([record.kind,record.points,
  record.offsetX,record.offsetY,record.zMin,record.zMax,
  record.source,record.sourceFormat,record.machineConfigKey]);
 let h=2166136261;
 for(let i=0;i<data.length;i++)
  h=Math.imul(h^data.charCodeAt(i),16777619)>>>0;
 return 'cad-'+h.toString(16).padStart(8,'0');
}
const finite=(v,label,min,max)=>{
 if(v===null||v===undefined||v===''||!Number.isFinite(Number(v))||
  Number(v)<min||Number(v)>max)throw Error(label+' debe estar entre '+min+' y '+max+' mm');
 return Number(v);
};
const band=(v,label)=>{
 if(!v||typeof v!=='object')throw Error('Faltan cotas de '+label);
 const zMin=finite(v.zMin,label+'.zMin',-5000,5000);
 const zMax=finite(v.zMax,label+'.zMax',-5000,5000);
 if(zMax-zMin<.1)throw Error('La anchura Z de '+label+' debe ser al menos 0,1 mm');
 return {zMin,zMax,widthMm:zMax-zMin,centerMm:(zMin+zMax)/2};
};
export function normalizeGaugeFingers(raw){
 if(!raw||raw.version!==1||raw.unit!=='mm')
  throw Error('Se necesita versión 1 y unidades mm para dedos Z');
 const machineConfigKey=String(raw.machineConfigKey||'');
 if(!/^(?:machine|v85)-[0-9a-f]{8}$/.test(machineConfigKey))
  throw Error('Vincular las cotas Z a la revisión real de máquina');
 const profileKind=raw.profileKind;
 if(profileKind!=='stop'&&profileKind!=='support')
  throw Error('Elegir contorno físico Stop o Support');
 const shared=raw.sameSectionConfirmed===true;
 let profileFingerprint=null,profileFingerprints=null;
 if(shared){
  if(!/^cad-[0-9a-f]{8}$/.test(String(raw.profileFingerprint||'')))
   throw Error('Vincular ambas bandas Z al MISMO contorno DXF importado');
  profileFingerprint=String(raw.profileFingerprint);
 }else{
  if(!['Z1','Z2'].every(axis=>
   /^cad-[0-9a-f]{8}$/.test(String(raw.profileFingerprints?.[axis]||''))))
   throw Error('Si no hay MISMO contorno confirmado, identificar dos DXF independientes Z1 y Z2');
  profileFingerprints={Z1:String(raw.profileFingerprints.Z1),
   Z2:String(raw.profileFingerprints.Z2)};
 }
 const source=String(raw.source||'').trim();
 if(source.length<5||source.length>160)
  throw Error('Indicar documento/cota de origen Z de los dos dedos');
 const referenceSceneTime=finite(raw.referenceSceneTime,'Tiempo de pose de referencia',0,100000);
 const z1=band(raw.fingers?.Z1,'Z1'),z2=band(raw.fingers?.Z2,'Z2');
 if(Math.min(z1.zMax,z2.zMax)-Math.max(z1.zMin,z2.zMin)>1e-7)
  throw Error('Z1 y Z2 ocupan la misma anchura; verificar medidas y cero Z');
 return {version:1,unit:'mm',machineConfigKey,profileKind,
  profileFingerprint,profileFingerprints,
  sameSectionConfirmed:shared,source,referenceSceneTime,
  fingers:{Z1:z1,Z2:z2},
  industrialVerified:false,cncValidated:false};
}
export function loadGaugeFingers(storage){
 if(!storage?.getItem)return null;
 const text=storage.getItem(GAUGE_FINGERS_KEY);
 if(text==null)return null;
 return normalizeGaugeFingers(JSON.parse(text));
}
export function saveGaugeFingers(storage,raw){
 if(!storage?.setItem)throw Error('Almacenamiento Z de dedos no disponible');
 const verified=normalizeGaugeFingers(raw);
 storage.setItem(GAUGE_FINGERS_KEY,JSON.stringify(verified));
 return verified;
}
export function clearGaugeFingers(storage){
 if(!storage?.removeItem)throw Error('Almacenamiento Z de dedos no disponible');
 storage.removeItem(GAUGE_FINGERS_KEY);
}
const unavailable=(status,reason)=>({status,reason,modeled:false,
 slices:[],verified:false,canApproveForMachine:false});
/** Construye las DOS bandas únicamente si la pose y el DXF coinciden. */
export function gaugeFingerSlices(raw,{machineConfigKey,profileKind,
 profileFingerprint,profileFingerprints=null,gaugeProfiles=null,sceneTime,
 gauge}={}){
 if(!raw)return unavailable('FALTAN_Z1_Z2','Posiciones Z1/Z2 no declaradas');
 let record;
 try{record=normalizeGaugeFingers(raw);}
 catch(error){return unavailable('COTAS_Z_INVALIDAS',String(error.message||error));}
 if(record.machineConfigKey!==machineConfigKey)
  return unavailable('OTRA_CONFIGURACION','Las cotas Z pertenecen a otra configuración de máquina');
 if(record.profileKind!==profileKind)
  return unavailable('OTRO_TIPO_DE_DEDO','Las bandas Z se declararon para el otro perfil Stop/Support');
 if(!Number.isFinite(sceneTime)||
  Math.abs(sceneTime-record.referenceSceneTime)>1e-7)
  return unavailable('OTRA_POSE','La Z declarada corresponde sólo a la pose de referencia, no al recorrido CNC');
 const available=body=>body?.valid&&Array.isArray(body.polygon)&&
  String(body.provenance||'').startsWith('perfil CAD importado ');
 const sources={};
 if(record.sameSectionConfirmed){
  if(!available(gauge))return unavailable('FALTA_DXF_DEL_DEDO',
   'Ambos dedos comparten sección: importar el DXF del perfil Stop/Support seleccionado');
  if(record.profileFingerprint!==profileFingerprint)
   return unavailable('DXF_CAMBIADO',
    'El contorno o montaje DXF compartido cambió: las cotas Z deben comprobarse de nuevo');
  sources.Z1=gauge;sources.Z2=gauge;
 }else{
  for(const axis of ['Z1','Z2']){
   if(!available(gaugeProfiles?.[axis]))
    return unavailable('FALTA_DXF_'+axis,
     'Falta el DXF individual de '+axis+' del tipo '+profileKind);
   if(record.profileFingerprints[axis]!==profileFingerprints?.[axis])
    return unavailable('DXF_CAMBIADO_'+axis,
     'El DXF o montaje del dedo '+axis+' cambió; revisar cotas Z antes de reutilizarlas');
   sources[axis]=gaugeProfiles[axis];
  }
 }
 const slices=['Z1','Z2'].map(axis=>({
  id:'tope-'+axis,axis,polygon:sources[axis].polygon,
  zMin:record.fingers[axis].zMin,zMax:record.fingers[axis].zMax,
  provenance:sources[axis].provenance+' · dedo '+axis+
   ' · Z declarada: '+record.source+' · montaje y ejes CNC sin certificar'
 }));
 return {status:record.sameSectionConfirmed?
  'DOS_DEDOS_Z_EN_POSE_DECLARADA':'DOS_PERFILES_DXF_INDEPENDIENTES',
  reason:(record.sameSectionConfirmed?
   'Dos dedos con sección común':'Cada dedo utiliza su propio DXF y offsets X/Y')+
   '; solo la pose de referencia, no la trayectoria completa ni la máquina real',
  modeled:true,slices,verified:false,canApproveForMachine:false};
}
