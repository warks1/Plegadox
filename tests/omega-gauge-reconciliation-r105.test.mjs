import test from 'node:test';
import assert from 'node:assert/strict';
import {EXAMPLE,normalized} from '../engine.js';
import {technicalScene} from '../technical-section.js';
import {gaugePlacement} from '../backgauge-placement.js';
import {gaugeRiskStatus} from '../gauge-risk-status.js';
import {buildGaugeMotionDiagnostic} from '../gauge-motion-diagnostic.js';

const piece=normalized(EXAMPLE);
const samples=[.20,.35,.38,.48,.68,.90];

test('R105: en Omega cada golpe conserva el contacto hasta sujeción sin retirada',()=>{
 const bends=[0,1,3,2];
 assert.deepEqual(piece.order,bends);
 for(let op=0;op<4;op++){
  const prep=technicalScene(piece,5*(op+.35));
  const hold=technicalScene(piece,5*(op+.38));
  assert.equal(hold.stage.activeBend,bends[op]);
  const stop=piece.stopByBend[bends[op]];
  const p0=gaugePlacement(prep,stop),p1=gaugePlacement(hold,stop);
  assert.equal(p0.contactEngaged,true,'Sin apoyo inicial G'+(op+1));
  if(hold.gaugeTransition===null){
   assert.equal(p1.contactEngaged,true,
    'Pérdida de contacto sin retroceso G'+(op+1));
   assert.equal(gaugeRiskStatus(p1).level,'green',
    'Aviso erróneo de colisión o apoyo en sujeción G'+(op+1));
  }
  assert.deepEqual(prep.gaugeAnchor,hold.gaugeAnchor,
   'Coordenada X/R modificada sin desplazamiento G'+(op+1));
  assert.equal(p1.point.x,hold.gaugeAnchor.x);
  assert.equal(p1.point.y,hold.gaugeAnchor.y);
  assert.equal(p1.contact.point.x,p1.point.x);
  assert.equal(p1.verified,false);
 }
});

test('R105: la referencia del siguiente golpe coincide con el fin del cambio de cota',()=>{
 for(let op=0;op<3;op++){
  const end=technicalScene(piece,5*(op+.995));
  const next=technicalScene(piece,5*(op+1+.05));
  const motion=end.gaugeTransition;
  if(!motion?.to)continue;
  assert.ok(Math.hypot(motion.point.x-next.gaugeAnchor.x,
   motion.point.y-next.gaugeAnchor.y)<1e-4,
   'El tope salta entre golpes G'+(op+1)+' y G'+(op+2));
  assert.deepEqual(motion.to,next.gaugeAnchor);
 }
});

test('R105: informe JSON y visor de sección comparten referencias y colores',()=>{
 const report=buildGaugeMotionDiagnostic(piece,{build:'QA-R105',samples});
 assert.equal(report.operations.length,4);
 assert.deepEqual(report.operationOrder,[1,2,4,3]);
 assert.equal(report.samplesPerOperation,samples.length);
 assert.equal(report.verified,false);
 for(const [op,operation] of report.operations.entries()){
  for(const [i,sub] of samples.entries()){
   const scene=technicalScene(piece,5*(op+sub));
   const placement=gaugePlacement(scene,operation.stopNumber);
   const risk=gaugeRiskStatus(placement);
   const frame=operation.frames[i];
   assert.deepEqual(frame.finger,placement.point,
    'Coordenadas distintas entre visor e informe');
   assert.equal(frame.risk.level,risk.level);
   assert.equal(frame.risk.code,risk.code??null);
   assert.equal(frame.contact.engaged,placement.contactEngaged);
   assert.equal(frame.reference.segmentIndex,scene.gaugeReference.segmentIndex);
   assert.equal(frame.setup.autoSelected,scene.gaugeSetup.autoSelected===true);
  }
 }
});

test('R105: avisos de holgura no se transforman en penetración de chapa/tope',()=>{
 for(const op of [0,2]){
  const scene=technicalScene(piece,5*(op+.48));
  const placement=gaugePlacement(scene,piece.stopByBend[scene.stage.activeBend]);
  if(placement.gaugeInterference?.kind==='holgura'){
   const status=gaugeRiskStatus(placement);
   assert.equal(status.level,'amber');
   assert.equal(status.code,'holgura-actual');
  }
 }
});
