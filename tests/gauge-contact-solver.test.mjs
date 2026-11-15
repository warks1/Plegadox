import test from 'node:test';
import assert from 'node:assert/strict';
import {EXAMPLE,normalized,stage,gaugeReference} from '../engine.js';
import {getActiveMachineConfig} from '../machine-config.js';
import {selectMachine} from '../machine-selection.js';
import {resolveGaugeSetup,evaluateGaugeSetup} from '../gauge-contact-solver.js';
import {technicalScene} from '../technical-section.js';

const machine=()=>{selectMachine('trumpf-v85');return getActiveMachineConfig();};
test('automático no declara apoyo físico si utiliza un vértice interior',()=>{
 const p=normalized(EXAMPLE),st=stage(p,5.1),m=machine();
 const selected=resolveGaugeSetup(p,st,m);
 assert.equal(selected.verified,false);
 assert.equal(selected.manual,false);
 assert.ok(Array.isArray(selected.candidates));
 if(selected.valid){
  assert.equal(selected.ref.freeEdge,true);
  assert.equal(selected.faceAccessible,true);
  assert.equal(selected.warning,false);
 }else{
  assert.equal(selected.noSafeContact,true);
 }
});
test('elección manual no se reemplaza automáticamente aunque haya interferencia',()=>{
 const p=normalized(EXAMPLE),st=stage(p,5.1),bend=st.activeBend,m=machine();
 const segment=Math.max(0,Math.min(p.flanges.length-1,bend));
 const draft={...p,gaugeSideByBend:[...p.gaugeSideByBend],
  gaugeSegmentByBend:[...p.gaugeSegmentByBend]};
 draft.gaugeSideByBend[bend]='before';
 draft.gaugeSegmentByBend[bend]=segment;
 const selected=resolveGaugeSetup(draft,st,m);
 assert.equal(selected.manual,true);
 assert.equal(selected.ref.segmentIndex,segment);
 assert.equal(selected.candidates.length,1);
 if(!selected.ref.freeEdge)assert.equal(selected.valid,false);
});
test('apoyo inicial inválido NO se valida porque la vista prevé retroceso',()=>{
 const p=normalized(EXAMPLE),st=stage(p,5.4),bend=st.activeBend;
 const draft={...p,gaugeSegmentByBend:[...p.gaugeSegmentByBend],
  gaugeSideByBend:[...p.gaugeSideByBend]};
 const interior=Math.max(1,Math.min(p.flanges.length-2,bend));
 draft.gaugeSegmentByBend[bend]=interior;
 draft.gaugeSideByBend[bend]='before';
 const scene=technicalScene(draft,5.4);
 assert.equal(scene.gaugeSetup.valid,false);
 assert.equal(scene.gaugePlan.setupValid,false);
 assert.equal(scene.gaugePlan.needsSetupCorrection,true);
 // Si aparece una penetración FUTURA, el simulador puede representar
 // la retirada después de sujeción, pero JAMÁS validar el apoyo manual.
 // Si ya hay penetración en preparación, una retirada tardía NO la arregla.
 const risk=scene.gaugePlan.penetrationCount>0&&
  scene.gaugeSetup.interference?.kind!=='penetracion';
 assert.equal(scene.gaugePlan.enabled,risk);
 assert.equal(scene.gaugePlan.withdrawalUnverified,risk);
});
test('mismo punto de dibujo de dedo y punto de contacto inicial',()=>{
 const p=normalized(EXAMPLE),st=stage(p,.3);
 const setup=resolveGaugeSetup(p,st,machine());
 if(setup.point&&setup.polygon.length){
  assert.ok(setup.polygon.every(q=>Number.isFinite(q.x)&&Number.isFinite(q.y)));
  const reference=setup.ref;
  assert.ok(reference.sourceIndex===0||
   reference.sourceIndex===p.flanges.length||!setup.valid);
 }
});
