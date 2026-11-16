import test from 'node:test';
import assert from 'node:assert/strict';
import {CAD_EVIDENCE_SOURCES} from '../cad-evidence.js';
import {listCadImportSources,suggestedMountFamily} from '../cad-import-sources.js';

const matrix=[
 {ref:'25.203',num:'25203',V:10,R:1,load:1000},
 {ref:'25.304',num:'25304',V:12,R:1,load:400},
 {ref:'25.205',num:'25205',V:16,R:1.6,load:1000}
];
test('R122: tres fichas originales UKB de 84° no se mezclan con matrices 85/88°',()=>{
 for(const x of matrix){
  const records=CAD_EVIDENCE_SOURCES.filter(item=>item.maker==='UKB'&&item.reference===x.ref);
  assert.equal(records.length,1);
  const entry=records[0];
  assert.equal(entry.kind,'die');
  assert.equal(entry.dimensions.angleDeg,84);
  assert.equal(entry.dimensions.vOpeningMm,x.V);
  assert.equal(entry.dimensions.shoulderRadiusMm,x.R);
  assert.equal(entry.dimensions.maxLoadKNPerMetre,x.load);
  assert.equal(entry.dimensions.heightMm,100);
  assert.equal(entry.mount,'UKB TRUMPF/WILA/BYSTRONIC');
  assert.equal(entry.sourceUrl,'https://www.ukb-gmbh.de/en/'+x.num+'.html');
  assert.equal(entry.cadUrl,'https://daten.ukb-gmbh.de/dxf/zip/'+x.num+'.DXF.zip');
  assert.equal(entry.status,'ENLACE_CONFIRMADO_NO_IMPORTADO');
  assert.equal(entry.datum,'OEM_REFERENCE_UNCONFIRMED');
 }
});
test('R122: referencias nuevas aparecen en listado, sin longitud Z ni certificación de amarre',()=>{
 const offers=listCadImportSources();
 for(const x of matrix){
  const e=offers.find(z=>z.tool.manufacturer==='UKB'&&z.tool.reference===x.ref);
  assert.ok(e,x.ref);
  assert.equal(e.tool.length,null);
  assert.equal(e.tool.verifiedSpecs,false);
  assert.equal(e.tool.profileAccuracy,'provisional');
  assert.equal(suggestedMountFamily(e.tool.mount),'Desconocido');
 }
});
