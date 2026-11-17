/**
 * R131 · LRU acotada de escenas CAD/triangulación.
 * Al orbitar, volver entre golpes o alternar poses no es necesario
 * repetir la geometría si ya estaba preparada. Presupuesto pequeño
 * en Galaxy; no persiste nada en disco y se invalida al cambiar CAD.
 */
export function createSolidFrameCache(factory,{capacity=1}={}){
 if(typeof factory!=='function')throw Error('Falta constructor de sólidos');
 const limit=value=>{
  if(!Number.isInteger(value)||value<1||value>8)
   throw Error('El caché de escenas admite de 1 a 8 entradas');
  return value;
 };
 let cap=limit(capacity),frames=[],hits=0,misses=0,evictions=0;
 return {
  get(piece,time,maxFaces){
   if(!piece||!Number.isFinite(time)||!Number.isFinite(maxFaces))
    throw Error('Estado de escena no válido');
   const index=frames.findIndex(e=>e.piece===piece&&
    e.time===time&&e.limit===maxFaces);
   if(index>=0){
    const entry=frames.splice(index,1)[0];
    frames.push(entry);hits++;
    return entry.value;
   }
   // Si el constructor falla, NO guardar una escena vacía en caché.
   const value=factory(piece,time,maxFaces);
   frames.push({piece,time,limit:maxFaces,value});misses++;
   if(frames.length>cap){frames.shift();evictions++;}
   return value;
  },
  invalidate(){frames=[];},
  setCapacity(value){
   cap=limit(value);
   while(frames.length>cap){frames.shift();evictions++;}
  },
  get stats(){return {hits,misses,evictions,entries:frames.length,capacity:cap};}
 };
}
