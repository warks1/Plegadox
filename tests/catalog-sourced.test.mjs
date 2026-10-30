import test from 'node:test';
import assert from 'node:assert/strict';
import {DIES,PUNCHES} from '../engine.js';
import {registerCatalogue,CATALOG_SOURCES,toolMatchesBrand} from '../catalog.js';
import {sectionPunch,sectionDie} from '../tool-profiles.js';
import {inspectProfile} from '../validation.js';
registerCatalogue(DIES,PUNCHES);

test('el catálogo presenta pata de cabra GN9 y GN6 con escotes distintos',()=>{
 const gn9=PUNCHES.find(p=>p.id==='conic-gn9-12-8806'),
       gn6=PUNCHES.find(p=>p.id==='conic-gn6-12-8806');
 assert.ok(gn9&&gn6,'No se han cargado los punzones GN');
 assert.equal(gn9.manufacturer,'CONIC (tipo Amada)');
 assert.equal(gn9.height,120);assert.equal(gn9.angle,88);
 assert.equal(gn9.neckOffset,9);assert.equal(gn6.neckOffset,6);
 const a=sectionPunch(gn9).points,b=sectionPunch(gn6).points;
 assert.notDeepEqual(a,b,'Diferentes escotes no pueden mostrar la misma geometría');
 assert.ok(a.length>=12,'La pata de cabra ha de tener concavidad lateral');
 assert.equal(gn9.profileAccuracy,'provisional','No afirmar CAD oficial');
});
test('puntas rectas de 30° reconocibles y diferenciadas',()=>{
 const a=PUNCHES.find(p=>p.id==='conic-act-12-3006'),b=PUNCHES.find(p=>p.id==='straight88');
 assert.equal(a.angle,30);
 assert.equal(a.height,120);
 assert.equal(a.tip,1.2);
 assert.notDeepEqual(sectionPunch(a).points,sectionPunch(b).points);
});
test('matrices de 30° muestran V6 V8 V10 V12 y anchura exterior de ficha',()=>{
 const ids=['conic-v006-30-s','conic-v008-30-s','conic-v010-30-s','conic-v012-30-s'];
 const openings=[6,8,10,12];
 const widths=[17,20,25,30];
 ids.forEach((id,i)=>{
   const die=DIES.find(d=>d.id===id);
   assert.ok(die,id);
   assert.equal(die.angle,30);
   assert.equal(die.opening,openings[i]);
   const pts=sectionDie(die).points;
   assert.equal(pts[4][0]-pts[0][0],widths[i]);
   assert.equal(die.profileAccuracy,'provisional');
 });
});
test('catálogo de tipo Amada no suplanta fabricante AMADA',()=>{
 const tool=PUNCHES.find(p=>p.id==='conic-gn9-12-8806');
 assert.ok(toolMatchesBrand(tool,'Amada'));
 assert.equal(tool.manufacturer,'CONIC (tipo Amada)');
 assert.match(CATALOG_SOURCES[tool.source].url,/conic\.co\.jp/);
});
