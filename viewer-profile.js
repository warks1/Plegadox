/**
 * Representación para el visor 3D, con fillets de fibra media aproximada.
 * Los pliegues se redondean de derecha a izquierda para conservar los
 * índices originales; el motor de validación sigue usando fibra recta.
 * NO son los sólidos CAD ni el radio final verificado de la chapa.
 */
import {normalized,profile,development,clamp,finite} from './engine.js';
import {roundedCorner} from './bend-contact.js';
export function viewerProfile(piece,fractions=[]){
 const p=normalized(piece),straight=profile(p,fractions).points;
 const neutralRadius=development(p).radius+p.thickness/2;
 let points=straight;
 for(let bend=p.angles.length-1;bend>=0;bend--){
  const fraction=clamp(finite(fractions[bend],0),0,1);
  if(Math.abs(p.angles[bend]*fraction)<.5)continue;
  points=roundedCorner(points,bend+1,neutralRadius);
 }
 return {points,straight,neutralRadius,approximate:true,verified:false};
}
