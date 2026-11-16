import test from 'node:test';
import assert from 'node:assert/strict';
import {auditImportedCadDimensions,catalogCadAuditReference} from '../tool-cad-oem-audit.js';
const die={kind:'die',reference:'25.500',sourceUrl:'https://www.ukb-gmbh.de/en/25500.html',
 heightMm:100,angleDeg:30,openingMm:5};
const declared={kind:'die',angleDeg:30,openingMm:5};
test('R113: coincidencia de altura DXF y V/ángulo declarados NO es certificación',()=>{
 const r=auditImportedCadDimensions({height:100},die,declared);
 assert.equal(r.canRegister,true);assert.equal(r.conflicts.length,0);
 assert.equal(r.verified,false);assert.equal(r.manufacturerVerified,false);
 assert.equal(r.checks.find(x=>x.field==='heightMm').origin,'MEDIDO_EN_DXF_2D');
 assert.match(r.checks.find(x=>x.field==='angleDeg').origin,/SOLO_DECLARACION/);
});
test('R113: discrepancia de altura física del DXF bloquea registrar bajo referencia',()=>{
 const r=auditImportedCadDimensions({height:96.7},die,declared);
 assert.equal(r.canRegister,false);assert.equal(r.conflicts[0].field,'heightMm');
 assert.equal(r.status,'DISCREPANCIA_BLOQUEANTE');
});
test('R113: no permite reetiquetar una matriz de 30° como 88°',()=>{
 const r=auditImportedCadDimensions({height:100},die,{...declared,angleDeg:88});
 assert.equal(r.canRegister,false);assert.equal(r.conflicts[0].field,'angleDeg');
});
test('R113: cambios nominales de apertura V se rechazan',()=>{
 const r=auditImportedCadDimensions({height:100},die,{...declared,openingMm:6});
 assert.equal(r.canRegister,false);assert.equal(r.conflicts[0].field,'openingMm');
});
test('R113: compara diámetro de punta, no radio de punzón',()=>{
 const punch={kind:'punch',reference:'1015',heightMm:88.5,angleDeg:88,tipDiameterMm:6};
 const r=auditImportedCadDimensions({height:88.5},punch,{kind:'punch',angleDeg:88,tipDiameterMm:3});
 assert.equal(r.canRegister,false);assert.equal(r.conflicts[0].field,'tipDiameterMm');
});
test('R113: sin ficha se puede importar sin reclamar identidad OEM',()=>{
 const r=auditImportedCadDimensions({height:100},null,declared);
 assert.equal(r.canRegister,true);assert.equal(r.verified,false);
 assert.equal(r.status,'SIN_FICHA_ASOCIADA');
});
test('R113: dato no publicado queda pendiente',()=>{
 const r=auditImportedCadDimensions({height:100},{kind:'die',reference:'x',angleDeg:30},declared);
 assert.equal(r.canRegister,true);assert.deepEqual(r.missing,['heightMm','openingMm']);
});
test('R113: fuente y tipo incompatibles se rechazan',()=>{
 assert.throws(()=>auditImportedCadDimensions({height:100},die,{kind:'punch',angleDeg:30}),/no coincide/);
});
test('R113: los metadatos del catálogo no prueban origen',()=>{
 const source=catalogCadAuditReference({reference:'25.500',height:100,angle:30,
  opening:5,cadSourceUrl:'https://www.ukb-gmbh.de/en/25500.html'},'die');
 assert.equal(auditImportedCadDimensions({height:100},source,declared).canRegister,true);
 assert.equal(source.openingMm,5);
});
