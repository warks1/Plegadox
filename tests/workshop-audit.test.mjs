import test from 'node:test';
import assert from 'node:assert/strict';
import {EXAMPLE,MACHINE} from '../engine.js';
import {auditForWorkshop} from '../workshop-audit.js';
import {V85_FACTORY} from '../machine-config.js';
const scan={warningCount:0,operations:[]};
const audited=p=>auditForWorkshop(p,{machine:V85_FACTORY,toolScan:scan,sheetScan:scan});
test('omega estándar: NUNCA se afirma que sea apta para fabricar',()=>{
 const a=audited(EXAMPLE);
 assert.equal(a.status,'SIN_VALIDACION_INDUSTRIAL');
 assert.equal(a.canApproveForMachine,false);
 assert.equal(a.verified,false);
 assert.ok(a.summary.missing>0);
 assert.ok(a.issues.some(x=>x.code==='machine-3d'));
 assert.ok(a.issues.some(x=>x.code==='load-punzón'));
 assert.ok(a.issues.some(x=>x.code==='load-matriz'));
 assert.deepEqual(a.piece.order,[0,1,3,2]);
});
test('alas cortas son incompatibilidad en la operación concreta',()=>{
 const a=audited({...EXAMPLE,flanges:[5,50],angles:[90],order:[0]});
 const issue=a.issues.find(x=>x.code==='short-flange');
 assert.ok(issue);assert.equal(issue.level,'block');assert.equal(issue.bend,0);
});
test('un giro interior inferior al ángulo de la herramienta se señala',()=>{
 const a=audited({...EXAMPLE,flanges:[50,50],angles:[150],order:[0]});
 assert.ok(a.issues.some(x=>x.code==='incompatible-angle'&&x.level==='block'));
});
test('tonelaje superior a 85t y pieza mayor que trancha son incompatibilidades',()=>{
 const a=audited({...EXAMPLE,width:9000,thickness:10});
 assert.ok(a.issues.some(x=>x.code==='machine-width'&&x.level==='block'));
 assert.ok(a.issues.some(x=>x.code==='force-overload'&&x.level==='block'));
});
test('no equiparar montaje mismo fabricante con compatibilidad CNC',()=>{
 const a=audited({...EXAMPLE,punch:'conic-gn9-12-8806',die:'conic-v012-30-s'});
 assert.ok(a.issues.some(x=>x.code==='mount-machine'));
});
test('montajes expresamente diferentes se bloquean',()=>{
 const a=audited({...EXAMPLE,punch:'conic-gn9-12-8806',die:'trumpf-evw20-84'});
 assert.ok(a.issues.some(x=>x.code==='mount-family'&&x.level==='block'));
});
test('la advertencia de colisión 2D no se convierte en certificación 3D',()=>{
 const a=auditForWorkshop(EXAMPLE,{machine:V85_FACTORY,
  toolScan:{warningCount:2},sheetScan:{warningCount:1}});
 assert.equal(a.summary.toolWarnings,2);assert.equal(a.summary.sheetWarnings,1);
 assert.ok(a.issues.some(x=>x.code==='tool-2d'));
 assert.ok(a.issues.some(x=>x.code==='sheet-2d'));
 assert.equal(a.canApproveForMachine,false);
});
