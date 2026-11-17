import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {EXAMPLE} from '../engine.js';
import {getActiveMachineConfig} from '../machine-config.js';
import {machineConfigurationKey,normalizeMachineCad,
 MACHINE_CAD_KINDS,positionMachineCad} from '../machine-cad.js';
import {normalizeGaugeFingers,gaugeSectionFingerprint,gaugeFingerSlices}
 from '../machine-gauge-fingers.js';
import {technicalScene} from '../technical-section.js';
import {buildVolumeScene,inspectVolumeFrame} from '../volume-engine.js';
import {machineVolumeMesh} from '../machine-volume-viewer.js';

const machine=getActiveMachineConfig(),key=machineConfigurationKey(machine);
const left=normalizeMachineCad({
 kind:'stopZ1',points:[[0,0],[10,0],[10,12],[0,12]],source:'DXF Z1 ensayo geométrico',
 offsetX:5,offsetY:0,zMin:-30,zMax:-10,machineConfigKey:key
});
const right=normalizeMachineCad({
 kind:'stopZ2',points:[[0,0],[18,0],[18,8],[0,8]],source:'DXF Z2 ensayo geométrico',
 offsetX:26,offsetY:2,zMin:10,zMax:30,machineConfigKey:key
});
const dims=()=>({
 version:1,unit:'mm',machineConfigKey:key,profileKind:'stop',
 profileFingerprint:null,sameSectionConfirmed:false,
 profileFingerprints:{
  Z1:gaugeSectionFingerprint(left),Z2:gaugeSectionFingerprint(right)
 },
 referenceSceneTime:0,source:'Cotas documentales de ensayo, no CNC',
 fingers:{Z1:{zMin:-25,zMax:-8},Z2:{zMin:9,zMax:31}}
});
const opts=()=>({machine,machineCAD:{stopZ1:left,stopZ2:right},
 gaugeFingers:dims()});

test('R129: catálogo de máquina acepta perfiles diferentes en Stop y Support',()=>{
 for(const kind of ['stopZ1','stopZ2','supportZ1','supportZ2'])
  assert.ok(MACHINE_CAD_KINDS.includes(kind),kind);
 assert.equal(left.kind,'stopZ1');
 assert.equal(right.kind,'stopZ2');
 assert.notDeepEqual(left.points,right.points);
 const p=positionMachineCad(left,{x:100,y:20},{machine});
 assert.deepEqual(p.polygon[0],{x:105,y:20});
 assert.equal(gaugeSectionFingerprint(left).startsWith('cad-'),true);
 assert.notEqual(gaugeSectionFingerprint(left),gaugeSectionFingerprint(right));
});
test('R129: dos DXF individuales no requieren afirmar que la sección es idéntica',()=>{
 const data=normalizeGaugeFingers(dims());
 assert.equal(data.sameSectionConfirmed,false);
 assert.equal(data.profileFingerprint,null);
 assert.ok(data.profileFingerprints.Z1);
 assert.ok(data.profileFingerprints.Z2);
 const broken=dims();delete broken.profileFingerprints.Z2;
 assert.throws(()=>normalizeGaugeFingers(broken),/dos DXF independientes/i);
 const bad=dims();bad.profileFingerprints.Z1='incorrecto';
 assert.throws(()=>normalizeGaugeFingers(bad),/MISMO contorno|dos DXF independientes/);
});
test('R129: ausencia, cambio DXF, otro tipo y otra pose no producen sólidos ficticios',()=>{
 const scene=technicalScene(EXAMPLE,0);
 const fake=buildVolumeScene(scene,opts());
 assert.equal(fake.gaugeReferenceOnly,true);
 const a=fake.objects.gaugeZ1,b=fake.objects.gaugeZ2;
 assert.notDeepEqual(a.polygon,b.polygon);
 const direct={machineConfigKey:key,profileKind:'stop',
  profileFingerprints:dims().profileFingerprints,
  gaugeProfiles:{Z1:a,Z2:b},sceneTime:0};
 assert.equal(gaugeFingerSlices(dims(),direct).status,
  'DOS_PERFILES_DXF_INDEPENDIENTES');
 assert.equal(gaugeFingerSlices(dims(),{...direct,
  gaugeProfiles:{...direct.gaugeProfiles,Z2:null}}).status,'FALTA_DXF_Z2');
 assert.equal(gaugeFingerSlices(dims(),{...direct,
  profileFingerprints:{...direct.profileFingerprints,Z2:'cad-00000000'}})
  .status,'DXF_CAMBIADO_Z2');
 assert.equal(gaugeFingerSlices(dims(),{...direct,profileKind:'support'}).status,
  'OTRO_TIPO_DE_DEDO');
 assert.equal(gaugeFingerSlices(dims(),{...direct,sceneTime:.25}).status,
  'OTRA_POSE');
 assert.equal(gaugeFingerSlices(null,direct).status,'FALTAN_Z1_Z2');
});
test('R129: dos secciones diferentes participan en la malla y colisiones como cuerpos distintos',()=>{
 const model=buildVolumeScene(technicalScene(EXAMPLE,0),opts());
 assert.equal(model.gaugeReferenceOnly,true);
 assert.equal(model.gaugeFingerReview.status,'DOS_PERFILES_DXF_INDEPENDIENTES');
 assert.ok(model.cadProfilesUsed.includes('stopZ1'));
 assert.ok(model.cadProfilesUsed.includes('stopZ2'));
 assert.equal(model.missingCadComponents.includes('stop'),false);
 assert.equal(model.missingCadComponents.includes('stopZ1'),false);
 assert.equal(model.missingCadComponents.includes('stopZ2'),false);
 assert.equal(model.objects.gaugeZ1.polygon.length,4);
 assert.equal(model.objects.gaugeZ2.polygon.length,4);
 assert.notEqual(model.objects.gaugeZ1.polygon[0].x,
  model.objects.gaugeZ2.polygon[0].x);
 assert.deepEqual([model.objects.gaugeZ1.zMin,model.objects.gaugeZ1.zMax],[-25,-8]);
 assert.deepEqual([model.objects.gaugeZ2.zMin,model.objects.gaugeZ2.zMax],[9,31]);
 const mesh=machineVolumeMesh(model);
 assert.ok(mesh.faces.some(face=>face.kind==='gaugeZ1'));
 assert.ok(mesh.faces.some(face=>face.kind==='gaugeZ2'));
 assert.equal(mesh.faces.some(face=>face.kind==='gauge'),false);
 const inspection=inspectVolumeFrame(technicalScene(EXAMPLE,0),opts());
 assert.equal(inspection.issues.some(issue=>issue.kind==='gauge'),false);
 assert.equal(inspection.canApproveForMachine,false);
 const changed=buildVolumeScene(technicalScene(EXAMPLE,0),{
  ...opts(),machineCAD:{stopZ1:left,stopZ2:{...right,source:'revision nueva'}}
 });
 assert.equal(changed.gaugeReferenceOnly,false);
 assert.equal(changed.gaugeFingerReview.status,'DXF_CAMBIADO_Z2');
 assert.ok(machineVolumeMesh(changed).faces.some(f=>f.kind==='gauge'));
});
test('R129: componentes 3D reales y avisos no se aplican fuera de la pose',()=>{
 const changed=buildVolumeScene(technicalScene(EXAMPLE,5.01),opts());
 assert.equal(changed.gaugeReferenceOnly,false);
 assert.equal(changed.gaugeFingerReview.status,'OTRA_POSE');
 assert.equal(changed.verified,false);
 assert.ok(changed.objects.gauge.valid);
 assert.equal(changed.cadProfilesUsed.includes('stopZ1'),false);
});
test('R129: panel incluye las cuatro posibilidades y datos guardados siguen sin firma industrial',()=>{
 const html=readFileSync(new URL('../index.html',import.meta.url),'utf8');
 const js=readFileSync(new URL('../machine-cad-ui.js',import.meta.url),'utf8');
 const sw=readFileSync(new URL('../sw.js',import.meta.url),'utf8');
 for(const code of ['stopZ1','stopZ2','supportZ1','supportZ2']){
  assert.ok(html.includes('value="'+code+'"'));
  assert.ok(js.includes('profileKind+axis'));
 }
 assert.match(js,/sameSectionConfirmed:shared/);
 assert.match(js,/profileFingerprints/);
 assert.match(sw,/"\.\/machine-gauge-fingers\.js"/);
});
