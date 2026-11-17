/** R127 · paleta industrial gobernada por el semáforo real del tope. */
export function gaugeSolidStyle(evidence={}){
 const level=['green','amber','red'].includes(evidence?.level)?
  evidence.level:'amber';
 const colors={green:[48,176,115],amber:[231,160,75],red:[230,85,74]};
 // La anchura Z de un dedo sin DXF no existe en el modelo. Su
 // envolvente es una pista visual, NO un sólido CAD que llene la chapa.
 return {level,color:colors[level],provisional:evidence?.knownZ!==true,
  fillAlpha:evidence?.knownZ===true?1:0.22,
  dashed:evidence?.knownZ!==true,verified:false};
}
