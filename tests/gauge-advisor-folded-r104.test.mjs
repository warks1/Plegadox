import test from 'node:test';
import assert from 'node:assert/strict';
import {EXAMPLE,normalized} from '../engine.js';
import {suggestGaugeContact} from '../gauge-contact-advisor.js';

const make=()=>normalized(EXAMPLE);
const toolCheck=()=>[{hasPenetration:false},{hasPenetration:false}];
const isFolded=part=>part.gaugeSegmentByBend[1]===2&&part.stopByBend[1]===1;

test('R104: búsqueda de apoyo descubre una pestaña preplegada solo tras descartar cantos',()=>{
 const p=make(),before=JSON.stringify(p);
 const report=suggestGaugeContact(p,5.1,{
  gaugeCheck:c=>({contactObserved:isFolded(c),
   possibleInterference:false,warnings:0,findings:[]}),
  toolCheck,
  setupCheck:c=>({valid:isFolded(c),foldedWingContact:isFolded(c)})
 });
 assert.equal(report.options.length,5);
 assert.ok(report.best);
 assert.equal(report.best.segment,2);
 assert.equal(report.best.stop,1);
 assert.equal(report.best.supportKind,'CARA_EXTERIOR_PREPLEGADA_2D');
 assert.equal(report.best.requiresPhysicalReview,true);
 assert.equal(JSON.stringify(p),before);
 assert.deepEqual(p.order,[0,1,3,2]);
});

test('R104: no explorar interiores si hay apoyo libre viable sin advertencias',()=>{
 const p=make();
 let called=0;
 const report=suggestGaugeContact(p,5.1,{
  gaugeCheck:c=>({contactObserved:c.gaugeSegmentByBend[1]===0&&
   c.stopByBend[1]===1,possibleInterference:false,warnings:0,findings:[]}),
  toolCheck,
  setupCheck:()=>{called++;throw Error('No debe buscar interiores');}
 });
 assert.equal(report.options.length,4);
 assert.equal(report.best.segment,0);
 assert.equal(report.best.stop,1);
 assert.equal(called,0);
});

test('R104: no recomendar un punto interior si el solver no ve cara exterior',()=>{
 const p=make();
 const report=suggestGaugeContact(p,5.1,{
  gaugeCheck:()=>({contactObserved:false,
   possibleInterference:false,warnings:0,findings:[]}),
  toolCheck,
  setupCheck:()=>({valid:false,foldedWingContact:false})
 });
 assert.equal(report.best,null);
 assert.equal(report.options.length,4);
});

test('R104: una pestaña con penetración de útil no se recomienda',()=>{
 const p=make();
 const report=suggestGaugeContact(p,5.1,{
  gaugeCheck:c=>({contactObserved:isFolded(c),
   possibleInterference:false,warnings:0,findings:[]}),
  toolCheck:c=>[{hasPenetration:isFolded(c)}],
  setupCheck:c=>({valid:isFolded(c),foldedWingContact:isFolded(c)})
 });
 assert.equal(report.best,null);
 assert.ok(report.options.find(o=>o.segment===2&&o.stop===1 &&
  o.toolPenetrations===1&&!o.plausible));
});

test('R104: una excepción al comprobar el interior no bloquea el botón de búsqueda',()=>{
 const p=make();
 const report=suggestGaugeContact(p,5.1,{
  gaugeCheck:()=>({contactObserved:false,
   possibleInterference:false,warnings:0,findings:[]}),
  toolCheck,
  setupCheck:()=>{throw Error('CAD provisional sin datos');}
 });
 assert.equal(report.best,null);
 assert.ok(report.options.some(o=>o.error==='CAD provisional sin datos'));
});
