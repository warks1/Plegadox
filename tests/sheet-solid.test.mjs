import test from 'node:test';
import assert from 'node:assert/strict';
import {EXAMPLE} from '../engine.js';
import {viewerProfile} from '../viewer-profile.js';
import {sheetSolidMesh} from '../sheet-solid.js';
const close=(a,b)=>assert.ok(Math.abs(a-b)<1e-8, a+' != '+b);

test('chapa plana 500 mm por espesor 2, con seis caras cerradas',()=>{
 const s=sheetSolidMesh([{x:0,y:0},{x:150,y:0}],500,2);
 assert.equal(s.closed,true);assert.equal(s.verified,false);
 assert.equal(s.faces.length,6);
 assert.equal(s.segments,1);
 assert.deepEqual(s.faces.map(f=>f.kind),['upper','lower','front','back','start','end']);
 close(s.outer[0].y,1);close(s.inner[0].y,-1);
 for(const f of s.faces)for(const p of f.points){
  assert.ok(Number.isFinite(p.x)&&Number.isFinite(p.y)&&Number.isFinite(p.z));
  assert.equal(Math.abs(p.z),250);
 }
 const end=s.faces.find(x=>x.kind==='end');
 close(Math.abs(end.points[2].y-end.points[0].y),2);
});

test('todos los tramos del perfil redondeado tienen dos pieles y sus cantos',()=>{
 const points=viewerProfile(EXAMPLE,[1,1,1,1]).points;
 const s=sheetSolidMesh(points,500,2);
 assert.equal(s.faces.length,4*s.segments+2);
 assert.ok(s.segments>40);
 assert.equal(s.faces.filter(f=>f.kind==='front').length,s.segments);
 assert.equal(s.faces.filter(f=>f.kind==='back').length,s.segments);
 assert.ok(s.faces.every(f=>f.points.length===4));
 assert.ok(s.faces.every(f=>f.points.every(p=>Number.isFinite(p.x)&&Number.isFinite(p.y))));
 assert.equal(s.verified,false);
});

test('espesor y ancho realmente modifican la sección y la extrusión',()=>{
 const p=[{x:0,y:0},{x:50,y:0},{x:50,y:50}];
 const a=sheetSolidMesh(p,500,2),b=sheetSolidMesh(p,2000,10);
 close(a.outer[0].y,1);close(a.inner[0].y,-1);
 close(b.outer[0].y,5);close(b.inner[0].y,-5);
 assert.equal(Math.max(...a.faces.flatMap(f=>f.points.map(p=>p.z))),250);
 assert.equal(Math.max(...b.faces.flatMap(f=>f.points.map(p=>p.z))),1000);
 assert.notDeepEqual(a.outer,b.outer);
});

test('pliegue positivo y negativo mantienen extremos y malla finita',()=>{
 for(const sign of [1,-1]){
  const pts=viewerProfile({flanges:[50,50],angles:[sign*90],thickness:2},[1]).points;
  const m=sheetSolidMesh(pts,800,2);
  assert.equal(m.closed,true);
  assert.ok(m.faces.length>10);
  assert.ok(pts.at(-1).y*sign>0);
  assert.ok(m.faces.every(f=>f.points.every(p=>Number.isFinite(p.x)&&Number.isFinite(p.y))));
 }
});

test('perfiles repetidos no generan caras degeneradas ni entradas inválidas',()=>{
 const a=sheetSolidMesh([{x:0,y:0},{x:0,y:0},{x:10,y:0}],20,1);
 assert.equal(a.segments,1);
 assert.equal(a.faces.length,6);
 assert.equal(sheetSolidMesh([],20,1).closed,false);
 assert.equal(sheetSolidMesh([{x:0,y:0},{x:10,y:0}],20,0).faces.length,0);
});
