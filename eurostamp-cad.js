/**
 * R38 · Vincular DXF ORIGINAL descargado por el usuario a una referencia Eurostamp.
 * No se redistribuyen aquí ficheros CAD del fabricante. No se generan perfiles
 * ficticios a partir de una foto o de las cotas H/V/R.
 *
 * El motor existente usa el mismo contorno validado para 2D/3D, sin afirmar
 * que este CAD plano certifique el portaherramientas o colisiones de la V85.
 */
import {parseToolDxf,validateContour} from './tool-dxf.js';
import {eurostampById,EUROSTAMP_ALL} from './eurostamp-catalog.js';
export const EUROSTAMP_CAD_STORAGE_KEY='plegadox:eurostamp-cad:v1';
export const EUROSTAMP_CAD_MAX=45;
const nameOf=id=>eurostampById(id)?.reference;
const tolerance=h=>Math.max(.75,h*.015);

function checkProfile(record,source){
 if(!record||!eurostampById(record.id))throw Error('Referencia Eurostamp no registrada');
 const spec=eurostampById(record.id);
 if(record.profilePoints==null)throw Error('Falta el contorno CAD');
 const contour=validateContour(record.profilePoints);
 if(Math.abs(contour.height-spec.height)>tolerance(spec.height))
  throw Error('Altura CAD '+contour.height.toFixed(2)+' mm: no coincide con la ficha Eurostamp H'+spec.height);
 if(contour.width>250)throw Error('Contorno de herramienta demasiado ancho: revisar proyección DXF');
 if(source&&record.fileName&&String(record.fileName).length>130)
  throw Error('Nombre DXF demasiado largo');
 return {spec,contour};
}
/** Carga un DXF original aislado; NO lo asocia por coincidencia de ángulo.
 * La asociación al SKU es explícita y la altura total se comprueba.
 */
export function parseEurostampProfile(text,{id,fileName=''}={}){
 const spec=eurostampById(id);
 if(!spec)throw Error('Referencia Eurostamp desconocida');
 const name=String(fileName||'').trim();
 if(name&&!/\.dxf$/i.test(name))throw Error('Archivo requerido: DXF ASCII');
 const prefixed=name.match(/(?:^|[^\d])(\d{4})(?:[-_.]|$)/)?.[1];
 if(prefixed&&prefixed!==spec.reference)
  throw Error('El nombre del archivo señala la referencia '+prefixed+' y no '+spec.reference);
 const parsed=parseToolDxf(text);
 if(parsed.unitsAssumed)
  throw Error('El DXF no declara unidades mm. Exporta con $INSUNITS=4 para evitar errores de escala');
 if(Math.abs(parsed.height-spec.height)>tolerance(spec.height))
  throw Error('Altura CAD '+parsed.height.toFixed(2)+' mm no coincide con H'+spec.height+' de la ficha '+spec.reference);
 // El parser centra por caja envolvente. En punzones el eje de trabajo
 // debe pasar por el centro de la punta inferior, no por el cuerpo.
 // Se puede inferir un eje de punta si el extremo más bajo es inequívoco;
 // si no, se mantiene el perfil pero se identifica como no calibrado.
 let points=parsed.points.map(pt=>[...pt]),datumStatus='no-calibrado';
 if(spec.tip!=null){
  const bottom=points.filter(p=>p[1]<=.12);
  if(bottom.length>0){
   const xs=bottom.map(p=>p[0]),span=Math.max(...xs)-Math.min(...xs);
   if(span<=Math.max(.7,Number(spec.tip)*1.7)){
    const center=(Math.max(...xs)+Math.min(...xs))/2;
    points=points.map(([x,y])=>[Number((x-center).toFixed(6)),y]);
    datumStatus='punta-alineada-2D';
   }
  }
 }
 const result={id:spec.id,manufacturer:'Eurostamp',reference:spec.reference,
  fileName:name||spec.reference+'.dxf',profilePoints:points,
  cadStatus:'DXF-2D-importado-pendiente-montaje',
  datumStatus,units:'mm',importedDxf:true,verifiedSpecs:true,
  cadVerified:false,profileAccuracy:'provisional',
  sourceDescription:'Contorno 2D aportado por usuario bajo SKU Eurostamp; amarre y ejes CNC no calibrados'};
 checkProfile(result,true);
 return result;
}
export function applyEurostampProfile(dies,punches,record){
 const {spec}=checkProfile(record,true);
 const tools=spec.opening!=null?dies:punches;
 const item=tools.find(t=>t.id===spec.id);
 if(!item)throw Error('El SKU no está cargado en el catálogo');
 Object.assign(item,{profilePoints:record.profilePoints.map(p=>[...p]),
  importedDxf:true,cadStatus:'DXF-2D-importado-pendiente-montaje',
  cadVerified:false,verifiedSpecs:true,profileAccuracy:'provisional',
  sourceDescription:record.sourceDescription,
  datumStatus:record.datumStatus||'no-calibrado'});
 return item;
}
export function listEurostampProfiles(storage){
 if(!storage)return [];
 let array;
 try{array=JSON.parse(storage.getItem(EUROSTAMP_CAD_STORAGE_KEY)||'[]');}
 catch{return [];}
 if(!Array.isArray(array))return [];
 const kept=[],seen=new Set();
 for(const record of array.slice(0,EUROSTAMP_CAD_MAX)){
  if(!record||seen.has(record.id))continue;
  try{checkProfile(record);kept.push(record);seen.add(record.id);}
  catch{/* datos locales ajenos al catálogo, no cargar */}
 }
 return kept;
}
export function persistEurostampProfile(storage,record){
 if(!storage)throw Error('Almacenamiento CAD no disponible');
 checkProfile(record,true);
 const previous=listEurostampProfiles(storage);
 const replaced=previous.filter(x=>x.id!==record.id);
 if(replaced.length>=EUROSTAMP_CAD_MAX)
  throw Error('Biblioteca DXF Eurostamp llena');
 const next=[...replaced,record];
 // Antes de mutar útiles del motor, guardar o fallar (sin estado mixto).
 storage.setItem(EUROSTAMP_CAD_STORAGE_KEY,JSON.stringify(next));
 return next.length;
}
export function hydrateEurostampProfiles(dies,punches,storage){
 let count=0;
 for(const record of listEurostampProfiles(storage)){
  try{applyEurostampProfile(dies,punches,record);count++;}
  catch{/* perfil inválido: se queda la versión de catálogo sin CAD */}
 }
 return count;
}
/** Para formar catálogos desplegables sin conservar referencias mutables. */
export function pendingEurostampCount(dies,punches){
 return EUROSTAMP_ALL.filter(t=>{
  const actual=(t.opening!=null?dies:punches).find(x=>x.id===t.id);
  return !actual?.importedDxf;
 }).length;
}
