import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {gaugeRiskStatus,GAUGE_COLORS} from '../gauge-risk-status.js';
import {EXAMPLE} from '../engine.js';
import {technicalScene} from '../technical-section.js';
import {gaugePlacement} from '../backgauge-placement.js';
const base={setupValid:true,geometryUnavailable:true,
 gaugeInterference:{warning:false,kind:'sin-interferencia-detectada'},
 gaugeDecision:{known:true,enabled:false,clearanceWarnings:0,penetrationCount:0}};
test('R83: verde sin interferencia 2D aun con CAD OEM pendiente',()=>{
 const status=gaugeRiskStatus(base);
 assert.equal(status.level,'green');assert.equal(status.verified,false);
 assert.match(status.message,/2D/);
});
test('R83: naranja por holgura, retirada, apoyo incorrecto o dato incompleto',()=>{
 for(const p of [
  {...base,gaugeInterference:{warning:true,kind:'holgura'}},
  {...base,setupValid:false},
  {...base,gaugeDecision:{known:true,enabled:true,penetrationCount:1}},
  {...base,gaugeDecision:{known:true,enabled:false,clearanceWarnings:1}},
  {...base,gaugeDecision:{known:false},gaugeInterference:{warning:false,kind:'sin-geometria'}}
 ])assert.equal(gaugeRiskStatus(p).level,'amber');
});
test('R83: rojo por penetración, nunca por una mera holgura o CAD pendiente',()=>{
 assert.equal(gaugeRiskStatus({...base,gaugeInterference:{warning:true,kind:'penetracion'}}).level,'red');
 assert.equal(gaugeRiskStatus({...base,gaugeInterference:{warning:true,kind:'holgura'}}).level,'amber');
 for(const c of ['green','amber','red'])assert.ok(GAUGE_COLORS[c].edge);
});
test('R83: vistas de máquina y sección comparten el mismo semáforo',()=>{
 for(const path of ['machine-visual.js','technical-section.js']){
  const s=readFileSync(new URL('../'+path,import.meta.url),'utf8');
  assert.match(s,/gaugeRiskStatus\(/);
  assert.match(s,/GAUGE_COLORS/);
 }
});
test('R83: G2 Omega libre verde, no confundir CAD con colisión',()=>{
 const scene=technicalScene(EXAMPLE,5+5*.30),pl=gaugePlacement(scene,1);
 assert.equal(pl.setupValid,true);
 assert.equal(pl.gaugeInterference.warning,false);
 assert.equal(scene.gaugePlan.enabled,false);
 assert.equal(gaugeRiskStatus({...pl,geometryUnavailable:true}).level,'green');
});
test('R83: punzón alto inmóvil durante todos los volteos y cambios de golpe',()=>{
 for(let op=0;op<EXAMPLE.order.length-1;op++){
  const at=sub=>technicalScene(EXAMPLE,op*5+5*sub).kinematics.tipHeight;
  const parked=[.84001,.85,.88,.90,.92,.94,.96,.98,.99999].map(at);
  assert.ok(parked.every(v=>Math.abs(v-parked[0])<1e-7),
   'G'+(op+1)+' el punzón oscila en volteo '+JSON.stringify(parked));
  assert.ok(Math.abs(at(.839999)-parked[0])<.01,
   'G'+(op+1)+' punzón salta al comenzar giro');
  const next=technicalScene(EXAMPLE,(op+1)*5).kinematics.tipHeight;
  assert.ok(Math.abs(next-parked[0])<.01,
   'G'+(op+1)+' punzón salta al comenzar golpe siguiente');
 }
});
test('R83: punzón sube en retorno y no vuelve a bajar antes del siguiente golpe',()=>{
 for(let op=0;op<EXAMPLE.order.length;op++){
  const at=sub=>technicalScene(EXAMPLE,op*5+5*sub).kinematics.tipHeight;
  let prev=at(.680001);
  for(const sub of [.7,.73,.76,.8,.83,.839999]){
   const current=at(sub);
   assert.ok(current>=prev-1e-6,'G'+(op+1)+' bajó durante Retorno');
   prev=current;
  }
 }
});
