/**
 * R131 · diferencia entre cilindros Y1/Y2 en un intervalo CNC.
 * El visor 2,5D desplaza la trancha mediante el PROMEDIO de Y1/Y2.
 * La diferencia respecto al datum no es una traslación rígida: la
 * viga puede inclinarse en Z. Declarar ese error en mm y reducir la
 * evidencia del modelo sin fabricar una inclinación OEM inexistente.
 */
export function assessRamYTilt(before,after,reference,toleranceMm=0){
 const values=[before?.Y1,before?.Y2,after?.Y1,after?.Y2,
  reference?.Y1,reference?.Y2,toleranceMm];
 if(!values.every(Number.isFinite)||toleranceMm<0||toleranceMm>5)
  return {known:false,exceedsTolerance:true,
   reason:'Faltan posiciones Y1/Y2 o tolerancia documentada'};
 const referenceSkew=reference.Y1-reference.Y2;
 const startDelta=(before.Y1-before.Y2)-referenceSkew;
 const endDelta=(after.Y1-after.Y2)-referenceSkew;
 const maxDifferentialMm=Math.max(Math.abs(startDelta),Math.abs(endDelta));
 const meanApproximationErrorMm=maxDifferentialMm/2;
 return {known:true,referenceSkewMm:referenceSkew,
  startDifferentialMm:startDelta,endDifferentialMm:endDelta,
  maxDifferentialMm,meanApproximationErrorMm,
  exceedsTolerance:maxDifferentialMm>toleranceMm+1e-7,
  hasUnmodeledTilt:maxDifferentialMm>1e-7,
  physicalTiltModeled:false,
  reason:maxDifferentialMm>toleranceMm+1e-7?
   'Diferencia Y1/Y2 mayor que la tolerancia del datum; segmento sin resolver':
   maxDifferentialMm>1e-7?
   'Trancha/punzón/amarres superiores modelados con la media de Y1/Y2; la inclinación Z NO está modelada':
   'Las dos Y conservan la misma diferencia relativa que en el datum declarado'
 };
}
