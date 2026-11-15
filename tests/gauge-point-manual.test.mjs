import test from 'node:test';
import assert from 'node:assert/strict';
import {normalized,gaugeReference,gaugePointOnProfile,profile} from '../engine.js';

test('punto manual se conserva para cada pliegue y no cambia su lado',()=>{
 const p=normalized({name:'Pieza',flanges:[50,100,50],angles:[90,-90],
  gaugeSideByBend:['after','before'],gaugePointByBend:[35,20]});
 const g1=gaugeReference(p,0),g2=gaugeReference(p,1);
 assert.equal(g1.side,'after');assert.equal(g1.distance,35);
 assert.equal(g1.totalLength,100);assert.equal(g1.freeEdge,false);
 assert.equal(g2.side,'before');assert.equal(g2.distance,20);
 assert.equal(g2.totalLength,100);assert.equal(g2.freeEdge,false);
 const points=profile(p,[0,0]).points;
 assert.equal(gaugePointOnProfile(points,g1).x,85);
 assert.equal(gaugePointOnProfile(points,g2).x,130);
});

test('sin cota manual el extremo se conserva sin desplazar dibujos ni orden',()=>{
 const p=normalized({flanges:[50,100,50],angles:[90,90],
  order:[1,0],gaugeSideByBend:['before','after']});
 const g1=gaugeReference(p,0),g2=gaugeReference(p,1);
 assert.deepEqual(p.order,[1,0]);
 assert.deepEqual(p.gaugePointByBend,[null,null]);
 assert.equal(g1.distance,50);assert.equal(g1.freeEdge,true);
 assert.equal(g2.distance,50);assert.equal(g2.freeEdge,true);
});

test('la cota se limita al ala y los datos mal formados no la activan',()=>{
 const p=normalized({flanges:[20,40],angles:[90],gaugeSideByBend:['after'],
  gaugePointByBend:[300]});
 assert.equal(gaugeReference(p,0).distance,40);
 assert.equal(gaugeReference(p,0).atEnd,true);
 const invalid=normalized({...p,gaugePointByBend:['incorrecto']});
 assert.equal(gaugeReference(invalid,0).manual,false);
});

test('una referencia interior no se declara extremo libre',()=>{
 const p=normalized({flanges:[50,50],angles:[90],
  gaugeSideByBend:['after'],gaugePointByBend:[25]});
 const g=gaugeReference(p,0);
 assert.equal(g.freeEdge,false);
 assert.equal(gaugePointOnProfile(profile(p).points,g).x,75);
});
