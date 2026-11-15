import test from 'node:test';
import assert from 'node:assert/strict';
import {gaugeRetractionPath} from '../gauge-retract-motion.js';
import {normalized,stage} from '../engine.js';
const props={anchor:{x:55,y:1},target:{x:80,y:1},
 maxSheetX:125,fingerReach:45,opening:16};
const run=sub=>gaugeRetractionPath({...props,sub});
test('el dedo aguanta la cota antes de sujetar y se retira antes de deformar',()=>{
 assert.equal(run(.30),null);
 const start=run(.36),half=run(.40),park=run(.44);
 assert.equal(start.point.x,props.anchor.x);
 assert.equal(start.phase,'retroceso-antes-plegado');
 assert.ok(half.point.x>start.point.x,'el dedo inicia retroceso');
 assert.ok(park.point.x>half.point.x,'el dedo se aparta');
 assert.ok(park.point.x>props.maxSheetX+props.fingerReach,'queda fuera de la proyección nominal');
 const p=normalized({flanges:[50,50,50],angles:[90,-90]});
 const held=stage(p,5*.40),bent=stage(p,5*.55);
 assert.equal(held.fractions[0],0,'no se empieza a doblar durante el retroceso');
 assert.ok(bent.fractions[0]>0);
});
test('mantiene el tope retirado durante doblado y lo hace volver sin salto',()=>{
 const park=run(.44),during=run(.73),begin=run(.84),middle=run(.92),end=run(.99);
 assert.deepEqual(park.point,during.point);
 assert.deepEqual(during.point,begin.point);
 assert.ok(middle.point.x<begin.point.x);
 assert.deepEqual(end.point,props.target);
});
test('último pliegue conserva el tope aparcado durante retorno',()=>{
 const after=gaugeRetractionPath({...props,target:null,sub:.98});
 assert.equal(after.phase,'retirado-durante-plegado');
 assert.equal(after.withdrawn,true);
});
test('no presenta como CNC una trayectoria visual estimada',()=>{
 assert.equal(run(.55).verified,false);
 assert.ok(run(.55).plannedRetraction>0);
});
