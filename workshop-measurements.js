/**
 * Registro de mediciones reales para contrastar el motor de desarrollo.
 * Ninguna medición introducida por el operario se convierte por sí misma
 * en geometría CAD certificada, ni cambia el factor K automáticamente.
 */
import {development,normalized} from './engine.js';
export const MEASUREMENTS_KEY='plegadox:workshop-measurements:v1';
export const MEASUREMENT_FORMAT='plegadox-workshop-measurement-v1';
const MAX_RECORDS=120;
const numeric=(n,a,b)=>typeof n==='number'&&Number.isFinite(n)&&n>=a&&n<=b;
const validDate=s=>typeof s==='string'&&s.length>=10&&s.length<=35&&!Number.isNaN(Date.parse(s));
const round=n=>Math.round(n*1e5)/1e5;
const check=(ok,msg)=>{if(!ok)throw Error(msg);};
export function measurementKey(input){
 const p=normalized(input);
 return JSON.stringify([p.material,p.thickness,p.width,p.die,p.punch,p.datum,
  p.flanges,p.angles]);
}
export function calibrationSuggestion(piece,{measuredFlat,measuredRadius,anglesChecked=false}){
 const p=normalized(piece);
 check(numeric(measuredFlat,1,100000),'Longitud desarrollada medida inválida (mm)');
 const estimate=development(p),deviation=round(measuredFlat-estimate.length);
 if(!numeric(measuredRadius,.1,100))
  return {available:false,reason:'Para proponer K introduce también el radio interior medido en la pieza.',
   predictedFlat:round(estimate.length),measuredFlat,deviation,proposedK:null};
 if(!anglesChecked)
  return {available:false,reason:'Confirma antes las cotas exteriores/interiores y los ángulos reales de todos los pliegues.',
   predictedFlat:round(estimate.length),measuredFlat,deviation,proposedK:null};
 const lo=development({...p,radius:measuredRadius,kFactor:.15}).length;
 const hi=development({...p,radius:measuredRadius,kFactor:.6}).length;
 const slope=(hi-lo)/(.6-.15);
 if(!Number.isFinite(slope)||Math.abs(slope)<1e-7)
  return {available:false,reason:'No hay suficientes pliegues para estimar el factor K.',
   predictedFlat:round(estimate.length),measuredFlat,deviation,proposedK:null};
 const proposedK=.15+(measuredFlat-lo)/slope;
 if(!numeric(proposedK,.15,.6))
  return {available:false,
   reason:'La longitud medida requiere K='+round(proposedK)+
    ', fuera del intervalo 0,15–0,60. Revisar radio, cotas de alas, método de medida, útil y ángulos.',
   predictedFlat:round(estimate.length),measuredFlat,deviation,proposedK:null,
   rawK:round(proposedK)};
 return {available:true,predictedFlat:round(estimate.length),measuredFlat,
  deviation,measuredRadius,proposedK:round(proposedK),
  reason:'K inferido para ESTA pieza a partir de longitud, radio y cotas declaradas. No extrapolar a otras geometrías sin muestras.'};
}
export function validateMeasurementRecord(record){
 check(record&&typeof record==='object'&&record.format===MEASUREMENT_FORMAT,
  'Formato de medición incorrecto');
 check(typeof record.id==='string'&&/^wm-[a-z0-9-]{5,50}$/.test(record.id),
  'Identificador de medición inválido');
 check(validDate(record.recordedAt),'Fecha de medición inválida');
 check(typeof record.pieceName==='string'&&record.pieceName.length<=80,
  'Nombre de pieza inválido');
 check(typeof record.key==='string'&&record.key.length<=3500,
  'Clave de medición inválida');
 check(record.piece&&typeof record.piece==='object'&&
  record.key===measurementKey(record.piece),'Geometría de medición alterada');
 check(numeric(record.measuredFlat,1,100000),'Longitud medida inválida');
 check(record.measuredRadius===null||numeric(record.measuredRadius,.1,100),
  'Radio medido inválido');
 check(typeof record.anglesChecked==='boolean','Confirmación de ángulos inválida');
 check(typeof record.notes==='string'&&record.notes.length<=300,
  'Notas de ensayo inválidas');
 check(typeof record.calculated==='number'&&Number.isFinite(record.calculated),
  'Estimación original inválida');
 check(record.proposedK===null||numeric(record.proposedK,.15,.6),
  'Factor K calculado inválido');
 // No confiar en un campo arbitrario "verified" enviado desde un JSON.
 return {...record,verified:false,industrialApproval:false};
}
export function readMeasurements(storage){
 check(storage&&typeof storage.getItem==='function','Almacenamiento no disponible');
 const raw=storage.getItem(MEASUREMENTS_KEY);
 if(raw==null)return [];
 let rows;
 try{rows=JSON.parse(raw);}catch{throw Error('Registro de mediciones dañado; no se sobrescribe');}
 check(Array.isArray(rows)&&rows.length<=MAX_RECORDS,'Registro de mediciones inválido');
 const data=rows.map(validateMeasurementRecord);
 check(new Set(data.map(e=>e.id)).size===data.length,'Mediciones duplicadas');
 return data;
}
export function createMeasurement(piece,data,{now=new Date().toISOString(),id=null}={}){
 const p=normalized(piece);
 const measuredFlat=Number(data.measuredFlat);
 const measuredRadius=data.measuredRadius==null||data.measuredRadius===''?
  null:Number(data.measuredRadius);
 const anglesChecked=data.anglesChecked===true;
 const suggestion=calibrationSuggestion(p,{measuredFlat,measuredRadius,anglesChecked});
 const record={format:MEASUREMENT_FORMAT,
  id:id||'wm-'+Date.now().toString(36)+'-'+Math.random().toString(36).slice(2,10),
  recordedAt:now,pieceName:p.name,key:measurementKey(p),piece:p,
  measuredFlat,measuredRadius,anglesChecked,
  calculated:round(suggestion.predictedFlat),deviation:suggestion.deviation,
  proposedK:suggestion.available?suggestion.proposedK:null,
  notes:String(data.notes||'').slice(0,300),
  verified:false,industrialApproval:false};
 return validateMeasurementRecord(record);
}
export function persistMeasurement(storage,record){
 const rows=readMeasurements(storage),valid=validateMeasurementRecord(record);
 check(rows.length<MAX_RECORDS,'Máximo 120 mediciones. Exporta los registros antes de añadir más.');
 check(!rows.some(x=>x.id===valid.id),'La medición ya existe');
 rows.unshift(valid);
 storage.setItem(MEASUREMENTS_KEY,JSON.stringify(rows));
 return valid;
}
export function mergeMeasurements(existing,incoming){
 check(Array.isArray(existing)&&Array.isArray(incoming),'Registros inválidos');
 const all=existing.map(validateMeasurementRecord);
 for(const record of incoming){
  const verified=validateMeasurementRecord(record);
  const old=all.find(x=>x.id===verified.id);
  if(old){
   check(JSON.stringify(old)===JSON.stringify(verified),
    'Conflicto con medición existente: '+verified.id);
  }else all.push(verified);
 }
 check(all.length<=MAX_RECORDS,'La unión supera el máximo de 120 mediciones');
 return all;
}
export function deleteMeasurement(storage,id){
 const rows=readMeasurements(storage),index=rows.findIndex(x=>x.id===id);
 check(index>=0,'Medición inexistente');
 const [deleted]=rows.splice(index,1);
 storage.setItem(MEASUREMENTS_KEY,JSON.stringify(rows));
 return deleted;
}
