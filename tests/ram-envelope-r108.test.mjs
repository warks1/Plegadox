import test from 'node:test';
import assert from 'node:assert/strict';
import {EXAMPLE,normalized} from '../engine.js';
import {technicalScene} from '../technical-section.js';
import {getActiveMachineConfig} from '../machine-config.js';
import {machineRamEnvelope} from '../machine-ram-envelope.js';
import {buildVolumeScene,makePrism,prismOverlap} from '../volume-engine.js';

test('R108: trancha del detector y de la vista usan exactamente el mismo contorno',()=>{
 const p=normalized(EXAMPLE),machine=getActiveMachineConfig();
 for(let operation=0;operation<4;operation++)
  for(const sub of [.36,.44,.46,.52,.60,.68,.84,.95]){
   const scene=technicalScene(p,5*(operation+sub));
   const expected=machineRamEnvelope(scene,machine);
   const solid=buildVolumeScene(scene,{machine,machineCAD:{}}).objects.ram;
   assert.ok(solid.valid,'La envolvente necesita un contorno utilizable');
   assert.deepEqual(solid.polygon,expected.polygon,
    'La trancha que se comprueba no es la que se dibuja');
   assert.equal(solid.provenance,expected.provenance);
   assert.equal(expected.verified,false);
   assert.equal(solid.zMin,-machine.ramWidth/2);
   assert.equal(solid.zMax,machine.ramWidth/2);
  }
});

test('R108: no omitir el saliente lateral que existe en la vista',()=>{
 const scene={kinematics:{tipHeight:10},punch:{height:150}};
 const ram=machineRamEnvelope(scene,{ram:[0,0,0,0,0,0,125]});
 assert.equal(ram.toolTop,160);
 assert.equal(ram.width,125);
 assert.equal(Math.min(...ram.polygon.map(p=>p.x)),-60);
 assert.equal(Math.max(...ram.polygon.map(p=>p.x)),82.5);
 assert.equal(Math.min(...ram.polygon.map(p=>p.y)),150);
 assert.equal(Math.max(...ram.polygon.map(p=>p.y)),236);
 assert.equal(ram.provenance,'envolvente-trancha-del-visor-sin-CAD');
});

test('R108: una penetración de trancha tiene volumen y posición Z propia',()=>{
 const scene={kinematics:{tipHeight:10},punch:{height:150}};
 const outline=machineRamEnvelope(scene,{ram:[0,0,0,0,0,0,125]}).polygon;
 const ram=makePrism('trancha',outline,-100,100);
 const near=makePrism('chapa',[
  {x:-2,y:170},{x:2,y:170},{x:2,y:174},{x:-2,y:174}
 ],-50,50);
 const far=makePrism('chapa-fuera-z',near.polygon,120,150);
 assert.equal(prismOverlap(ram,near).intersects,true);
 assert.ok(prismOverlap(ram,near).volume>0);
 assert.equal(prismOverlap(ram,far).intersects,false);
 assert.equal(prismOverlap(ram,far).unknown,false);
});

test('R108: sin datum de punzón montado no dar por calculada la trancha',()=>{
 assert.throws(()=>machineRamEnvelope({kinematics:{tipHeight:1}},{}),
  /punzón montado/);
 assert.throws(()=>machineRamEnvelope({kinematics:{tipHeight:Infinity},
  punch:{height:120}},{}),/punzón montado/);
});
