/**
 * R133 · contraste NOMINAL de sistemas de amarre por herramienta.
 * Fuente técnica: WILA Tool Tang explica que New Standard y European
 * Style (Promecam) difieren físicamente y requieren adaptador/retrofit.
 * https://www.wilatooling.com/knowledge-innovation/knowledge-articles/tool-tang/
 *
 * No se infiere compatibilidad mecánica por tonelaje, marca ni por DXF
 * de la sección. Falta siempre el montaje de la unidad y su comprobación.
 */
const upperOf=p=>String(p?.upperClampingSystem||'').toUpperCase();
const lowerOf=p=>String(p?.lowerDieSystem||'').toUpperCase();
export function reviewNominalToolMount(tool,profile){
 const kind=tool?.kind;
 const mount=String(tool?.mount||'').trim().toUpperCase();
 const machineId=String(profile?.id||'');
 const upper=upperOf(profile),lower=lowerOf(profile);
 const machineSystem=kind==='punch'?upper:kind==='die'?lower:'';
 const answer=(status,description)=>({status,description,
  kind,machineId,machineSystem:machineSystem||'SIN_IDENTIFICAR',
  toolMount:mount||'SIN_IDENTIFICAR',
  compatibleForMachine:false,fitPhysicallyVerified:false,
  toolCadVerified:false,canApproveForMachine:false});
 if(!['punch','die'].includes(kind))
  return answer('TIPO_DESCONOCIDO',
   'No existe evidencia para decidir el amarre de esta herramienta');
 if(!machineSystem)return answer('AMARRE_MAQUINA_NO_IDENTIFICADO',
  'Falta identificar en la unidad el sistema de sujeción '+(kind==='punch'?'superior':'inferior')+
   '; el CAD de la herramienta no demuestra que se pueda montar');
 if(!mount||mount==='DESCONOCIDO'||mount.includes('PENDIENTE'))
  return answer('AMARRE_HERRAMIENTA_NO_COTEJADO',
   'No hay una referencia de zanco/base OEM inequívoca; comprobar físicamente');
 const promecam=mount==='AMADA/PROMECAM'||mount==='EUROPEAN STYLE';
 if(kind==='punch'&&upper==='WILA'&&promecam)
  return answer('ADAPTADOR_SUPERIOR_NECESARIO_PENDIENTE',
   'Punzón European Style/Promecam y amarre superior WILA son sistemas diferentes. '+
   'Verificar adaptador específico y CAD de todos los apoyos; NO se puede montar por similitud');
 if(kind==='die'&&lower==='PROMECAM_CON_ADAPTADOR'&&promecam)
  return answer('REGLETA_PROMECAM_DECLARADA_PENDIENTE_CAD',
   'La máquina tiene declarada regleta de matrices Promecam, pero no sus cotas, '+
   'zanco, alojamiento ni longitud Z. Un inserto 1V requiere cotejar portamatriz real');
 if(kind==='punch'&&upper==='WILA'&&mount==='WILA')
  return answer('FAMILIA_WILA_COINCIDENTE_SIN_MEDICION',
   'Familia nominal WILA, pero debe cotejarse tipo exacto de zanco, amarre y adaptadores');
 if(kind==='die'&&lower==='PROMECAM_CON_ADAPTADOR'&&mount.includes('WILA'))
  return answer('SISTEMAS_DISTINTOS_INFERIOR',
   'La base inferior declarada es adaptadora Promecam; el zanco WILA no se considera compatible sin soporte específico');
 return answer('MONTAJE_NO_RESUELTO',
  'El dato de catálogo no identifica la mordaza y el adaptador exactos de esta plegadora');
}
