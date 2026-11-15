/** Semáforo orientativo del tope en la sección 2D.
 * Verde: geometría calculada y sin interferencia detectada.
 * Naranja: apoyo inválido, datos insuficientes o riesgo/retirada prevista.
 * Rojo: penetración geométrica detectada en la pose mostrada.
 * Ningún color equivale a una certificación 3D o autorización CNC.
 */
export function gaugeRiskStatus(placement){
 const hit=placement?.gaugeInterference,plan=placement?.gaugeDecision;
 if(hit?.kind==='penetracion')
  return {level:'red',message:'PENETRACIÓN DETECTADA EN 2D',verified:false};
 // Una referencia interior o un dedo sin superficie de apoyo NO pueden
 // recibir verde sólo porque el detector no haya informado penetración.
 // El asiento frontal se exige durante la preparación, no cuando la chapa
 // ya ha sido retirada de la V después de sujetar.
 const preparing=['Posicionamiento','Aproximación'].includes(placement?.phase);
 // El apoyo manual puede ser una cara de pestaña ya plegada, pero
 // solo cuando el solver ha verificado el asiento 2D de esa cara.
 const invalidReference=(placement?.freeEdge===false&&
    placement?.foldedWingContact!==true)||
  placement?.sheetEdgeFound===false||
  placement?.contact?.usable===false||
  placement?.setupValid===false||
  plan?.needsSetupCorrection===true;
 const invalidSeat=preparing&&
  (placement?.sheetInFront===false||placement?.seat?.seated===false);
 if(invalidReference||invalidSeat)
  return {level:'amber',message:plan?.withdrawalUnverified?
   'APOYO NO VÁLIDO · RETIRADA 2D SIN VALIDACIÓN FÍSICA':
   'APOYO NO VÁLIDO · REVISAR PRESENTACIÓN 2D',verified:false};
 // warning:false significa también "no pude evaluar", según el detector.
 // Sólo se concede verde con kind explícito de ausencia de interferencia.
 if(!hit||hit.kind==='sin-geometria'||hit.kind!=='sin-interferencia-detectada'&&hit.warning===false)
  return {level:'amber',message:'COMPROBACIÓN 2D INCOMPLETA',verified:false};
 if(hit.warning===true||
    plan?.enabled===true||
    (Number(plan?.clearanceWarnings)||0)>0||
    (Number(plan?.penetrationCount)||0)>0)
  return {level:'amber',message:'POSIBLE INTERFERENCIA / REVISAR APOYO',verified:false};
 if(hit.kind==='sin-interferencia-detectada'&&hit.warning===false&&plan?.known===true)
  return {level:'green',message:'SIN INTERFERENCIA DETECTADA EN 2D',verified:false};
 return {level:'amber',message:'COMPROBACIÓN 2D INCOMPLETA',verified:false};
}
export const GAUGE_COLORS=Object.freeze({
 green:Object.freeze({fill:'#276b4a',edge:'#80ffc5',face:'#bfffe1',label:'#baffd8',glow:'#34dd91'}),
 amber:Object.freeze({fill:'#735620',edge:'#ffd182',face:'#ffe5b2',label:'#ffe4aa',glow:'#ffb84e'}),
 red:Object.freeze({fill:'#852f2e',edge:'#ff897a',face:'#ffc5bd',label:'#ff9d94',glow:'#ff5d48'})
});
