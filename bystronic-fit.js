/**
 * PlegadoX · medidas de montaje WILA / adaptador inferior Promecam.
 * Los valores NULL representan cotas NO medidas. Nunca interpolar el
 * rango genérico de otras máquinas como apertura real de esta unidad.
 */
export const BYSTRONIC_FIT_KEY='plegadox:bystronic-fit:v1';
export const BYSTRONIC_FIT_FIELDS=Object.freeze([
 'daylightMeasured',
 'upperAssemblyProjection',
 'lowerAdapterHeight',
 'lowerDieProjection'
]);
const LIMITS=Object.freeze({
 daylightMeasured:[100,1200],
 upperAssemblyProjection:[0,700],
 lowerAdapterHeight:[0,300],
 lowerDieProjection:[0,400]
});
export function normalizeBystronicFit(input={}){
 if(!input||typeof input!=='object'||Array.isArray(input))
  throw Error('Mediciones de montaje no válidas');
 const fit={};
 for(const key of BYSTRONIC_FIT_FIELDS){
  const raw=input[key];
  if(raw==null||raw===''){fit[key]=null;continue;}
  const num=Number(raw),[min,max]=LIMITS[key];
  if(typeof raw==='boolean'||!Number.isFinite(num)||num<min||num>max)
   throw Error(key+': valor fuera de '+min+'–'+max+' mm');
  fit[key]=num;
 }
 return fit;
}
export function readBystronicFit(storage=typeof localStorage==='undefined'?null:localStorage){
 if(!storage?.getItem)return normalizeBystronicFit();
 const raw=storage.getItem(BYSTRONIC_FIT_KEY);
 return normalizeBystronicFit(raw==null?{}:JSON.parse(raw));
}
export function writeBystronicFit(input,storage=typeof localStorage==='undefined'?null:localStorage){
 const measured=normalizeBystronicFit(input);
 if(!storage?.setItem)throw Error('Almacenamiento de medidas no disponible');
 storage.setItem(BYSTRONIC_FIT_KEY,JSON.stringify(measured));
 return measured;
}
/** Apertura libre NOMINAL entre las puntas de los conjuntos ya montados.
 * upperAssemblyProjection: desde cara inferior de trancha hasta punta
 *   del punzón MONTADO (incluye cabezal WILA y voladizo del punzón).
 * lowerAdapterHeight: altura real que añade la regleta Promecam.
 * lowerDieProjection: desde apoyo SOBRE adaptador a coronación matriz.
 *
 * NO comprueba carrera, escote, colisiones laterales ni recorrido.
 */
export function assessBystronicWorkingOpening(input){
 const measured=normalizeBystronicFit(input);
 const missing=BYSTRONIC_FIT_FIELDS.filter(k=>measured[k]===null);
 if(missing.length)return {calculable:false,opening:null,missing,verified:false};
 const opening=measured.daylightMeasured-measured.upperAssemblyProjection-
  measured.lowerAdapterHeight-measured.lowerDieProjection;
 const rounded=Math.round(opening*100)/100;
 return {calculable:true,opening:rounded,feasibleNominal:rounded>=0,
  missing:[],verified:false,
  note:'Resta nominal de alturas montadas; NO acredita capacidad de plegado ni ausencia de colisiones'};
}
