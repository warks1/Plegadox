import test from 'node:test';
import assert from 'node:assert/strict';
import {EXAMPLE,normalized,stage} from '../engine.js';
import {technicalScene} from '../technical-section.js';
import {gaugePlacement,gaugeContourAtContact} from '../backgauge-placement.js';
import {gaugeContactFeature,V85_FACTORY} from '../machine-config.js';
import {predictGaugeRetract,previewGaugeRetractState,adjustStageForPinch,
 PINCH_FRACTION,GAUGE_OUT_FRACTION} from '../gauge-retract-planner.js';

test('TrumaBend V85: STOP 1 y SUPPORT 2 presentan por defecto CARA DELANTERA',()=>{
 for(const [num,values] of [[1,V85_FACTORY.stop],[2,V85_FACTORY.support]]){
  const f=gaugeContactFeature(values,num);
  assert.equal(f.surface,'vertical-front');
  assert.equal(f.mode,'front');
  assert.equal(f.point.x,0);
  const outline=V85_FACTORY.support;
  assert.equal(f.from.x,f.to.x);
 }
 const shelf=gaugeContactFeature(V85_FACTORY.support,2,'shelf');
 assert.equal(shelf.surface,'horizontal-top');
 assert.equal(shelf.mode,'shelf');
});
test('R37: apoyo frontal de Support 2 mantiene todo el dedo DETRÁS del canto',()=>{
 const p=normalized({...EXAMPLE,stopByBend:[2,2,2,2]});
 assert.ok(p.gaugeContactByBend.every(v=>v==='front'));
 const scene=technicalScene(p,0.3);
 const place=gaugePlacement(scene,2);
 assert.equal(place.contactMode,'front');
 assert.equal(place.contact.surface,'vertical-front');
 const polygon=gaugeContourAtContact(place,V85_FACTORY.support);
 assert.ok(polygon.every(q=>q.x>=place.point.x-1e-8),
  'Ningún escalón bajo la chapa cuando el operario pidió contacto frontal');
 assert.equal(place.contact.point.x,place.point.x);
});
test('R37: el apoyo SUPERIOR solamente se activa en el pliegue solicitado',()=>{
 const p=normalized({...EXAMPLE,gaugeContactByBend:['front','shelf','front','front']});
 assert.equal(gaugePlacement(technicalScene(p,5.3),1).contactMode,'shelf');
 assert.equal(gaugePlacement(technicalScene(p,0.3),1).contactMode,'front');
 const shelf=gaugePlacement(technicalScene(p,5.3),2);
 const front=gaugePlacement(technicalScene(p,0.3),2);
 assert.equal(shelf.contact.surface,'horizontal-top');
 assert.equal(front.contact.surface,'vertical-front');
 assert.ok(gaugeContourAtContact(shelf,V85_FACTORY.support).some(q=>q.x<shelf.point.x));
});
test('R37: riesgo geométrico desencadena DX sin saltos; primero sujetar, después plegar',()=>{
 const p=normalized({...EXAMPLE,stopByBend:[2,2,2,2]});
 const operation=1,bend=p.order[operation];
 const mock=time=>({
  stage:{phase:'Plegado',activeOperation:operation,activeBend:bend},
  piece:p,die:{opening:16},
  gaugeReference:{sourceIndex:2,distance:50,side:'after'},
  gaugeAnchor:{x:60,y:1},
  sheet:[{x:0,y:1},{x:60,y:1},{x:60,y:1}],
  sheetDisplay:[{x:0,y:1},{x:60,y:1},{x:73,y:-12}]
 });
 const plan=predictGaugeRetract(p,operation,mock,{machine:V85_FACTORY});
 assert.equal(plan.required,true);
 assert.ok(plan.warningCount>0);
 assert.ok(plan.distanceMm>0);
 assert.equal(previewGaugeRetractState(plan,.2).dxMm,0);
 assert.equal(previewGaugeRetractState(plan,PINCH_FRACTION).dxMm,0);
 assert.equal(previewGaugeRetractState(plan,GAUGE_OUT_FRACTION).dxMm,plan.distanceMm);
 const before=adjustStageForPinch(stage(p,operation*5+PINCH_FRACTION*5),plan);
 assert.equal(before.fractions[bend],0);
 assert.equal(before.phase,'Sujeción · retirada X simulada');
 const after=adjustStageForPinch(stage(p,operation*5+.58*5),plan);
 assert.ok(after.fractions[bend]>0);
 assert.ok(after.fractions[bend]<1);
 assert.equal(after.phase,'Plegado tras retirada X');
 assert.equal(plan.canApproveForMachine,false);
});
test('R37: Omega de muestra mantiene el orden 1,2,4,3 y permite comprobar cada golpe',()=>{
 const p=normalized(EXAMPLE);
 assert.deepEqual(p.order,[0,1,3,2]);
 for(let operation=0;operation<4;operation++){
  const scene=technicalScene(p,operation*5+.5);
  const place=gaugePlacement(scene,p.stopByBend[p.order[operation]]);
  assert.ok(place.contact);
  assert.equal(place.contactMode,'front');
  assert.equal(place.verified,false);
 }
});
