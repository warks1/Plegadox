import test from 'node:test';
import assert from 'node:assert/strict';
import {EXAMPLE,profile,stage,orientedForMachine} from '../engine.js';
import {segmentsIntersect,segmentContactKind,segmentContactGeometry,segmentClearance,inspectProfile,analyzeSequence} from '../validation.js';

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

test('alerta cuando un ala no alcanza medio ancho de la V',()=>{
 const p={...EXAMPLE,flanges:[4,50,50,50,50],die:'v16'};
 const report=analyzeSequence(p);
 const issue=report.issues.find(x=>x.code==='v-support'&&x.bend===0);
 assert.ok(issue,'V16 necesita al menos 8 mm para llegar al hombro en el esquema');
 assert.equal(issue.halfV,8);
 assert.deepEqual(issue.shortWings.map(x=>x.side),['anterior']);
 assert.equal(report.perOperation[0].vSupportWarning,true);
 assert.equal(report.hasGeometryWarning,true);
});
test('no lanza advertencia de apoyo a V/2 exacto ni por el signo del ángulo',()=>{
 const p={...EXAMPLE,die:'v16',flanges:[8,50,50,50,50],angles:[-90,-90,-90,90]};
 assert.equal(analyzeSequence(p).issues.filter(x=>x.code==='v-support').length,0);
});
test('compara el apoyo de ambas alas sin asignar incompatibilidad certificada',()=>{
 const p={...EXAMPLE,flanges:[8,3,50,50,50],die:'v16'};
 const report=analyzeSequence(p);
 const first=report.issues.find(x=>x.code==='v-support'&&x.bend===0);
 const second=report.issues.find(x=>x.code==='v-support'&&x.bend===1);
 assert.ok(first&&second);
 assert.equal(first.shortWings[0].side,'posterior');
 assert.equal(second.shortWings[0].side,'anterior');
 assert.equal(report.verifiedMachineClearance,false);
});

test('avisa cuando la longitud de un segmento de punzón no cubre el ancho de pieza',()=>{
 const p={...EXAMPLE,width:1000,punch:'amada-831',die:'conic-v010-30-s'};
 const report=analyzeSequence(p);
 const punch=report.issues.find(x=>x.code==='tool-length'&&x.kind==='punzón');
 assert.ok(punch,'Debe revisar el montaje de 415 mm en pieza de 1000 mm');
 assert.equal(punch.availableLength,415);
 assert.equal(punch.requiredLength,1000);
 assert.match(punch.message,/montaje de varios segmentos/);
 assert.ok(report.hasGeometryWarning,'La cobertura del útil necesita revisión');
 assert.equal(report.verifiedMachineClearance,false);
});
test('distingue segmentos de punzón y de matriz sin afirmar que el montaje es imposible',()=>{
 const report=analyzeSequence({...EXAMPLE,width:1000,punch:'amada-831',die:'rolleri-tmr100-16-30'});
 assert.deepEqual(report.issues.filter(x=>x.code==='tool-length').map(x=>x.kind),
  ['punzón','matriz']);
 assert.equal(analyzeSequence({...EXAMPLE,width:400,punch:'amada-831',die:'rolleri-tmr100-16-30'})
  .issues.some(x=>x.code==='tool-length'),false);
});
test('valida por separado ancho nominal de trancha y portaútiles',()=>{
 const report=analyzeSequence({...EXAMPLE,width:2100});
 assert.ok(report.issues.some(x=>x.code==='machine-width'));
 assert.ok(report.issues.some(x=>x.code==='machine-holder-width'));
});

test('el informe conserva ambas advertencias si punzón y matriz son cortos',()=>{
 const p={...EXAMPLE,width:1000,punch:'amada-831',die:'rolleri-tmr100-16-30'};
 const issues=analyzeSequence(p).issues.filter(x=>x.code==='tool-length');
 assert.equal(issues.length,2);
 assert.equal(new Set(issues.map(x=>x.kind)).size,2);
 assert.deepEqual(issues.map(x=>x.availableLength),[415,500]);
});

test('diferencia cruce interior, solapamiento colineal y contacto en extremo',()=>{
 const a=p(0,0),b=p(20,0);
 assert.equal(segmentContactKind(a,b,p(10,-10),p(10,10)),'cross');
 assert.equal(segmentContactKind(a,b,p(10,0),p(30,0)),'overlap');
 assert.equal(segmentContactKind(a,b,p(20,0),p(30,10)),'touch');
 assert.equal(segmentContactKind(a,b,p(25,0),p(35,0)),null);
 assert.equal(segmentContactKind(a,b,p(5,1),p(15,1)),null);
 assert.equal(segmentsIntersect(a,b,p(20,0),p(30,10)),true);
});
test('identifica el tipo correcto en perfiles sin alas consecutivas',()=>{
 const crossing=inspectProfile([p(0,0),p(10,10),p(0,10),p(10,0)],2);
 assert.equal(crossing[0].kind,'cross');
 const touching=inspectProfile([p(0,0),p(10,0),p(10,10),p(0,10),p(0,0)],2);
 assert.ok(touching.some(i=>i.kind==='touch'&&i.segments[0]===0&&i.segments[1]===3));
 assert.ok(!touching.some(i=>i.kind==='cross'),'Un extremo no es cruce interior');
 const overlapping=inspectProfile([p(0,0),p(20,0),p(20,10),p(10,0),p(30,0)],2);
 assert.ok(overlapping.some(i=>i.kind==='overlap'&&i.segments[0]===0&&i.segments[1]===3));
});
test('informe final etiqueta el contacto puntual sin llamarlo cruce',()=>{
 const shape={flanges:[50,50,50,50],angles:[90,90,90],order:[0,1,2],thickness:2};
 const report=analyzeSequence(shape);
 assert.ok(report.issues.some(i=>i.code==='final-touch'));
 assert.ok(!report.issues.some(i=>i.code==='final-cross'));
 assert.match(report.summary,/interferencias geométricas/);
});

test('sitúa el punto de cruce interior en coordenadas milimétricas',()=>{
 const found=segmentContactGeometry(p(0,0),p(20,0),p(12,-15),p(12,15));
 assert.equal(found.kind,'cross');
 assert.ok(Math.abs(found.point.x-12)<1e-9);
 assert.ok(Math.abs(found.point.y)<1e-9);
 assert.equal(found.clearance,0);
 const hits=inspectProfile([p(0,0),p(20,0),p(20,15),p(12,-15)],2);
 assert.ok(hits.find(h=>h.kind==='cross'&&Number.isFinite(h.point.x)));
});
test('sitúa en el centro la longitud de solapamiento, sin dibujar falso cruce',()=>{
 const g=segmentContactGeometry(p(0,0),p(20,0),p(12,0),p(26,0));
 assert.equal(g.kind,'overlap');
 assert.ok(Math.abs(g.point.x-16)<1e-9);
 assert.ok(Math.abs(g.point.y)<1e-9);
});
test('el contacto puntual señala el vértice común',()=>{
 const g=segmentContactGeometry(p(0,0),p(20,0),p(20,0),p(25,10));
 assert.equal(g.kind,'touch');
 assert.deepEqual(g.point,p(20,0));
});
test('la proximidad devuelve los dos puntos más cercanos y distancia real',()=>{
 const g=segmentContactGeometry(p(0,0),p(20,0),p(20.5,0.8),p(20.5,20));
 assert.equal(g.kind,null);
 assert.ok(Math.abs(g.clearance-Math.hypot(.5,.8))<1e-9);
 assert.deepEqual(g.pointA,p(20,0));
 assert.deepEqual(g.pointB,p(20.5,.8));
 assert.ok(Math.abs(g.point.x-20.25)<1e-9);
 assert.ok(Math.abs(g.point.y-.4)<1e-9);
});
test('la fibra plana no produce marcas y sus extremos siguen intactos',()=>{
 const pts=profile(EXAMPLE).points;
 assert.deepEqual(inspectProfile(pts,EXAMPLE.thickness),[]);
});
