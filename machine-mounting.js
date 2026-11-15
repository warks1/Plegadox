/** Compatibilidad de MONTAJE por lado, no por igualdad de dos herramientas.
 * Configuración real Bystronic 2006 aportada por su propietario:
 *   arriba WILA; abajo adaptador de matriz tipo Promecam.
 * No deduce perfil exacto de fijación, carga admisible ni geometría CAD.
 */
const family=tool=>String(tool?.mount||'').trim().toUpperCase();
function upperWila(tool){
 const f=family(tool);
 if(!f)return null;
 if(/WILA/.test(f))return true;
 if(/TRUMPF|AMADA|PROMECAM/.test(f))return false;
 return null; // R, RF-A y otros: las adaptaciones requieren comprobación.
}
function lowerPromecam(tool){
 const f=family(tool);
 if(!f)return null;
 if(/PROMECAM|AMADA/.test(f))return true;
 if(/TRUMPF|BYSTRONIC|BEYELER|ROLLERI R2/.test(f))return false;
 return null;
}
export function checkMachineToolMounting(machine,punch,die){
 if(machine?.profileId!=='bystronic-2006-100-3100')
  return {compatible:null,verified:false,reason:'Montaje de esta máquina no definido aquí'};
 const up=upperWila(punch),down=lowerPromecam(die);
 if(up===false||down===false)
  return {compatible:false,verified:false,upper:up,lower:down,
   reason:'Útil incompatible con el montaje declarado: arriba WILA, abajo adaptador Promecam. No se ha declarado un segundo adaptador.'};
 if(up===true&&down===true)
  return {compatible:true,verified:false,upper:up,lower:down,
   reason:'Familias de anclaje nominales WILA/Promecam compatibles; verificar amarre, asiento, altura y carga de cada referencia.'};
 return {compatible:null,verified:false,upper:up,lower:down,
  reason:'Falta comprobar anclaje del punzón WILA o matriz Promecam en la unidad real.'};
}
