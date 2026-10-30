import test from 'node:test';
import assert from 'node:assert/strict';
import {EXAMPLE,profile,stage,orientedForMachine} from '../engine.js';
import {segmentsIntersect,segmentClearance,inspectProfile,analyzeSequence} from '../validation.js';

const p=(x,y)=>({x,y});
test('detecta cruce entre dos segmentos no adyacentes',()=>{
 const shape=[p(0,0),p(10,10),p(0,10),p(10,0)];
 const findings=inspectProfile(shape,2);
 assert.ok(findings.some(x=>x.kind==='cross'));
 assert.equal(segmentClearance(shape[0],shape[1],shape[2],shape[3]),0);
});
test('detecta proximidad menor que el espesor aunque no exista cruce',()=>{
 const shape=[p(0,0),p(10,0),p(10,5),p(0,5),p(0,1)];
 const findings=inspectProfile(shape,2);
 assert.ok(findings.some(x=>x.kind==='close'&&x.clearance>0&&x.clearance<2));
});
test('no alerta al girar en un vértice compartido por dos alas consecutivas',()=>{
 const shape=[p(0,0),p(50,0),p(50,50),p(100,50)];
 const findings=inspectProfile(shape,2);
 assert.equal(findings.length,0);
});
test('sin cruces de tramos alejados en estado inicial',()=>{
 const data=profile(EXAMPLE);
 assert.deepEqual(inspectProfile(data.points,2),[]);
});
test('comprobación de secuencia usa el orden programado 1-2-4-3',()=>{
 const result=analyzeSequence(EXAMPLE);
 assert.deepEqual(result.perOperation.map(x=>x.bend),[0,1,3,2]);
 assert.equal(result.verifiedMachineClearance,false);
 assert.match(result.limitations,/deformación plástica/i);
 assert.ok(result.perOperation.every(x=>x.sampledStates>=6));
});
test('relación V a espesor fuera de guía genera aviso, no falsa aprobación',()=>{
 const result=analyzeSequence({...EXAMPLE,thickness:8,die:'v6'});
 assert.ok(result.issues.some(x=>x.code==='v-to-thickness'));
 assert.equal(result.verifiedMachineClearance,false);
});
test('un perfil con cruce muestra aviso geométrico sin afirmar colisión 3D',()=>{
 const inputs={flanges:[30,40,40,40],angles:[120,120,120],order:[0,1,2],thickness:2};
 const result=analyzeSequence(inputs);
 // The polygon closes over itself, so non-adjacent segments touch / cross.
 assert.equal(result.verifiedMachineClearance,false);
 assert.ok(typeof result.summary==='string');
});
test('pliegue negativo se orienta hacia abajo, positivo hacia arriba durante formación',()=>{
 const base={flanges:[50,50],angles:[-90],order:[0]};
 const negative=orientedForMachine(base,[.6],0);
 const positive=orientedForMachine({...base,angles:[90]},[.6],0);
 assert.ok(negative[2].y<0 && positive[2].y>0);
 const before=stage(base,0);
 assert.ok(before.fractions.every(x=>x===0),'El golpe no empieza con una pieza ya plegada');
});
test('la proximidad detectada no depende del orden de vértices de una línea',()=>{
 const a=p(0,0),b=p(10,0),c=p(11,1),d=p(11,9);
 assert.equal(segmentsIntersect(a,b,c,d),false);
 assert.ok(Math.abs(segmentClearance(a,b,c,d)-Math.sqrt(2))<1e-6);
});

test('avisa cuando el ángulo interior es más cerrado que la abertura de matriz o punzón',()=>{
 const input={...EXAMPLE,angles:[120,-90,-90,90],punch:'straight88',die:'v16'};
 const report=analyzeSequence(input);
 const warning=report.issues.find(i=>i.code==='tool-angle'&&i.bend===0);
 assert.ok(warning,'Debe advertir del pliegue de 120° con útiles de 88°');
 assert.match(warning.message,/interior programado 60/);
 assert.equal(report.perOperation[0].toolAngleWarning,true);
 assert.ok(report.hasGeometryWarning);
 const allowed=analyzeSequence({...input,angles:[90,-90,-90,90]});
 assert.equal(allowed.issues.filter(i=>i.code==='tool-angle').length,0,
  'Un pliegue habitual de 90° con útiles de 88° no debe bloquearse ni dar aviso de cuña');
});
test('la limitación se evalúa tanto para el signo positivo como para el negativo',()=>{
 const positive=analyzeSequence({...EXAMPLE,angles:[120,0,0,0]});
 const negative=analyzeSequence({...EXAMPLE,angles:[-120,0,0,0]});
 assert.ok(positive.issues.some(i=>i.code==='tool-angle'&&i.bend===0));
 assert.ok(negative.issues.some(i=>i.code==='tool-angle'&&i.bend===0));
});
