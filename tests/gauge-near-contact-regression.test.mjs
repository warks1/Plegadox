import test from 'node:test';
import assert from 'node:assert/strict';
import {inspectGaugeProfile} from '../gauge-interference.js';

const gauge=[
 {x:10,y:-5},{x:40,y:-5},
 {x:40,y:5},{x:10,y:5}
];
const contact={x:10,y:0};

test('contacto real en la cara nominal del tope sigue siendo admisible',()=>{
 const hit=inspectGaugeProfile([{x:0,y:0},{x:10,y:0}],gauge,2,contact);
 assert.equal(hit.warning,false);
});

test('penetración de sólo 0,4 mm no se oculta por estar cerca del apoyo',()=>{
 const hit=inspectGaugeProfile([{x:0,y:0},{x:10.4,y:0}],gauge,2,contact);
 assert.equal(hit.warning,true);
 assert.equal(hit.kind,'penetracion');
 assert.ok(hit.point.x>10&&hit.point.x<10.4);
});

test('penetración somera repetida con más espesor sigue señalándose',()=>{
 const hit=inspectGaugeProfile([{x:0,y:0},{x:10.8,y:0}],gauge,6,contact);
 assert.equal(hit.warning,true);
 assert.equal(hit.kind,'penetracion');
});

test('el contacto en un vértice sin entrar en el sólido no es penetración',()=>{
 const hit=inspectGaugeProfile([{x:0,y:0},{x:10,y:0}],gauge,6,contact);
 assert.notEqual(hit.kind,'penetracion');
});
