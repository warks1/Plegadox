/**
 * PlegadoX R136 · evidencia CNC del TOPE separada del semáforo 2D.
 *
 * No mezclar una traza CNC (tiempo de ejes) con el fotograma de
 * plegado (tiempo de escena) sin una correspondencia verificada.
 * Una alerta CAD no prueba choque real; un informe incompleto
 * tampoco autoriza el color verde.
 */
const finger=name=>name==='gauge'||name==='gaugeZ1'||name==='gaugeZ2';
const neutral=(code,reason,extra={})=>({
 level:'neutral',code,reason,
 headline:'SIN EVIDENCIA CNC SUFICIENTE',
 gaugeEvents:0,newEvents:0,preexistingEvents:0,
 checked:false,verified:false,physicalCollisionCertified:false,
 canApproveForMachine:false,...extra
});
export function classifyCncGaugeSemaphore(report){
 if(!report||report.checked!==true||!(report.intervalsChecked>0))
  return neutral('SIN_TRAZA_CNC_APLICABLE',
   'Faltan trazas aplicables de ejes, datum o fases de chapa inmóvil; '+
   'el resultado no es una colisión detectada');
 const events=(report.events||[]).filter(event=>
  finger(event?.moving)||finger(event?.against));
 const newEvents=events.filter(ev=>ev.createdDuringThisInterval===true);
 const prior=events.filter(ev=>ev.preexistingAtStart===true);
 const uncertain=events.filter(ev=>!ev.preexistingAtStart&&!ev.createdDuringThisInterval);
 const totals={gaugeEvents:events.length,newEvents:newEvents.length,
  preexistingEvents:prior.length,uncertainEvents:uncertain.length,
  checked:true};
 const classified=(level,code,headline,reason)=>({
  ...neutral(code,reason),...totals,level,code,headline,
  verified:false,physicalCollisionCertified:false,canApproveForMachine:false
 });
 if(newEvents.length){
  const cadCad=newEvents.filter(ev=>ev.evidenceCode==='DOS_PERFILES_CAD'&&
   ev.upperAssemblyTiltUnmodeled!==true);
  if(cadCad.length)return classified('red','TOPE_PENETRACION_NUEVA_CAD',
   'ROJO · PENETRACIÓN NUEVA MODELADA DEL TOPE',
   cadCad.length+' solape(s) nuevos entre perfiles CAD declarados durante '+
   'la traza. Comprobar inmediatamente X/R/Z, dedo, longitud y datum; '+
   'NO implica colisión real inevitable');
  return classified('amber','TOPE_PENETRACION_NUEVA_PROVISIONAL',
   'NARANJA · POSIBLE PENETRACIÓN NUEVA DEL TOPE',
   newEvents.length+' solape(s) nuevos detectados con al menos una '+
   'geometría provisional/limitación de Y1/Y2. Completar CAD y revisar montaje');
 }
 if(prior.length||uncertain.length)return classified('amber',
  'TOPE_SOLAPE_PREEXISTENTE_O_INDETERMINADO',
  'NARANJA · SOLAPE PREVIO O SIN CLASIFICAR',
  prior.length+' solape(s) del tope ya presentes al inicio y '+
  uncertain.length+' sin clasificar. No son choques NUEVOS por defecto, '+
  'pero tampoco se descartan como seguros');
 // Una lista limitada de eventos, intervalos sin leer o la pérdida de
 // CAD invalida cualquier inferencia de ausencia de choque.
 const pending=(report.missingCad||[]).some(k=>
  ['stop','support','stopZ1','stopZ2','supportZ1','supportZ2'].includes(k));
 const limited=report.unresolved>0||report.suppressedEvents>0||
  report.uniquePendingPairs>0||report.pairIntervalsMissing>0||
  report.ramTiltApproximatedIntervals>0||report.impactWindowsUnresolved>0;
 if(pending||limited)return neutral('TOPE_CNC_INCOMPLETO',
  'No hay solapes nuevos del tope en la parte evaluada, pero faltan CAD '+
   'de dedos, recorridos o pares de interferencia. NO es una colisión naranja '+
   'detectada y NO se puede declarar trayectoria libre',totals);
 return classified('green','TOPE_SIN_PENETRACION_MODELADA',
  'VERDE · SIN PENETRACIÓN MODELADA EN INTERVALOS REVISADOS',
  'Sin solapes volumétricos del tope en los intervalos lineales con CAD '+
  'declarado; sigue SIN CERTIFICACIÓN de amarre, CNC ni contacto tangencial');
}
/** La información debe corresponder a la pieza, máquina y geometría
 * activas. El render no puede reutilizar resultados de otro trabajo.
 */
export function boundCncGaugeStatus(snapshot,{pieceKey,machineId,machineConfigKey,
 sceneTime=null}={}){
 if(!snapshot||!pieceKey||!machineId||!machineConfigKey||
  snapshot.pieceKey!==pieceKey||snapshot.machineId!==machineId||
  snapshot.machineConfigKey!==machineConfigKey)
  return neutral('INFORME_DESACTUALIZADO',
   'El diagnóstico CNC mostrado pertenece a otra pieza, máquina o configuración');
 if(Number.isFinite(sceneTime)&&Number.isFinite(snapshot.referenceSceneTime)&&
    Math.abs(sceneTime-snapshot.referenceSceneTime)>1e-7)
  return neutral('OTRA_FASE_DE_CHAPA',
   'Esta evidencia CNC corresponde a chapa inmóvil en otra fase de la '+
   'secuencia; NO trasladar el color al fotograma actual');
 return snapshot.status||neutral('SIN_EVIDENCIA_CNC',
  'No hay diagnóstico aplicable al tope');
}
