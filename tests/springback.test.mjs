import test from 'node:test';
import assert from 'node:assert/strict';
import {EXAMPLE,normalized,stage} from '../engine.js';
import {technicalScene} from '../technical-section.js';
import {contactKinematics} from '../bend-contact.js';
const pts=[{x:-50,y:0},{x:0,y:0},{x:50,y:0}];
const run=(over,phase,press,angle=90)=>contactKinematics({points:pts,activeBend:0,
 angle,opening:16,dieDepth:8.3,thickness:2,phase,press,overbend:over});
test('sobredoblado: al final del golpe supera el programado y se relaja al retornar',()=>{
 const base=run(0,'Plegado',1),over=run(2,'Plegado',1);
 assert.ok(over.sagTarget>base.sagTarget);
 assert.equal(over.overbendApplied,2);
 assert.equal(run(2,'Plegado',.45).overbendApplied,0);
 assert.equal(run(2,'Retorno',0).overbendApplied,0);
 assert.equal(run(2,'Reposicionamiento',0).overbendApplied,0);
 assert.equal(run(2,'Pieza terminada',0).overbendApplied,0);
});
test('sin giro no hay sobredoblado',()=>{
 assert.equal(run(2,'Plegado',1,0).overbendApplied,0);
});
test('springback se normaliza y se puede desactivar por pieza',()=>{
 assert.equal(normalized(EXAMPLE).springback,true);
 assert.equal(normalized({...EXAMPLE,springback:false}).springback,false);
 const on=technicalScene(EXAMPLE,.62*5),off=technicalScene({...EXAMPLE,springback:false},.62*5);
 assert.ok(on.kinematics.overbendApplied>0);
 assert.equal(off.kinematics.overbendApplied,0);
});
test('inox sobredobla más que acero S235; el ángulo final programado no cambia',()=>{
 const inox=technicalScene({...EXAMPLE,material:'inox304'},.62*5).kinematics.overbendApplied;
 const acero=technicalScene({...EXAMPLE,material:'s235'},.62*5).kinematics.overbendApplied;
 assert.ok(inox>acero);
 const end=stage(EXAMPLE,20);
 assert.ok(end.fractions.every(f=>f===1));
 assert.equal(technicalScene(EXAMPLE,20).kinematics.overbendApplied,0);
});
