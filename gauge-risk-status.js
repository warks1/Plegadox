/** Semáforo de tope para el visor geométrico 2D.
 * Verde: no se detecta interferencia; naranja: posible interferencia
 * o comprobación incompleta; rojo: penetración GEOMÉTRICA en esta pose.
 * No significa ausencia de colisiones 3D ni aprobación CNC. Una
 * penetración roja puede resolverse cambiando la secuencia/herramienta.
 */
export function gaugeRiskStatus(placement){
 const hit=placement?.gaugeInterference,plan=placement?.gaugeDecision;
 if(hit?.kind==='penetracion')
  return {level:'red',message:'PENETRACIÓN DETECTADA EN 2D',verified:false};
 if(hit?.warning===true||placement?.setupValid===false||
    plan?.enabled===true||plan?.needsSetupCorrection===true||
    (Number(plan?.clearanceWarnings)||0)>0||
    (Number(plan?.penetrationCount)||0)>0)
  return {level:'amber',message:'POSIBLE INTERFERENCIA / REVISAR APOYO',verified:false};
 if(hit?.warning===false&&plan?.known===true&&placement?.setupValid!==false)
  return {level:'green',message:'SIN INTERFERENCIA DETECTADA EN 2D',verified:false};
 return {level:'amber',message:'COMPROBACIÓN 2D INCOMPLETA',verified:false};
}
export const GAUGE_COLORS=Object.freeze({
 green:Object.freeze({fill:'#276b4a',edge:'#80ffc5',face:'#bfffe1',label:'#baffd8',glow:'#34dd91'}),
 amber:Object.freeze({fill:'#735620',edge:'#ffd182',face:'#ffe5b2',label:'#ffe4aa',glow:'#ffb84e'}),
 red:Object.freeze({fill:'#852f2e',edge:'#ff897a',face:'#ffc5bd',label:'#ff9d94',glow:'#ff5d48'})
});
