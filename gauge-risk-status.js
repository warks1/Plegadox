/** Semáforo orientativo del tope en la sección 2D.
 * Verde: geometría calculada y sin interferencia detectada.
 * Naranja: apoyo inválido, datos insuficientes o riesgo en pose actual.
 * Rojo: penetración geométrica detectada en la pose mostrada.
 * Ningún color equivale a una certificación 3D o autorización CNC.
 */
export function gaugeRiskStatus(placement){
 const hit=placement?.gaugeInterference,plan=placement?.gaugeDecision;
 if(hit?.kind==='penetracion')
  return {level:'red',code:'penetracion-actual',message:'PENETRACIÓN DETECTADA EN 2D',verified:false};
 // Una referencia interior o un dedo sin superficie de apoyo NO pueden
 // recibir verde sólo porque el detector no haya informado penetración.
 // El asiento frontal se exige durante la preparación, no cuando la chapa
 // ya ha sido retirada de la V después de sujetar.
 // En sujeción aún se exige apoyo si el dedo sigue en posición.
 // Si ha empezado la retirada PREVENTIVA, la ausencia de contacto es
 // esperada: no convertir el retroceso legítimo en un aviso naranja.
 const retracting=placement?.gaugeTransition?.phase==='retroceso-antes-plegado';
 const preparing=['Posicionamiento','Aproximación'].includes(placement?.phase)||
  (placement?.phase==='Sujeción'&&!retracting);
 // El apoyo manual puede ser una cara de pestaña ya plegada, pero
 // solo cuando el solver ha verificado el asiento 2D de esa cara.
 // En vez de pintar todo de naranja como "posible colisión",
 // identificar la causa REAL del naranja en la sección actual.
 // Estos defectos de apoyo se señalan aunque no haya penetración.
 const amber=(code,message)=>({level:'amber',code,message,verified:false});
 if(placement?.freeEdge===false&&placement?.foldedWingContact!==true)
  return amber('referencia-interior',
   'REFERENCIA INTERIOR SIN CARA EXTERIOR DE APOYO 2D');
 if(placement?.sheetEdgeFound===false)
  return amber('sin-borde-libre','NO HAY BORDE DE APOYO ACCESIBLE EN 2D');
 if(placement?.contact?.usable===false)
  return amber('cara-tope-invalida','CARA DE PARADA DEL TOPE NO DEFINIDA');
 if(preparing&&placement?.sheetInFront===false)
  return amber('chapa-detras','CHAPA POR DETRÁS DE LA CARA FRONTAL DEL TOPE');
 if(preparing&&placement?.seat?.seated===false)
  return amber('sin-asiento','CHAPA SIN ASIENTO FRONTAL SOBRE EL TOPE');
 if(placement?.setupValid===false||plan?.needsSetupCorrection===true)
  return amber('apoyo-invalido',plan?.withdrawalUnverified?
   'APOYO NO VÁLIDO · RETIRADA 2D SIN VALIDACIÓN FÍSICA':
   'APOYO NO VÁLIDO · REVISAR PRESENTACIÓN 2D');
 // Durante el posicionamiento, una sección sin choque NO implica que
 // el borde esté realmente contra la cara frontal. Si el punto nominal
 // queda separado, comunicarlo como falta de contacto, no "colisión".
 if(preparing&&placement?.contactEngaged===false)
  return amber('sin-contacto-actual',
   'SIN CONTACTO FRONTAL EN PREPARACIÓN · COMPROBAR COTA Y REFERENCIA');
 // warning:false significa también "no pude evaluar", según el detector.
 // Sólo se concede verde con kind explícito de ausencia de interferencia.
 if(!hit||hit.kind==='sin-geometria'||hit.kind!=='sin-interferencia-detectada'&&hit.warning===false)
  return {level:'amber',code:'comprobacion-incompleta',message:'COMPROBACIÓN 2D INCOMPLETA',verified:false};
 // El pronóstico supone un dedo de tope inmóvil, pero la pose del
 // simulador puede mostrar el dedo retirado. No confundir ambos riesgos.
 if(hit.warning===true)
  return {level:'amber',code:hit.kind==='holgura'?'holgura-actual':'interferencia-actual',message:'HOLGURA O INTERFERENCIA EN POSICIÓN 2D ACTUAL',verified:false};
 if(plan?.withdrawalUnverified===true||plan?.initialPenetration===true||
    ((Number(plan?.penetrationCount)||0)>0&&plan?.enabled!==true))
  return {level:'amber',code:'retirada-no-fiable',message:'INTERFERENCIA FUTURA SIN RETIRADA FIABLE',verified:false};
 if(hit.kind==='sin-interferencia-detectada'&&hit.warning===false&&plan?.known===true){
  const forecast=plan?.enabled===true?'retirada-prevista':
   (Number(plan?.clearanceWarnings)||0)>0?'holgura-futura':null;
  return {level:'green',message:forecast==='retirada-prevista'?
   'SIN CHOQUE EN POSE 2D · RETIRADA PREVISTA':
   forecast==='holgura-futura'?
   'SIN CHOQUE EN POSE 2D · HOLGURA FUTURA A REVISAR':
   'SIN INTERFERENCIA DETECTADA EN 2D',forecast,verified:false};
 }
 return {level:'amber',code:'comprobacion-incompleta',message:'COMPROBACIÓN 2D INCOMPLETA',verified:false};
}
export const GAUGE_COLORS=Object.freeze({
 green:Object.freeze({fill:'#276b4a',edge:'#80ffc5',face:'#bfffe1',label:'#baffd8',glow:'#34dd91'}),
 amber:Object.freeze({fill:'#735620',edge:'#ffd182',face:'#ffe5b2',label:'#ffe4aa',glow:'#ffb84e'}),
 red:Object.freeze({fill:'#852f2e',edge:'#ff897a',face:'#ffc5bd',label:'#ff9d94',glow:'#ff5d48'})
});
