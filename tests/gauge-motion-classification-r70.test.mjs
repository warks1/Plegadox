import test from 'node:test';
import assert from 'node:assert/strict';
import {EXAMPLE} from '../engine.js';
import {inspectGaugeOperation,scanGaugeSequence} from '../gauge-sequence-review.js';

const sample=(piece,time)=>{
 const operation=Math.min(piece.order.length-1,Math.floor(time/5));
 const t=(time%5)/5,translate=t>.84&&t<.99;
 const collide=translate&&operation===1;
 return {
  scene:{stage:{activeOperation:operation,activeBend:piece.order[operation],
   phase:translate?'Retirada':'Posicionamiento'},
   gaugeTransition:translate?{
    phase:'regreso-a-siguiente-referencia',moving:true,withdrawn:true,
    point:{x:64,y:1}
   }:null},
  place:{stopNumber:piece.stopByBend[piece.order[operation]]||1,
   freeEdge:true,sheetInFront:true,seat:{seated:true},
   contactEngaged:!translate,
   geometryUnavailable:true,
   gaugeInterference:{warning:collide,
    kind:collide?'penetracion':'sin-interferencia-detectada',
    point:collide?{x:53,y:0}:null}}
 };
};
test('R70: si durante G2 el dedo atraviesa chapa, identificar específicamente el MOVIMIENTO',()=>{
 const result=inspectGaugeOperation(EXAMPLE,1,{samples:20,inspect:sample});
 assert.equal(result.operation,1);
 assert.equal(result.movementInterference,true);
 assert.ok(result.movementWarnings>=1);
 assert.equal(result.movementFindings[0].kind,'penetracion');
 assert.equal(result.movementFindings[0].movingFinger,true);
 assert.equal(result.movementFindings[0].motionPhase,'regreso-a-siguiente-referencia');
 assert.match(result.movementFindings[0].reason,/DURANTE movimiento del tope/);
 assert.ok(result.movementFirstTime>9.2&&result.movementFirstTime<10);
 assert.equal(result.verified,false);
});
test('R70: las otras operaciones no heredan advertencia de movimiento de G2',()=>{
 const result=scanGaugeSequence(EXAMPLE,{inspect:sample,samplesPerOperation:20});
 assert.equal(result.movementWarningCount,1);
 assert.ok(result.movementWarningSamples>0);
 assert.deepEqual(result.operations.map(x=>x.movementInterference),
  [false,true,false,false]);
 assert.equal(result.verified,false);
});
test('R70: choque estático no se disfraza de choque de traslado',()=>{
 const probe=(piece,time)=>{
  const state=sample(piece,time);
  state.scene.stage.phase='Posicionamiento';
  state.scene.gaugeTransition=null;
  state.place.gaugeInterference={warning:true,kind:'penetracion',point:{x:1,y:2}};
  return state;
 };
 const r=inspectGaugeOperation(EXAMPLE,0,{samples:8,inspect:probe});
 assert.equal(r.possibleInterference,true);
 assert.equal(r.movementInterference,false);
 assert.equal(r.movementWarnings,0);
 assert.equal(r.movementFindings.length,0);
 assert.ok(r.findings[0].reason.includes('penetración 2D chapa/tope'));
});
