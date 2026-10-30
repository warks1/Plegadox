import test from 'node:test';
import assert from 'node:assert/strict';
import {EXAMPLE,development} from '../engine.js';
import {flatBendLayout} from '../flat-layout.js';
const near=(a,b)=>assert.ok(Math.abs(a-b)<1e-8,a+' != '+b);
test('desarrollo exterior: se reparte media deducción BD alrededor del centro',()=>{
 const l=flatBendLayout(EXAMPLE),d=development(EXAMPLE),bd=d.perBend[0].bd;
 near(l.folds[0].position,50-bd/2);
 near(l.folds[1].position,100-bd-bd/2);
 near(l.length,d.length);
 assert.deepEqual(l.folds.map(x=>x.angle),[90,-90,-90,90]);
 assert.deepEqual(l.folds.map(x=>x.operation),[1,2,4,3]);
 assert.ok(l.folds.every(x=>x.position>0&&x.position<l.length));
 assert.equal(l.verified,false);
});
test('cotas sobre fibra neutra: se añade BA y media BA hasta centro',()=>{
 const piece={...EXAMPLE,datum:'neutral'},l=flatBendLayout(piece),ba=development(piece).perBend[0].ba;
 near(l.folds[0].position,50+ba/2);
 near(l.folds[1].position,100+ba+ba/2);
 near(l.length,development(piece).length);
});
test('rechaza pliegues fuera de desarrollo o solapados',()=>{
 assert.throws(()=>flatBendLayout({...EXAMPLE,flanges:[1,1,1,1,1],
  thickness:10,radius:100}),/Longitud desarrollada|Posiciones de pliegue/);
});
test('secuencia inversa no cambia orden espacial de las marcas',()=>{
 const p={...EXAMPLE,width:1800,order:[3,2,1,0],angles:[-30,45,-120,90]};
 const l=flatBendLayout(p);
 assert.equal(l.width,1800);
 assert.deepEqual(l.folds.map(x=>x.operation),[4,3,2,1]);
 assert.deepEqual(l.folds.map(x=>x.angle),[-30,45,-120,90]);
 assert.ok(l.folds.every((x,i)=>i===0||x.position>l.folds[i-1].position));
});
