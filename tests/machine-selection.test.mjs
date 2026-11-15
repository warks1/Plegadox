import test from 'node:test';
import assert from 'node:assert/strict';
import {MACHINE_PROFILES,V85_OEM_HISTORICAL_REFERENCE,
 selectMachine,getActiveMachineId,getActiveMachineProfile} from '../machine-selection.js';
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

test('la máquina de la foto de 2006 usa referencia AFM EP provisional, no cotas PR100',()=>{
 selectMachine('bystronic-2006-100-3100');
 const cfg=getActiveMachineConfig();
 const profile=getActiveMachineProfile();
 assert.equal(profile.year,null);
 assert.deepEqual(profile.productionPeriod,{start:2006,end:2009});
 assert.equal(profile.tonnage,100);
 assert.equal(cfg.bendingLength,3100);
 assert.equal(cfg.stroke,200);
 assert.equal(cfg.nominalWeightTonnes,9);
 assert.equal(cfg.betweenUprights,null,'no adjudicar los 2750 mm de la PR100');
 assert.equal(cfg.throat,null,'sin dato confirmado en la unidad');
 assert.equal(cfg.openHeight,null,'no usar los 500 mm de PR100');
 assert.equal(cfg.xTravel,null,'no copiar recorrido X de PR100');
 assert.equal(cfg.rTravel,null,'no copiar recorrido R de PR100');
 assert.equal(cfg.tableHeight,null);
 assert.equal(cfg.outer,null,'no copiar dimensiones exteriores PR100');
 assert.equal(cfg.gaugeGeometryDocumented,false);
 assert.equal(profile.identificationConfidence,'probable-por-imagen-sin-placa');
 assert.equal(cfg.dimensionsVerified,'familia-afm-ep-referencia-no-validada-en-unidad');
 selectMachine('trumpf-v85');
});

test('V85: ficha histórica TRUMPF está separada de cotas Cybelec reales y no calibra ejes',()=>{
 const reference=V85_OEM_HISTORICAL_REFERENCE;
 assert.equal(reference.provenance,'ficha-historica-fabricante-familia-no-verificada-en-unidad');
 assert.equal(reference.applicableToOwnerUnit,false);
 assert.equal(reference.bendingLengthNominal,2050);
 assert.equal(reference.betweenUprightsNominal,1750);
 assert.equal(reference.throatNominal,410);
 assert.equal(reference.xAxisTravelNominal,600);
 assert.equal(reference.rAxisTravelNominal,250);
 assert.equal(reference.strokeStandard,215);
 assert.equal(reference.strokeExtendedOptional,365);
 assert.equal(reference.effectiveOpenHeightStandard,385);
 assert.equal(reference.effectiveOpenHeightExtendedOptional,535);
 assert.equal(reference.z1z2Optional,true);
 assert.match(reference.source,/TrumaBend-V-Series_TRUMPF_Brochure\.pdf$/);
 const profile=MACHINE_PROFILES['trumpf-v85'];
 assert.equal(profile.bendingLength,2040,
  'NO sobrescribir cotas de la unidad con longitud nominal 2050 del catálogo');
 assert.equal(profile.betweenUprights,null);
 assert.equal(profile.stroke,null);
 assert.equal(profile.openHeight,null);
 assert.equal(profile.oemHistoricalReference,reference);
 selectMachine('trumpf-v85');
 const machine=getActiveMachineConfig();
 assert.equal(machine.ramWidth,2040);
 assert.ok(machine.gaugeGeometryDocumented===false);
 assert.equal(machine.xTravel,undefined,
  'NO trasladar carrera X de un catálogo a la configuración operativa');
 assert.equal(machine.rTravel,undefined,
  'NO trasladar carrera R de un catálogo a la configuración operativa');
});
