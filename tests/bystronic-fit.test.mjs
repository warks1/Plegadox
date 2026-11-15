import test from 'node:test';
import assert from 'node:assert/strict';
import {MACHINE_PROFILES,selectMachine} from '../machine-selection.js';
import {getActiveMachineConfig} from '../machine-config.js';
import {normalizeBystronicFit,readBystronicFit,writeBystronicFit,
 assessBystronicWorkingOpening} from '../bystronic-fit.js';
import {checkMachineToolMounting} from '../machine-mounting.js';
import {machineConfigurationKey} from '../machine-cad.js';

function memoryStorage(){
 const data=new Map();
 return {getItem:k=>data.get(k)??null,setItem:(k,v)=>data.set(k,v)};
}
test('cabezales WILA, bombeo y adaptador Promecam declarados en Bystronic 2006',()=>{
 const p=MACHINE_PROFILES['bystronic-2006-100-3100'];
 assert.equal(p.upperClampingSystem,'WILA');
 assert.equal(p.lowerDieSystem,'PROMECAM_CON_ADAPTADOR');
 assert.equal(p.hydraulicCrowning,true);
 assert.equal(p.openHeight,null);
 assert.equal(p.daylightReference.min,400);
 assert.equal(p.daylightReference.max,515);
});
test('la ficha oficial Xpert Pro estándar difiere de Extended y no se atribuye a 2006',()=>{
 const p=MACHINE_PROFILES['bystronic-xpert-pro-100-3100'];
 assert.equal(p.firstPresented,2018);
 assert.equal(p.year,null);
 assert.equal(p.tonnage,100);
 assert.equal(p.bendingLength,3100);
 assert.equal(p.openHeight,640);
 assert.equal(p.stroke,250);
 assert.equal(p.betweenUprights,2750);
 assert.equal(p.xTravel,600);
 assert.equal(p.rTravel,250);
 assert.equal(p.upperClampingSystem,'WILA');
 selectMachine(p.id);
 const cfg=getActiveMachineConfig();
 assert.equal(cfg.openHeight,640);
 assert.equal(cfg.tableWidth,74);
 assert.equal(cfg.gaugeGeometryDocumented,false);
 selectMachine('trumpf-v85');
});
test('luz útil siempre pendiente sin las cuatro medidas montadas',()=>{
 const empty=normalizeBystronicFit({});
 assert.equal(empty.daylightMeasured,null);
 assert.equal(assessBystronicWorkingOpening(empty).calculable,false);
 assert.equal(assessBystronicWorkingOpening({daylightMeasured:640}).opening,null);
 assert.throws(()=>normalizeBystronicFit({daylightMeasured:99999}),/fuera/);
});
test('cálculo de apertura nominal resta WILA/punzón + regleta + matriz',()=>{
 const result=assessBystronicWorkingOpening({
  daylightMeasured:640,upperAssemblyProjection:135,
  lowerAdapterHeight:25,lowerDieProjection:80
 });
 assert.equal(result.calculable,true);
 assert.equal(result.opening,400);
 assert.equal(result.verified,false);
});
test('configuración de medidas no se comparte entre AFM EP 2006 y Xpert Pro',()=>{
 const storage=memoryStorage();
 writeBystronicFit({daylightMeasured:485},storage,'bystronic-2006-100-3100');
 writeBystronicFit({daylightMeasured:640},storage,'bystronic-xpert-pro-100-3100');
 assert.equal(readBystronicFit(storage,'bystronic-2006-100-3100').daylightMeasured,485);
 assert.equal(readBystronicFit(storage,'bystronic-xpert-pro-100-3100').daylightMeasured,640);
});
test('montaje comprueba WILA arriba y Promecam abajo, nunca mismo mount',()=>{
 const m={profileId:'bystronic-xpert-pro-100-3100'};
 const wila={mount:'WILA'};
 const pro={mount:'Amada/Promecam'};
 assert.equal(checkMachineToolMounting(m,wila,pro).compatible,true);
 assert.equal(checkMachineToolMounting(m,{mount:'TRUMPF'},pro).compatible,false);
 assert.equal(checkMachineToolMounting(m,wila,{mount:'Bystronic/Beyeler R'}).compatible,false);
 assert.equal(checkMachineToolMounting(m,{mount:'Bystronic R'},pro).compatible,null);
});
test('CAD de dos Bystronic de 3100 no puede reutilizarse',()=>{
 selectMachine('bystronic-2006-100-3100');
 const old=machineConfigurationKey(getActiveMachineConfig());
 selectMachine('bystronic-xpert-pro-100-3100');
 const current=machineConfigurationKey(getActiveMachineConfig());
 assert.notEqual(old,current);
 selectMachine('trumpf-v85');
});
