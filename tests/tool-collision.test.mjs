import test from 'node:test';
import assert from 'node:assert/strict';
import {EXAMPLE} from '../engine.js';
import {segmentNearestPoints,insidePolygon,inspectSheetAgainstPolygon,inspectToolContact,inspectSequenceTools,describeToolIssue,consolidateToolIssues} from '../tool-collision.js';
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

test('detecta roce de espesor entre puntos de muestreo aunque la fibra no cruce el útil',()=>{
 const tool=[point(45,-3),point(47,-3),point(47,3),point(45,3)];
 const sheet=[point(-5000,4),point(5000,4)];
 const hits=inspectSheetAgainstPolygon(sheet,tool,3,'die');
 assert.ok(hits.some(x=>x.category==='clearance'&&
  x.point.x>=45&&x.point.x<=47), 'Avisar de la envolvente de chapa: d=1 mm < 1,5 mm');
 assert.equal(hits.filter(x=>x.category==='penetration').length,0,
  'Fibra central fuera del cuerpo; no inventar una penetración de línea central');
});
test('no avisa al superar la holgura nominal con el mismo útil',()=>{
 const tool=[point(45,-3),point(47,-3),point(47,3),point(45,3)];
 const sheet=[point(-5000,8),point(5000,8)];
 assert.equal(inspectSheetAgainstPolygon(sheet,tool,3,'die').length,0);
});
test('contacto de apoyo a medio espesor en Y=0 de una matriz no genera falsa alarma',()=>{
 const tool=[point(-30,0),point(-8,0),point(0,-8),
             point(8,0),point(30,0),point(30,-50),point(-30,-50)];
 const sheet=[point(-100,1),point(-10,1)];
 const hits=inspectSheetAgainstPolygon(sheet,tool,2,'die');
 assert.equal(hits.length,0);
});

test('el aviso diferencia holgura por espesor y penetración de la fibra',()=>{
 const clearance=describeToolIssue({kind:'die',category:'clearance',segment:2});
 assert.match(clearance,/HOLGURA INSUFICIENTE/);
 assert.match(clearance,/MATRIZ/);
 assert.match(clearance,/tramo 3/);
 assert.doesNotMatch(clearance,/PENETRACIÓN 2D/);
 const penetration=describeToolIssue({kind:'punch',category:'penetration',segment:0});
 assert.match(penetration,/PENETRACIÓN 2D/);
 assert.match(penetration,/PUNZÓN/);
 assert.match(describeToolIssue(null),/NO está verificada/);
});

test('la secuencia prioriza penetraciones y diferencia los avisos de holgura',()=>{
 const result=inspectSequenceTools(EXAMPLE,4);
 assert.equal(result.warningCount,result.operations.filter(x=>x.possibleToolInterference).length);
 assert.equal(result.intrusionCount,result.operations.filter(x=>x.possibleToolIntrusion).length);
 for(const op of result.operations){
  assert.equal(op.possibleToolInterference,Boolean(op.example));
  if(op.example?.category==='penetration')assert.equal(op.possibleToolIntrusion,true);
  assert.equal(op.verified,false);
 }
});

test('una penetración leve no puede ser ocultada por una holgura más profunda del mismo tramo',()=>{
 const entries=[
  {kind:'die',category:'clearance',segment:3,depth:9,point:point(2,4)},
  {kind:'die',category:'penetration',segment:3,depth:.25,point:point(2,3)},
  {kind:'die',category:'clearance',segment:1,depth:12,point:point(1,1)},
  {kind:'punch',category:'penetration',segment:2,depth:.12,point:point(3,1)}
 ];
 const chosen=consolidateToolIssues(entries);
 assert.equal(chosen.length,3,'Se conserva una incidencia por útil y tramo');
 assert.equal(chosen[0].category,'penetration');
 assert.equal(chosen[1].category,'penetration');
 assert.equal(chosen[2].category,'clearance');
 assert.equal(chosen.find(x=>x.kind==='die'&&x.segment===3).depth,.25);
 assert.deepEqual(consolidateToolIssues([...entries].reverse()),chosen,
  'El diagnóstico no debe cambiar por el orden de los muestreos');
});
test('para una categoría idéntica se muestra el caso con mayor profundidad',()=>{
 const out=consolidateToolIssues([
  {kind:'punch',segment:0,category:'penetration',depth:.1},
  {kind:'punch',segment:0,category:'penetration',depth:.8},
  {kind:'punch',segment:1,category:'clearance',depth:.4}
 ]);
 assert.equal(out[0].depth,.8);
 assert.equal(out[1].segment,1);
});

test('distancia exacta 0 cuando las ARISTAS se cruzan por su interior',()=>{
 const near=segmentNearestPoints({x:-50,y:0},{x:50,y:0},
  {x:0,y:-50},{x:0,y:50});
 assert.equal(near.dist,0);
 assert.ok(Math.abs(near.sheet.x)<1e-9&&Math.abs(near.sheet.y)<1e-9);
 assert.deepEqual(near.sheet,near.tool);
});
test('cruce interior oblicuo entre útiles largos no depende de extremos cercanos',()=>{
 const near=segmentNearestPoints({x:-100,y:-100},{x:100,y:100},
  {x:-100,y:100},{x:100,y:-100});
 assert.equal(near.dist,0);
 assert.ok(Math.abs(near.sheet.x)<1e-9&&Math.abs(near.sheet.y)<1e-9);
});
test('aristas paralelas y separadas devuelven distancia mínima física',()=>{
 const near=segmentNearestPoints({x:0,y:0},{x:20,y:0},
  {x:8,y:3},{x:15,y:3});
 assert.ok(Math.abs(near.dist-3)<1e-9);
 assert.ok(Math.abs(near.sheet.y)<1e-9);
 assert.ok(Math.abs(near.tool.y-3)<1e-9);
});
test('los tramos colineales superpuestos siguen teniendo distancia cero',()=>{
 const near=segmentNearestPoints({x:0,y:0},{x:20,y:0},
  {x:10,y:0},{x:30,y:0});
 assert.equal(near.dist,0);
});
