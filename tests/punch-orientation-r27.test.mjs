import test from 'node:test';
import assert from 'node:assert/strict';
import {EXAMPLE,normalized} from '../engine.js';
import {technicalScene} from '../technical-section.js';
import {machineToolProjection} from '../machine-visual.js';
import {currentToolContact,inspectToolContact} from '../tool-collision.js';

const original={...EXAMPLE,punch:'ref-goose-50-100-r1',punchOrientation:'normal'};
const opposite={...original,punchOrientation:'reversed'};

test('orientación de montaje se normaliza sin tocar pliegues, cotas y signos',()=>{
 const a=normalized(original),b=normalized(opposite);
 assert.equal(a.punchOrientation,'normal');
 assert.equal(b.punchOrientation,'reversed');
 assert.deepEqual(a.angles,b.angles);
 assert.deepEqual(a.order,b.order);
 assert.deepEqual(a.flanges,b.flanges);
 assert.equal(normalized({...EXAMPLE,punchOrientation:'inventada'}).punchOrientation,'normal');
});

test('girar 180° refleja TODO el punzón asimétrico, no la chapa ni la matriz',()=>{
 for(const t of [0,2.2,6.1,13.1]){
  const a=technicalScene(original,t),b=technicalScene(opposite,t);
  assert.equal(a.punchPolygon.length,b.punchPolygon.length);
  for(let i=0;i<a.punchPolygon.length;i++){
   assert.ok(Math.abs(a.punchPolygon[i].x+b.punchPolygon[i].x)<1e-7,
    'x del vértice '+i+' debe invertirse a t='+t);
   assert.ok(Math.abs(a.punchPolygon[i].y-b.punchPolygon[i].y)<1e-7,
    'H del útil no cambia al invertir montaje');
  }
  assert.deepEqual(a.diePolygon,b.diePolygon,'La matriz no se invierte');
  assert.deepEqual(a.sheet,b.sheet,'La chapa conserva su pliegue firmado');
  assert.deepEqual(a.piece.angles,b.piece.angles);
  assert.deepEqual(machineToolProjection(b,0,0,1).punch,
   b.punchPolygon.map(p=>[p.x,-p.y]),'La máquina usa el útil invertido');
 }
});

test('cambio de orientación invalida el caché de avisos de colisión',()=>{
 const before=currentToolContact(original,2.4);
 const after=currentToolContact(opposite,2.4);
 assert.notStrictEqual(before,after);
 assert.deepEqual(after,inspectToolContact(opposite,2.4));
 assert.equal(after.verified,false);
});

test('el montaje invertido no convierte los perfiles de catálogo en CAD certificado',()=>{
 const a=technicalScene(opposite,2);
 assert.equal(a.verified,false);
 assert.equal(a.punch.provisional,true);
});
