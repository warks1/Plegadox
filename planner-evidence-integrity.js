/**
 * PlegadoX R114 · cotejo de informes de seguridad del planificador.
 *
 * Las incidencias DETALLADAS prevalecen sobre contadores agregados.
 * Ausencia de CAD o de trayectoria CNC != ausencia de colisión.
 * Todos los resultados son orientativos, nunca autorización industrial.
 */
const count=x=>typeof x==='number'&&Number.isFinite(x)?
 Math.max(0,Math.trunc(x)):0;
const FINDING_PENETRATION=new Set(['penetration','penetracion']);
const MACHINE_KINDS=new Set(['ram','bed','gauge','upperClamp',
 'lowerClamp','upperAdapter','lowerAdapter','frontSupport']);
const PHYSICAL_HITS=new Set(['interferencia-envolvente',
 'penetracion-barrido-lineal-modelado']);
const UNCERTAIN_HITS=new Set(['intervalo-barrido-no-resuelto','geometria-invalida']);
const findings=op=>Array.isArray(op?.findings)?op.findings:[];
export function reconcileCriticalToolEvidence(report,operationsExpected){
 if(!report||!Array.isArray(report.operations)||
  report.operations.length!==operationsExpected)
  throw Error('Barrido crítico de punzón/matriz incompleto');
 const byKind={punch:{penetrations:0,warnings:0},
  die:{penetrations:0,warnings:0}};
 let observedPenetrations=0,observedWarnings=0;
 for(const op of report.operations){
  const hits=findings(op);
  const pen=op.hasPenetration===true||
   (Array.isArray(op.penetrationKinds)&&op.penetrationKinds.length>0)||
   hits.some(x=>FINDING_PENETRATION.has(x?.category));
  if(pen)observedPenetrations++;
  if(pen||op.hasWarning===true||hits.length)observedWarnings++;
  for(const kind of ['punch','die']){
   if(hits.some(x=>x.kind===kind))byKind[kind].warnings++;
   if((Array.isArray(op.penetrationKinds)&&op.penetrationKinds.includes(kind))||
    hits.some(x=>x.kind===kind&&FINDING_PENETRATION.has(x.category)))
    byKind[kind].penetrations++;
  }
 }
 for(const kind of ['punch','die']){
  byKind[kind].penetrations=Math.max(byKind[kind].penetrations,
   count(report.byKind?.[kind]?.penetrations));
  byKind[kind].warnings=Math.max(byKind[kind].warnings,
   count(report.byKind?.[kind]?.warnings),byKind[kind].penetrations);
 }
 return {
  penetrationOperations:Math.max(count(report.penetrationOperations),observedPenetrations,
   byKind.punch.penetrations,byKind.die.penetrations),
  warningOperations:Math.max(count(report.warningOperations),observedWarnings),
  framesChecked:count(report.framesChecked),
  byKind,
  findings:report.operations.flatMap(op=>findings(op).map(f=>({
   ...f,operation:op.operation,bend:op.bend
  }))).slice(0,16),
  verified:false
 };
}
export function reconcileVolumeEvidence(report){
 if(!report||typeof report!=='object')
  throw Error('Resultado volumétrico de máquina no disponible');
 const operations=Array.isArray(report.operations)?report.operations:[];
 const hits={};
 let uncertain=0;
 for(const op of operations){
  const each=new Set();
  for(const f of findings(op)){
   if(UNCERTAIN_HITS.has(f.severity))uncertain++;
   if(MACHINE_KINDS.has(f.kind)&&PHYSICAL_HITS.has(f.severity))
    each.add(f.kind);
  }
  for(const kind of each)hits[kind]=(hits[kind]||0)+1;
 }
 const get=(kind,declared=0)=>Math.max(count(hits[kind]),
  count(report.byKind?.[kind]),count(declared));
 const ramWarnings=get('ram',report.ramWarnings),
  bedWarnings=get('bed',report.bedWarnings),
  gaugeWarnings=get('gauge',report.gaugeWarnings);
 const allKinds=[...MACHINE_KINDS];
 const detected=allKinds.reduce((n,kind)=>n+get(kind,
  kind==='ram'?report.ramWarnings:kind==='bed'?report.bedWarnings:
   kind==='gauge'?report.gaugeWarnings:0),0);
 const ramEvidence=Array.isArray(report.ramEvidence)&&report.ramEvidence.length?
  report.ramEvidence:operations.flatMap(op=>findings(op)
   .filter(f=>f.kind==='ram'&&PHYSICAL_HITS.has(f.severity))
   .map(f=>({...f,operation:op.operation,bend:op.bend}))).slice(0,12);
 return {
  modeledMachineWarnings:Math.max(count(report.modeledMachineWarnings),detected),
  ramWarnings,bedWarnings,gaugeWarnings,ramEvidence,
  uncertainSweptIntervals:Math.max(count(report.uncertainSweptIntervals),
   count(report.unresolvedGeometryFindings),uncertain),
  axisViolations:Math.max(count(report.axisViolationCount),
   Array.isArray(report.axisReport?.violations)?report.axisReport.violations.length:0),
  axisModeledCollisions:Math.max(count(report.axisModeledCollisions),
   Array.isArray(report.axisGeometry?.events)?report.axisGeometry.events.length:0),
  verified:false
 };
}
export function reconcileGaugeEvidence(report,expectedOperations=null){
 if(!report||typeof report!=='object')
  throw Error('Inspección del tope no disponible');
 const ops=Array.isArray(report.operations)?report.operations:[];
 const observedAbsent=ops.filter(op=>op?.contactObserved===false).length;
 const expected=Number.isInteger(expectedOperations)&&expectedOperations>=1?
  expectedOperations:null;
 // Un contador en cero NO permite inferir contactos verificados si
 // faltan golpes, operaciones o un resultado booleano de contacto.
 // No llamar colisión a esta incertidumbre.
 const missingOperationCount=expected===null?0:Math.max(0,expected-ops.length);
 const unexplainedOperations=ops.filter(op=>op?.contactObserved!==true&&
  op?.contactObserved!==false).length;
 const surplusOperations=expected===null?0:Math.max(0,ops.length-expected);
 // Si se declaran IDs de operación, cuatro registros duplicados del
 // golpe 1 no prueban cuatro apoyos distintos. Una batería antigua
 // puede omitir el índice; en tal caso el orden del array es la única
 // evidencia nominal y sigue señalada como modelo no certificado.
 const indexed=ops.length>0&&ops.every(op=>Number.isInteger(op?.operation));
 const distinct= indexed?new Set(ops.map(op=>op.operation)):null;
 const indexMismatch=expected!==null&&indexed&&(
  distinct.size!==expected||ops.some(op=>op.operation<0||
   op.operation>=expected)) ;
 return {contactNotObserved:Math.max(count(report.contactNotObserved),observedAbsent),
  missingOperationCount,unexplainedOperations,surplusOperations,
  indexMismatch,
  incompleteContactData:missingOperationCount>0||unexplainedOperations>0||
   surplusOperations>0||indexMismatch};
}
/** Diagnóstico para el OPERARIO. No convierte un modelo sin advertencias
 * en una máquina comprobada ni llama COLISIÓN a una falta de contacto.
 */
export function summarizePhysicalEvidence(plan,{volumeExpected=true}={}){
 const collisions=[],supportProblems=[],unknown=[],clearances=[];
 if(plan.machineWidthExceeded)collisions.push('Ancho de pieza fuera de la zona de trabajo declarada');
 if(plan.toolPenetrations>0)collisions.push('Penetración modelada de punzón/matriz');
 if(plan.sheetCross>0||plan.sheetOverlap>0)collisions.push('Cruce/solape de chapa modelado');
 if(plan.gaugePenetrations>0)collisions.push('Penetración de chapa en dedo de tope');
 if(plan.volumeMachineWarnings>0)collisions.push('Interferencia modelada de trancha/mesa/tope/amarres');
 if(plan.axisViolations>0||plan.axisModeledCollisions>0)
  collisions.push('Infracción de ejes o invasión modelada en trayectoria');
 if(plan.gaugeInvalidReferences>0)supportProblems.push('Cara de referencia de tope inválida');
 if(plan.gaugeContactNotObserved>0)supportProblems.push('No se ha observado contacto con el tope');
 if(!plan.gaugeChecked)unknown.push('Contacto de tope sin evaluar');
 if(plan.gaugeContactUnknown===true)
  unknown.push('Contacto de tope sin datos completos en todos los golpes');
 if(!plan.toolCriticalChecked)unknown.push('Fases críticas punzón/matriz sin evaluar');
 if(volumeExpected&&!plan.volumeChecked)unknown.push('Barrido volumétrico sin evaluar');
 if(!plan.axisChecked)unknown.push('Sin recorrido CNC comprobado de ejes');
 if(!plan.axisGeometryChecked)unknown.push('CAD de máquina sin cotejo con trayectoria de ejes');
 if(plan.axisGeometryUnresolved>0)unknown.push('Intervalos CNC sin resolver');
 if(plan.volumeSweptSuspects>0)unknown.push('Barridos geométricos sin resolver');
 if(plan.cadImportError)unknown.push('Error de importación CAD de máquina');
 const kinds=Array.isArray(plan.cadMissing)?[...new Set(plan.cadMissing.filter(x=>typeof x==='string'))]:[];
 if(kinds.length)unknown.push('Faltan perfiles CAD de máquina: '+kinds.join(', '));
 const used=Array.isArray(plan.cadProfilesUsed)?plan.cadProfilesUsed:[];
 if(!kinds.length&&!used.length)unknown.push('No consta inventario físico completo CAD de máquina');
 if(plan.toolingMountVerified!==true)unknown.push('Amarres y datums de útiles sin verificar');
 if(plan.toolGeometryVerified!==true)unknown.push('Perfiles de útiles sin certificación geométrica');
 if(plan.gaugeClearanceWarnings>0||plan.gaugeWarnings>0)
  clearances.push('Holguras o avisos de tope sin penetración demostrada');
 if(plan.toolWarnings>0)clearances.push('Avisos de proximidad punzón/matriz');
 const status=collisions.length?'INTERFERENCIA_MODELADA':
  supportProblems.length?'APOYO_DE_TOPE_INVALIDO':
  unknown.length?'MODELO_FISICO_INCOMPLETO':
  clearances.length?'AVISOS_DE_HOLGURA':'SIN_AVISOS_EN_MODELO_NO_CERTIFICADO';
 return {status,collisions,supportProblems,unknown,clearances,
  missingCad:kinds,verified:false,canApproveForMachine:false};
}
