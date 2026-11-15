/** R50: reparar SOLO los defaults de apoyo obsoletos de muestras Omega.
 * NUNCA modifica piezas ajenas ni elecciones manuales de otros proyectos.
 * Una pieza de ejemplo con geometría editada tampoco se migra.
 */
const OLD=['before','before','before','after'];
const AUTO=['auto','auto','auto','auto'];
const SAME=(a,b)=>Array.isArray(a)&&a.length===b.length&&a.every((v,i)=>v===b[i]);
const NAMES=new Set(['Omega · ejemplo geométrico','Omega · referencia Cybelec (DIN nominal)']);
export function migrateLegacyOmegaGauge(input){
 if(!input||typeof input!=='object'||Array.isArray(input))return input;
 if(!NAMES.has(input.name))return input;
 if(!SAME(input.flanges,[50,50,50,50,50])||
    !SAME(input.angles,[90,-90,-90,90])||
    !SAME(input.order,[0,1,3,2])||
    !SAME(input.gaugeSideByBend,OLD))return input;
 // Las elecciones manuales sobre tramos y distancias nunca se sobrescriben.
 if(Array.isArray(input.gaugeSegmentByBend)&&
    input.gaugeSegmentByBend.some(x=>x!==null&&x!==undefined))return input;
 if(Array.isArray(input.gaugePointByBend)&&
    input.gaugePointByBend.some(x=>x!==null&&x!==undefined))return input;
 return {...input,gaugeSideByBend:[...AUTO],
  gaugeMigrationNotice:'R50: referencias del ejemplo Omega reparadas para buscar cantos libres'};
}
