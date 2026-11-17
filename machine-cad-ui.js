/** Interfaz local de CAD de máquina y trazas de ejes: no conecta con CNC. */
import {machineCadFromDXF,loadMachineCad,saveMachineCad,removeMachineCad,
 MACHINE_CAD_KINDS,machineConfigurationKey} from './machine-cad.js';
import {getActiveMachineConfig} from './machine-config.js';
import {getActiveMachineProfile} from './machine-selection.js';
import {MOTION_AXES,normalizeAxisMotion,motionPieceKey,
 assessAxisMotion,saveAxisMotion,loadAxisMotion} from './machine-axis-motion.js';
import {loadAxisMapping,saveAxisMapping,scanAxisCADMovement} from './machine-axis-geometry.js';
import {loadGaugeFingers,saveGaugeFingers,clearGaugeFingers,gaugeSectionFingerprint} from './machine-gauge-fingers.js';
import './cad-evidence-ui.js';

const $=id=>document.getElementById(id);
const profileForTemplate=()=>getActiveMachineProfile();
const filePrefix=()=>('PlegadoX-'+profileForTemplate().id).replace(/[^a-z0-9-]/gi,'-');
const say=(id,value,error=false)=>{
 const el=$(id);
 if(el){el.textContent=value;el.dataset.error=String(error);}
};
function signal(){
 if(typeof window!=='undefined'){
  window.dispatchEvent(new CustomEvent('plegadox:machineChanged'));
  window.PLEGADOX_REDRAW?.();
 }
}
function refreshCAD(){
 const rows=loadMachineCad(localStorage);
 say('machineCadStatus',
  MACHINE_CAD_KINDS.map(kind=>kind+': '+(rows[kind]?
   rows[kind].points.length+' vértices · Z '+rows[kind].zMin+'…'+rows[kind].zMax+
    ' mm · '+rows[kind].source:'sin CAD')).join(' | ')+
  '. Las geometrías importadas NO están certificadas para fabricación.');
}
function refreshGaugeFingerZ(){
 try{
  const saved=loadGaugeFingers(localStorage);
  if(!saved){
   say('machineGaugeZStatus','Sin Z1/Z2 documentadas. El visor usa una envolvente provisional, NO dos dedos físicos conocidos.');
   return;
  }
  const config=machineConfigurationKey(getActiveMachineConfig());
  if(config!==saved.machineConfigKey){
   say('machineGaugeZStatus','Cotas Z de otra revisión de máquina: quedan conservadas pero BLOQUEADAS. Vuelve a medir y registrar.',true);
   return;
  }
  const library=loadMachineCad(localStorage);
  if(saved.sameSectionConfirmed){
   if(gaugeSectionFingerprint(library[saved.profileKind])!==saved.profileFingerprint){
    say('machineGaugeZStatus',
     'DXF común de '+saved.profileKind+' cambiado o ausente: cotas Z1/Z2 BLOQUEADAS.',true);
    return;
   }
  }else{
   const changed=['Z1','Z2'].filter(axis=>
    gaugeSectionFingerprint(library[saved.profileKind+axis])!==
     saved.profileFingerprints?.[axis]);
   if(changed.length){
    say('machineGaugeZStatus','CAD individual de '+changed.join(' y ')+
     ' cambiado o ausente. Bloqueadas cotas Z1/Z2 hasta volver a verificarlas.',true);
    return;
   }
  }
  const format=key=>key+' '+saved.fingers[key].zMin+'…'+saved.fingers[key].zMax+' mm';
  say('machineGaugeZStatus','Z1 y Z2 declarados para '+saved.profileKind+
   (saved.sameSectionConfirmed?' · perfil DXF compartido':' · dos DXF individuales')+
   ' · '+format('Z1')+' · '+format('Z2')+
   ' · solo pose '+saved.referenceSceneTime+' · '+saved.source+
   '. NO certifica recorridos, montaje, colisiones ni seguridad CNC.');
 }catch(error){say('machineGaugeZStatus','Registro Z1/Z2 ilegible: '+error.message,true);}
}
function part(){
 return window.PLEGADOX_STATE?.().piece||null;
}
function refreshMotion(){
 const p=part();
 try{
  const program=loadAxisMotion(localStorage);
  const status=program&&p&&program.pieceKey!==motionPieceKey(p)?
   {status:'TRAZA_DE_OTRA_PIEZA',checked:false,violations:[],
    unknown:['El recorrido almacenado no corresponde a esta pieza']}:assessAxisMotion(program);
  let extra='';
  try{
   const mapping=loadAxisMapping(localStorage);
   const review=p?scanAxisCADMovement(p,{
    axisMotion:program,mapping,machine:getActiveMachineConfig(),
    machineId:getActiveMachineProfile().id}):null;
   if(review){
    const e=review.evidenceSummary;
    extra=' · CAD/ejes: '+review.status+
     ' · solapes MODELADOS '+review.events.length+
     (e?' (2 DXF: '+e.cadPairCount+
      ', mixtos: '+e.mixedCount+
      ', provisionales: '+e.provisionalCount+')':'')+
     ' · intervalos sin resolver '+review.unresolved+
     (review.collisionPairPlanCount?
      ' · parejas comprobables por intervalo: '+review.collisionPairPlanCount:'')+
     (review.uniquePendingPairs?
      ' · parejas pendientes de geometría: '+review.uniquePendingPairs:'')+
     (review.pairIntervalsChecked!=null?
      ' · comprobaciones geométricas: '+review.pairIntervalsChecked:'')+
     (review.broadphaseRejectedPairs?
      ' · parejas separadas sin triangulación '+review.broadphaseRejectedPairs:'')+
     (review.ramTiltApproximatedIntervals?
      ' · Y1/Y2 no paralelos: '+review.ramTiltApproximationMaxMm.toFixed(3)+
       ' mm de incertidumbre en '+review.ramTiltApproximatedIntervals+
       ' intervalos':'');
    const list=$('machineAxisFindings');
    if(list){
     const lines=[
      'Estado: '+review.status+' · sin validación de choque físico ni certificación CNC',
      ...(review.missingCad?.length?[
       'CAD pendiente: '+review.missingCad.join(', ')]:[]),
      ...(review.uniquePendingPairs?[
       'COBERTURA INCOMPLETA: '+review.uniquePendingPairs+
       ' parejas de componentes sin CAD válido o sin modelar; '+
       review.pairIntervalsMissing+' evaluaciones omitidas. Nunca se interpretan como libres.']:[]),
      ...(review.missingPairExamples||[]).slice(0,12).map(p=>
       'Sin comprobar '+p.moving+' / '+p.against+' (intervalo '+
       p.interval+'): '+p.reason),
      ...(review.ramTiltApproximatedIntervals?[
       'Trancha/amarres superiores: movimiento Y1/Y2 DIFERENCIAL; desplazamiento medio de modelo, desviación de hasta '+
        review.ramTiltApproximationMaxMm.toFixed(3)+
        ' mm, NO certificado ni geometría de viga inclinada']:[]),
      ...(review.events||[]).slice(0,10).map(hit=>
       Number(hit.startTime).toFixed(3)+'–'+Number(hit.endTime).toFixed(3)+
       ' s · '+hit.moving+' / '+hit.against+' · '+
       (hit.evidenceLabel||'interferencia no clasificada')),
      ...(!review.events?.length?[
       'Sin solapes entre poses comprobadas no significa recorrido físico libre de colisiones']:[]),
      ...(review.events?.length>10?['Solo se muestran los primeros 10 avisos; descarga el informe completo']:[])
     ];
     list.replaceChildren(...lines.map(line=>{
      const li=document.createElement('li');li.textContent=line;return li;
     }));
    }
    const mounts=$('machineAxisMountInterfaces');
    if(mounts){
     const items=review.assemblyInterfacesPending||[];
     mounts.replaceChildren(...items.map(p=>{
      const li=document.createElement('li');
      li.textContent=p.moving+' / '+p.against+
       ': no se interpreta contacto solidario como choque automático. '+
       p.reason;return li;
     }));
    }
   }
  }catch(error){extra=' · calibración inválida: '+error.message;}
  say('machineAxisStatus',
   'Trazas Y1/Y2/X/R/Z1/Z2: '+status.status+
   (status.checked?' · '+status.posesChecked+' posiciones · '+
    status.violations.length+' infracciones':' · sin comprobación de ejes aplicable')+
   extra+'. No constituye validación de colisiones ni certificación industrial.');
 }catch(error){say('machineAxisStatus','Error al leer registro de ejes: '+error.message,true);}
}
function download(filename,content){
 const blob=new Blob([content],{type:'application/json'});
 const url=URL.createObjectURL(blob),a=document.createElement('a');
 a.href=url;a.download=filename;document.body.append(a);a.click();a.remove();
 setTimeout(()=>URL.revokeObjectURL(url),1500);
}
function installer(){
 if(!$('machineCadFile'))return;
 $('machineGaugeZSave')?.addEventListener('click',()=>{
  try{
   const source=$('machineGaugeZSource').value.trim();
   const profileKind=$('machineGaugeZKind').value;
   const shared=$('machineGaugeZIdentical').checked;
   const rows=loadMachineCad(localStorage);
   let profileFingerprint=null,profileFingerprints=null;
   if(shared){
    profileFingerprint=gaugeSectionFingerprint(rows[profileKind]);
    if(!profileFingerprint)
     throw Error('Importa primero el DXF común del dedo '+profileKind+
      ' en el panel CAD y comprueba su montaje.');
   }else{
    profileFingerprints=Object.fromEntries(['Z1','Z2'].map(axis=>[
     axis,gaugeSectionFingerprint(rows[profileKind+axis])]));
    const missing=['Z1','Z2'].filter(axis=>!profileFingerprints[axis]);
    if(missing.length)throw Error('Falta CAD propio de '+missing.join(', ')+
     ': importa DXF '+missing.map(axis=>profileKind+axis).join(' y ')+
     ' antes de registrar ambas cotas.');
   }
   const row=saveGaugeFingers(localStorage,{
    version:1,unit:'mm',
    machineConfigKey:machineConfigurationKey(getActiveMachineConfig()),
    profileKind,profileFingerprint,profileFingerprints,
    sameSectionConfirmed:shared,
    source,referenceSceneTime:$('machineGaugeZTime').value,
    fingers:{
     Z1:{zMin:$('machineGaugeZ1Min').value,zMax:$('machineGaugeZ1Max').value},
     Z2:{zMin:$('machineGaugeZ2Min').value,zMax:$('machineGaugeZ2Max').value}
    }
   });
   refreshGaugeFingerZ();signal();
  }catch(error){say('machineGaugeZStatus','No se registraron dedos Z1/Z2: '+error.message,true);}
 });
 $('machineGaugeZDelete')?.addEventListener('click',()=>{
  try{clearGaugeFingers(localStorage);refreshGaugeFingerZ();signal();}
  catch(error){say('machineGaugeZStatus','No se borraron cotas: '+error.message,true);}
 });
 try{
  const saved=loadGaugeFingers(localStorage);
  if(saved&&saved.machineConfigKey===machineConfigurationKey(getActiveMachineConfig())){
   $('machineGaugeZKind').value=saved.profileKind;
   $('machineGaugeZTime').value=String(saved.referenceSceneTime);
   $('machineGaugeZSource').value=saved.source;
   $('machineGaugeZIdentical').checked=saved.sameSectionConfirmed;
   for(const axis of ['Z1','Z2']){
    $('machineGauge'+axis+'Min').value=String(saved.fingers[axis].zMin);
    $('machineGauge'+axis+'Max').value=String(saved.fingers[axis].zMax);
   }
  }
 }catch{/* Registro corrupto se explica en el estado, no se sobrescribe. */}
 window.addEventListener('plegadox:machineChanged',refreshGaugeFingerZ);
 const save=$('machineCadSave'),file=$('machineCadFile'),kind=$('machineCadKind');
 save?.addEventListener('click',async()=>{
  const entry=file.files?.[0];
  if(!entry){say('machineCadStatus','Selecciona un perfil DXF ASCII con contorno cerrado.',true);return;}
  try{
   if(!/\.dxf$/i.test(entry.name)||entry.size>1024*1024)
    throw Error('Se admite únicamente DXF ASCII inferior a 1 MB');
   const options={
    kind:kind.value,machineConfigKey:machineConfigurationKey(getActiveMachineConfig()),
    offsetX:$('machineCadOffsetX').value,
    offsetY:$('machineCadOffsetY').value,
    zMin:$('machineCadZMin').value,zMax:$('machineCadZMax').value,
    source:$('machineCadSource').value.trim()
   };
   // El operador declara explícitamente sus ceros. Un PDF acotado no
   // define automáticamente estas referencias de montaje.
   const cad=machineCadFromDXF(await entry.text(),options);
   saveMachineCad(localStorage,cad);
   refreshCAD();signal();
  }catch(error){say('machineCadStatus','No se añadió CAD: '+error.message,true);}
 });
 $('machineCadDelete')?.addEventListener('click',()=>{
  try{
   removeMachineCad(localStorage,kind.value);refreshCAD();signal();
  }catch(error){say('machineCadStatus','No se pudo borrar CAD: '+error.message,true);}
 });
 $('machineAxisTemplate')?.addEventListener('click',()=>{
  const p=part();
  if(!p){say('machineAxisStatus','No hay pieza activa',true);return;}
  const limits=Object.fromEntries(MOTION_AXES.map(axis=>[axis,
   {min:null,max:null,maxSpeed:null}]));
  download(filePrefix()+'-plantilla-ejes.json',JSON.stringify({
   unit:'mm',timeUnit:'s',source:'programmed',
   sourceDescription:'Completar con datos documentados de la máquina y el CNC',
   machineId:profileForTemplate().id,
   machineName:profileForTemplate().title,
   machineVerification:'Confirmar placa, amarre y calibración CNC antes de usar',
   pieceKey:motionPieceKey(p),
   limits,poses:[],
   instructions:'Introducir al menos dos poses; time en segundos; axes {Y1,Y2,X,R,Z1,Z2}; sceneTime opcional = tiempo de la animación (0-5 por golpe). Para barrido CAD sólo sirven fases en las que DOS poses tienen el mismo sceneTime: chapa inmóvil. Los ejes deben estar medidos, nunca inferidos del catálogo.'
  },null,2));
 });
 $('machineAxisImport')?.addEventListener('change',async event=>{
  const file=event.target.files?.[0];if(!file)return;
  try{
   if(file.size>512*1024||!/\.json$/i.test(file.name))
    throw Error('Selecciona un JSON inferior a 512 KB');
   const raw=JSON.parse(await file.text());
   if(!raw.pieceKey||raw.pieceKey!==motionPieceKey(part()))
    throw Error('La clave de la traza no coincide con la pieza, sus herramientas y orden actuales');
   const validated=normalizeAxisMotion(raw);
   saveAxisMotion(localStorage,validated);
   refreshMotion();signal();
  }catch(error){say('machineAxisStatus','No se importó recorrido: '+error.message,true);}
  event.target.value='';
 });
 $('machineAxisMappingTemplate')?.addEventListener('click',()=>{
  download(filePrefix()+'-plantilla-datum-CAD.json',JSON.stringify({
   version:1,unit:'mm',
   signs:{Y:null,X:null,R:null,Z1:null,Z2:null},
   activeFinger:null,referenceSceneTime:null,ramTiltTolerance:null,
   machineConfigKey:machineConfigurationKey(getActiveMachineConfig()),
   source:'DESCRIBIR: ficha/control, origen, sentidos y prueba física',
   instructions:'Rellenar signos +1/-1, dedo Z1 o Z2, sceneTime de referencia y tolerancia Y1/Y2 documentada. La primera pose de la traza deberá declarar exactamente ese sceneTime. No utilizar valores de otra máquina.'
  },null,2));
 });
 $('machineAxisMappingImport')?.addEventListener('change',async event=>{
  const file=event.target.files?.[0];if(!file)return;
  try{
   if(file.size>100*1024||!/\.json$/i.test(file.name))
    throw Error('Selecciona JSON de calibración inferior a 100 KB');
   const parsed=JSON.parse(await file.text());
   if(parsed.machineConfigKey!==machineConfigurationKey(getActiveMachineConfig()))
    throw Error('La calibración pertenece a otras cotas de máquina');
   saveAxisMapping(localStorage,parsed);
   refreshMotion();signal();
  }catch(error){say('machineAxisStatus','Datum CAD/ejes rechazado: '+error.message,true);}
  event.target.value='';
 });
  $('machineAxisCheck')?.addEventListener('click',refreshMotion);
 $('machineAxisReportDownload')?.addEventListener('click',()=>{
  try{
   const p=part();
   if(!p)throw Error('No hay pieza activa');
   const report=scanAxisCADMovement(p,{
    axisMotion:loadAxisMotion(localStorage),
    mapping:loadAxisMapping(localStorage),
    machine:getActiveMachineConfig(),machineId:getActiveMachineProfile().id
   });
   download(filePrefix()+'-evidencias-barrido-cad.json',
    JSON.stringify({format:'plegadox-cnc-evidence-r130',
     exportedAt:new Date().toISOString(),
     pieceKey:motionPieceKey(p),
     machineId:getActiveMachineProfile().id,
     report,certified:false,canApproveForMachine:false},null,2));
   say('machineAxisStatus','Informe geométrico R130 exportado. Los datos NO certifican recorrido seguro.');
  }catch(error){
   say('machineAxisStatus','No se pudo exportar diagnóstico: '+error.message,true);
  }
 });
 window.addEventListener('plegadox:machineChanged',refreshMotion);
 try{refreshCAD();refreshMotion();refreshGaugeFingerZ();}
 catch(error){say('machineCadStatus','Datos CAD guardados no legibles: '+error.message,true);}
}
installer();
