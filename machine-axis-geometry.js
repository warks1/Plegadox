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
import {normalizeAxisMotion,motionPieceKey} from './machine-axis-motion.js';
import {machineConfigurationKey} from './machine-cad.js';
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
 if(!/^v85-[0-9a-f]{8}$/.test(key))
  throw Error('La calibración debe estar asociada a la configuración V85');
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
  return unknown('TRAZA_DE_OTRA_PIEZA','La traza no corresponde a geometría, orden y útiles actuales');
 if(mapping.machineConfigKey!==machineConfigurationKey(machine))
  return unknown('DATUM_DE_OTRA_MAQUINA','Las cotas de la V85 cambiaron tras calibrar los ejes');
 const initial=program.poses[0];
 if(initial.sceneTime==null||
    Math.abs(initial.sceneTime-mapping.referenceSceneTime)>1e-7)
  return unknown('CHAPA_SIN_REFERENCIA_TEMPORAL',
   'La primera pose requiere sceneTime igual al tiempo de referencia de chapa');
 if(mapping.referenceSceneTime>piece.order.length*5+1e-7)
  return unknown('REFERENCIA_FUERA_DE_PIEZA','El tiempo de chapa supera la secuencia');
 let base;
 try{base=buildVolumeScene(technicalScene(piece,mapping.referenceSceneTime),{
  machine,machineCAD:options.machineCAD});}
 catch(error){return unknown('ESCENA_CAD_INVALIDA',String(error.message||error));}
 const ref=initial.axes;
 const at=pose=>{
  const y=((pose.axes.Y1-ref.Y1)+(pose.axes.Y2-ref.Y2))/2*mapping.signs.Y;
  const x=(pose.axes.X-ref.X)*mapping.signs.X;
  const r=(pose.axes.R-ref.R)*mapping.signs.R;
  const z=(pose.axes[mapping.activeFinger]-ref[mapping.activeFinger])*
   mapping.signs[mapping.activeFinger];
  return {
   ram:translatePrism(base.objects.ram,0,y),
   punch:translatePrism(base.objects.punch,0,y),
   gauge:translatePrism(base.objects.gauge,x,r,z),
   bed:base.objects.bed,die:base.objects.die,
   sheet:base.sheet
  };
 };
 const events=[],unknowns=[],maxIntervals=Math.max(1,Math.min(250,
  Number.isFinite(Number(options.maxIntervals))?Math.trunc(Number(options.maxIntervals)):100));
 let intervalsChecked=0,framesChecked=0,unresolved=0,tiltUnresolved=0;
 const zMode=options.machineCAD===undefined?'biblioteca local':
  'CAD de máquina facilitado';
 const pairs=[
  ['ram','bed'],['ram','die'],['ram','gauge'],
  ['punch','bed'],['punch','die'],['punch','gauge'],
  ['gauge','die'],['gauge','bed']
 ];
 const recordEvent=(sweep,kind,object,from,to)=>{
  if(events.length>=120)return;
  events.push({kind:'contacto-cad-trayectoria',moving:kind,against:object,
   startTime:from.time,endTime:to.time,
   modeledReason:sweep.reason,
   sourceMoving:base.objects[kind]?.provenance||'chapa de modelo',
   sourceAgainst:base.objects[object]?.provenance||'chapa de modelo',
   verified:false});
 };
 const refTilt=ref.Y1-ref.Y2;
 for(let i=1;i<program.poses.length;i++){
  if(intervalsChecked>=maxIntervals){unresolved+=program.poses.length-i;
   unknowns.push('Se alcanzó el límite de intervalos de esta revisión');break;}
  const before=program.poses[i-1],after=program.poses[i];
  if(before.sceneTime==null||after.sceneTime==null||
   Math.abs(before.sceneTime-after.sceneTime)>1e-7||
   Math.abs(before.sceneTime-mapping.referenceSceneTime)>1e-7){
   unresolved++;continue;
  }
  const skew0=(before.axes.Y1-before.axes.Y2)-refTilt;
  const skew1=(after.axes.Y1-after.axes.Y2)-refTilt;
  if(Math.abs(skew0)>mapping.ramTiltTolerance||
   Math.abs(skew1)>mapping.ramTiltTolerance){
   tiltUnresolved++;unresolved++;
   unknowns.push('Inclinación Y1/Y2 fuera de tolerancia de modelo 2,5D');
   continue;
  }
  let a,b;
  try{a=at(before);b=at(after);}
  catch(error){unresolved++;unknowns.push(String(error.message||error));continue;}
  intervalsChecked++;framesChecked+=2;
  for(const [moving,against] of pairs){
   const sweep=sweptPrismPair(a[moving],b[moving],a[against],b[against]);
   if(sweep.intersects)recordEvent(sweep,moving,against,before,after);
   else if(sweep.unknown)unresolved++;
  }
  for(const moving of ['ram','gauge']){
   for(let n=0;n<a.sheet.length;n++){
    const sweep=sweptPrismPair(a[moving],b[moving],a.sheet[n],b.sheet[n]);
    if(sweep.intersects)recordEvent(sweep,moving,'chapa-'+(n+1),before,after);
    else if(sweep.unknown)unresolved++;
   }
  }
 }
 const needed=['ram','bed',piece.stopByBend[
  technicalScene(piece,mapping.referenceSceneTime).stage.activeBend]===2?'support':'stop'];
 const missing=needed.filter(k=>!base.cadProfilesUsed.includes(k));
 if(missing.length)unknowns.push('CAD de máquina sin perfil referenciado: '+missing.join(', '));
 if(program.poses.length-1>intervalsChecked)unknowns.push(
  'Hay fases sin chapa inmóvil o sin correspondencia con la animación');
 unknowns.push('No se ha modelado el segundo dedo Z1/Z2, inclinación continua Y1/Y2, agarres, volteos ni deformación de chapa');
 if(!base.objects.punch.provenance.includes('perfil-acotado'))
  unknowns.push('Perfil de punzón no acreditado con CAD OEM');
 if(!base.objects.die.provenance.includes('perfil-acotado'))
  unknowns.push('Perfil de matriz no acreditado con CAD OEM');
 return {status:events.length?
  (missing.length?'PENETRACION_EN_ENVOLVENTE_PROVISIONAL':'COLISIONES_EN_BARRIDO_CAD_DECLARADO'):
  unresolved||missing.length?'REVISION_CAD_CNC_INCOMPLETA':
  'INTERVALOS_LINEALES_REVISADOS_SIN_CERTIFICAR',
  checked:intervalsChecked>0,intervalsChecked,framesChecked,
  unresolved,tiltUnresolved,
  cadProfilesUsed:base.cadProfilesUsed,missingCad:missing,
  axisFingerModeled:mapping.activeFinger,mappingSource:mapping.source,
  evidence:zMode,events,unknown:unknowns,verified:false,
  canApproveForMachine:false};
}
