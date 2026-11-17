/**
 * R126: cache de la escena geométrica ya triangulada. Mover la cámara no
 * cambia los sólidos; no se recalculan contornos, contactos ni mallas
 * en cada evento táctil. Se invalida al cambiar pieza/máquina/CAD.
 */
export function createSolidFrameCache(factory){
 if(typeof factory!=='function')throw Error('Falta constructor de sólidos');
 let last=null,hits=0,misses=0;
 return {
  get(piece,time,limit){
   if(!piece||!Number.isFinite(time)||!Number.isFinite(limit))
    throw Error('Estado de escena no válido');
   if(last&&last.piece===piece&&last.time===time&&last.limit===limit){
    hits++;return last.value;
   }
   // Una excepción no se guarda para que pueda recuperarse el visor.
   const value=factory(piece,time,limit);
   last={piece,time,limit,value};misses++;
   return value;
  },
  invalidate(){last=null;},
  get stats(){return {hits,misses};}
 };
}
