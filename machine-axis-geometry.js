/**
 * PlegadoX · proyección DOCUMENTADA de ejes CNC sobre sólidos 2,5D.
 *
 * La relación con la escena se hace únicamente por signos, origen y
 * referencia temporal aportados; nunca se deducen los ceros de V85 de
 * una ficha técnica ajena. Y1/Y2 se aproximan por media sólo cuando el
 * desfase no varía más que la tolerancia explícita indicada.
 *
 * Válido exclusivamente para intervalos con chapa declarada INMÓVIL
 * (dos poses con idéntico sceneTime, igual al datum de calibración).
 * Los tramos con giro o deformación permanecen SIN RESOLVER.
 */
import {normalized} from './engine.js';
import {getActiveMachineConfig} from './machine-config.js';
import {technicalScene} from './technical-section.js';
import {buildVolumeScene} from './volume-engine.js';
import {sweptPrismPair,translatePrism} from './swept-volume.js';
import {sweptBroadphase} from './machine-swept-broadphase-r132.js';
import {planMachineInterferencePairs,pairGeometryAvailability} from './machine-interference-pairs-r133.js';
import {normalizeAxisMotion,motionPieceKey} from './machine-axis-motion.js';
import {machineConfigurationKey} from './machine-cad.js';
import {getActiveMachineProfile} from './machine-selection.js';
import {classifyAxisContact,summarizeAxisContacts} from './machine-axis-evidence.js';
import {assessRamYTilt} from './machine-ram-tilt-evidence-r131.js';
export const AXIS_MAPPING_KEY='plegadox:axis-cad-mapping:v1';
const AXES=['Y','X','R','Z1','Z2'];
const numeric=(v,name,min,max)=>{
 if(v==null||v===''||!Number.isFinite(Number(v))||
  Number(v)<min||Number(v)>max)throw Error(name+' inválido');
 return Number(v);
};
export function normalizeAxisMapping(raw){
 if(!raw||raw.unit!=='mm'||raw.version!==1)
  throw Error('La calibración debe indicar version=1 y unit=mm');
 const signs={};
 for(const axis of AXES){
  const value=raw.signs?.[axis];
  if(value!==1&&value!==-1)
   throw Error('Debe calibrar el sentido de '+axis+' (+1 o -1)');
  signs[axis]=value;
 }
 const finger=raw.activeFinger??raw.finger;
 if(raw.activeFinger!=null&&raw.finger!=null&&raw.activeFinger!==raw.finger)
  throw Error('Selección de dedo contradictoria en la calibración');
 if(finger!=='Z1'&&finger!=='Z2')
  throw Error('Elegir dedo modelado Z1 o Z2');
 const sceneTime=numeric(raw.referenceSceneTime,'Tiempo de referencia de chapa',0,100000);
 const ramTiltTolerance=numeric(raw.ramTiltTolerance,'Tolerancia de Y1/Y2',0,5);
 const source=String(raw.source||'').trim();
 if(source.length<4||source.length>160)
  throw Error('Indicar documento u origen de la calibración CNC');
 const key=String(raw.machineConfigKey||'');
 if(!/^(?:v85|machine)-[0-9a-f]{8}$/.test(key))
  throw Error('La calibración debe estar asociada a una configuración de plegadora');
 return {version:1,unit:'mm',signs,activeFinger:finger,referenceSceneTime:sceneTime,
  ramTiltTolerance,source,machineConfigKey:key,
  certified:false,cncValidated:false};
}
export function loadAxisMapping(storage){
 if(!storage?.getItem)return null;
 const raw=storage.getItem(AXIS_MAPPING_KEY);
 if(raw==null)return null;
 return normalizeAxisMapping(JSON.parse(raw));
}
export function saveAxisMapping(storage,raw){
 if(!storage?.setItem)throw Error('Almacenamiento de calibración no disponible');
 const mapping=normalizeAxisMapping(raw);
 storage.setItem(AXIS_MAPPING_KEY,JSON.stringify(mapping));
 return mapping;
}
const unknown=(status,message)=>({status,checked:false,framesChecked:0,
 intervalsChecked:0,unresolved:1,events:[],unknown:[message],
 verified:false,canApproveForMachine:false});
export function scanAxisCADMovement(input,options={}){
 if(!options.axisMotion)return unknown('EJES_SIN_TRAYECTORIA',
  'No hay registros reales de ejes para esta pieza');
 if(!options.mapping)return unknown('EJES_SIN_DATUM_CAD',
  'Faltan signos X/R/Y/Z, datum temporal y elección de dedo');
 let program,mapping;
 try{program=normalizeAxisMotion(options.axisMotion);
  mapping=normalizeAxisMapping(options.mapping);}
 catch(error){return unknown('TRAZA_O_DATUM_INVALIDOS',String(error.message||error));}
 const piece=normalized(input),machine=options.machine||getActiveMachineConfig();
 if(program.pieceKey!==motionPieceKey(piece))
  return unknown('TRAZA_DE_OTRA_PIEZA',
   'La traza no corresponde a pieza, orden, herramientas, tipo Stop/Support, posición de apoyo, radio o desarrollo actuales');
 // R130: no trasladar una traza archivada para otra plegadora aunque
 // casualmente comparta los mismos límites o la misma llave de cotas.
 const activeMachineId=options.machineId||getActiveMachineProfile().id;
 // Compatibilidad con trazas históricas que sí declaraban el modelo V85,
 // pero aún no especificaban el ID normalizado. No equiparar una V85
 // con ninguna Bystronic, ni afirmar su número de serie como verificado.
 const genericV85=program.machineId==='V85'&&
  activeMachineId==='trumpf-v85';
 if(program.machineId!==activeMachineId&&!genericV85)
  return unknown('TRAZA_DE_OTRA_MAQUINA',
   'La traza corresponde a '+program.machineId+' y no a '+activeMachineId);
 if(mapping.machineConfigKey!==machineConfigurationKey(machine))
  return unknown('DATUM_DE_OTRA_MAQUINA','La configuración de plegadora cambió tras calibrar los ejes');
 const initial=program.poses[0];
 if(initial.sceneTime==null||
    Math.abs(initial.sceneTime-mapping.referenceSceneTime)>1e-7)
  return unknown('CHAPA_SIN_REFERENCIA_TEMPORAL',
   'La primera pose requiere sceneTime igual al tiempo de referencia de chapa');
 if(mapping.referenceSceneTime>piece.order.length*5+1e-7)
  return unknown('REFERENCIA_FUERA_DE_PIEZA','El tiempo de chapa supera la secuencia');
 let base;
 try{base=buildVolumeScene(technicalScene(piece,mapping.referenceSceneTime),{
  machine,machineCAD:options.machineCAD,gaugeFingers:options.gaugeFingers});}
 catch(error){return unknown('ESCENA_CAD_INVALIDA',String(error.message||error));}
 const ref=initial.axes;
 const twoFingers=base.gaugeReferenceOnly===true;
 const at=pose=>{
  const y=((pose.axes.Y1-ref.Y1)+(pose.axes.Y2-ref.Y2))/2*mapping.signs.Y;
  const x=(pose.axes.X-ref.X)*mapping.signs.X;
  const r=(pose.axes.R-ref.R)*mapping.signs.R;
  const z=(pose.axes[mapping.activeFinger]-ref[mapping.activeFinger])*
   mapping.signs[mapping.activeFinger];
  // Amarres y adaptadores móviles siguen Y; inferiores y apoyos fijos.
  // CAD ausente significa SIN RESOLVER, nunca "ausencia de colisión".
  const extra={};
  for(const kind of ['upperClamp','upperAdapter'])
   if(base.objects[kind]?.valid)
    extra[kind]=translatePrism(base.objects[kind],0,y);
  for(const kind of ['lowerClamp','lowerAdapter','frontSupport'])
   if(base.objects[kind]?.valid)extra[kind]=base.objects[kind];
  return {
   ram:translatePrism(base.objects.ram,0,y),
   punch:translatePrism(base.objects.punch,0,y),
   gauge:twoFingers?null:translatePrism(base.objects.gauge,x,r,z),
   ...(twoFingers?{
    gaugeZ1:translatePrism(base.objects.gaugeZ1,x,r,
     (pose.axes.Z1-ref.Z1)*mapping.signs.Z1),
    gaugeZ2:translatePrism(base.objects.gaugeZ2,x,r,
     (pose.axes.Z2-ref.Z2)*mapping.signs.Z2)
   }:{}),
   bed:base.objects.bed,die:base.objects.die,
   ...extra,sheet:base.sheet
  };
 };
 const events=[],unknowns=[],maxIntervals=Math.max(1,Math.min(250,
  Number.isFinite(Number(options.maxIntervals))?Math.trunc(Number(options.maxIntervals)):100));
 let intervalsChecked=0,framesChecked=0,unresolved=0,tiltUnresolved=0;
 let ramTiltApproximatedIntervals=0,ramTiltApproximationMaxMm=0;
 let broadphaseRejectedPairs=0,narrowphasePairsChecked=0,indeterminateBroadphasePairs=0;
 const zMode=options.machineCAD===undefined?'biblioteca local':
  'CAD de máquina facilitado';
 // Matriz integral de conjuntos: todas las combinaciones superior-
 // inferior y topes, SIN doble inspección al invertir el orden.
 // Montajes del mismo conjunto no se tratan como choques accidentales:
 // quedan expresamente pendientes de cotejo de interfaces OEM.
 const interferencePlan=planMachineInterferencePairs(twoFingers);
 const reviewedPairs=interferencePlan.pairs;
 const fingerNames=twoFingers?['gaugeZ1','gaugeZ2']:['gauge'];
 let pairIntervalsChecked=0,pairIntervalsMissing=0;
 let cadCadPairIntervals=0,partlyProvisionalPairIntervals=0;
 let sheetPairIntervalsMissing=0,suppressedEvents=0;
 const pendingPairNames=new Set(),missingPairExamples=[];
 const reportMissing=(moving,against,reason,interval)=>{
  pairIntervalsMissing++;
  const key=moving+' / '+against;
  pendingPairNames.add(key);
  if(missingPairExamples.length<24)missingPairExamples.push({
   moving,against,interval,reason,certified:false
  });
 };
 const upperKinds=new Set(['ram','punch','upperClamp','upperAdapter']);
 const recordEvent=(sweep,kind,object,from,to,tiltApproximationMm=0)=>{
  if(events.length>=120){suppressedEvents++;return;}
  const sourceMoving=base.objects[kind]?.provenance||'chapa de modelo';
  const sourceAgainst=base.objects[object]?.provenance||
   (object.startsWith('chapa-')?'malla-chapa-compartida':'envolvente provisional');
  const upperAssemblyInvolved=upperKinds.has(kind)||upperKinds.has(object);
  const evidence=classifyAxisContact(sourceMoving,sourceAgainst,{
   upperAssemblyYApproximationMm:upperAssemblyInvolved?tiltApproximationMm:0
  });
  events.push({kind:'contacto-cad-trayectoria',moving:kind,against:object,
   startTime:from.time,endTime:to.time,
   modeledReason:sweep.reason,evidenceCode:evidence.code,
   evidenceLabel:evidence.label,
   upperAssemblyTiltUnmodeled:evidence.upperAssemblyTiltUnmodeled===true,
   upperAssemblyYApproximationMm:upperAssemblyInvolved?tiltApproximationMm:0,
   sourceMoving,sourceAgainst,verified:false,
   physicalCollisionCertified:false});
 };
 for(let i=1;i<program.poses.length;i++){
  if(intervalsChecked>=maxIntervals){unresolved+=program.poses.length-i;
   unknowns.push('Se alcanzó el límite de intervalos de esta revisión');break;}
  const before=program.poses[i-1],after=program.poses[i];
  if(before.sceneTime==null||after.sceneTime==null||
   Math.abs(before.sceneTime-after.sceneTime)>1e-7||
   Math.abs(before.sceneTime-mapping.referenceSceneTime)>1e-7){
   unresolved++;continue;
  }
  const tilt=assessRamYTilt(before.axes,after.axes,ref,
   mapping.ramTiltTolerance);
  if(tilt.exceedsTolerance){
   tiltUnresolved++;unresolved++;
   unknowns.push('Inclinación Y1/Y2 fuera de tolerancia de modelo 2,5D');
   continue;
  }
  if(tilt.hasUnmodeledTilt){
   ramTiltApproximatedIntervals++;
   ramTiltApproximationMaxMm=Math.max(ramTiltApproximationMaxMm,
    tilt.meanApproximationErrorMm);
  }
  let a,b;
  try{a=at(before);b=at(after);}
  catch(error){unresolved++;unknowns.push(String(error.message||error));continue;}
  intervalsChecked++;framesChecked+=2;
  for(const [moving,against] of reviewedPairs){
   const availability=pairGeometryAvailability(a,b,moving,against);
   if(!availability.checkable){
    reportMissing(moving,against,availability.missing.join(', '),i);
    continue;
   }
   pairIntervalsChecked++;
   if(availability.imported)cadCadPairIntervals++;
   else partlyProvisionalPairIntervals++;
   const broad=sweptBroadphase(a[moving],b[moving],a[against],b[against]);
   if(!broad.mayOverlap){broadphaseRejectedPairs++;continue;}
   if(!broad.known)indeterminateBroadphasePairs++;
   narrowphasePairsChecked++;
   const sweep=sweptPrismPair(a[moving],b[moving],a[against],b[against]);
   if(sweep.intersects)recordEvent(sweep,moving,against,before,after,
    tilt.meanApproximationErrorMm);
   else if(sweep.unknown)unresolved++;
  }
  for(const moving of interferencePlan.sheetSweptBodies){
   for(let n=0;n<a.sheet.length;n++){
    const availability=pairGeometryAvailability(
     {movingBody:a[moving],sheetBody:a.sheet[n]},
     {movingBody:b[moving],sheetBody:b.sheet[n]},
     'movingBody','sheetBody');
    if(!availability.checkable){
     sheetPairIntervalsMissing++;
     reportMissing(moving,'chapa-'+(n+1),
      availability.missing.join(', '),i);
     continue;
    }
    pairIntervalsChecked++;
    partlyProvisionalPairIntervals++;
    const broad=sweptBroadphase(a[moving],b[moving],a.sheet[n],b.sheet[n]);
    if(!broad.mayOverlap){broadphaseRejectedPairs++;continue;}
    if(!broad.known)indeterminateBroadphasePairs++;
    narrowphasePairsChecked++;
    const sweep=sweptPrismPair(a[moving],b[moving],a.sheet[n],b.sheet[n]);
    if(sweep.intersects)recordEvent(sweep,moving,'chapa-'+(n+1),before,after,
     tilt.meanApproximationErrorMm);
    else if(sweep.unknown)unresolved++;
   }
  }
 }
 // R130: si hay DOS perfiles independientes, exigir stopZ1+stopZ2
 // (o supportZ1+supportZ2), no un inexistente perfil común stop.
 // No falsear el informe "falta CAD" cuando ambos ya están montados.
 const activeBend=technicalScene(piece,mapping.referenceSceneTime).stage.activeBend;
 const gaugeKind=piece.stopByBend[activeBend]===2?'support':'stop';
 const gaugeKinds=twoFingers&&
  base.gaugeFingerReview?.status==='DOS_PERFILES_DXF_INDEPENDIENTES'?
  [gaugeKind+'Z1',gaugeKind+'Z2']:[gaugeKind];
 const needed=['ram','bed',...gaugeKinds,
  'upperClamp','lowerClamp','upperAdapter','lowerAdapter','frontSupport'];
 const missing=needed.filter(k=>!base.cadProfilesUsed.includes(k));
 if(missing.length)unknowns.push('CAD de máquina sin perfil referenciado: '+missing.join(', '));
 if(pendingPairNames.size)unknowns.push(
  'Parejas de interferencia NO evaluadas por falta de CAD/contorno válido: '+
  [...pendingPairNames].slice(0,14).join(', ')+
  (pendingPairNames.size>14?' y otras '+(pendingPairNames.size-14):'')+
  '. Estos huecos no significan ausencia de colisión.');
 unknowns.push('Interfaces de montaje del mismo conjunto NO certificadas: '+
  interferencePlan.excludedAssemblyInterfaces.length+
  ' uniones entre viga/amarres/útiles o mesa/matriz/soportes. '+
  'No son pares de choque durante movimiento rígido; comprobar planos de montaje.');
 if(program.poses.length-1>intervalsChecked)unknowns.push(
  'Hay fases sin chapa inmóvil o sin correspondencia con la animación');
 if(ramTiltApproximatedIntervals)unknowns.push(
  'Y1/Y2 presentan un movimiento diferencial en '+
  ramTiltApproximatedIntervals+' intervalos: desviación geométrica aproximada máxima '+
  ramTiltApproximationMaxMm.toFixed(3)+
  ' mm respecto al movimiento medio. No se modela la flexión ni inclinación real de la trancha.');
 unknowns.push((twoFingers?
  'Se han modelado los DOS dedos en Z1/Z2 con CAD y bandas Z declaradas, únicamente a partir del datum y en intervalos de chapa inmóvil; NO hay validación CNC continua, inclinación Y1/Y2 ni deformación/volteos.':
  'No se ha modelado el segundo dedo Z1/Z2, inclinación continua Y1/Y2, volteos ni deformación de chapa.')+
  ' Los amarres/adaptadores se inspeccionan sólo cuando existe su CAD registrado.');
 if(!base.objects.punch.provenance.includes('perfil-acotado'))
  unknowns.push('Perfil de punzón no acreditado con CAD OEM');
 if(!base.objects.die.provenance.includes('perfil-acotado'))
  unknowns.push('Perfil de matriz no acreditado con CAD OEM');
 if(genericV85)unknowns.push(
  'Identificación CNC histórica solo como V85; placa/número de serie sin verificar');
 if(suppressedEvents)unknowns.push(
  'La lista visual de incidencias alcanzó 120 eventos: se omitieron '+
   suppressedEvents+' observaciones adicionales. El resultado NO es exhaustivo.');
 const evidenceSummary=summarizeAxisContacts(events);
 const riskStatus=events.length?
  evidenceSummary.status:
  unresolved||missing.length||pairIntervalsMissing||
   ramTiltApproximatedIntervals?
   'REVISION_CAD_CNC_INCOMPLETA':
  'INTERVALOS_LINEALES_REVISADOS_SIN_CERTIFICAR';
 return {status:riskStatus,evidenceSummary,
  checked:intervalsChecked>0,intervalsChecked,framesChecked,
  unresolved,tiltUnresolved,
  ramTiltApproximatedIntervals,ramTiltApproximationMaxMm,
  broadphaseRejectedPairs,narrowphasePairsChecked,indeterminateBroadphasePairs,
  pairIntervalsChecked,pairIntervalsMissing,uniquePendingPairs:pendingPairNames.size,
  cadCadPairIntervals,partlyProvisionalPairIntervals,sheetPairIntervalsMissing,
  excludedAssemblyInterfaceCount:interferencePlan.excludedAssemblyInterfaces.length,
  collisionPairPlanCount:reviewedPairs.length,
  missingPairExamples,assemblyInterfacesPending:interferencePlan.excludedAssemblyInterfaces,
  suppressedEvents,
  ramIndependentYGeometryModeled:false,
  cadProfilesUsed:base.cadProfilesUsed,missingCad:missing,
  axisFingerModeled:twoFingers?['Z1','Z2']:mapping.activeFinger,
  bothGaugeFingersModeled:twoFingers,mappingSource:mapping.source,
  traceSource:program.source,
  machineId:activeMachineId,traceMachineId:program.machineId,
  machineIdentityGeneric:genericV85,
  gaugeCadKindsRequired:gaugeKinds,
  coverage:{machineCadPresent:needed.length-missing.length,
   machineCadRequired:needed.length,missingCad:missing,
   sampledIntervals:intervalsChecked,unresolvedIntervals:unresolved,
   ramTiltApproximatedIntervals,ramTiltApproximationMaxMm,
   broadphaseRejectedPairs,narrowphasePairsChecked,indeterminateBroadphasePairs,
   pairIntervalsChecked,pairIntervalsMissing,uniquePendingPairs:pendingPairNames.size,
   cadCadPairIntervals,partlyProvisionalPairIntervals,
   sheetPairIntervalsMissing,
   excludedAssemblyInterfaceCount:interferencePlan.excludedAssemblyInterfaces.length,
   collisionPairPlanCount:reviewedPairs.length,
   suppressedEvents,
   fullOEM:false,fullCNC:false},
  physicalCollisionCertified:false,
  evidence:zMode,events,unknown:unknowns,verified:false,
  canApproveForMachine:false};
}
