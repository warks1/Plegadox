import test from 'node:test';
import assert from 'node:assert/strict';
import {gaugeReviewTargetTime} from '../gauge-sequence-review.js';

test('R71: saltar al instante de colisión del DEDO EN MOVIMIENTO si la hay',()=>{
 const op={operation:1,movementInterference:true,movementFirstTime:9.48,
  example:{time:5.2}};
 assert.equal(gaugeReviewTargetTime(op),9.48);
});
test('R71: si no hay choque durante movimiento conservar primer aviso habitual',()=>{
 assert.equal(gaugeReviewTargetTime({
  operation:2,movementInterference:false,example:{time:10.7}}),10.7);
});
test('R71: cuando no hay incidencia mostrar inicio del golpe con margen',()=>{
 assert.equal(gaugeReviewTargetTime({operation:3,example:null}),15.5);
 assert.throws(()=>gaugeReviewTargetTime({operation:-1}));
});
