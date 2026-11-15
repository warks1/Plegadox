import test from 'node:test';
import assert from 'node:assert/strict';
import {EXAMPLE,normalized,stage} from '../engine.js';
import {getActiveMachineConfig} from '../machine-config.js';
import {selectMachine} from '../machine-selection.js';
import {resolveGaugeSetup,foldedStopFaceCandidate} from '../gauge-contact-solver.js';
import {technicalScene} from '../technical-section.js';
import {gaugePlacement} from '../backgauge-placement.js';
import {gaugeRiskStatus} from '../gauge-risk-status.js';

test('R94: estudiar referencia G2 a cara de pestaña preplegada, sin cambiar datos del operario',()=>{
 selectMachine('trumpf-v85');
 const p=normalized({...EXAMPLE,flanges:[50,30,50,30,20],
  punch:'goose',die:'v16',gaugeSideByBend:['auto','before','auto','auto']});
 const snapshot=JSON.stringify(p);
 const st=stage(p,5.25),decision=resolveGaugeSetup(p,st,getActiveMachineConfig());
 const sc=technicalScene(p,5.25);
 const placement=gaugePlacement(sc,1);
 const result={manual:decision.manual,ref:decision.ref,valid:decision.valid,
  stopPlacement:{aligned:placement.alignedToSheet,contact:placement.contactEngaged,
   kind:placement.referenceKind,gap:placement.contactGap,
   interference:placement.gaugeInterference,seat:placement.seat,
   level:gaugeRiskStatus(placement).level},
  foldedWingContact:decision.foldedWingContact,
  candidate:decision.foldedWingCandidate,
  setupReason:decision.reason,interference:decision.interference,
  anchor:sc.gaugeAnchor,predictedPenetration:sc.gaugePlan.penetrationCount,
  withdrawal:sc.gaugePlan.enabled};
 console.log('R94_G2_FOLDED_WALL_CANDIDATE='+JSON.stringify(result));
 assert.equal(decision.manual,true);
 assert.equal(decision.ref.freeEdge,false);
 assert.equal(decision.ref.distance,30);
 assert.equal(JSON.stringify(p),snapshot);
 assert.equal(decision.foldedWingContact,true,
  'La pestaña anterior del escenario es un pliegue previo vertical');
 assert.equal(decision.valid,true,'La pared solapa la pestaña sin invasión inicial');
 assert.ok(decision.foldedWingCandidate.overlap>=2);
 assert.equal(placement.foldedWingContact,true);
 assert.equal(placement.setupValid,true);
 assert.equal(placement.verified,false,
  'No afirmar CAD real a partir de un contacto 2D');
});

test('R94: no clasificar un vértice NO plegado como apoyo lateral',()=>{
 const positions=[{x:30,y:-49},{x:30,y:1},{x:0,y:1}];
 const ref={sourceIndex:1,pivotIndex:2,freeEdge:false,atEnd:true};
 const feature={surface:'vertical-front',
  from:{x:0,y:-25},to:{x:0,y:-18},point:{x:0,y:-21.5}};
 assert.equal(foldedStopFaceCandidate(positions,ref,{fractions:[0,0]},feature,2,true),null);
 assert.equal(foldedStopFaceCandidate(positions,ref,{fractions:[1,0]},feature,2,false),null);
});

test('R94: auditar los cuatro golpes con referencias manuales del vídeo sin inventar apoyo',()=>{
 selectMachine('trumpf-v85');
 const p=normalized({...EXAMPLE,flanges:[50,30,50,30,20],
  punch:'goose',die:'v16',
  gaugeSideByBend:['auto','before','before','auto']});
 const snapshot=JSON.stringify(p),report=[];
 for(let operation=0;operation<4;operation++){
  const scene=technicalScene(p,5*(operation+.25));
  const place=gaugePlacement(scene,1);
  const bend=scene.stage.activeBend;
  report.push({G:operation+1,P:bend+1,
   side:scene.gaugeReference.side,ref:scene.gaugeReference.distance,
   manual:scene.gaugeSetup.manual,
   foldedWall:scene.gaugeSetup.foldedWingContact===true,
   support:scene.gaugeSetup.valid,
   reason:scene.gaugeSetup.reason,
   contact:place.contactEngaged,
   interference:place.gaugeInterference.kind,
   penetrationCount:scene.gaugePlan.penetrationCount,
   retreat:scene.gaugePlan.enabled,
   status:gaugeRiskStatus(place).level});
  if(scene.gaugeSetup.valid){
   assert.equal(scene.gaugeSetup.interference.warning,false);
   assert.equal(scene.gaugeSetup.verified,false);
  }
 }
 assert.deepEqual(report.map(x=>x.P),[1,2,4,3]);
 assert.equal(report[1].foldedWall,true);
 assert.equal(report[1].support,true);
 assert.equal(JSON.stringify(p),snapshot);
 console.log('R94_MANUAL_SEQUENCE_REPORT='+JSON.stringify(report));
});
