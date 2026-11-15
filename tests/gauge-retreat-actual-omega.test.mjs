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
 // La advertencia de holgura de un ala ahora activa la retirada
 // preventiva: no debe permanecer el dedo en una trayectoria de riesgo.
 for(const item of report){
  assert.equal(item.setupValid,true,'Referencia del golpe '+item.operation);
  if(item.issues.some(issue=>['holgura','penetracion'].includes(issue.kind))){
   assert.equal(item.enabled,true,'G'+item.operation+' debe prever retirada');
   assert.ok(item.retreatDistance>0,'G'+item.operation+' debe apartar el dedo');
   assert.equal(item.duringPhase,'retirado-durante-plegado');
   assert.equal(item.transitionAtClamping,'retroceso-antes-plegado');
  }
 }
 assert.ok(report.some(item=>item.enabled),'La Omega debe ejercer retirada preventiva');
});
