import test from 'node:test';
import assert from 'node:assert/strict';
import {gaugeRiskStatus} from '../gauge-risk-status.js';
import {technicalScene} from '../technical-section.js';
import {gaugePlacement} from '../backgauge-placement.js';
import {EXAMPLE} from '../engine.js';

const valid={
 phase:'Aproximación',setupValid:true,freeEdge:true,sheetEdgeFound:true,
 sheetInFront:true,seat:{seated:true},contact:{usable:true},
 gaugeInterference:{warning:false,kind:'sin-interferencia-detectada'},
 gaugeDecision:{known:true,enabled:false,clearanceWarnings:0,penetrationCount:0}
};
test('R89: verde sólo con sección evaluada y apoyo frontal físicamente válido',()=>{
 assert.equal(gaugeRiskStatus(valid).level,'green');
 for(const broken of [
  {freeEdge:false},{sheetEdgeFound:false},{sheetInFront:false},
  {seat:{seated:false}},{contact:{usable:false}},
  {setupValid:false},{gaugeDecision:{...valid.gaugeDecision,needsSetupCorrection:true}}
 ]){
  const status=gaugeRiskStatus({...valid,...broken});
  assert.equal(status.level,'amber',JSON.stringify(broken));
  assert.match(status.message,/APOYO/);
 }
});
test('R89: datos de geometría desconocida nunca se pintan verdes',()=>{
 for(const collision of [
  {warning:false,kind:'sin-geometria'},
  {warning:false,kind:'sin-datos'},
  {warning:false},
  null
 ]){
  assert.equal(gaugeRiskStatus({...valid,gaugeInterference:collision}).level,'amber',
   JSON.stringify(collision));
 }
});
test('R89: rojo geométrico prevalece sobre apoyo incorrecto, sin hablar de inevitabilidad',()=>{
 const status=gaugeRiskStatus({...valid,freeEdge:false,
  gaugeInterference:{warning:true,kind:'penetracion'}});
 assert.equal(status.level,'red');
 assert.match(status.message,/PENETRACIÓN/);
});
test('R89: pérdida de contacto durante retorno no se confunde con preparación errónea',()=>{
 assert.equal(gaugeRiskStatus({...valid,phase:'Retorno',seat:{seated:false},
  sheetInFront:false}).level,'green');
});
test('R89: el estado de fase real del visor llega al evaluador',()=>{
 const scene=technicalScene(EXAMPLE,5+5*.30);
 const place=gaugePlacement(scene,1);
 assert.equal(place.phase,'Aproximación');
 assert.equal(place.setupValid,true);
 assert.equal(place.freeEdge,true);
 assert.equal(gaugeRiskStatus(place).level,'green');
 assert.equal(gaugeRiskStatus({...place,freeEdge:false}).level,'amber');
});
