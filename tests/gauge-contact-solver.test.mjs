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
test('si el apoyo inicial está mal NO se pide retirada para esconder choque',()=>{
 const p=normalized(EXAMPLE),st=stage(p,5.4),bend=st.activeBend;
 const draft={...p,gaugeSegmentByBend:[...p.gaugeSegmentByBend],
  gaugeSideByBend:[...p.gaugeSideByBend]};
 const interior=Math.max(1,Math.min(p.flanges.length-2,bend));
 draft.gaugeSegmentByBend[bend]=interior;
 draft.gaugeSideByBend[bend]='before';
 const scene=technicalScene(draft,5.4);
 assert.equal(scene.gaugeSetup.valid,false);
 assert.equal(scene.gaugePlan.setupValid,false);
 assert.equal(scene.gaugePlan.enabled,false);
 assert.equal(scene.gaugeTransition?.plannedRetraction??0,0);
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

test('vídeo 15/11: apoyo manual a 20 mm dentro de ala de 50 mm no se corrige retirando tope',()=>{
 // La parada física necesita un canto libre delante de la cara frontal.
 // Tocar un punto interior puede ser una cota manual legítima de edición,
 // pero no valida ese contacto como apoyo real en la simulación.
 const piece=normalized({...EXAMPLE,
  gaugeSideByBend:['before','auto','auto','auto'],
  gaugeSegmentByBend:[0,null,null,null],
  gaugePointByBend:[20,null,null,null]});
 const ref=gaugeReference(piece,0);
 assert.equal(ref.distance,20);
 assert.equal(ref.freeEdge,false);
 const setup=technicalScene(piece,.30);
 assert.equal(setup.gaugeSetup.manual,true);
 assert.equal(setup.gaugeSetup.valid,false);
 assert.equal(setup.gaugePlan.needsSetupCorrection,true);
 const during=technicalScene(piece,.60*5);
 assert.equal(during.gaugePlan.setupValid,false);
 assert.equal(during.gaugePlan.enabled,false,
  'No desplazar el dedo para ocultar un apoyo físicamente inválido');
 assert.equal(during.gaugeTransition?.plannedRetraction??0,0);
 // La misma ala, llevada a su extremo físico, deja de ser referencia interior.
 const edge=gaugeReference({...piece,gaugePointByBend:[50,null,null,null]},0);
 assert.equal(edge.freeEdge,true);
});
