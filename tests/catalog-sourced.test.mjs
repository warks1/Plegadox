import test from 'node:test';
import assert from 'node:assert/strict';
import {DIES,PUNCHES} from '../engine.js';
import {registerCatalogue,CATALOG_SOURCES,toolMatchesBrand} from '../catalog.js';
import {sectionPunch,sectionDie,sectionBounds} from '../tool-profiles.js';
import {inspectProfile,segmentContactKind} from '../validation.js';
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
   const section=sectionDie(die),bounds=sectionBounds(section.points);
   assert.equal(bounds.maxX-bounds.minX,widths[i]);
   assert.ok(section.roundedShoulders,'Debe dibujarse R de hombro de ficha');
   assert.ok(section.points.length>15,'Cada hombro incluye arco circular');
   assert.equal(die.profileAccuracy,'provisional');
 });
});
test('catálogo de tipo Amada no suplanta fabricante AMADA',()=>{
 const tool=PUNCHES.find(p=>p.id==='conic-gn9-12-8806');
 assert.ok(toolMatchesBrand(tool,'Amada'));
 assert.equal(tool.manufacturer,'CONIC (tipo Amada)');
 assert.match(CATALOG_SOURCES[tool.source].url,/conic\.co\.jp/);
});

test('R nominal de hombro de matrices CONIC se conserva sin cambiar apertura teórica',()=>{
 for(const id of ['conic-v006-30-s','conic-v008-30-s','conic-v010-30-s','conic-v012-30-s']){
  const item=DIES.find(x=>x.id===id),s=sectionDie(item),r=item.shoulderRadius;
  assert.ok(Math.abs(s.shoulderRadius-r)<1e-10);
  assert.equal(s.opening,item.opening);
  assert.equal(s.angle,30);
  const leftArc=s.points.slice(1,10);
  assert.equal(leftArc.length,9);
  const cx=leftArc[0][0],cy=s.height-r;
  for(const [x,y] of leftArc)
   assert.ok(Math.abs(Math.hypot(x-cx,y-cy)-r)<1e-9,
     'Los puntos del hombro deben estar en el círculo R'+r);
  const rightArc=s.points.slice(11,20);
  for(let i=0;i<9;i++){
   assert.ok(Math.abs(leftArc[8-i][0]+rightArc[i][0])<1e-9);
   assert.ok(Math.abs(leftArc[8-i][1]-rightArc[i][1])<1e-9);
  }
 }
});
test('no se inventa radio de hombro en matrices de V genéricas',()=>{
 const generic=sectionDie({opening:16,angle:88,height:80});
 assert.equal(generic.shoulderRadius,0);
 assert.equal(generic.roundedShoulders,false);
 assert.equal(generic.points.length,7);
});

test('el catálogo de punzones no contiene aristas cruzadas ni solapadas',()=>{
 for(const tool of PUNCHES){
  const vertices=sectionPunch(tool).points.map(([x,y])=>({x,y}));
  if(vertices.length>1&&vertices[0].x===vertices.at(-1).x&&vertices[0].y===vertices.at(-1).y)vertices.pop();
  for(let i=0;i<vertices.length;i++){
   const a=vertices[i],b=vertices[(i+1)%vertices.length];
   for(let j=i+2;j<vertices.length;j++){
    if(i===0&&j===vertices.length-1)continue;
    const c=vertices[j],d=vertices[(j+1)%vertices.length];
    const kind=segmentContactKind(a,b,c,d);
    assert.notEqual(kind,'cross',tool.id+': cruce '+i+'/'+j);
    assert.notEqual(kind,'overlap',tool.id+': solapamiento '+i+'/'+j);
   }
  }
 }
});
