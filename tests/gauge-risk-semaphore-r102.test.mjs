import test from 'node:test';
import assert from 'node:assert/strict';
import {gaugeRiskStatus} from '../gauge-risk-status.js';

const nominal=()=>({
 phase:'Posicionamiento',
 freeEdge:true,foldedWingContact:false,sheetEdgeFound:true,
 sheetInFront:true,seat:{seated:true},contact:{usable:true},
 setupValid:true,alignedToSheet:true,contactEngaged:true,
 geometryUnavailable:true, // Sin CAD certificado no supone colisión 2D
 gaugeDecision:{known:true,enabled:false,needsSetupCorrection:false,
  penetrationCount:0,clearanceWarnings:0,withdrawalUnverified:false},
 gaugeInterference:{kind:'sin-interferencia-detectada',warning:false}
});

test('R102: contacto nominal sin choque detectado: verde aunque falte CAD OEM',()=>{
 const status=gaugeRiskStatus(nominal());
 assert.equal(status.level,'green');
 assert.equal(status.verified,false);
});

test('R102: holgura por espesor es naranja sin falsificar ausencia de asiento',()=>{
 const placement={...nominal(),
  gaugeInterference:{kind:'holgura',warning:true}};
 const status=gaugeRiskStatus(placement);
 assert.equal(status.level,'amber');
 assert.equal(status.code,'holgura-actual');
 assert.equal(placement.contactEngaged,true);
 assert.equal(placement.setupValid,true);
});

test('R102: penetración sigue roja y apoyo inválido permanece naranja',()=>{
 assert.equal(gaugeRiskStatus({...nominal(),gaugeInterference:{
  kind:'penetracion',warning:true}}).level,'red');
 const invalid=gaugeRiskStatus({...nominal(),setupValid:false});
 assert.equal(invalid.level,'amber');
 assert.equal(invalid.code,'apoyo-invalido');
});

test('R102: detector sin resultado explícito no concede verde',()=>{
 const incomplete=gaugeRiskStatus({...nominal(),gaugeInterference:{
  kind:'sin-geometria',warning:false}});
 assert.equal(incomplete.level,'amber');
 assert.equal(incomplete.code,'comprobacion-incompleta');
});
