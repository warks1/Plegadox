import test from 'node:test';
import assert from 'node:assert/strict';
import {EXAMPLE} from '../engine.js';
import {recommendTooling,targetVRatio} from '../tooling-advisor.js';

test('2 mm, alas 50 mm, 90 grados: V16 de guía x8, con punzón adecuado',()=>{
 const p={...EXAMPLE,flanges:[50,50],angles:[90],order:[0]};
 const r=recommendTooling(p);
 assert.ok(r.choice);
 assert.equal(r.targetOpening,16);
 assert.equal(r.choice.dieOpening,16);
 assert.ok(r.choice.punchAngle<=90);
 assert.ok(r.choice.minimumFlange>=r.choice.flangeLimit);
 assert.equal(r.choice.verified,false);
});
test('las medidas de alas alteran recomendación: 8 mm no admite V16 (0,7V)',()=>{
 const input={...EXAMPLE,flanges:[8,40],angles:[90],order:[0]};
 const r=recommendTooling(input);
 assert.ok(r.choice,'debe existir V10/V6 si el ala lo permite');
 assert.ok(r.choice.dieOpening<=8/.7+1e-8);
 assert.notEqual(r.choice.dieOpening,16);
 assert.equal(r.minimumFlange,8);
});
test('si el ala es demasiado corta NO se inventa una matriz admisible',()=>{
 const r=recommendTooling({...EXAMPLE,flanges:[1,50],angles:[90],order:[0]});
 assert.equal(r.choice,null);
 assert.ok(r.reasons[0].includes('No hay una pareja'));
});
test('para un ángulo interior 30 grados sólo propone punzones y matrices agudos',()=>{
 const r=recommendTooling({...EXAMPLE,flanges:[50,50],angles:[150],order:[0]});
 assert.ok(r.choice);
 assert.ok(r.choice.punchAngle<=30);
 assert.ok(r.choice.dieAngle<=30);
});
test('en angulo interior imposible no aconseja erróneamente 88 grados',()=>{
 const r=recommendTooling({...EXAMPLE,flanges:[50,50],angles:[165],order:[0]});
 assert.equal(r.choice,null);
});
test('tonelaje nominal impide sugerir combinación de riesgo',()=>{
 const r=recommendTooling({...EXAMPLE,thickness:10,width:10000,flanges:[150,150],angles:[90],order:[0]});
 assert.equal(r.choice,null);
});
test('familias incompatibles no se emparejan; sin CNC ni certificación',()=>{
 const input={...EXAMPLE,flanges:[50,50],angles:[90],order:[0]};
 const dies=[{id:'d',opening:16,angle:88,mount:'TRUMPF',name:'V16 de prueba'}];
 const punches=[{id:'p',angle:88,mount:'Amada/Promecam',name:'Punzón de prueba'}];
 assert.equal(recommendTooling(input,{dies,punches}).choice,null);
});
test('espesores mayores cambian objetivo V; cambios de signo no cambian la pieza',()=>{
 assert.equal(targetVRatio(2),8);assert.equal(targetVRatio(10),10);
 assert.equal(targetVRatio(12),12);
 const input=structuredClone(EXAMPLE);
 const r=recommendTooling(input);
 assert.equal(r.requiresClearance,true,'omega necesita revisar cuellos y colisiones');
 assert.ok(r.choice);
 assert.deepEqual(input,EXAMPLE);
 assert.deepEqual(input.order,[0,1,3,2]);
 assert.deepEqual(input.angles,[90,-90,-90,90]);
});

test('omega de 3 mm y alas 50 mm: la guía recomienda la V más cercana a x8',()=>{
 const r=recommendTooling({...EXAMPLE,thickness:3});
 assert.ok(r.choice);
 assert.equal(r.targetOpening,24);
 assert.equal(r.choice.dieOpening,24,'No priorizar una V más pequeña sin motivo');
});
