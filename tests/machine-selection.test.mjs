import test from 'node:test';
import assert from 'node:assert/strict';
import {MACHINE_PROFILES,selectMachine,getActiveMachineId,getActiveMachineProfile} from '../machine-selection.js';
import {getActiveMachineConfig} from '../machine-config.js';
import {estimateAirBendForce} from '../engine.js';
test('PR100 y EP II comparten 3100 nominal pero NO cotas de montantes/carrera',()=>{
 const pr=MACHINE_PROFILES['bystronic-pr100-3100'];
 const ep=MACHINE_PROFILES['bystronic-ep2-31-100'];
 assert.equal(pr.bendingLength,3100);assert.equal(ep.bendingLength,3100);
 assert.equal(pr.tonnage,100);assert.equal(ep.tonnage,100);
 assert.equal(pr.betweenUprights,2750);assert.equal(ep.betweenUprights,2550);
 assert.equal(pr.stroke,215);assert.equal(ep.stroke,200);
});
test('la ficha seleccionada sustituye capacidad y ancho sin copiar cotas Cybelec',()=>{
 selectMachine('bystronic-ep2-31-100');
 const cfg=getActiveMachineConfig();
 assert.equal(getActiveMachineProfile().id,'bystronic-ep2-31-100');
 assert.equal(cfg.ramWidth,3100);assert.equal(cfg.tonnage,100);
 assert.equal(cfg.gaugeGeometryDocumented,false);
 assert.ok(cfg.ram.every(v=>v===null),'no introducir cotas inventadas de trancha');
 const force=estimateAirBendForce({flanges:[50,50],angles:[90]});
 assert.equal(force.nominalCapacity,100);
 selectMachine('trumpf-v85');
 assert.equal(getActiveMachineId(),'trumpf-v85');
});
test('códigos desconocidos no sustituyen configuración guardada',()=>{
 assert.throws(()=>selectMachine('bystronic-otro'),/no conocido/);
});

test('Bystronic 2006 incorpora las cotas documentadas PR100/3100 como referencia',()=>{
 selectMachine('bystronic-2006-100-3100');
 const cfg=getActiveMachineConfig();
 const profile=getActiveMachineProfile();
 assert.equal(profile.year,2006);
 assert.equal(cfg.tonnage,100);
 assert.equal(cfg.bendingLength,3100);
 assert.equal(cfg.betweenUprights,2750);
 assert.equal(cfg.throat,400);
 assert.equal(cfg.openHeight,500);
 assert.equal(cfg.stroke,215);
 assert.equal(cfg.xRange,1040);
 assert.equal(cfg.xTravel,590);
 assert.equal(cfg.rTravel,250);
 assert.deepEqual(cfg.outer,{length:4100,depth:2050,height:2600});
 assert.equal(cfg.nominalWeightTonnes,9);
 assert.equal(cfg.tableHeight,null);
 assert.equal(cfg.gaugeGeometryDocumented,false);
 assert.ok(cfg.dimensionsSource.includes('politesi'));
 assert.equal(cfg.dimensionsVerified,'cotas-fabricante-pr100-3100-atribuidas-como-referencia');
 selectMachine('trumpf-v85');
});
