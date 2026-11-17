import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {EXAMPLE} from '../engine.js';
import {V85_FACTORY,normalizeV85} from '../machine-config.js';
import {technicalScene} from '../technical-section.js';
import {machineConfigurationKey} from '../machine-cad.js';
import {motionPieceKey} from '../machine-axis-motion.js';
import {normalizeAxisMapping,scanAxisCADMovement} from '../machine-axis-geometry.js';
const machine=V85_FACTORY;
const axisNames=['Y1','Y2','X','R','Z1','Z2'];
const limits=Object.fromEntries(axisNames.map(s=>[s,{min:-3000,max:3000,maxSpeed:500}]));
const fixture=()=>{
 const tip=technicalScene(EXAMPLE,0).kinematics.tipHeight;
 const mk=(kind,offsetX,offsetY)=>({
  kind,source:'CAD de prueba geométrica',machineConfigKey:machineConfigurationKey(machine),
  points:[[-10,0],[10,0],[10,10],[-10,10]],
  offsetX,offsetY,zMin:-15,zMax:15});
 return {
  ram:mk('ram',0,100-tip),bed:mk('bed',0,0),
  stop:mk('stop',150,0),support:mk('support',150,0)
 };
};
const mapping=()=>({
 unit:'mm',version:1,
 signs:{Y:-1,X:1,R:1,Z1:1,Z2:1},
 activeFinger:'Z1',referenceSceneTime:0,ramTiltTolerance:1,
 source:'Control y referencia medidos en ensayo',machineConfigKey:machineConfigurationKey(machine)
});
const motion=()=>({
 unit:'mm',timeUnit:'s',source:'recorded',sourceDescription:'Ensayo geométrico',
 machineId:'V85',pieceKey:motionPieceKey(EXAMPLE),limits,
 poses:[
  {time:0,phase:'chapa fija',sceneTime:0,axes:{Y1:0,Y2:0,X:10,R:10,Z1:0,Z2:0}},
  {time:5,phase:'chapa fija',sceneTime:0,axes:{Y1:200,Y2:200,X:10,R:10,Z1:0,Z2:0}}
 ]});
test('CAD+ejes: datum de ejes normaliza de forma estable tras guardar y recuperar',()=>{
 const first=normalizeAxisMapping(mapping());
 assert.equal(first.activeFinger,'Z1');
 assert.deepEqual(normalizeAxisMapping(first),first);
});
test('CAD+ejes: acepta datum asociado al modelo real de plegadora sin mezclar máquinas',()=>{
 const key=machineConfigurationKey(normalizeV85(V85_FACTORY));
 assert.match(key,/^machine-[0-9a-f]{8}$/);
 assert.equal(normalizeAxisMapping({...mapping(),machineConfigKey:key}).machineConfigKey,key);
 assert.throws(()=>normalizeAxisMapping({...mapping(),machineConfigKey:'other-12345678'}),
  /configuración de plegadora/);
});
test('CAD+ejes: geometría ilustrativa se anuncia como provisional',()=>{
 const partial={...fixture()};delete partial.bed;
 const report=scanAxisCADMovement(EXAMPLE,{machine,machineCAD:partial,
  mapping:mapping(),axisMotion:motion()});
 assert.ok(report.missingCad.includes('bed'));
 // R130 desglosa la evidencia por objeto; no equiparar este aviso
 // de CAD incompleto a un choque real certificado.
 assert.ok(report.events.length>0);
 assert.ok(report.evidenceSummary);
 assert.equal(report.physicalCollisionCertified,false);
 assert.notEqual(report.status,'INTERVALOS_LINEALES_REVISADOS_SIN_CERTIFICAR');
 assert.equal(report.canApproveForMachine,false);
});
test('CAD+ejes: traslación calibrada de la trancha detecta choque con mesa entre posiciones',()=>{
 const result=scanAxisCADMovement(EXAMPLE,{machine,machineCAD:fixture(),
  mapping:mapping(),axisMotion:motion()});
 assert.equal(result.checked,true);
 assert.ok(result.intervalsChecked>0);
 const ramVsBed=result.events.find(x=>x.moving==='ram'&&x.against==='bed');
 assert.ok(ramVsBed);
 assert.match(ramVsBed.sourceMoving,/CAD importado/);
 assert.match(ramVsBed.sourceAgainst,/CAD importado/);
 assert.equal(result.status,'SOLAPE_ENTRE_DXF_DECLARADOS');
 assert.equal(ramVsBed.evidenceCode,'DOS_PERFILES_CAD');
 assert.equal(ramVsBed.physicalCollisionCertified,false);
 assert.ok(result.missingCad.includes('upperClamp'));
 assert.ok(result.missingCad.includes('lowerAdapter'));
 // Una colisión con CAD de trancha/mesa no certifica todo el conjunto sin amarres.
 assert.equal(result.verified,false);
 assert.equal(result.canApproveForMachine,false);
});
test('CAD+ejes: si cambian el orden o las herramientas se bloquea la traza',()=>{
 const other={...EXAMPLE,order:[3,2,1,0]};
 const result=scanAxisCADMovement(other,{machine,machineCAD:fixture(),
  mapping:mapping(),axisMotion:motion()});
 assert.equal(result.checked,false);
 assert.equal(result.status,'TRAZA_DE_OTRA_PIEZA');
});
test('CAD+ejes: sin signo calibrado o sin escena de chapa fija no se simula',()=>{
 const bad={...mapping(),signs:{...mapping().signs,Y:0}};
 assert.throws(()=>normalizeAxisMapping(bad),/calibrar el sentido/);
 const tr=motion();delete tr.poses[0].sceneTime;
 const result=scanAxisCADMovement(EXAMPLE,{machine,machineCAD:fixture(),
  mapping:mapping(),axisMotion:tr});
 assert.equal(result.checked,false);
 assert.equal(result.status,'CHAPA_SIN_REFERENCIA_TEMPORAL');
});
test('CAD+ejes: inclinación desconocida Y1/Y2 se deja SIN RESOLVER',()=>{
 const tr=motion();tr.poses[1].axes.Y1=210;
 const result=scanAxisCADMovement(EXAMPLE,{machine,machineCAD:fixture(),
  mapping:mapping(),axisMotion:tr});
 assert.equal(result.intervalsChecked,0);
 assert.equal(result.tiltUnresolved,1);
 assert.equal(result.events.length,0);
});
test('CAD+ejes: el movimiento lineal del dedo Z1 se revisa volumétricamente',()=>{
 const tr=motion();tr.poses[1].axes.Z1=100;
 const result=scanAxisCADMovement(EXAMPLE,{machine,machineCAD:fixture(),
  mapping:mapping(),axisMotion:tr});
 assert.equal(result.axisFingerModeled,'Z1');
 assert.equal(result.intervalsChecked,1);
 assert.equal(result.checked,true);
 assert.equal(result.canApproveForMachine,false);
 assert.equal(result.verified,false);
});
test('PWA R36 ofrece vínculo CAD/ejes, importación de mapa y cachea módulos nuevos',()=>{
 const html=readFileSync(new URL('../index.html',import.meta.url),'utf8');
 const sw=readFileSync(new URL('../sw.js',import.meta.url),'utf8');
 for(const id of ['machineAxisMappingPanel','machineAxisMappingTemplate','machineAxisMappingImport'])
  assert.ok(html.includes('id="'+id+'"'));
 for(const file of ['swept-volume.js','machine-axis-geometry.js'])
  assert.ok(sw.includes('"./'+file+'"'));
});
