import test from 'node:test';
import assert from 'node:assert/strict';
import {development,EXAMPLE,profile,stage} from '../engine.js';
import {CYBELEC_OMEGA,cybelecReferencePreset,compareCybelecOmega,equivalentKForCybelec} from '../cybelec-reference.js';

test('fotografías Cybelec: geometría de cuatro pliegues +90 -90 -90 +90',()=>{
 assert.deepEqual([...CYBELEC_OMEGA.flanges],[50,50,50,50,50]);
 assert.deepEqual([...CYBELEC_OMEGA.angles],[90,-90,-90,90]);
 assert.equal(CYBELEC_OMEGA.referenceDIN,233.94);
 assert.equal(CYBELEC_OMEGA.photographedRadius,2.63);
 const shape=profile(cybelecReferencePreset(),[1,1,1,1]);
 assert.deepEqual(shape.directions.map(x=>Math.round(x*180/Math.PI)),[0,90,0,-90,0]);
});

test('el ejemplo anterior no representa las herramientas V16/30 de las fotos',()=>{
 const c=compareCybelecOmega(EXAMPLE);
 assert.equal(c.sameGeometry,true);
 assert.equal(c.compatibleDie,false,'por defecto se empleaba V16/88');
 assert.ok(Math.abs(development(EXAMPLE).length-234.12884780754905)<.0001);
});

test('preset fotografiado: DIN nominal reproducido solo con K equivalente explícito',()=>{
 const p=cybelecReferencePreset(),c=compareCybelecOmega(p);
 assert.equal(p.die,'v16-30');
 assert.equal(p.punch,'straight30');
 assert.equal(p.radius,2.63);
 assert.ok(equivalentKForCybelec()>.35&&equivalentKForCybelec()<.36);
 assert.equal(c.comparable,true);
 assert.ok(Math.abs(c.delta)<1e-9,'el modelo reproduce el número DIN con parámetro equivalente');
 assert.equal(p.datum,'outside');
 assert.deepEqual(p.order,[0,1,3,2]);
 assert.deepEqual(c.executionOrder.map(x=>x.bend),[1,2,4,3]);
 assert.equal(stage(p,15.1).activeBend,2);
});

test('DIN no depende de secuencia temporal; referencia no se aplica a otra pieza',()=>{
 const p=cybelecReferencePreset(),reordered={...p,order:[0,1,2,3]};
 assert.equal(development(p).length,development(reordered).length);
 assert.equal(compareCybelecOmega({...p,flanges:[50,50,49,50,50]}).comparable,false);
});
