import test from 'node:test';
import assert from 'node:assert/strict';
import {EXAMPLE,normalized} from '../engine.js';
import {contactKinematics} from '../bend-contact.js';
import {technicalScene} from '../technical-section.js';
import {gaugePlacement} from '../backgauge-placement.js';
import {inspectToolContact} from '../tool-collision.js';

const almost=(a,b,eps=1e-6)=>assert.ok(Math.abs(a-b)<=eps,a+' != '+b);
test('Ala anterior reflejada X: el plegado abre las dos alas SOBRE V, no una bajo punzón',()=>{
 const before=contactKinematics({points:[{x:50,y:0},{x:0,y:0},{x:0,y:50}],
  activeBend:0,angle:90,opening:16,dieDepth:9,thickness:2,phase:'Plegado',press:1,
  feedMirrored:true});
 const after=contactKinematics({points:[{x:-50,y:0},{x:0,y:0},{x:0,y:50}],
  activeBend:0,angle:90,opening:16,dieDepth:9,thickness:2,phase:'Plegado',press:1,
  feedMirrored:false});
 for(const m of [before,after]){
  assert.ok(m.sheet[0].y>m.sheet[1].y+30,'El ala anterior debe elevarse frente al punto de contacto');
  assert.ok(m.sheet[2].y>m.sheet[1].y+30,'El ala siguiente debe elevarse frente al punto de contacto');
  almost(m.tipHeight,m.sheet[1].y+1);
 }
 assert.ok(before.sheet[0].x>0&&before.sheet[2].x<0,'La chapa alimentada por ala anterior debe abrir hacia ambos lados');
 assert.ok(after.sheet[0].x<0&&after.sheet[2].x>0,'La chapa alimentada por ala siguiente debe abrir hacia ambos lados');
});
test('Omega 1-2-4-3: en cada golpe ambos tramos adyacentes quedan hacia los hombros de V',()=>{
 const p=normalized(EXAMPLE),original=structuredClone(p);
 for(let op=0;op<p.order.length;op++){
  const t=op*5+2.9,s=technicalScene(p,t);
  const bend=s.stage.activeBend,center=s.sheet[bend+1],left=s.sheet[bend],right=s.sheet[bend+2];
  assert.ok(left.y>center.y+4,'G'+(op+1)+': ala anterior atraviesa el punzón');
  assert.ok(right.y>center.y+4,'G'+(op+1)+': ala posterior atraviesa el punzón');
  almost(Math.min(...s.punchPolygon.map(pt=>pt.y)),center.y+p.thickness/2);
 }
 assert.deepEqual(p,original,'El cálculo no puede reescribir el programa');
});
test('Referencia del tope sigue fija 50 mm mientras chapa hace el primer pliegue',()=>{
 const p=normalized(EXAMPLE),start=gaugePlacement(technicalScene(p,.5),1);
 for(const t of [1.9,2.4,2.9,3.2]){
  const s=technicalScene(p,t),stop=gaugePlacement(s,1);
  assert.equal(stop.nominalDistance,50);
  assert.equal(stop.referenceSide,'before');
  assert.deepEqual(stop.point,start.point);
  assert.equal(s.feedMirrored,true);
 }
});
test('La alimentación por lado contrario conserva secuencia, signos y tipo Stop/Support',()=>{
 const p=normalized(EXAMPLE),prior=structuredClone(p);
 const a=technicalScene({...p,gaugeSideByBend:['before','before','before','after']},2.9);
 const b=technicalScene({...p,gaugeSideByBend:['after','before','before','after']},2.9);
 assert.equal(a.feedMirrored,true);
 assert.equal(b.feedMirrored,false);
 const lA=a.sheet[a.stage.activeBend],lB=b.sheet[b.stage.activeBend];
 assert.ok(lA.x>0&&lB.x<0);
 assert.deepEqual(p,prior);
 assert.deepEqual(p.order,[0,1,3,2]);
 assert.deepEqual(p.angles,[90,-90,-90,90]);
 const report=inspectToolContact(p,2.9);
 assert.equal(report.verified,false,'Advertencias ilustrativas, no certificación industrial');
});
