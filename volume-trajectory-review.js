/**
 * PlegadoX R31: barrido temporal de cuerpos extruidos en anchura (2,5D).
 * Inspecciona todas las operaciones y los cambios de fase; los intervalos
 * entre muestras permanecen SIN VALIDAR. No ordena maniobras CNC.
 */
import {normalized} from './engine.js';
import {technicalScene} from './technical-section.js';
import {inspectVolumeFrame} from './volume-engine.js';
import {assessAxisMotion,loadAxisMotion,motionPieceKey} from './machine-axis-motion.js';
import {sweptPrismPair} from './swept-volume.js';
import {scanAxisCADMovement,loadAxisMapping} from './machine-axis-geometry.js';
// Registrar cuerpos montados además del punzón/matriz. Si falta CAD
 // estos objetos NO existen en el modelo, nunca se consideran libres.
 const machineKinds=['ram','bed','gauge','gaugeZ1','gaugeZ2','upperClamp','lowerClamp',
  'upperAdapter','lowerAdapter','frontSupport'];
 const kinds=[...machineKinds,'punch','die'];
 // Nunca contar un barrido SIN RESOLVER como penetración 3D.
 const modeledSeverities=new Set(['interferencia-envolvente',
  'penetracion-barrido-lineal-modelado']);
 const uncertainSeverities=new Set(['intervalo-barrido-no-resuelto',
  'geometria-invalida']);
 const provisionalSeverities=new Set(['solape-envolvente-provisional',
  'solape-barrido-provisional']);
 const severityRank=severity=>modeledSeverities.has(severity)?4:
  provisionalSeverities.has(severity)?3:
  severity==='contacto-o-penetracion-posible'?2:
  uncertainSeverities.has(severity)?1:0;
const bounded=(n,lo,hi,fallback)=>Number.isFinite(Number(n))?
 Math.max(lo,Math.min(hi,Math.trunc(Number(n)))):fallback;
function bounds(prism){
 if(!prism?.valid)return null;
 const xs=prism.polygon.map(p=>p.x),ys=prism.polygon.map(p=>p.y);
 return {minX:Math.min(...xs),maxX:Math.max(...xs),
  minY:Math.min(...ys),maxY:Math.max(...ys),
  minZ:prism.zMin,maxZ:prism.zMax};
}
const union=(a,b)=>!a?b:!b?a:{
 minX:Math.min(a.minX,b.minX),maxX:Math.max(a.maxX,b.maxX),
 minY:Math.min(a.minY,b.minY),maxY:Math.max(a.maxY,b.maxY),
 minZ:Math.min(a.minZ,b.minZ),maxZ:Math.max(a.maxZ,b.maxZ)
};
const crosses=(a,b,margin=.02)=>a&&b&&
 Math.min(a.maxX,b.maxX)-Math.max(a.minX,b.minX)>margin&&
 Math.min(a.maxY,b.maxY)-Math.max(a.minY,b.minY)>margin&&
 Math.min(a.maxZ,b.maxZ)-Math.max(a.minZ,b.minZ)>margin;
const perOpTimes=(op,count)=>{
 // R108: también se inspeccionan las posiciones críticas del cierre
 // contra punzón y TRANCHA. La antigua malla base (0,.16,.36,.68…)
 // podía saltarse completamente el tramo .44-.52 de plegado.
 // Conservar el barrido de intervalos como NO CERTIFICADO.
 const values=new Set([0,.16,.34,.36,.40,.44,.45,.46,.47,.48,
  .50,.52,.56,.60,.64,.68,.72,.84,.92,1-1e-7]);
 for(let i=0;i<=count;i++)values.add(Math.min(1-1e-7,i/count));
 return [...values].sort((a,b)=>a-b).map(t=>op*5+t*5);
};
export function scanVolumeTrajectory(input,options={}){
 const p=normalized(input);
 const perOperation=bounded(options.samplesPerOperation,4,50,8);
 const inspect=options.inspect||((part,time)=>inspectVolumeFrame(
  technicalScene(part,time),{machine:options.machine,machineCAD:options.machineCAD,
   gaugeFingers:options.gaugeFingers}));
 const ops=[],allEvents=[],cadProfilesUsed=new Set(),missingCadComponents=new Set();
 let uncheckedSwept=0,linearSweptPenetrations=0,linearSweptIntervalsEvaluated=0,
  framesChecked=0,cadImportError=null,gaugePairReferenceFrames=0;
 for(let op=0;op<p.order.length;op++){
  const times=perOpTimes(op,perOperation),events=[];
  let previous=null;
  for(const time of times){
   const frame=inspect(p,time);
   framesChecked++;
   if(frame.model?.gaugeReferenceOnly)gaugePairReferenceFrames++;
   for(const name of frame.model?.cadProfilesUsed||[])cadProfilesUsed.add(name);
   for(const name of frame.model?.missingCadComponents||[])missingCadComponents.add(name);
   if(frame.model?.cadImportError)cadImportError=frame.model.cadImportError;
   const kindsHit=new Set(frame.issues?.map(issue=>issue.kind)||[]);
   for(const issue of frame.issues||[]){
    // Cada choque se atribuye al golpe y al instante (no al perfil final).
    if(!kinds.includes(issue.kind))continue;
    const event={operation:op,bend:p.order[op],time,
     kind:issue.kind,severity:issue.severity,
     segment:issue.segment,volumeMm3:issue.volumeMm3,
     evidence:issue.evidence,verified:false};
    events.push(event);
    if(allEvents.length<200)allEvents.push(event);
   }
   // AABB barrido conservador: avisa si las posiciones extremas no
   // colisionan pero las envolventes del intervalo se superponen.
   // Esto NO prueba que haya contacto en un punto intermedio.
   const model=frame.model;
   if(previous?.model&&model){
    const sheetSweep=union(
     previous.model.sheet.reduce((b,s)=>union(b,bounds(s)),null),
     model.sheet.reduce((b,s)=>union(b,bounds(s)),null));
    for(const kind of machineKinds){
     // No barrer una envolvente falsa de ancho total mientras el modelo
     // dispone de dedos Z1/Z2 reales para cualquiera de los extremos.
     if(kind==='gauge'&&(previous.model.gaugeReferenceOnly||
      model.gaugeReferenceOnly))continue;
     const before=previous.model.objects[kind],after=model.objects[kind];
     if(!before?.valid||!after?.valid)continue;
     const moving=union(bounds(before),bounds(after));
     if(kindsHit.has(kind)||previous.kindsHit.has(kind)||
       !crosses(sheetSweep,moving))continue;
     let sweepFound=null,allLinear=true;
     // Si ambos cuerpos mantienen sección y sólo TRASLADAN X/Y, se
     // comprueba la franja BARRIDA entre muestras, no sólo los extremos.
     // Si la chapa DEFORMA/GIRA o cambia Z, NO se inventa continuidad.
     if(previous.model.sheet.length!==model.sheet.length)allLinear=false;
     else for(let segment=0;segment<model.sheet.length;segment++){
      const sweep=sweptPrismPair(
       previous.model.sheet[segment],model.sheet[segment],before,after);
      if(sweep.unknown){allLinear=false;continue;}
      if(sweep.intersects){sweepFound={...sweep,segment};break;}
     }
     if(sweepFound){
      linearSweptPenetrations++;
      const cadDeclared=[before.provenance,after.provenance].every(source=>
       typeof source==='string'&&source.startsWith('perfil CAD importado '));
      const event={operation:op,bend:p.order[op],time,kind,
       severity:cadDeclared?'penetracion-barrido-lineal-modelado':
        'solape-barrido-provisional',
       segment:sweepFound.segment,volumeMm3:null,
       evidence:'intersección en barrido lineal entre poses de la simulación; '+
        (cadDeclared?'CAD importado sin validación CNC':'envolvente ilustrativa sin CAD OEM')+', no es trayectoria CNC registrada',
       verified:false};
      events.push(event);
      if(allEvents.length<200)allEvents.push(event);
     }else if(!allLinear){
      const event={operation:op,bend:p.order[op],time,
       kind,severity:'intervalo-barrido-no-resuelto',segment:null,
       volumeMm3:null,evidence:'envolventes AABB temporales: deformación, giro o Z pendiente de comprobación CNC',
       verified:false};
      events.push(event);
      if(allEvents.length<200)allEvents.push(event);
      uncheckedSwept++;
     }else linearSweptIntervalsEvaluated++;
    }
   }
   previous={model,kindsHit};
  }
  const occurrences=new Map();
  for(const ev of events){
   const prior=occurrences.get(ev.kind);
   if(!prior||severityRank(ev.severity)>severityRank(prior.severity))
    occurrences.set(ev.kind,ev);
  }
  ops.push({operation:op,bend:p.order[op],samples:times.length,
   earliest:events[0]||null,findings:[...occurrences.values()],
   // Conservar todas las incertidumbres del golpe incluso si otra
   // muestra del MISMO cuerpo presenta después una penetración.
   unresolvedFindingsCount:events.filter(e=>uncertainSeverities.has(e.severity)).length,
   provisionalKinds:[...new Set(events.filter(e=>provisionalSeverities.has(e.severity))
    .map(e=>e.kind))],
   possibleInterference:events.length>0,
   modelPenetration:events.some(e=>
    machineKinds.includes(e.kind)&&
    ['interferencia-envolvente','penetracion-barrido-lineal-modelado']
     .includes(e.severity)),
   checkedFrom:times[0],checkedTo:times.at(-1),verified:false});
 }
 // Los registros de ejes se asignan a una geometría y secuencia exactas.
 // Una traza de otra pieza JAMÁS sirve para acreditar ésta.
 let axisSource=options.axisMotion;
 if(axisSource===undefined&&typeof localStorage!=='undefined'){
  try{axisSource=loadAxisMotion(localStorage);}
  catch{axisSource=null;}
 }
 const axisReport=axisSource?.pieceKey!==motionPieceKey(p)&&axisSource?
  {status:'TRAZA_DE_OTRA_PIEZA',checked:false,violations:[],
   unknown:['El registro de ejes no corresponde a la geometría, orden y útiles actuales'],
   verified:false,canApproveForMachine:false}:
  assessAxisMotion(axisSource||null,{
   samplesPerSegment:options.axisSamplesPerSegment,
   collisionAt:options.axisCollisionAt
  });
 // Vincular CAD de máquina con Y1/Y2/X/R/Z sólo con signos/datum
 // expresamente importados, y únicamente en fases de chapa inmóvil.
 let mapping=options.axisMapping;
 if(mapping===undefined&&typeof localStorage!=='undefined'){
  try{mapping=loadAxisMapping(localStorage);}
  catch{mapping=null;}
 }
 const axisGeometry=scanAxisCADMovement(p,{
  axisMotion:axisSource, mapping,
  machine:options.machine,machineCAD:options.machineCAD,
  maxIntervals:options.axisGeometryMaxIntervals
 });
  const byKind=Object.fromEntries(kinds.map(kind=>[kind,0]));
 const provisionalByKind=Object.fromEntries(machineKinds.map(kind=>[kind,0]));
 let unresolvedGeometryFindings=0;
 for(const row of ops){
  unresolvedGeometryFindings+=row.unresolvedFindingsCount;
  // La primera incidencia más grave puede reemplazar la provisional
  // del mismo cuerpo. Conservar ambas evidencias por operación.
  for(const kind of row.provisionalKinds)
   if(provisionalByKind[kind]!==undefined)provisionalByKind[kind]++;
  for(const f of row.findings){
   // Una envolvente sin Z real no demuestra penetración de máquina.
   // El contacto habitual con el radio del útil se cuenta por separado.
   if(modeledSeverities.has(f.severity)||
     (['punch','die'].includes(f.kind)&&
      f.severity==='contacto-o-penetracion-posible'))byKind[f.kind]++;
  }
 }
 return {operations:ops,framesChecked,byKind,provisionalByKind,
  provisionalMachineWarnings:machineKinds.reduce((n,kind)=>
   n+provisionalByKind[kind],0),
  provisionalRamWarnings:provisionalByKind.ram,
  provisionalBedWarnings:provisionalByKind.bed,
  provisionalGaugeWarnings:provisionalByKind.gauge+
   provisionalByKind.gaugeZ1+provisionalByKind.gaugeZ2,
  cadProfilesUsed:[...cadProfilesUsed],missingCadComponents:[...missingCadComponents],
  cadImportError,
  warningCount:ops.filter(o=>o.possibleInterference).length,
  modeledMachineWarnings:machineKinds.reduce((n,kind)=>n+byKind[kind],0),
  // No confundir contacto normal de punzón/matriz con intrusión en
  // trancha. La trancha se comprueba como cuerpo INDEPENDIENTE.
  ramWarnings:byKind.ram,bedWarnings:byKind.bed,
  gaugeWarnings:byKind.gauge+byKind.gaugeZ1+byKind.gaugeZ2,
  gaugeFingerWarnings:{Z1:byKind.gaugeZ1,Z2:byKind.gaugeZ2},
  gaugePairReferenceFrames,
  punchVolumeContacts:byKind.punch,dieVolumeContacts:byKind.die,
  ramEvidence:ops.flatMap(op=>op.findings.filter(f=>f.kind==='ram')
   .map(f=>({...f,operation:op.operation,bend:op.bend}))).slice(0,12),
  uncertainSweptIntervals:uncheckedSwept,unresolvedGeometryFindings,
  linearSweptPenetrations,
  linearSweptIntervalsEvaluated,axisReport,axisViolationCount:axisReport.violations.length,
  axisGeometry,axisModeledCollisions:axisGeometry.events.length,
  status:'VOLUMENES_PARAMETRICOS_SIN_VALIDACION_CAD_CNC',
  source:'Cotas V85 Cybelec del usuario + perfiles CAD importados cuando consten + envolventes provisionales cuando falten',
  verified:false,continuousCollisionVerified:false,canApproveForMachine:false,
  limitations:'Se comprueban sólidos 2,5D y barridos lineales rígidos del visor. Cuando existe calibración explícita de signos y datum, la traza Y/X/R/Z se proyecta sobre sólidos CAD sólo en fases de chapa declarada inmóvil; no se modelan inclinación Y1/Y2 superior a tolerancia, el segundo dedo, giro, deformación, montaje OEM ni el recorrido continuo real. Las poses Y1/Y2/X/R/Z1/Z2 también se revisan contra límites declarados. Sin sólidos STEP, amarres, recorridos reales completos y volteos no puede certificarse seguridad.'};
}
