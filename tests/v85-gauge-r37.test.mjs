import test from 'node:test';
import assert from 'node:assert/strict';
import {EXAMPLE,normalized} from '../engine.js';
import {technicalScene} from '../technical-section.js';
import {gaugePlacement} from '../backgauge-placement.js';
import {getV85,gaugeContactFeature} from '../machine-config.js';

test('diagnóstico de contacto omega en golpe 2 y 4 sin alterar pieza',()=>{
 const p=normalized(EXAMPLE),rows=[];
 for(let i=0;i<4;i++){
  const time=i*5+.5,s=technicalScene(p,time);
  const n=p.stopByBend[s.stage.activeBend];
  const q=gaugePlacement(s,n);
  rows.push({golpe:i+1,pliegue:s.stage.activeBend+1,
   reference:s.gaugeReference,contact:q.contact,nominal:q.point,
   edge:q.sheetEdgeFound,front:q.sheetInFront,seat:q.seat,
   engaged:q.contactEngaged,gaugeInterference:q.gaugeInterference,
   sheet:s.sheet,display:s.sheetDisplay});
 }
 console.log('GAUGE_DIAGNOSTIC_V85 '+JSON.stringify(rows));
 assert.equal(rows.length,4);
});
