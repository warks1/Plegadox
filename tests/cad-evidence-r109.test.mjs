import test from 'node:test';
import assert from 'node:assert/strict';
import {CAD_EVIDENCE_SOURCES,CAD_REQUIREMENTS,
 reconcileCadDimensions,cadCoverage,cadSourceFor} from '../cad-evidence.js';

const by=id=>CAD_EVIDENCE_SOURCES.find(x=>x.id===id);
test('R109: todas las fichas de enlace son trazables y NO fingen CAD descargado',()=>{
 assert.ok(CAD_EVIDENCE_SOURCES.length>=9);
 assert.equal(new Set(CAD_EVIDENCE_SOURCES.map(x=>x.id)).size,
  CAD_EVIDENCE_SOURCES.length);
 for(const x of CAD_EVIDENCE_SOURCES){
  assert.match(x.sourceUrl,/^https:\/\//);
  assert.notEqual(x.status,'CAD_CERTIFICADO');
  if(x.cadUrl){
   assert.match(x.cadUrl,/^https:\/\//);
   assert.match(x.status,/NO_IMPORTADO/);
  }
 }
 assert.equal(cadSourceFor('die','UKB','22.316').length,1);
 assert.equal(by('ukb-22316').dimensions.vOpeningMm,16);
 assert.equal(by('eurostamp-1322').dimensions.angleDeg,85);
 assert.equal(by('eurostamp-3041').dimensions.vOpeningMm,8);
});

test('R109: dos fuentes parciales de la MISMA referencia complementan cotas sin promedio',()=>{
 const src=by('ukb-22316');
 const second={...src,id:'anexo-ukb-22316',
  sourceUrl:'https://www.ukb-gmbh.de/en/22316.html#ficha',
  dimensions:{heightMm:60.01,toolBodyWidthMm:25}};
 // Cotas no declaradas en el esquema tipado se RECHAZAN.
 assert.throws(()=>reconcileCadDimensions([src,second]),/Cota no válida/);
 const valid={...second,dimensions:{heightMm:60.01,tipRadiusMm:1}};
 const result=reconcileCadDimensions([src,valid]);
 assert.equal(result.status,'COTAS_RECOPILADAS_NO_CERTIFICADAS');
 assert.equal(result.dimensions.heightMm,60);
 assert.equal(result.dimensions.tipRadiusMm,1);
 assert.equal(result.dimensions.vOpeningMm,16);
 assert.equal(result.conflicts.length,0);
 assert.equal(result.geometryMergeAllowed,false,
  'Una ficha sin datum no sirve para fusionar las siluetas');
 assert.equal(result.canApproveForMachine,false);
});

test('R109: cotas contradictorias NO se sustituyen por promedio',()=>{
 const a=by('eurostamp-1015');
 const b={...a,id:'revision-2',dimensions:{heightMm:90,angleDeg:88}};
 const result=reconcileCadDimensions([a,b]);
 assert.equal(result.status,'COTAS_CONTRADICTORIAS');
 assert.equal(result.dimensions.heightMm,undefined);
 assert.equal(result.conflicts[0].field,'heightMm');
 assert.equal(result.canApproveForMachine,false);
});

test('R109: está prohibido completar una cota con CAD de otra herramienta',()=>{
 assert.throws(()=>reconcileCadDimensions([
  by('eurostamp-1015'),by('eurostamp-1322')]),/referencias.*distintos/);
 assert.throws(()=>reconcileCadDimensions([
  by('ukb-22316'),by('ukb-26221')]),/referencias.*distintos/);
});

test('R109: el mismo artículo y datum DOCUMENTADO es combinable sólo como evidencia',()=>{
 const base=by('eurostamp-1015');
 const a={...base,datum:'PLANO_CERO_OEM_2026',dimensions:{heightMm:88.5}};
 const b={...base,id:'suplemento',datum:'PLANO_CERO_OEM_2026',
  dimensions:{angleDeg:88,tipRadiusMm:3}};
 const result=reconcileCadDimensions([a,b]);
 assert.equal(result.geometryMergeAllowed,true);
 assert.equal(result.status,'COTAS_RECOPILADAS_NO_CERTIFICADAS');
 assert.equal(result.verified,false);
 assert.equal(result.cadImported,false);
});

test('R109: las dos máquinas empiezan sin CAD OEM instalado, pero con inventario de carencias',()=>{
 for(const key of Object.keys(CAD_REQUIREMENTS)){
  const report=cadCoverage(key);
  assert.equal(report.requiredCount,13);
  assert.equal(report.importedCount,0);
  assert.equal(report.missing.length,13);
  assert.equal(report.canApproveForMachine,false);
 }
 const imported=cadCoverage('trumpf-v85',{
  ram:{points:[[0,0],[5,0],[0,5]]}});
 assert.equal(imported.importedCount,1);
 assert.ok(imported.missing.includes('mountDatums'));
 assert.ok(imported.missing.includes('axesXYZ'));
});
