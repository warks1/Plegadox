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
 // R109 fijaba 9 cuerpos. La R129 conserva los nueve y añade 4 DXF
 // por dedo; extender una biblioteca no debe romper la regresión antigua.
 assert.equal(MACHINE_CAD_KINDS.length,13);
 for(const kind of ['stopZ1','stopZ2','supportZ1','supportZ2']){
  assert.ok(MACHINE_CAD_KINDS.includes(kind));
  assert.ok(machineCadDatum(kind));
 }
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
 // El primer vértice está en la ARISTA SUPERIOR; desplazar en Y+2
 // colocaba la chapa de prueba FUERA del cuerpo, no dentro de él.
 const x=(upper.polygon[0].x+upper.polygon[2].x)/2;
 const y=(upper.polygon[0].y+upper.polygon[2].y)/2;
 const penetrant=makePrism('chapa-prueba',
  [{x:x-1,y:y-1},{x:x+1,y:y-1},
   {x:x+1,y:y+1},{x:x-1,y:y+1}],-5,5);
 const hit=prismOverlap(upper,penetrant);
 assert.equal(hit.intersects,true);
 assert.ok(hit.volume>0);
 assert.equal(hit.unknown,false);
});
