/**
 * PlegadoX R127 · contraste transversal Z de dedo CAD y chapa.
 * Únicamente la Z declarada por un perfil CAD importado es aprovechable.
 * Un contorno X/Y paramétrico y la anchura de chapa nunca sirven para
 * inventar ni confirmar la ubicación de un dedo trasero.
 */
export function assessGaugeDepth(sheet,gauge){
 const imported=typeof gauge?.provenance==='string'&&
  gauge.provenance.startsWith('perfil CAD importado ');
 if(!imported)return {kind:'z-no-documentada',knownZ:false,contactAvailable:null,
  overlapMm:null,verified:false};
 if(!gauge?.valid||!Number.isFinite(gauge.zMin)||
    !Number.isFinite(gauge.zMax)||gauge.zMax<=gauge.zMin)
  return {kind:'cad-dedo-invalido',knownZ:false,contactAvailable:null,
   overlapMm:null,verified:false};
 if(!Array.isArray(sheet)||!sheet.length||
  sheet.some(s=>!s?.valid||!Number.isFinite(s.zMin)||
   !Number.isFinite(s.zMax)||s.zMax<=s.zMin))
  return {kind:'chapa-z-incompleta',knownZ:true,contactAvailable:null,
   overlapMm:null,verified:false};
 let overlapMm=0;
 for(const body of sheet)
  overlapMm=Math.max(overlapMm,
   Math.max(0,Math.min(body.zMax,gauge.zMax)-
    Math.max(body.zMin,gauge.zMin)));
 if(overlapMm<=1e-6)
  return {kind:'dedo-fuera-de-anchura-z',knownZ:true,
   contactAvailable:false,overlapMm:0,verified:false};
 return {kind:'intervalos-z-solapados',knownZ:true,
  contactAvailable:true,overlapMm,verified:false};
}
