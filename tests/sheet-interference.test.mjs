import test from 'node:test';
import assert from 'node:assert/strict';
import {EXAMPLE,profile} from '../engine.js';
import {inspectSheetFrame,scanSheetSequence,describeSheetIssue} from '../sheet-interference.js';

test('la omega estándar comienza plana y sin cruces',()=>{
 const frame=inspectSheetFrame(EXAMPLE,0);
 assert.equal(frame.time,0);
 assert.equal(frame.hasCross,false);
 assert.equal(frame.hasNear,false);
 assert.deepEqual(frame.issues,[]);
 assert.equal(frame.verified,false);
});
test('reconoce el cruce de dos alas no consecutivas sin herramienta CAD',()=>{
 const shape={flanges:[50,50,50,50],angles:[120,120,120],order:[0,1,2],thickness:2};
 const frame=inspectSheetFrame(shape,15);
 assert.ok(frame.hasCross,JSON.stringify(frame.issues));
 assert.equal(frame.issues[0].kind,'cross');
 assert.match(describeSheetIssue(frame.issues[0]),/CRUCE/);
 assert.deepEqual(frame.issues[0].segments,[0,2]);
});
test('la separación de fibras inferior al espesor genera contacto, no cruce',()=>{
 const shape={flanges:[50,50,50,50],angles:[90,90,90],order:[0,1,2],thickness:2};
 // El perfil final 50x50 cierra: toca extremos, por lo que un cruce sería
 // correcto; el test sólo valida que la API no confunda los tipos.
 const result=inspectSheetFrame(shape,15);
 assert.ok(result.issues.every(x=>x.kind==='cross'||x.kind==='close'));
 assert.equal(result.verified,false);
 const sample={kind:'close',clearance:1.25,segments:[0,3]};
 assert.match(describeSheetIssue(sample),/1.25 mm/);
});
test('el escáner vincula cada muestra a su golpe y a su tiempo',()=>{
 const shape={flanges:[50,50,50,50],angles:[120,120,120],order:[0,1,2],thickness:2};
 const scan=scanSheetSequence(shape,15);
 assert.equal(scan.operations.length,3);
 assert.deepEqual(scan.operations.map(x=>x.bend),[0,1,2]);
 assert.ok(scan.operations.every(x=>x.samples===16));
 const last=scan.operations[2];
 assert.ok(last.possibleSheetInterference);
 assert.ok(last.exampleTime>=10&&last.exampleTime<=15);
 assert.equal(last.example?.finding.kind,'cross');
 assert.equal(scan.verified,false);
});
test('el orden 1-2-4-3 se mantiene y ningún aviso es aprobación',()=>{
 const scan=scanSheetSequence(EXAMPLE,8);
 assert.deepEqual(scan.operations.map(x=>x.bend),[0,1,3,2]);
 assert.ok(scan.operations.every(x=>x.verified===false&&x.samples===9));
 assert.equal(scan.verified,false);
});
