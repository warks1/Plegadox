import test from 'node:test';
import assert from 'node:assert/strict';
import {DIES,PUNCHES} from '../engine.js';
import {registerCatalogue,CATALOG_SOURCES} from '../catalog.js';
import {V85_FACTORY,normalizeV85,gaugeOutline,gaugeBounds,dimensionSeries} from '../machine-config.js';
import {sectionDie} from '../tool-profiles.js';
registerCatalogue(DIES,PUNCHES);

test('las 3 fotos Cybelec quedan transcritas sin alterar cotas',()=>{
 assert.equal(V85_FACTORY.ramWidth,2040);
 assert.equal(V85_FACTORY.holderWidth,2040);
 assert.equal(V85_FACTORY.ramOrigin,0);
 assert.equal(V85_FACTORY.holderOrigin,0);
 assert.deepEqual(V85_FACTORY.ram,[1340,28,2,25.4,20,30,125,20,39,28]);
 assert.deepEqual(V85_FACTORY.bed,[820,80,25.25,25.25,50,20,20]);
 assert.equal(V85_FACTORY.toolWorkingDistance,30);
 assert.deepEqual(V85_FACTORY.stop,[70,100,18,25,12,0]);
 assert.deepEqual(V85_FACTORY.support,[70,100,8,25,12,8]);
 assert.equal(V85_FACTORY.preferredDistance,80);
 for(const f of ['stopL6Max','stopL6Min','supportL6Max','supportL6Min','stopOx','stopOz','supportOx','supportOz'])
  assert.equal(V85_FACTORY[f],0);
});
test('las cotas personalizadas se guardan separadas sin modificar los valores originales',()=>{
 const changed=normalizeV85({...V85_FACTORY,ramWidth:1980,
  stop:[70,100,22,25,12,0],support:[70,100,9,25,12,8]});
 assert.equal(changed.ramWidth,1980);
 assert.equal(changed.stop[2],22);
 assert.equal(V85_FACTORY.stop[2],18);
 assert.equal(changed.support[2],9);
});
test('rechaza medidas inválidas y conserva defaults',()=>{
 const cfg=normalizeV85({ram:['no',null,Infinity,-30]});
 assert.equal(cfg.ram[0],1340);
 assert.equal(cfg.ram[1],28);
 assert.equal(cfg.ram[2],2);
 assert.equal(cfg.ram[3],0);
});
test('Stop y Support usan perfiles esquemáticos diferentes',()=>{
 const stop=gaugeOutline(V85_FACTORY.stop),support=gaugeOutline(V85_FACTORY.support,2);
 assert.notDeepEqual(stop,support);
 assert.ok(stop.every(p=>Number.isFinite(p.x)&&Number.isFinite(p.y)));
 assert.equal(Math.max(...stop.map(p=>p.x)),100);
 assert.equal(Math.max(...support.map(p=>p.x)),100);
});
test('V16 / 30 figura como matriz real y genérica y mantiene amarre distinto',()=>{
 const verified=DIES.find(d=>d.id==='rolleri-tmr100-16-30');
 const generic=DIES.find(d=>d.id==='v16-30');
 assert.ok(verified);
 assert.equal(verified.manufacturer,'Rolleri');
 assert.equal(verified.opening,16);
 assert.equal(verified.angle,30);
 assert.equal(verified.height,120);
 assert.equal(verified.workingHeight,100);
 assert.equal(verified.shoulderRadius,1.6);
 assert.equal(verified.mount,'Rolleri R2/R3');
 assert.equal(verified.profileAccuracy,'provisional');
 assert.match(CATALOG_SOURCES[verified.source].url,/rolleri\.es/);
 assert.equal(generic.opening,16);
 assert.equal(generic.angle,30);
 assert.equal(generic.verifiedSpecs,false);
 assert.ok(sectionDie(generic).depth>sectionDie({opening:16,angle:88}).depth);
});
test('lista técnica conserva los cuatro grupos de cotas',()=>{
 const groups=dimensionSeries(V85_FACTORY);
 assert.deepEqual(groups.map(g=>g.values.length),[10,7,6,6]);
 assert.equal(groups[3].values.at(-1).value,8);
});

test('la envolvente del dibujo Stop respeta L1>L2 y L3>L4 editados',()=>{
 const modified=[180,100,40,25,12,0],bounds=gaugeBounds(modified);
 assert.equal(bounds.minX,0);
 assert.equal(bounds.maxX,180);
 assert.equal(bounds.minY,-40);
 assert.equal(bounds.maxY,0);
 assert.equal(bounds.width,180);
 assert.equal(bounds.height,40);
 const original=gaugeBounds(V85_FACTORY.stop);
 assert.equal(original.width,100);
 assert.equal(original.height,25);
});
