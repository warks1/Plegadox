/**
 * Auditoría previa a taller: evidencia técnica y límites, NO certificación.
 * No autoriza fabricar, nunca produce "sin colisiones" por ausencia de avisos.
 * La selección de datos de máquina y útiles es explícita y comprobable.
 */
import {normalized,getTooling,estimateAirBendForce,MACHINE} from './engine.js';
import {getV85} from './machine-config.js';
import {selectionCompatibility} from './catalog.js';
import {inspectSequenceTools} from './tool-collision.js';
import {scanSheetSequence} from './sheet-interference.js';
import {scanGaugeSequence} from './gauge-sequence-review.js';
import {toolHeightAudit} from './tool-height-audit.js';
import {scanVolumeTrajectory} from './volume-trajectory-review.js';

const round=n=>Math.round(n*100)/100;
function item(code,level,message,bend=null){
 return {code,level,message,bend};
}
/** `report.status` nunca se eleva a APTO por geometría provisional. */
export function auditForWorkshop(input,options={}){
 const p=normalized(input);
 const {punch,die}=getTooling(p);
 const cfg=options.machine||getV85();
 const force=estimateAirBendForce(p);
 const issues=[],push=(code,level,message,bend=null)=>issues.push(item(code,level,message,bend));
 const maxWidth=Math.min(Number(cfg.ramWidth)||MACHINE.workingWidth,
  Number(cfg.holderWidth)||MACHINE.workingWidth);
 if(p.width>maxWidth+1e-6)
  push('machine-width','block','La pieza ('+p.width+' mm) supera el ancho configurado de la V85 ('+maxWidth+' mm).');
 const flangeMin=.7*Number(die.opening);
 for(let i=0;i<p.angles.length;i++){
  const min=Math.min(p.flanges[i],p.flanges[i+1]);
  if(min+1e-8<flangeMin)
   push('short-flange','block','Pliegue P'+(i+1)+': ala '+round(min)+' mm inferior al apoyo orientativo 0,7×V = '+round(flangeMin)+' mm.',i);
  const interior=180-Math.abs(p.angles[i]);
  if(interior+1e-8<Math.max(punch.angle,die.angle))
   push('incompatible-angle','block','Pliegue P'+(i+1)+': ángulo interior '+round(interior)+'° más cerrado que el útil ('+
   Math.max(punch.angle,die.angle)+'°).',i);
 }
 if(!force.estimated||!Number.isFinite(force.tonneForce))
  push('force-unknown','review','No existe estimación utilizable de fuerza de plegado.');
 else if(force.exceedsNominal)
  push('force-overload','block','Fuerza estimada '+round(force.tonneForce)+' t mayor que las 85 t nominales de la V85.');
 else if(!force.conventionalAirBend90)
  push('force-method','review','La fórmula de fuerza es orientativa fuera del plegado al aire convencional cercano a 90°.');
 const mounting=selectionCompatibility(punch,die);
 if(mounting.compatible===false)push('mount-family','block','Familias de amarre incompatibles conocidas: '+mounting.reason);
 else push('mount-machine','missing','No está verificado el montaje real de '+punch.name+' y '+die.name+' en las mordazas de esta V85.');
 if(punch.length&&p.width>punch.length)
  push('punch-length','review','Ancho de pieza '+p.width+' mm superior al segmento de punzón '+punch.length+' mm; comprobar ensamblaje y carga por segmento.');
 if(die.length&&p.width>die.length)
  push('die-length','review','Ancho de pieza '+p.width+' mm superior al segmento de matriz '+die.length+' mm; comprobar ensamblaje y carga por segmento.');
 for(const [kind,t] of [['punzón',punch],['matriz',die]]){
  const dims=toolHeightAudit(t,kind==='punzón'?'punch':'die');
  if(!dims.heightMatches)
   push('height-'+kind,'block','La altura declarada del '+kind+
    ' NO coincide con el contorno del visor: ficha '+dims.declaredHeight+
    ' mm, perfil '+dims.measuredNominal+' mm.');
  if(dims.nominalType==='working')
   push('head-projection-'+kind,'missing','La pata de cabra '+t.name+
    ' tiene H útil '+dims.declaredHeight+' mm acotada, pero el vástago superior ('+
    dims.estimatedUpperHeight+' mm) es estimado: H total SIN VERIFICAR.');
  if(t.profileAccuracy!=='verified'||t.importedDxf||t.verifiedSpecs!==true)
   push('profile-'+kind,'missing','Contorno de '+kind+' no acreditado por CAD acotado de fabricante: '+t.name+'.');
  if(!Number.isFinite(Number(t.maxLoadKNm))||Number(t.maxLoadKNm)<=0)
   push('load-'+kind,'missing','Falta el límite de carga por metro certificado de '+kind+' ('+t.name+').');
 }
 push('machine-3d','missing','Se dispone de cotas L1–L10/L1–L7 y anchos de la V85 Cybelec, pero NO de sólidos CAD completos ni trayectorias CNC verificadas de máquina, amarres y topes.');
 push('material-test','missing','Faltan ensayos/calibración de radios, recuperación elástica y deducciones con material/lote y útiles reales.');
 const toolScan=options.toolScan||inspectSequenceTools(p,3);
 const sheetScan=options.sheetScan||scanSheetSequence(p,8);
 const gaugeScan=options.gaugeScan||scanGaugeSequence(p,{samplesPerOperation:18});
 const volumeScan=options.volumeScan||scanVolumeTrajectory(p,{
  machine:cfg,samplesPerOperation:6
 });
 if(volumeScan.modeledMachineWarnings>0)
  push('volume-model','review',volumeScan.modeledMachineWarnings+
   ' elemento(s) de máquina con posible interferencia de envolventes 3D extruidas (trancha, mesa o tope). Son CROQUIS y deben verificarse en máquina.');
 if(volumeScan.uncertainSweptIntervals>0)
  push('volume-swept','review',volumeScan.uncertainSweptIntervals+
   ' intervalo(s) del recorrido con cruce de envolventes barridas, sin colisión volumétrica continua resuelta.');
 push('volume-unverified','missing','La evaluación volumétrica usa cuerpos 2,5D, no sólidos OEM ni carrera de ejes X/R/Z ni volteos físicos verificados.');
 if(toolScan.warningCount>0)
  push('tool-2d','review',toolScan.warningCount+' operación(es) con candidatos de interferencia 2D entre chapa y herramientas; inspeccionar cada golpe.');
 if(sheetScan.warningCount>0)
  push('sheet-2d','review',sheetScan.warningCount+' operación(es) con candidatos de auto-interferencia 2D de chapa.');
 // Recorre también retirada y cambio de pliegue; el visor puntual no bastaba.
 // Alertas de sección, NO bloqueo industrial ni acreditación del contacto CNC.
 for(const op of gaugeScan.operations){
  for(const finding of op.findings){
   const time=round(finding.time);
   const detail='Golpe '+(op.operation+1)+' · pliegue P'+(op.bend+1)+
    ' · '+(op.stopNumber===2?'Support 2':'Stop 1')+
    ' · t='+time+' s: '+finding.reason+'.';
   push('gauge-'+finding.kind,'review',detail,op.bend);
  }
  if(!op.contactObserved)
   push('gauge-unconfirmed','review','Golpe '+(op.operation+1)+
    ' · pliegue P'+(op.bend+1)+
    ': no se observó contacto nominal en los '+op.samples+
    ' instantes muestreados; NO equivale a que el tope no toque físicamente la chapa.',op.bend);
 }
 if(p.angles.some(a=>Math.abs(a)>0&&Math.abs(a)!==90))
  push('non90','review','Ángulos de plegado distintos de 90°: confirmar radio, apoyo y recuperaciones reales.');
 const block=issues.filter(i=>i.level==='block');
 const missing=issues.filter(i=>i.level==='missing');
 const review=issues.filter(i=>i.level==='review');
 // El software no tiene validador volumétrico 3D ni CNC, por tanto
 // nunca equiparar ausencia de bloques a autorización para fabricar.
 return {schema:'plegadox-workshop-audit-v1',pieceName:p.name,tooling:{
  punchId:punch.id,dieId:die.id,punchName:punch.name,dieName:die.name,
  dieOpening:die.opening,tipAngle:punch.angle},piece:{
  material:p.material,thickness:p.thickness,width:p.width,
  flanges:[...p.flanges],angles:[...p.angles],order:[...p.order]},
  machine:{name:cfg.name||MACHINE.name,width:maxWidth,nominalTonnage:MACHINE.tonnage},
  force:{estimated:force.estimated,tonnes:force.estimated?round(force.tonneForce):null,
   loadPercent:force.estimated?round(force.loadPercent):null},
  issues,summary:{blocks:block.length,missing:missing.length,reviews:review.length,
   toolWarnings:toolScan.warningCount,sheetWarnings:sheetScan.warningCount,
   gaugeWarnings:gaugeScan.warningCount,
   gaugeContactNotObserved:gaugeScan.contactNotObserved,
   volumeWarnings:volumeScan.modeledMachineWarnings,
   volumeSweptIntervals:volumeScan.uncertainSweptIntervals},gaugeScan,volumeScan,
  status:'SIN_VALIDACION_INDUSTRIAL',verified:false,canApproveForMachine:false,
  limitations:'Volumetría extruida (2,5D) y recorrido temporal muestreado; sin volúmenes CAD OEM de mesa/trancha/mordazas, posición Z exacta de topes ni validación CNC. No autoriza fabricación.'};
}
