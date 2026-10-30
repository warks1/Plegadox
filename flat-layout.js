/** Estimación de centros de pliegue sobre el desarrollo, NO posiciones CNC. */
import {normalized,development} from './engine.js';
export function flatBendLayout(raw){
 const piece=normalized(raw),dev=development(piece);
 const length=dev.length,width=piece.width;
 if(!Number.isFinite(length)||length<=0||!Number.isFinite(width)||width<=0)
  throw new RangeError('Longitud desarrollada no valida: revisar cotas, angulos y radio');
 const folds=[];
 let before=0;
 for(let i=0;i<piece.angles.length;i++){
  const bend=dev.perBend[i];
  const adjustment=piece.datum==='neutral'?bend.ba:-bend.bd;
  const position=before+piece.flanges[i]+adjustment/2;
  if(!Number.isFinite(position)||position<=0||position>=length||
    (folds.length&&position<=folds.at(-1).position+1e-7))
   throw new RangeError('Posiciones de pliegue no validas: revisar longitud de alas, radio y criterio de cota');
  folds.push({bend:i,operation:piece.order.indexOf(i)+1,
   angle:bend.angle,position,allowance:bend.ba,deduction:bend.bd,verified:false});
  before+=piece.flanges[i]+adjustment;
 }
 return {length,width,folds,datum:piece.datum,estimated:true,verified:false};
}
