import test from 'node:test';
import assert from 'node:assert/strict';
import {gaugeRiskStatus} from '../gauge-risk-status.js';
import {gaugeStatusCardLayout} from '../machine-visual.js';
import {buildGaugeMotionDiagnostic} from '../gauge-motion-diagnostic.js';
import {selectMachine} from '../machine-selection.js';
import {EXAMPLE,normalized} from '../engine.js';

const base={
 phase:'Aproximación',setupValid:true,freeEdge:true,sheetEdgeFound:true,
 sheetInFront:true,seat:{seated:true},contact:{usable:true},
 gaugeInterference:{kind:'sin-interferencia-detectada',warning:false},
 gaugeDecision:{known:true,enabled:false,penetrationCount:0,clearanceWarnings:0}
};
const variant=(changes)=>({...base,...changes});
const check=(p,level,code,fragment,phase='retroceso-antes-plegado')=>{
 const risk=gaugeRiskStatus(p);
 assert.equal(risk.level,level);
 assert.equal(risk.code,code);
 const card=gaugeStatusCardLayout(390,245,190,160,1,
  risk.level,.4,phase,risk.forecast??null,risk.code??null);
 assert.match(card.subline,fragment);
 return card;
};

test('R99: naranja indica el problema real, no un movimiento que lo oculte',()=>{
 check(variant({setupValid:false}),'amber','apoyo-invalido',/APOYO NO VÁLIDO/);
 check(variant({gaugeInterference:{kind:'sin-geometria',warning:false}}),
  'amber','comprobacion-incompleta',/DATOS 2D INSUFICIENTES/);
 check(variant({gaugeInterference:{kind:'holgura',warning:true}}),
  'amber','holgura-actual',/HOLGURA ACTUAL/);
 check(variant({gaugeDecision:{...base.gaugeDecision,
  enabled:false,penetrationCount:2}}),'amber','retirada-no-fiable',
  /RETIRADA NO FIABLE/);
 check(variant({gaugeInterference:{kind:'penetracion',warning:true}}),
  'red','penetracion-actual',/PENETRACIÓN 2D/);
});
test('R99: verde conserva los avisos de retirada futura y giro sin falso choque',()=>{
 const p=variant({gaugeDecision:{...base.gaugeDecision,
  enabled:true,penetrationCount:3}});
 const risk=gaugeRiskStatus(p);
 assert.equal(risk.level,'green');
 assert.equal(risk.forecast,'retirada-prevista');
 const card=gaugeStatusCardLayout(390,245,190,160,1,risk.level,
  .4,null,risk.forecast,risk.code??null);
 assert.match(card.subline,/RETIRADA PREVISTA/);
});
test('R99: diagnóstico de Omega registra el código de la fase y el pronóstico',()=>{
 selectMachine('trumpf-v85');
 const piece=normalized({...EXAMPLE,flanges:[50,30,50,30,20],
  punch:'goose',die:'v16',stopByBend:[1,1,1,1],
  gaugeSideByBend:['auto','before','before','auto']});
 const original=JSON.stringify(piece);
 const data=buildGaugeMotionDiagnostic(piece,{samples:[.25,.60,.92]});
 const g2=data.operations[1];
 assert.equal(g2.frames[0].risk.level,'green');
 assert.equal(g2.frames[0].risk.forecast,'retirada-prevista');
 assert.equal(g2.frames[1].risk.level,'green');
 assert.equal(data.verified,false);
 assert.equal(JSON.stringify(piece),original);
});
