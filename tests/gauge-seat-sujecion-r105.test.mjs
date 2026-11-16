import test from 'node:test';
import assert from 'node:assert/strict';
import {EXAMPLE,normalized} from '../engine.js';
import {technicalScene} from '../technical-section.js';
import {gaugePlacement} from '../backgauge-placement.js';
import {gaugeRiskStatus} from '../gauge-risk-status.js';

test('R105: Omega 1-2-4-3 mantiene contacto durante sujeción sin retroceso',()=>{
 const piece=normalized(EXAMPLE);
 const original=JSON.stringify(piece);
 for(let operation=0;operation<4;operation++){
  const preparation=technicalScene(piece,5*(operation+.30));
  const hold=technicalScene(piece,5*(operation+.38));
  const stop=piece.stopByBend[hold.stage.activeBend];
  const before=gaugePlacement(preparation,stop);
  const during=gaugePlacement(hold,stop);
  assert.equal(hold.stage.phase,'Sujeción');
  assert.equal(before.stopNumber,during.stopNumber);
  assert.deepEqual(hold.gaugeAnchor,preparation.gaugeAnchor,
   'El tope no se mueve solo porque cambie la fase del ciclo');
  if(before.contactEngaged&&hold.gaugeTransition===null){
   assert.equal(during.contactEngaged,true,
    'Debe conservarse el contacto frontal hasta que haya retirada');
   assert.equal(gaugeRiskStatus(during).level,'green');
  }
 }
 assert.equal(JSON.stringify(piece),original,'No alterar datos de pieza');
});

test('R105: sujeción sin contacto ni retirada se advierte como apoyo pendiente',()=>{
 const a={phase:'Sujeción',freeEdge:true,sheetEdgeFound:true,
  sheetInFront:true,seat:{seated:true},contact:{usable:true},
  contactEngaged:false,setupValid:true,
  gaugeDecision:{known:true,enabled:false},
  gaugeInterference:{kind:'sin-interferencia-detectada',warning:false}};
 const risk=gaugeRiskStatus(a);
 assert.equal(risk.level,'amber');
 assert.equal(risk.code,'sin-contacto-actual');
});

test('R105: sujeción CON retirada no exige contacto frontal del dedo',()=>{
 const a={phase:'Sujeción',freeEdge:true,sheetEdgeFound:true,
  sheetInFront:true,seat:{seated:true},contact:{usable:true},
  contactEngaged:false,setupValid:true,
  gaugeTransition:{phase:'retroceso-antes-plegado',moving:true},
  gaugeDecision:{known:true,enabled:true},
  gaugeInterference:{kind:'sin-interferencia-detectada',warning:false}};
 const risk=gaugeRiskStatus(a);
 assert.equal(risk.level,'green');
 assert.equal(risk.code,undefined);
 assert.equal(risk.forecast,'retirada-prevista');
});
