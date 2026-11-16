import test from 'node:test';
import assert from 'node:assert/strict';
import {CAD_EVIDENCE_SOURCES} from '../cad-evidence.js';
import {listCadImportSources,suggestedMountFamily} from '../cad-import-sources.js';
const table={
 '25.502':{V:8,R:1,H:100,kN:200,mount:'UKB TRUMPF/WILA/BYSTRONIC'},
 '25.403':{V:10,R:1,H:100,kN:400,mount:'UKB TRUMPF/WILA/BYSTRONIC'},
 '25.504':{V:12,R:1,H:100,kN:250,mount:'UKB TRUMPF/WILA/BYSTRONIC'},
 '25.405':{V:16,R:1.6,H:100,kN:500,mount:'UKB TRUMPF/WILA/BYSTRONIC'},
 '25.407':{V:24,R:2.5,H:100,kN:650,mount:'UKB TRUMPF/WILA/BYSTRONIC'},
 '25.408':{V:30,R:3,H:100,kN:900,mount:'UKB TRUMPF/WILA/BYSTRONIC'},
 '24.035':{V:32,R:4,H:60,kN:500,mount:'UKB BYSTRONIC (MONTAJE REAL PENDIENTE)'}
};
test('R120: catálogo 30° incorpora siete referencias UKB sin confundir matriz ni amarre',()=>{
 for(const [ref,params] of Object.entries(table)){
  const matches=CAD_EVIDENCE_SOURCES.filter(x=>x.reference===ref&&x.maker==='UKB');
  assert.equal(matches.length,1,ref);
  const tool=matches[0];
  assert.equal(tool.kind,'die');assert.equal(tool.mount,params.mount);
  assert.equal(tool.dimensions.heightMm,params.H);
  assert.equal(tool.dimensions.vOpeningMm,params.V);
  assert.equal(tool.dimensions.angleDeg,30);
  assert.equal(tool.dimensions.shoulderRadiusMm,params.R);
  assert.equal(tool.dimensions.maxLoadKNPerMetre,params.kN);
  assert.match(tool.cadUrl,/^https:\/\/daten\.ukb-gmbh\.de\/dxf\/zip\/\d+\.DXF\.zip$/);
  assert.equal(tool.status,'ENLACE_CONFIRMADO_NO_IMPORTADO');
  assert.equal(tool.datum,'OEM_REFERENCE_UNCONFIRMED');
 }
});
test('R120: las referencias UKB nuevas se ofrecen para importación pero NO instaladas en máquina',()=>{
 const imports=listCadImportSources();
 for(const ref of Object.keys(table)){
  const row=imports.find(x=>x.tool.reference===ref&&x.tool.manufacturer==='UKB');
  assert.ok(row,ref);
  assert.equal(row.tool.profileAccuracy,'provisional');
  assert.equal(row.tool.verifiedSpecs,false);
  assert.equal(row.tool.length,null);
  assert.equal(suggestedMountFamily(row.tool.mount),'Desconocido');
 }
});
