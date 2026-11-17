/**
 * R133 · matriz de INTERFERENCIAS físicas de conjuntos de plegadora.
 *
 * Generar las comprobaciones sin duplicados para todo lo que puede
 * encontrarse entre el conjunto superior (móvil), inferior (fijo)
 * y los topes traseros. Ninguna combinación implica CAD OEM disponible.
 *
 * Los pares de piezas DEL MISMO CONJUNTO no se certifican con un barrido
 * de traslación solidaria: pueden estar diseñados para tocarse o acoplarse.
 * Su ensamblaje real, holgura y tornillería requieren CAD/montaje OEM.
 */
export const UPPER_MACHINE_BODIES=Object.freeze([
 'ram','punch','upperClamp','upperAdapter'
]);
export const LOWER_MACHINE_BODIES=Object.freeze([
 'bed','die','lowerClamp','lowerAdapter','frontSupport'
]);
export const SHEET_SWEPT_BODIES=Object.freeze([
 'ram','gauge','upperClamp','upperAdapter',
 'lowerClamp','lowerAdapter','frontSupport'
]);
export const SHEET_CONTACT_EXCLUSIONS=Object.freeze([
 {kind:'punch',reason:'contacto previsto con la chapa durante plegado; analizado en motor de herramienta'},
 {kind:'die',reason:'contacto previsto de la chapa sobre los hombros de la matriz'},
 {kind:'bed',reason:'referencia inferior fija; contacto con chapa no equivale a choque demostrado'}
]);
const within=group=>group.flatMap((a,i)=>
 group.slice(i+1).map(b=>({moving:a,against:b,
 reason:'Mismo conjunto montado: analizar amarre y tolerancias con CAD OEM, no como choque de barrido rígido',
 unresolved:true})));
export function planMachineInterferencePairs(twoFingers=false){
 const gauge=twoFingers?['gaugeZ1','gaugeZ2']:['gauge'];
 const planned=[
  ...UPPER_MACHINE_BODIES.flatMap(a=>
   LOWER_MACHINE_BODIES.map(b=>[a,b])),
  ...gauge.flatMap(a=>
   [...UPPER_MACHINE_BODIES,...LOWER_MACHINE_BODIES].map(b=>[a,b])),
  ...(twoFingers?[[gauge[0],gauge[1]]]:[])
 ];
 const found=new Set(),pairs=[];
 for(const pair of planned){
  const key=[...pair].sort().join('/');
  if(found.has(key))throw Error('Interferencia duplicada en catálogo: '+key);
  found.add(key);pairs.push(Object.freeze(pair));
 }
 const excludedInterfaces=[
  ...within(UPPER_MACHINE_BODIES),
  ...within(LOWER_MACHINE_BODIES)
 ];
 return Object.freeze({
  pairs:Object.freeze(pairs),
  sheetSweptBodies:Object.freeze(SHEET_SWEPT_BODIES
   .flatMap(kind=>kind==='gauge'?gauge:[kind])),
  excludedAssemblyInterfaces:Object.freeze(excludedInterfaces),
  expectedSheetContacts:SHEET_CONTACT_EXCLUSIONS,
  twoFingers,
  physicalCollisionCertified:false
 });
}
export function pairGeometryAvailability(a,b,moving,against){
 const items=[
  ['inicio',moving,a?.[moving]],['fin',moving,b?.[moving]],
  ['inicio',against,a?.[against]],['fin',against,b?.[against]]
 ];
 const missing=items.filter(([, ,body])=>!body?.valid)
  .map(([pose,kind])=>kind+' ('+pose+')');
 if(missing.length)return {checkable:false,missing,
  reason:'CAD/contorno ausente o no válido',certified:false};
 const imported=items.every(([, ,body])=>
  String(body.provenance||'').startsWith('perfil CAD importado '));
 return {checkable:true,imported,missing:[],
  reason:imported?'dos perfiles CAD aportados sin validación de montaje':
   'interferencia calculada con geometría parcialmente provisional',
  certified:false};
}
