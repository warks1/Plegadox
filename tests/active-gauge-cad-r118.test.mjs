import test from 'node:test';
import assert from 'node:assert/strict';
import {EXAMPLE,normalized} from '../engine.js';
import {technicalScene} from '../technical-section.js';
import {buildVolumeScene} from '../volume-engine.js';
import {scanVolumeTrajectory} from '../volume-trajectory-review.js';

const fixture=kind=>({
 kind,points:[[0,0],[8,0],[8,-10],[0,-10]],
 offsetX:0,offsetY:0,zMin:-16,zMax:16,
 source:'GEOMETRÍA SINTÉTICA DE PRUEBA, NO OEM'
});
const build=(stopNumber,cad={})=>{
 const piece=normalized({...EXAMPLE,stopByBend:Array(4).fill(stopNumber)});
 return buildVolumeScene(technicalScene(piece,1.25),{machineCAD:cad});
};
test('R118: un golpe STOP 1 no exige CAD del Support 2 inactivo',()=>{
 const frame=build(1);
 assert.ok(frame.missingCadComponents.includes('stop'));
 assert.equal(frame.missingCadComponents.includes('support'),false);
 assert.equal(frame.gaugePlacement.stopNumber,1);
});
test('R118: un golpe SUPPORT 2 no exige CAD del Stop 1 inactivo',()=>{
 const frame=build(2);
 assert.ok(frame.missingCadComponents.includes('support'));
 assert.equal(frame.missingCadComponents.includes('stop'),false);
 assert.equal(frame.gaugePlacement.stopNumber,2);
});
test('R118: CAD del Stop activo no crea falta ficticia del Support 2',()=>{
 const frame=build(1,{stop:fixture('stop')});
 assert.ok(frame.cadProfilesUsed.includes('stop'));
 assert.equal(frame.missingCadComponents.includes('stop'),false);
 assert.equal(frame.missingCadComponents.includes('support'),false);
 assert.equal(frame.verified,false);
});
test('R118: si la omega emplea ambos dedos, la secuencia sigue pidiendo ambos CAD',()=>{
 const p=normalized({...EXAMPLE,stopByBend:[1,2,1,2]});
 const scan=scanVolumeTrajectory(p,{machineCAD:{},
  axisMotion:null,axisMapping:null,samplesPerOperation:4});
 assert.ok(scan.missingCadComponents.includes('stop'));
 assert.ok(scan.missingCadComponents.includes('support'));
 assert.equal(scan.verified,false);
 assert.equal(scan.canApproveForMachine,false);
});
