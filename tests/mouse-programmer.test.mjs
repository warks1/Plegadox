import test from 'node:test';
import assert from 'node:assert/strict';
import {flangeLengthFromMouseDrag} from '../mouse-programmer.js';

test('ratón arrastra un ala horizontal en su dirección real',()=>{
 const a=flangeLengthFromMouseDrag({originalLength:100,deltaX:36,deltaY:5,
  segmentX:100,segmentY:0,scale:2,zoom:1});
 assert.equal(a,118);
});
test('el desplazamiento perpendicular NO cambia la longitud del ala',()=>{
 assert.equal(flangeLengthFromMouseDrag({originalLength:80,deltaX:45,deltaY:0,
  segmentX:0,segmentY:-80,scale:2,zoom:1}),80);
 assert.equal(flangeLengthFromMouseDrag({originalLength:80,deltaX:0,deltaY:-40,
  segmentX:0,segmentY:-80,scale:2,zoom:1}),100);
});
test('el mismo movimiento con zoom 2 equivale a la mitad de milímetros',()=>{
 const args={originalLength:100,deltaX:40,deltaY:0,segmentX:100,
  segmentY:0,scale:2};
 assert.equal(flangeLengthFromMouseDrag({...args,zoom:1}),120);
 assert.equal(flangeLengthFromMouseDrag({...args,zoom:2}),110);
});
test('el ratón no puede introducir alas negativas o por encima del máximo',()=>{
 const p={originalLength:5,deltaX:-5000,deltaY:0,segmentX:10,segmentY:0,
  scale:1,zoom:1};
 assert.equal(flangeLengthFromMouseDrag(p),1);
 assert.equal(flangeLengthFromMouseDrag({...p,deltaX:500000}),10000);
});
test('una geometría de arrastre incorrecta se rechaza',()=>{
 for(const args of [{originalLength:20,deltaX:2,deltaY:0,segmentX:0,segmentY:0,scale:2},
  {originalLength:20,deltaX:NaN,deltaY:0,segmentX:12,segmentY:2,scale:1},
  {originalLength:20,deltaX:0,deltaY:0,segmentX:12,segmentY:2,scale:0}]){
  assert.throws(()=>flangeLengthFromMouseDrag(args));
 }
});
