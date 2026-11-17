import test from 'node:test';
import assert from 'node:assert/strict';
import {development,EXAMPLE} from '../engine.js';
import {flatBendLayout} from '../flat-layout.js';
const near=(a,b)=>assert.ok(Math.abs(a-b)<1e-7,a+' != '+b);

test('R143: Omega válida mantiene el desarrollo y suma de segmentos',()=>{
 const d=development(EXAMPLE);
 assert.equal(d.flatPatternFeasible,true);
 assert.deepEqual(d.invalidFlangeIndexes,[]);
 near(d.flatSegments.reduce((x,y)=>x+y,0),d.length);
 near(flatBendLayout(EXAMPLE).length,d.length);
 assert.equal(d.verified,false);
});
test('R143: BD real imposible no exporta DXF',()=>{
 const p={...EXAMPLE,bendDeductionByBend:[200,null,null,null],datum:'outside'};
 const d=development(p);
 assert.equal(d.flatPatternFeasible,false);
 assert.ok(d.invalidFlangeIndexes.includes(0));
 assert.throws(()=>flatBendLayout(p),/Desarrollo no factible.*ala 1/);
});
test('R143: pliegue 179 grados y alas cortas no se exporta como plano',()=>{
 const p={...EXAMPLE,angles:[179,-90,-90,90]};
 assert.equal(development(p).flatPatternFeasible,false);
 assert.throws(()=>flatBendLayout(p),/Desarrollo no factible/);
});
test('R143: BD exterior no contamina BA de cotas neutras',()=>{
 const p={...EXAMPLE,datum:'neutral',bendDeductionByBend:[200,null,null,null]};
 const d=development(p);
 assert.equal(d.flatPatternFeasible,true);
 assert.equal(d.calibratedCount,0);
 near(d.flatSegments.reduce((x,y)=>x+y,0),d.length);
});
