import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {normalizeGaugeFingers,gaugeFingerSlices,saveGaugeFingers,
 loadGaugeFingers,clearGaugeFingers} from '../machine-gauge-fingers.js';
import {getActiveMachineConfig} from '../machine-config.js';
import {machineConfigurationKey} from '../machine-cad.js';
import {technicalScene} from '../technical-section.js';
import {EXAMPLE} from '../engine.js';
import {buildVolumeScene,inspectVolumeFrame,makePrism,prismOverlap}
 from '../volume-engine.js';
import {machineVolumeMesh} from '../machine-volume-viewer.js';
import {visibleVolumeFaces} from '../machine-volume-layers.js';
import {describeGaugeVisualEvidence} from '../machine-gauge-evidence.js';

const machine=getActiveMachineConfig();
const key=machineConfigurationKey(machine);
const sample=(overrides={})=>({version:1,unit:'mm',machineConfigKey:key,
 profileKind:'stop',referenceSceneTime:0,
 sameSectionConfirmed:true,source:'Plano real de montaje Z1/Z2, operador',
 fingers:{Z1:{zMin:-20,zMax:-5},Z2:{zMin:5,zMax:20}},...overrides});
const localRecord=()=>({kind:'stop',
 points:[[-200,-50],[200,-50],[200,200],[-200,200]],
 offsetX:0,offsetY:0,zMin:-50,zMax:50,source:'DXF ficticio SOLO para test',
 machineConfigKey:key});
const scene=()=>technicalScene(EXAMPLE,0);
const build=(config=sample(),t=0)=>buildVolumeScene(technicalScene(EXAMPLE,t),
 {machine,machineCAD:{stop:localRecord()},gaugeFingers:config});

test('R128: cotas de ambos dedos siempre explícitas, mm, mismo datum y sin cruces',()=>{
 const x=normalizeGaugeFingers(sample());
 assert.equal(x.fingers.Z1.widthMm,15);
 assert.equal(x.fingers.Z2.centerMm,12.5);
 assert.equal(x.industrialVerified,false);
 assert.throws(()=>normalizeGaugeFingers(sample({sameSectionConfirmed:false})),/MISMO contorno/);
 assert.throws(()=>normalizeGaugeFingers(sample({fingers:{
  Z1:{zMin:0,zMax:20},Z2:{zMin:10,zMax:30}
 }})),/misma anchura/);
 assert.throws(()=>normalizeGaugeFingers(sample({fingers:{
  Z1:{zMin:'',zMax:20},Z2:{zMin:30,zMax:40}
 }})),/Z1.zMin/);
 assert.throws(()=>normalizeGaugeFingers(sample({unit:'in'})),/mm/);
 assert.throws(()=>normalizeGaugeFingers(sample({machineConfigKey:'otra'})),/máquina/);
 assert.throws(()=>normalizeGaugeFingers(sample({profileKind:'punch'})),/Stop o Support/);
});
test('R128: guardar/borrar medidas no introduce automáticamente falsos ceros CNC',()=>{
 const memory={state:new Map(),getItem(k){return this.state.get(k)??null;},
  setItem(k,v){this.state.set(k,v)},removeItem(k){this.state.delete(k)}};
 assert.equal(loadGaugeFingers(memory),null);
 saveGaugeFingers(memory,sample());
 assert.equal(loadGaugeFingers(memory).fingers.Z1.zMin,-20);
 clearGaugeFingers(memory);
 assert.equal(loadGaugeFingers(memory),null);
});
test('R128: las dos Z se materializan SOLO con DXF y en la pose del mismo perfil',()=>{
 const proxy=makePrism('gauge',[
  {x:0,y:0},{x:10,y:0},{x:10,y:10},{x:0,y:10}
 ],-50,50,'perfil CAD importado DXF ASCII · montaje no certificado');
 const ok=gaugeFingerSlices(sample(),{machineConfigKey:key,profileKind:'stop',
  sceneTime:0,gauge:proxy});
 assert.equal(ok.modeled,true);
 assert.equal(ok.slices.length,2);
 assert.deepEqual(ok.slices.map(s=>[s.zMin,s.zMax]),[[-20,-5],[5,20]]);
 assert.equal(ok.verified,false);
 const badTime=gaugeFingerSlices(sample(),{machineConfigKey:key,
  profileKind:'stop',sceneTime:.001,gauge:proxy});
 assert.equal(badTime.status,'OTRA_POSE');assert.equal(badTime.modeled,false);
 assert.equal(gaugeFingerSlices(sample(),{machineConfigKey:'v85-deadbeef',
  profileKind:'stop',sceneTime:0,gauge:proxy}).status,'OTRA_CONFIGURACION');
 assert.equal(gaugeFingerSlices(sample(),{machineConfigKey:key,
  profileKind:'support',sceneTime:0,gauge:proxy}).status,'OTRO_TIPO_DE_DEDO');
 assert.equal(gaugeFingerSlices(sample(),{machineConfigKey:key,
  profileKind:'stop',sceneTime:0,gauge:{...proxy,provenance:'envolvente'}})
  .status,'FALTA_DXF_DEL_DEDO');
});
test('R128: motor volumétrico cuenta Z1 y Z2, no el ancho Z ficticio del tope',()=>{
 const model=build();
 assert.equal(model.gaugeReferenceOnly,true);
 assert.equal(model.gaugeFingerReview.modeled,true);
 assert.deepEqual([model.objects.gaugeZ1.zMin,model.objects.gaugeZ1.zMax],[-20,-5]);
 assert.deepEqual([model.objects.gaugeZ2.zMin,model.objects.gaugeZ2.zMax],[5,20]);
 const mesh=machineVolumeMesh(model,2500);
 assert.ok(mesh.faces.some(f=>f.kind==='gaugeZ1'));
 assert.ok(mesh.faces.some(f=>f.kind==='gaugeZ2'));
 assert.equal(mesh.faces.some(f=>f.kind==='gauge'),false);
 const faceCount=mesh.faces.length;
 assert.ok(faceCount>0);
 assert.equal(visibleVolumeFaces(mesh.faces,{showGauge:false})
  .some(f=>f.kind.startsWith('gauge')),false);
 const frame=inspectVolumeFrame(scene(),{machine,
  machineCAD:{stop:localRecord()},gaugeFingers:sample()});
 assert.equal(frame.issues.some(i=>i.kind==='gauge'),false);
 assert.equal(frame.verified,false);
 assert.equal(frame.canApproveForMachine,false);
 assert.ok(frame.model.gaugeReferenceOnly);
 // Si la pose ha cambiado, no hay forma de situar los dos dedos.
 const later=build(sample(),.32);
 assert.equal(later.gaugeReferenceOnly,false);
 assert.equal(later.gaugeFingerReview.status,'OTRA_POSE');
 assert.ok(machineVolumeMesh(later).faces.some(f=>f.kind==='gauge'));
});
test('R128: coincidencia Z de cada dedo independiente, con apoyo ausente si ambos fuera',()=>{
 const modeled=build(sample({fingers:{
  Z1:{zMin:260,zMax:275},Z2:{zMin:290,zMax:305}
 }}));
 const result=describeGaugeVisualEvidence(modeled.gaugePlacement,
  modeled.objects.gauge,modeled.sheet,
  [modeled.objects.gaugeZ1,modeled.objects.gaugeZ2]);
 assert.equal(result.level,'amber');
 assert.equal(result.code,'tope-fuera-de-z');
 assert.match(result.message,/Z1 fuera de anchura/);
 assert.match(result.message,/Z2 fuera de anchura/);
 assert.match(result.message,/No equivale a trayectoria CNC/);
 assert.equal(prismOverlap(modeled.sheet[0],modeled.objects.gaugeZ1).volume,0);
});
test('R128: panel, eje CNC, parser y PWA cuentan los dos dedos sin inventar DXF',()=>{
 const ui=readFileSync(new URL('../index.html',import.meta.url),'utf8');
 const sw=readFileSync(new URL('../sw.js',import.meta.url),'utf8');
 const cnc=readFileSync(new URL('../machine-axis-geometry.js',import.meta.url),'utf8');
 const volume=readFileSync(new URL('../volume-trajectory-review.js',import.meta.url),'utf8');
 for(const input of ['machineGaugeZPanel','machineGaugeZ1Min','machineGaugeZ1Max',
  'machineGaugeZ2Min','machineGaugeZ2Max','machineGaugeZSave','machineGaugeZIdentical'])
  assert.ok(ui.includes('id="'+input+'"'),input+' no disponible');
 assert.ok(sw.includes('"./machine-gauge-fingers.js"'));
 assert.match(cnc,/gaugeZ1/);assert.match(cnc,/gaugeZ2/);
 assert.match(volume,/gaugePairReferenceFrames/);
});
