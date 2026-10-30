import test from 'node:test';
import assert from 'node:assert/strict';
import {contactKinematics,roundedCorner} from '../bend-contact.js';
import {technicalScene} from '../technical-section.js';
import {EXAMPLE,stage} from '../engine.js';
const close=(a,b,t=.18)=>assert.ok(Math.abs(a-b)<=t,`Esperado ${b}, recibido ${a}`);
const demo=[{x:-50,y:0},{x:0,y:0},{x:50,y:0}];
test('el primer golpe empieza plano y el punzón se aproxima desde arriba',()=>{
 const k=contactKinematics({points:demo,activeBend:0,opening:16,dieDepth:8.29,thickness:2,phase:'Aproximación',press:0});
 assert.equal(k.sag,0);
 assert.ok(k.sheet.every(p=>p.y===1));
 assert.ok(k.tipHeight>2);
});
test('el punzón desciende con la fibra de chapa y se apoya en los hombros de la V',()=>{
 const k=contactKinematics({
  points:[{x:-50,y:0},{x:0,y:0},{x:0,y:50}],
  activeBend:0,angle:90,opening:16,dieDepth:8.29,thickness:2,
  phase:'Plegado',press:.95
 });
 assert.ok(k.sag>7);
 assert.ok(k.sheet[0].y>k.sheet[1].y);
 assert.ok(k.sheet[2].y>k.sheet[1].y);
 close(k.tipHeight,k.sheet[1].y+1,1e-8);
 // En x=±8 mm, las caras inferiores se apoyan cerca del plano de la V.
 const hinge=k.sheet[1],right=k.sheet[2],left=k.sheet[0];
 const atX=(p,x)=>hinge.y+(p.y-hinge.y)*(x-hinge.x)/(p.x-hinge.x);
 assert.ok(atX(right,8)>=.95,'Apoyo sobre hombro derecho');
 assert.ok(atX(left,-8)>=.95,'Apoyo sobre hombro izquierdo');
 assert.ok(k.rounded.length>k.sheet.length,'La chapa se representa con radio y no un pico triangular');
});
test('la matriz limita la profundidad; no se simula una punta atravesando el fondo',()=>{
 const k=contactKinematics({
  points:[{x:-30,y:0},{x:0,y:0},{x:10,y:20}],activeBend:0,
  angle:120,opening:16,dieDepth:8.2,thickness:2,phase:'Plegado',press:1
 });
 assert.equal(k.limitedByDie,true);
 assert.ok(k.sag<=8.2-.6+1e-7);
 assert.ok(k.sheet[1].y>=-8.2+1);
});
test('al retirar el punzón la chapa mantiene el ángulo sin volver a aplanarse',()=>{
 const points=[{x:-50,y:0},{x:0,y:0},{x:0,y:50}];
 const formed=contactKinematics({points,activeBend:0,angle:90,
  opening:16,dieDepth:8.3,thickness:2,phase:'Plegado',press:1});
 const retract=contactKinematics({points,activeBend:0,angle:90,
  opening:16,dieDepth:8.3,thickness:2,phase:'Retorno',press:.2});
 const angle=(s)=>Math.atan2(s[2].y-s[1].y,s[2].x-s[1].x)-
   Math.atan2(s[1].y-s[0].y,s[1].x-s[0].x);
 close(angle(retract.sheet),angle(formed.sheet),1e-6);
 assert.ok(retract.sheet[1].y>formed.sheet[1].y,'La pieza retrocede hacia fuera de la V');
 assert.ok(retract.tipHeight>retract.sheet[1].y+1,'La punta se retira de la chapa');
});
test('un pliegue de radio aproximado crea un recorrido continuo sin modificar extremos',()=>{
 const b=[{x:-30,y:10},{x:0,y:0},{x:30,y:10}],q=roundedCorner(b,1,2);
 assert.ok(q.length>10);
 assert.deepEqual(q[0],b[0]);
 assert.deepEqual(q.at(-1),b.at(-1));
 assert.ok(q.every(v=>Number.isFinite(v.x)&&Number.isFinite(v.y)));
});
test('la sección técnica se alimenta de la misma cinemática del contacto',()=>{
 const st=stage(EXAMPLE,2.8),result=technicalScene(EXAMPLE,st);
 assert.equal(result.sheetDisplay.length>result.sheet.length,true);
 close(result.kinematics.tipHeight,result.sheet[st.activeBend+1].y+EXAMPLE.thickness/2,1e-6);
 assert.equal(result.verified,false,'No vender este modelo aproximado como validación CAD');
});
