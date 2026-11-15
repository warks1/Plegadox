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
 // Un golpe final sin siguiente referencia no puede simular
 // un aparcamiento salvo que haya intrusión real durante el plegado.
 // La colisión de un ala ya plegada en el posicionamiento no es razón
 // para mandar retirar el dedo durante este nuevo golpe.
 assert.equal(report[3].retreatDistance,0,
  'G4: no retirar un dedo sin interferencia del ala activa');
});
