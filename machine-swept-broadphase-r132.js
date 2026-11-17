/**
 * R132 · filtro de banda ancha conservador para barridos volumétricos.
 *
 * El AABB de cada cuerpo contiene todos sus instantes entre dos poses
 * SI sus vértices se trasladan linealmente. Dos bandas separadas nunca
 * pueden tener penetración modelada; si se superponen se necesita el
 * motor exacto de polígonos (NUNCA afirmar colisión por el AABB).
 *
 * La geometría ausente/inválida, DEFORMADA O GIRADA tampoco se
 * descarta: vuelve al motor exacto para conservar SIN RESOLVER.
 * Un roce tangente no se descarta por tolerancia numérica.
 */
import {prismTranslation} from './swept-volume.js';
const EPS=1e-7;
const finite=n=>typeof n==='number'&&Number.isFinite(n);
export function movingPrismBounds(from,to){
 if(!from?.valid||!to?.valid||!Array.isArray(from.polygon)||
  !Array.isArray(to.polygon)||!from.polygon.length||!to.polygon.length||
  !prismTranslation(from,to).ok)
  return null;
 const points=[...from.polygon,...to.polygon];
 if(!points.every(p=>finite(p?.x)&&finite(p?.y))||
  ![from.zMin,from.zMax,to.zMin,to.zMax].every(finite))return null;
 const xs=points.map(p=>p.x),ys=points.map(p=>p.y);
 return {
  minX:Math.min(...xs),maxX:Math.max(...xs),
  minY:Math.min(...ys),maxY:Math.max(...ys),
  minZ:Math.min(from.zMin,to.zMin),
  maxZ:Math.max(from.zMax,to.zMax)
 };
}
export function sweptBroadphase(a0,a1,b0,b1,epsilon=EPS){
 const a=movingPrismBounds(a0,a1),b=movingPrismBounds(b0,b1);
 if(!a||!b)return {mayOverlap:true,known:false,
  reason:'CAD sin sólido válido: no puede descartarse contacto',
  separatingAxis:null,certified:false};
 const margin=finite(epsilon)&&epsilon>=0&&epsilon<=.01?epsilon:EPS;
 for(const [axis,min,max] of [
  ['X','minX','maxX'],['Y','minY','maxY'],['Z','minZ','maxZ']]){
  // Cualquier roce o distancia próxima a cero debe pasar al motor
  // detallado (puede ser contacto tangente/holgura insuficiente).
  if(a[max]<b[min]-margin||b[max]<a[min]-margin)
   return {mayOverlap:false,known:true,
    separatingAxis:axis,reason:'envolventes barridas separadas en '+axis,
    certified:false};
 }
 return {mayOverlap:true,known:true,separatingAxis:null,
  reason:'envolventes se solapan; comprobar penetración con polígonos',
  certified:false};
}
