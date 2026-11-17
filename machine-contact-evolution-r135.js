/**
 * R135 · distinguir solape ya existente en el datum de penetración
 * que aparece al desplazarse los cuerpos durante la carrera CNC.
 *
 * AVISO: un solape preexistente PUEDE ser peligroso; también puede
 * representar un montaje o una posición paramétrica ficticia.
 * NUNCA se elimina de la auditoría ni se declara seguro.
 */
import {prismOverlap} from './volume-engine.js';
import {prismTranslation} from './swept-volume.js';
const finite=n=>typeof n==='number'&&Number.isFinite(n);
const EPS=1e-7;
const report=(code,label,a,b,rel=null)=>({
 code,label,
 initialOverlapMm3:a?.unknown?null:a?.volume??null,
 finalOverlapMm3:b?.unknown?null:b?.volume??null,
 penetratesInitially:a?.unknown?null:a?.intersects??null,
 penetratesFinally:b?.unknown?null:b?.intersects??null,
 relativeTranslationMm:rel,
 createdDuringThisInterval:['NUEVA_AL_FINAL','TRANSITORIA_ENTRE_POSES']
  .includes(code),
 baselineAlreadyPresent:['PREEXISTENTE_SIN_MOVIMIENTO_RELATIVO',
  'PREEXISTENTE_EN_EXTREMOS','PREEXISTENTE_RESUELTA_AL_FINAL'].includes(code),
 certified:false,physicalCollisionCertified:false
});
export function classifySweptContactEvolution(a0,a1,b0,b1){
 const initial=prismOverlap(a0,b0),final=prismOverlap(a1,b1);
 if(initial.unknown||final.unknown)
  return report('GEOMETRIA_INDETERMINADA',
   'No se puede decidir si el solape aparece o ya existía; CAD/pose inválida',
   initial,final);
 const ma=prismTranslation(a0,a1),mb=prismTranslation(b0,b1);
 if(!ma.ok||!mb.ok)
  return report('MOVIMIENTO_NO_RIGIDO',
   'El sólido cambió de forma/rotó: origen del solape sin resolver',
   initial,final);
 const relative=Math.hypot(ma.dx-mb.dx,ma.dy-mb.dy,ma.dz-mb.dz);
 if(initial.intersects){
  if(relative<=EPS)
   return report('PREEXISTENTE_SIN_MOVIMIENTO_RELATIVO',
    'Solape YA PRESENTE en la pose inicial, sin desplazamiento relativo. '+
    'Posible montaje, CAD/datum incorrecto o interferencia previa; NO es un choque nuevo de esta carrera',
    initial,final,relative);
  if(final.intersects)
   return report('PREEXISTENTE_EN_EXTREMOS',
    'Penetración modelada YA PRESENTE al inicio y también al final. '+
    'El movimiento puede agravarla; no es posible determinar el primer contacto previo',
    initial,final,relative);
  return report('PREEXISTENTE_RESUELTA_AL_FINAL',
   'Penetración modelada YA PRESENTE al inicio, pero ausente en la pose final. '+
   'Revisar fase de retirada y montaje; no puede declararse trayectoria segura',
   initial,final,relative);
 }
 if(final.intersects)return report('NUEVA_AL_FINAL',
  'Nueva penetración modelada durante la carrera y presente al final',
  initial,final,relative);
 return report('TRANSITORIA_ENTRE_POSES',
  'Solape modelado SÓLO entre posiciones: ambos extremos quedan libres; '+
  'el barrido continuo detectó la interferencia intermedia',
  initial,final,relative);
}
export function summarizeContactEvolution(events){
 const byCode={
  NUEVA_AL_FINAL:0,TRANSITORIA_ENTRE_POSES:0,
  PREEXISTENTE_SIN_MOVIMIENTO_RELATIVO:0,
  PREEXISTENTE_EN_EXTREMOS:0,PREEXISTENTE_RESUELTA_AL_FINAL:0,
  GEOMETRIA_INDETERMINADA:0,MOVIMIENTO_NO_RIGIDO:0,
  NO_CLASIFICADO:0
 };
 for(const event of events||[]){
  const code=event?.contactEvolutionCode;
  const key=Object.hasOwn(byCode,code)?code:'NO_CLASIFICADO';
  byCode[key]++;
 }
 const created=byCode.NUEVA_AL_FINAL+byCode.TRANSITORIA_ENTRE_POSES;
 const baseline=byCode.PREEXISTENTE_SIN_MOVIMIENTO_RELATIVO+
  byCode.PREEXISTENTE_EN_EXTREMOS+byCode.PREEXISTENTE_RESUELTA_AL_FINAL;
 return {byCode,newDuringInterval:created,preexistingAtStart:baseline,
  preexistingWithoutRelativeMotion:byCode.PREEXISTENTE_SIN_MOVIMIENTO_RELATIVO,
  undetermined:byCode.GEOMETRIA_INDETERMINADA+
   byCode.MOVIMIENTO_NO_RIGIDO+byCode.NO_CLASIFICADO,
  total:(events||[]).length,
  noNewModeledPenetrations:created===0,
  verified:false,physicalCollisionCertified:false,
  // No atribuir color VERDE al resultado: un solape previo sigue
  // siendo peligroso o necesita cotejo del perfil instalado.
  status:created>0?'PENETRACIONES_GENERADAS_DURANTE_CARRERA':
   baseline>0?'SOLAPES_PREEXISTENTES_PENDIENTES_DE_COTEJO':
   'SIN_EVENTOS_CLASIFICADOS'};
}
