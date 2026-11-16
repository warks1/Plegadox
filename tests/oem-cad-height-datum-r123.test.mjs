import test from 'node:test';
import assert from 'node:assert/strict';
import {CAD_EVIDENCE_SOURCES} from '../cad-evidence.js';
import {listCadImportSources} from '../cad-import-sources.js';
import {auditImportedCadDimensions,catalogCadAuditReference} from '../tool-cad-oem-audit.js';
const refs=['25.502','25.403','25.504'];
for(const ref of refs){
 test('R123: '+ref+' admite DXF total H120 solo con dibujo OEM H100+zanco20',()=>{
  const item=CAD_EVIDENCE_SOURCES.find(x=>x.maker==='UKB'&&x.reference===ref);
  assert.ok(item);
  const source=listCadImportSources().find(x=>x.tool.manufacturer==='UKB'&&
   x.tool.reference===ref);
  assert.ok(source,'Debe estar disponible en el importador OEM');
  const e=catalogCadAuditReference(source.tool,'die');
  const nominal={kind:'die',angleDeg:30,openingMm:item.dimensions.vOpeningMm};
  assert.equal(e.cadHeightEvidence?.reference,ref);
  assert.equal(e.cadHeightEvidence?.drawingOverallMm,120);
  assert.equal(e.cadHeightEvidence?.nominalHeightMm,100);
  assert.equal(e.cadHeightEvidence?.mountingTangMm,20);
  const audit=auditImportedCadDimensions({height:120},e,nominal);
  assert.equal(audit.canRegister,true);
  assert.equal(audit.status,'ALTURA_TOTAL_DXF_COTEJADA_DATUM_MONTAJE_PENDIENTE');
  assert.equal(audit.cadHeightDatumPending,true);
  assert.equal(audit.nominalHeightMm,100);
  assert.equal(audit.totalContourHeightMm,120);
  assert.equal(audit.mountingTangMm,20);
  assert.equal(audit.verified,false);
  assert.equal(audit.manufacturerVerified,false);
  assert.equal(audit.checks.find(x=>x.field==='heightMm').origin,
   'TOTAL_CONTORNO_VS_PLANO_OEM_CON_ZANCO');
  assert.equal(auditImportedCadDimensions({height:100},e,nominal).canRegister,false);
 });
}
test('R123: no se permiten excepciones por diferencias +20/+30 sin plano de identidad exacta',()=>{
 const nominal={kind:'die',angleDeg:30,openingMm:8};
 const generic={kind:'die',reference:'otro',heightMm:100,
  angleDeg:30,openingMm:8};
 assert.equal(auditImportedCadDimensions({height:120},generic,nominal).canRegister,false);
 const fake={...generic,cadHeightEvidence:{reference:'25.502',
  kind:'DIE_PROFILE_INCLUDING_MOUNTING_TANG',nominalHeightMm:100,
  drawingOverallMm:120,mountingTangMm:20,sourceUrl:'https://example.com'}};
 assert.equal(auditImportedCadDimensions({height:120},fake,nominal).canRegister,false);
 const wrongDatum={...generic,cadHeightEvidence:{reference:'otro',
  kind:'DIE_PROFILE_INCLUDING_MOUNTING_TANG',nominalHeightMm:100,
  drawingOverallMm:120,mountingTangMm:15,sourceUrl:'https://example.com'}};
 assert.equal(auditImportedCadDimensions({height:120},wrongDatum,nominal).canRegister,false);
});
test('R123: excepción de altura no encubre ángulo erróneo ni V equivocada',()=>{
 const source=listCadImportSources().find(x=>x.tool.reference==='25.502');
 const e=catalogCadAuditReference(source.tool,'die');
 const bad=auditImportedCadDimensions({height:120},e,{kind:'die',angleDeg:88,openingMm:10});
 assert.equal(bad.canRegister,false);
 assert.deepEqual(bad.conflicts.map(x=>x.field),['angleDeg','openingMm']);
});
test('R123: patas de cabra Eurostamp 88° y punzones UKB 85° quedan en fuentes oficiales',()=>{
 const items=[['EUROSTAMP','1017',88,104.65,.8],
  ['EUROSTAMP','1031',88,165,.8],
  ['UKB','11.850',85,185,1],
  ['UKB','11.849',85,165,.8],
  ['UKB','11.831',85,85,.6],
  ['UKB','11.670',85,145,.8],
  ['UKB','11.835',85,120,.8],
  ['UKB','11.800',85,200,1],
  ['UKB','11.840',85,185,1],
  ['UKB','11.232',85,135,.8]];
 for(const [maker,ref,angle,h,r] of items){
  const row=CAD_EVIDENCE_SOURCES.find(x=>x.maker===maker&&x.reference===ref);
  assert.ok(row,ref);
  assert.equal(row.dimensions.angleDeg,angle,ref);
  assert.equal(row.dimensions.heightMm,h,ref);
  assert.equal(row.dimensions.tipRadiusMm,r,ref);
  assert.equal(row.kind,'punch');
  assert.equal(row.status,'ENLACE_CONFIRMADO_NO_IMPORTADO');
  assert.ok(row.cadUrl.startsWith('https://'));
 }
});
