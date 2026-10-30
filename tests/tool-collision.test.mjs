import test from 'node:test';
import assert from 'node:assert/strict';
import {EXAMPLE} from '../engine.js';
import {insidePolygon,inspectSheetAgainstPolygon,inspectToolContact,inspectSequenceTools} from '../tool-collision.js';
const point=(x,y)=>({x,y});
const block=[point(-4,8),point(4,8),point(4,0),point(-4,0)];
test('un punto dentro de un punzón es intrusión, uno fuera no',()=>{
 assert.equal(insidePolygon(point(0,4),block),true);
 assert.equal(insidePolygon(point(10,4),block),false);
});
test('una chapa atravesando el cuerpo del punzón genera aviso concreto',()=>{
 const line=[point(-12,4),point(12,4)];
 const conflicts=inspectSheetAgainstPolygon(line,block,2,'punch');
 assert.ok(conflicts.some(x=>x.category==='penetration' && x.kind==='punch'));
 assert.ok(conflicts.some(x=>Math.abs(x.point.x)<3));
});
test('separación suficiente de un punzón no genera falsa colisión',()=>{
 const line=[point(-12,-8),point(12,-8)];
 const conflicts=inspectSheetAgainstPolygon(line,block,2,'punch');
 assert.equal(conflicts.length,0);
});
test('una chapa atravesando la matriz se detecta también, independientemente del punzón',()=>{
 const line=[point(-12,3),point(12,3)];
 const conflicts=inspectSheetAgainstPolygon(line,block,2,'die');
 assert.ok(conflicts.some(x=>x.category==='penetration'&&x.kind==='die'));
});
test('la inspección de golpe no se declara como validación CAD',()=>{
 for(const instant of [0,2.7,7.7,12.7]){
  const result=inspectToolContact(EXAMPLE,instant);
  assert.equal(result.verified,false);
  assert.ok(result.checkedSamples>0);
  assert.ok(result.issues.every(x=>['punch','die'].includes(x.kind)));
 }
});
test('escanea las cuatro operaciones en el orden real 1,2,4,3',()=>{
 const result=inspectSequenceTools(EXAMPLE,4);
 assert.deepEqual(result.operations.map(x=>x.bend),[0,1,3,2]);
 assert.ok(result.operations.every(x=>x.samples===4&&x.verified===false));
});

test('detecta una penetración muy estrecha incluso en un ala de 10 metros',()=>{
 // El muestreo antiguo separa los puntos unos 100 mm y no ve x=45..47.
 const narrow=[point(45,-3),point(47,-3),point(47,3),point(45,3)];
 const sheet=[point(-5000,0),point(5000,0)];
 const conflicts=inspectSheetAgainstPolygon(sheet,narrow,2,'die');
 assert.ok(conflicts.some(hit=>hit.category==='penetration'&&
  hit.point.x>45&&hit.point.x<47), 'Detectar cruce entre muestras');
});
test('un roce tangencial no se clasifica como penetración de la fibra media',()=>{
 const narrow=[point(45,-3),point(47,-3),point(47,3),point(45,3)];
 const tangent=[point(-5000,3),point(5000,3)];
 const conflicts=inspectSheetAgainstPolygon(tangent,narrow,2,'die');
 assert.equal(conflicts.filter(hit=>hit.category==='penetration').length,0);
});
