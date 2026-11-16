import test from 'node:test';
import assert from 'node:assert/strict';
import {gaugeRiskStatus} from '../gauge-risk-status.js';
import {gaugeStatusCardLayout} from '../machine-visual.js';
import {technicalScene} from '../technical-section.js';
import {gaugePlacement} from '../backgauge-placement.js';
import {EXAMPLE,normalized} from '../engine.js';
import {selectMachine} from '../machine-selection.js';

const clean={phase:'Aproximación',setupValid:true,freeEdge:true,sheetEdgeFound:true,
 sheetInFront:true,seat:{seated:true},contact:{usable:true},
 gaugeInterference:{kind:'sin-interferencia-detectada',warning:false},
 gaugeDecision:{known:true,enabled:false,penetrationCount:0,clearanceWarnings:0}};

test('R98: pronóstico de retirada no implica una colisión naranja en la pose actual',()=>{
 const p={...clean,gaugeDecision:{...clean.gaugeDecision,
  enabled:true,penetrationCount:3,clearanceWarnings:2}};
 const risk=gaugeRiskStatus(p);
 assert.equal(risk.level,'green');
 assert.equal(risk.forecast,'retirada-prevista');
 assert.match(risk.message,/RETIRADA PREVISTA/);
 const card=gaugeStatusCardLayout(390,245,190,160,1,risk.level,.4,null,risk.forecast);
 assert.match(card.headline,/SIN CHOQUE 2D/);
 assert.match(card.subline,/RETIRADA PREVISTA/);
 assert.equal(gaugeRiskStatus({...p,gaugeDecision:{...p.gaugeDecision,enabled:false}}).level,'amber');
 assert.equal(gaugeRiskStatus({...clean,gaugeDecision:{...clean.gaugeDecision,clearanceWarnings:1}}).level,'green');
});
test('R98: colisión actual, falta de holgura o apoyo no fiable siguen alertando',()=>{
 assert.equal(gaugeRiskStatus({...clean,gaugeInterference:{kind:'penetracion',warning:true}}).level,'red');
 assert.equal(gaugeRiskStatus({...clean,gaugeInterference:{kind:'holgura',warning:true}}).level,'amber');
 assert.equal(gaugeRiskStatus({...clean,seat:{seated:false}}).level,'amber');
 assert.equal(gaugeRiskStatus({...clean,gaugeDecision:{...clean.gaugeDecision,withdrawalUnverified:true}}).level,'amber');
 assert.equal(gaugeRiskStatus({...clean,gaugeInterference:{kind:'sin-geometria',warning:false}}).level,'amber');
});
test('R98: Omega del proyecto sin falso naranja en apoyo y retirada',()=>{
 selectMachine('trumpf-v85');
 const p=normalized({...EXAMPLE,flanges:[50,30,50,30,20],punch:'goose',die:'v16',
  stopByBend:[1,1,1,1],gaugeSideByBend:['auto','before','before','auto']});
 const start=technicalScene(p,5+5*.25),fold=technicalScene(p,5+5*.60);
 assert.equal(start.gaugeSetup.valid,true);
 assert.equal(start.gaugePlan.enabled,true);
 const startPlace=gaugePlacement(start,1),foldPlace=gaugePlacement(fold,1);
 assert.equal(startPlace.gaugeInterference.warning,false);
 assert.equal(gaugeRiskStatus(startPlace).level,'green');
 assert.equal(gaugeRiskStatus(startPlace).forecast,'retirada-prevista');
 assert.equal(fold.gaugeTransition.phase,'retirado-durante-plegado');
 assert.equal(foldPlace.gaugeInterference.kind,'sin-interferencia-detectada');
 assert.equal(gaugeRiskStatus(foldPlace).level,'green');
});
