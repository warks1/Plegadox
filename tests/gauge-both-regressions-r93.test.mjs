import test from 'node:test';
import assert from 'node:assert/strict';
import {technicalScene} from '../technical-section.js';
import {EXAMPLE,normalized} from '../engine.js';
import {gaugePerspectiveContours} from '../machine-visual.js';
import {gaugePlacement} from '../backgauge-placement.js';
import {gaugeRiskStatus} from '../gauge-risk-status.js';
import {selectMachine} from '../machine-selection.js';

test('R93: Stop 1 y chapa comparten plano frontal de perspectiva, sin cambiar X real',()=>{
 const contour=[[100,420],[180,420],[180,480],[100,480]];
 const flat=gaugePerspectiveContours(contour,2,false);
 assert.deepEqual(flat.near,contour);
 assert.deepEqual(flat.far,contour);
 assert.equal(flat.depthX,0);assert.equal(flat.depthY,0);
 const perspective=gaugePerspectiveContours(contour,2,true);
 assert.deepEqual(perspective.near,contour,
  'La cara de contacto del dedo NO se desplaza del plano métrico');
 assert.equal(perspective.depthX,46);
 assert.equal(perspective.depthY,-26);
 assert.deepEqual(perspective.far[0],[146,394]);
 assert.deepEqual(perspective.far[3],[146,454]);
 // La profundidad se añade DETRÁS del frente, como sheetDepth.
 assert.equal(perspective.far[0][0]-perspective.near[0][0],46);
});

test('R93: G2 del vídeo retira el dedo con penetración futura aunque el apoyo siga en aviso',()=>{
 selectMachine('trumpf-v85');
 const p=normalized({...EXAMPLE,flanges:[50,30,50,30,20],
  punch:'goose',die:'v16',stopByBend:[1,1,1,1],
  gaugeSideByBend:['auto','before','auto','auto']});
 const saved=JSON.stringify(p);
 const at=sub=>technicalScene(p,5+5*sub);
 const before=at(.25),clamp=at(.40),bend=at(.60);
 assert.equal(before.gaugeSetup.valid,true);
 assert.equal(before.gaugeSetup.foldedWingContact,true);
 assert.equal(before.gaugeSetup.interference.warning,false);
 assert.ok(before.gaugeSetup.foldedWingCandidate.overlap>=2);
 assert.equal(before.gaugePlan.penetrationCount>0,true);
 assert.equal(before.gaugePlan.setupValid,true);
 assert.equal(before.gaugePlan.needsSetupCorrection,false);
 assert.equal(before.gaugePlan.enabled,true);
 assert.equal(before.gaugePlan.withdrawalUnverified,false);
 assert.equal(before.gaugeTransition,null,
  'No retirar durante presentación, antes de sujetar');
 assert.equal(clamp.gaugeTransition.phase,'retroceso-antes-plegado');
 assert.equal(bend.gaugeTransition.phase,'retirado-durante-plegado');
 assert.ok(bend.gaugeTransition.plannedRetraction>0);
 assert.equal(gaugeRiskStatus(gaugePlacement(before,1)).level,'green',
  'La predicción con dedo quieto no representa un choque de la pose actual');
 assert.equal(gaugeRiskStatus(gaugePlacement(before,1)).forecast,'retirada-prevista');
 assert.equal(JSON.stringify(p),saved,'No modificar la referencia manual');
});

test('R93: Omega estándar no se retira por holgura nominal sin penetración',()=>{
 selectMachine('trumpf-v85');
 for(let i=0;i<EXAMPLE.order.length;i++){
  const scene=technicalScene(EXAMPLE,i*5+3);
  assert.equal(scene.gaugePlan.penetrationCount,0);
  assert.equal(scene.gaugePlan.enabled,false);
  assert.equal(scene.gaugeTransition,null);
 }
});
