/**
 * R126: sólo se muestran trazas CNC si los registros corresponden a
 * esta pieza y a ESTA configuración de máquina. Sin calibración,
 * ninguna línea decorativa debe sugerir un recorrido físico comprobado.
 */
export function assessTrailEvidence({motion,mapping,pieceKey,machineConfigKey,machineId}={}){
 if(!motion)return {drawable:false,code:'sin-registro-ejes',reason:'Sin recorrido Y1/Y2/X/R/Z1/Z2 importado'};
 if(!mapping)return {drawable:false,code:'sin-calibracion',reason:'Faltan signos y datum de ejes'};
 if(!pieceKey||motion.pieceKey!==pieceKey)
  return {drawable:false,code:'otra-pieza',reason:'La trayectoria guardada pertenece a otra pieza o secuencia'};
 if(!machineConfigKey||mapping.machineConfigKey!==machineConfigKey)
  return {drawable:false,code:'otra-configuracion',reason:'El datum corresponde a otra configuración de máquina'};
 if(!machineId||motion.machineId!==machineId)
  return {drawable:false,code:'otra-maquina',reason:'El programa de ejes no identifica esta plegadora'};
 if(!Array.isArray(motion.poses)||motion.poses.length<2)
  return {drawable:false,code:'poses-incompletas',reason:'Sin suficientes posiciones de ejes'};
 if(!['Y','X','R','Z1','Z2'].every(axis=>mapping.signs?.[axis]===1||
  mapping.signs?.[axis]===-1))
  return {drawable:false,code:'signos-incompletos',reason:'Sentido de ejes sin calibrar'};
 return {drawable:true,code:'relativo',reason:'Trazas relativas de posiciones declaradas; sin validación CNC o movimiento de chapa'};
}
