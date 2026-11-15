/**
 * PlegadoX · informe reproducible de posición/retirada de los topes.
 *
 * Guarda la referencia manual y la geometría ACTIVA del visor en las
 * fases de un golpe. Sirve para investigar regresiones (como R90-R96)
 * sin pedir al operario que cambie un apoyo para grabar otro vídeo.
 * Nunca constituye un programa CNC ni una certificación de colisiones.
 */
import {normalized} from './engine.js';
import {technicalScene} from './technical-section.js';
import {gaugePlacement,gaugeContourAtContact} from './backgauge-placement.js';
import {gaugeRiskStatus} from './gauge-risk-status.js';
import {getActiveMachineConfig} from './machine-config.js';

export const GAUGE_DIAGNOSTIC_SUBSTEPS=Object.freeze([
 .16,.25,.34,.36,.38,.40,.42,.44,.50,.60,.70,.83,.84,.92,.99
]);

const coordinate=(point)=>point&&Number.isFinite(point.x)&&Number.isFinite(point.y)?
 {x:point.x,y:point.y}:null;

function sampleStage(piece,operation,sub,machine){
 const scene=technicalScene(piece,5*(operation+sub));
 if(scene.stage.activeOperation!==operation)
  throw Error('El cálculo de tope pertenece a otro golpe');
 const bend=scene.stage.activeBend;
 const stopNumber=piece.stopByBend[bend]===2?2:1;
 const placement=gaugePlacement(scene,stopNumber);
 const dimensions=stopNumber===2?machine.support:machine.stop;
 const risk=gaugeRiskStatus(placement);
 const transition=scene.gaugeTransition;
 return {
  sub,time:5*(operation+sub),phase:scene.stage.phase,
  operation:operation+1,bend:bend+1,stopNumber,
  reference:{
   side:scene.gaugeReference.side,
   segmentIndex:scene.gaugeReference.segmentIndex,
   sourceIndex:scene.gaugeReference.sourceIndex,
   distance:scene.gaugeReference.distance,
   freeEdge:scene.gaugeReference.freeEdge,
   manual:scene.gaugeReference.manual
  },
  setup:{
   valid:scene.gaugeSetup.valid,
   reason:scene.gaugeSetup.reason,
   manual:scene.gaugeSetup.manual,
   foldedWingContact:scene.gaugeSetup.foldedWingContact===true,
   verified:scene.gaugeSetup.verified===true
  },
  anchor:coordinate(scene.gaugeAnchor),
  finger:coordinate(placement.point),
  contact:{
   engaged:placement.contactEngaged,
   from:coordinate(placement.contact?.from),
   to:coordinate(placement.contact?.to),
   point:coordinate(placement.contact?.point),
   gap:placement.contactGap,
   seat:placement.seat?.seated===true,
   referenceKind:placement.referenceKind
  },
  motion:transition?{
   phase:transition.phase,
   point:coordinate(transition.point),
   from:coordinate(transition.from),
   to:coordinate(transition.to),
   parkPoint:coordinate(transition.parkPoint),
   plannedRetraction:transition.plannedRetraction,
   moving:transition.moving===true,
   withdrawn:transition.withdrawn===true,
   verified:false
  }:null,
  prediction:{
   known:scene.gaugePlan.known===true,
   enabled:scene.gaugePlan.enabled===true,
   penetrationCount:scene.gaugePlan.penetrationCount??null,
   clearanceWarnings:scene.gaugePlan.clearanceWarnings??null,
   initialPenetration:scene.gaugePlan.initialPenetration===true,
   needsSetupCorrection:scene.gaugePlan.needsSetupCorrection===true
  },
  risk:{level:risk.level,message:risk.message,verified:false},
  actualInterference:{
   kind:placement.gaugeInterference?.kind??'sin-geometria',
   warning:placement.gaugeInterference?.warning===true,
   point:coordinate(placement.gaugeInterference?.point)
  },
  sheet:scene.sheetDisplay.map(coordinate),
  fingerPolygon:gaugeContourAtContact(placement,dimensions).map(coordinate),
  verified:false
 };
}

export function buildGaugeMotionDiagnostic(input,{
 build='compilacion-no-indicada',
 samples=GAUGE_DIAGNOSTIC_SUBSTEPS
}={}){
 const piece=normalized(input),machine=getActiveMachineConfig();
 if(!Array.isArray(samples)||!samples.length||
  samples.some((x,i)=>!Number.isFinite(x)||x<=0||x>=1||
   (i>0&&x<=samples[i-1])))
  throw Error('Instantes del diagnóstico deben ser crecientes dentro de cada golpe');
 const operations=piece.order.map((bend,i)=>{
  const frames=samples.map(sub=>sampleStage(piece,i,sub,machine));
  return {operation:i+1,bend:bend+1,stopNumber:piece.stopByBend[bend],
   frames,contactObserved:frames.some(f=>f.contact.engaged),
   withdrawalObserved:frames.some(f=>f.motion?.plannedRetraction>0),
   penetrationAfterRetreat:frames.some(f=>
    f.motion?.withdrawn===true&&f.actualInterference.kind==='penetracion')};
 });
 return {
  schema:'plegadox-gauge-motion-diagnostic-v1',
  build,
  generatedAt:new Date().toISOString(),
  source:'Modelo de sección 2D usado por el visor PlegadoX, no medición CNC',
  piece,
  machine:{
   name:machine.name,profileId:machine.profileId,
   stop:[...machine.stop],support:[...machine.support],
   ram:Array.isArray(machine.ram)?[...machine.ram]:null,
   bed:Array.isArray(machine.bed)?[...machine.bed]:null,
   gaugeGeometryDocumented:machine.gaugeGeometryDocumented===true,
   verified:machine.verified===true
  },
  operationOrder:piece.order.map(x=>x+1),
  samplesPerOperation:samples.length,
  operations,
  verified:false,canApproveForMachine:false,
  limitations:'Diagnóstico por poses discretas en sección 2D y perspectiva 2,5D; NO comprueba recorridos CNC continuos, ejes X/R/Z, sólidos OEM ni seguridad física. No autoriza fabricar.'
 };
}
