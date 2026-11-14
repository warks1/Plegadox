import test from 'node:test';
import assert from 'node:assert/strict';
import {EXAMPLE} from '../engine.js';
import {V85_FACTORY} from '../machine-config.js';
import {buildProjectBackup,restoreProjectBackup,parseProjectBackup} from '../project-backup.js';
import {MACHINE_CAD_KEY,machineConfigurationKey} from '../machine-cad.js';
import {AXIS_MAPPING_KEY} from '../machine-axis-geometry.js';
import {MOTION_KEY,MOTION_AXES,motionPieceKey} from '../machine-axis-motion.js';
function cad(kind='ram'){
 return {kind,points:[[0,0],[10,0],[10,80],[0,80]],
  offsetX:0,offsetY:120,zMin:-60,zMax:60,source:'Plano de prueba R36'};
}
const limits=Object.fromEntries(MOTION_AXES.map(axis=>[axis,{min:-1000,max:1000,maxSpeed:200}]));
function motion(){
 const axes={Y1:0,Y2:0,X:20,R:12,Z1:-200,Z2:200};
 return {unit:'mm',timeUnit:'s',source:'recorded',sourceDescription:'Ensayo',
  machineId:'V85',pieceKey:motionPieceKey(EXAMPLE),limits,
  poses:[{time:0,phase:'espera',axes},
   {time:2,phase:'retirada',axes:{...axes,X:80,R:25}}]};
}
function store(initial={},badKey=null){
 const map=new Map(Object.entries(initial)),calls=[];
 return {calls,map,getItem:key=>map.get(key)??null,
  setItem(key,value){calls.push(key);if(key===badKey)throw Error('CUOTA');
   map.set(key,String(value));},removeItem:key=>map.delete(key)};
}
const mapping=()=>({
 version:1,unit:'mm',signs:{Y:1,X:1,R:1,Z1:1,Z2:1},
 activeFinger:'Z1',referenceSceneTime:0,ramTiltTolerance:.5,
 source:'Datos de calibración medidos',machineConfigKey:machineConfigurationKey(V85_FACTORY)
});
const full=()=>buildProjectBackup({
 piece:EXAMPLE,machine:V85_FACTORY,tools:[],machineCad:{ram:cad()},
 axisMotion:motion(),axisMapping:mapping()
});
test('backup R36: CAD de máquina y ejes se conservan, nunca verificados',()=>{
 const backup=full();
 assert.ok(backup.machineCad.ram);
 assert.equal(backup.machineCad.ram.industrialVerified,false);
 assert.equal(backup.axisMotion.industrialVerified,false);
 assert.equal(backup.axisMotion.poses.length,2);
 assert.equal(backup.axisMapping.certified,false);
 const parsed=parseProjectBackup(JSON.stringify(backup));
 assert.equal(parsed.hasMachineCad,true);
 assert.equal(parsed.hasAxisMotion,true);
 const db=store();restoreProjectBackup(db,backup);
 assert.equal(JSON.parse(db.getItem(MACHINE_CAD_KEY)).ram.kind,'ram');
 assert.equal(JSON.parse(db.getItem(MOTION_KEY)).poses[1].axes.X,80);
 assert.equal(JSON.parse(db.getItem(AXIS_MAPPING_KEY)).activeFinger,'Z1');
});
test('backup antiguo sin campos CAD/ejes NO borra su contenido local',()=>{
 const previous={ram:cad()},axes=motion(),datum=mapping();
 const db=store({[MACHINE_CAD_KEY]:JSON.stringify(previous),
  [MOTION_KEY]:JSON.stringify(axes),[AXIS_MAPPING_KEY]:JSON.stringify(datum)});
 const old=full();delete old.machineCad;delete old.axisMotion;delete old.axisMapping;
 restoreProjectBackup(db,old);
 assert.deepEqual(JSON.parse(db.getItem(MACHINE_CAD_KEY)),previous);
 assert.deepEqual(JSON.parse(db.getItem(MOTION_KEY)),axes);
 assert.deepEqual(JSON.parse(db.getItem(AXIS_MAPPING_KEY)),datum);
});
test('backup R36 no sobreescribe perfil CAD incompatible ni traza CNC existente',()=>{
 const backup=full();
 const beforeCad={ram:{...backup.machineCad.ram,offsetX:1}};
 const db=store({[MACHINE_CAD_KEY]:JSON.stringify(beforeCad)});
 assert.throws(()=>restoreProjectBackup(db,backup),/Conflicto CAD/);
 assert.equal(db.calls.length,0);
 const other=motion();other.poses[1].axes.X=70;
 const db2=store({[MOTION_KEY]:JSON.stringify(other)});
 assert.throws(()=>restoreProjectBackup(db2,backup),/Conflicto de trayectoria/);
 assert.equal(db2.calls.length,0);
});
test('backup R36 detecta CAD deformado y revierte la transacción de ejes',()=>{
 const backup=full(),corrupt=structuredClone(backup);
 corrupt.machineCad.ram.points=[[0,0],[10,10],[0,10],[10,0]];
 const db=store();
 assert.throws(()=>restoreProjectBackup(db,corrupt),/autointersecado|sin área/);
 assert.equal(db.calls.length,0);
 const failing=store({},MOTION_KEY);
 const prior=[MACHINE_CAD_KEY,MOTION_KEY].map(k=>failing.getItem(k));
 assert.throws(()=>restoreProjectBackup(failing,backup),/No se pudo restaurar/);
 assert.deepEqual([MACHINE_CAD_KEY,MOTION_KEY].map(k=>failing.getItem(k)),prior);
});
