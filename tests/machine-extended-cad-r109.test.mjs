import test from 'node:test';
import assert from 'node:assert/strict';
import {EXAMPLE,normalized} from '../engine.js';
import {technicalScene} from '../technical-section.js';
import {getActiveMachineConfig} from '../machine-config.js';
import {MACHINE_CAD_KINDS,normalizeMachineCad,positionMachineCad,
 machineCadDatum} from '../machine-cad.js';
import {buildVolumeScene,prismOverlap,makePrism} from '../volume-engine.js';

const newParts=['upperClamp','lowerClamp','upperAdapter',
 'lowerAdapter','frontSupport'];
const poly=[[-12,12],[12,12],[12,0],[-12,0]];
const cad=kind=>normalizeMachineCad({kind,
 points:poly,offsetX:0,offsetY:0,zMin:-100,zMax:100,
 source:'PRUEBA SINTETICA NO OEM'});

test('R109: nueva lista de importación incluye todos los cuerpos de máquina',()=>{
 for(const name of [...newParts,'ram','bed','stop','support']){
  assert.ok(MACHINE_CAD_KINDS.includes(name));
  assert.ok(machineCadDatum(name));
 }
 assert.equal(MACHINE_CAD_KINDS.length,9);
 assert.throws(()=>normalizeMachineCad({...cad('upperClamp'),kind:'mordaza-certificada'}),
  /Tipo CAD no reconocido/);
});

test('R109: amarres y adaptadores importados son sólidos distintos del punzón/matriz',()=>{
 const machine=getActiveMachineConfig(),p=normalized(EXAMPLE);
 const scene=technicalScene(p,2.5);
 const provided=Object.fromEntries(newParts.map(kind=>[kind,cad(kind)]));
 const model=buildVolumeScene(scene,{machine,machineCAD:provided});
 for(const kind of newParts){
  assert.ok(model.objects[kind]?.valid,kind);
  assert.ok(model.cadProfilesUsed.includes(kind),kind);
  assert.ok(!model.missingCadComponents.includes(kind),kind);
  assert.match(model.objects[kind].provenance,/CAD importado/);
 }
 assert.ok(model.missingCadComponents.includes('ram'));
 assert.ok(model.missingCadComponents.includes('stop'));
 assert.equal(model.verified,false);
});

test('R109: sin contornos disponibles no se inventan sólidos de amarre',()=>{
 const machine=getActiveMachineConfig(),scene=technicalScene(EXAMPLE,2.5);
 const model=buildVolumeScene(scene,{machine,machineCAD:{}});
 for(const kind of newParts){
  assert.equal(model.objects[kind],undefined);
  assert.ok(model.missingCadComponents.includes(kind));
 }
 assert.equal(model.verified,false);
});

test('R109: la traslación de amarre superior sigue Y de punzón; inferior sigue mesa',()=>{
 const machine=getActiveMachineConfig(),scene=technicalScene(EXAMPLE,2.5);
 const upper=positionMachineCad(cad('upperClamp'),
  {x:0,y:scene.kinematics.tipHeight},{machine});
 const lower=positionMachineCad(cad('lowerAdapter'),
  {x:0,y:0},{machine});
 assert.ok(upper.polygon.every((v,i)=>
  Math.abs(v.y-lower.polygon[i].y-scene.kinematics.tipHeight)<1e-9));
 assert.equal(upper.industrialVerified,false);
});

test('R109: invasión de un amarre se clasifica por CUERPO y volumen real',()=>{
 const machine=getActiveMachineConfig(),scene=technicalScene(EXAMPLE,2.5);
 const model=buildVolumeScene(scene,{machine,machineCAD:{upperClamp:cad('upperClamp')}});
 const upper=model.objects.upperClamp;
 const x=upper.polygon[0].x,y=upper.polygon[0].y;
 const penetrant=makePrism('chapa-prueba',
  [{x:x+2,y:y+2},{x:x+4,y:y+2},
   {x:x+4,y:y+4},{x:x+2,y:y+4}],-5,5);
 const hit=prismOverlap(upper,penetrant);
 assert.equal(hit.intersects,true);
 assert.ok(hit.volume>0);
 assert.equal(hit.unknown,false);
});
