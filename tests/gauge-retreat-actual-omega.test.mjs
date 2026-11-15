import test from 'node:test';
import assert from 'node:assert/strict';
import {EXAMPLE,normalized} from '../engine.js';
import {technicalScene} from '../technical-section.js';

test('auditar retirada física por golpe y no confundir con el cambio de referencia',()=>{
 const piece=normalized(EXAMPLE);
 const report=piece.order.map((bend,operation)=>{
  const at=sub=>technicalScene(piece,operation*5+5*sub);
  const initial=at(.30),enter=at(.40),bending=at(.60),returning=at(.92);
  const plan=bending.gaugePlan;
  return {operation:operation+1,bend:bend+1,
   setupValid:plan.setupValid,enabled:plan.enabled,known:plan.known,
   reason:plan.reason,issues:plan.issues,
   anchor:initial.gaugeAnchor,
   duringPosition:bending.gaugeTransition?.point??bending.gaugeAnchor,
   retreatDistance:bending.gaugeTransition?.plannedRetraction??0,
   duringPhase:bending.gaugeTransition?.phase??'quieto',
   returnPhase:returning.gaugeTransition?.phase??'quieto',
   reference:initial.gaugeReference?.side,
   transitionAtClamping:enter.gaugeTransition?.phase??'quieto'};
 });
 console.log('OMEGA_GAUGE_ACTUAL_REPORT='+JSON.stringify(report));
 assert.equal(report.length,4);
 assert.deepEqual(report.map(x=>x.enabled),[false,false,false,false],
  'Omega: holgura junto al apoyo NO equivale a penetración del dedo');
 assert.deepEqual(report.map(x=>x.retreatDistance),[0,0,0,0],
  'Omega: prohibido aparcar por una advertencia de holgura');
 for(const item of report){
  assert.equal(item.duringPhase,'quieto','G'+item.operation+' no retrocede durante plegado');
  assert.equal(item.transitionAtClamping,'quieto',
   'G'+item.operation+' no se retira durante la sujeción');
 }
 assert.equal(report[3].returnPhase,'quieto',
  'G4: al finalizar la pieza no debe recolocar el tope');
 assert.ok(report[0].issues.some(issue=>issue.kind==='holgura'),
  'Conservar alertas 2D aunque no provoquen retiradas');
});
