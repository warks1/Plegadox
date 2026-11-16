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

test('R120: cinco punzones de 30 grados UKB con sección OEM y amarre específicos',()=>{
 const punches={
  '11.780':{H:135,R:.5,load:800,mount:'Amada/Promecam'},
  '11.880':{H:150,R:.8,load:400,mount:'Amada/Promecam'},
  '11.810':{H:200,R:1,load:500,mount:'Amada/Promecam'},
  '14.153':{H:175,R:1,load:1000,
   mount:'UKB BYSTRONIC (MONTAJE REAL PENDIENTE)'},
  '14.169':{H:250,R:3,load:1000,
   mount:'UKB BYSTRONIC (MONTAJE REAL PENDIENTE)'}
 };
 for(const [ref,params] of Object.entries(punches)){
  const found=CAD_EVIDENCE_SOURCES.filter(x=>
   x.maker==='UKB'&&x.kind==='punch'&&x.reference===ref);
  assert.equal(found.length,1,ref);
  const tool=found[0];
  assert.equal(tool.dimensions.heightMm,params.H);
  assert.equal(tool.dimensions.angleDeg,30);
  assert.equal(tool.dimensions.tipRadiusMm,params.R);
  assert.equal(tool.dimensions.maxLoadKNPerMetre,params.load);
  assert.equal(tool.mount,params.mount);
  assert.equal(tool.status,'ENLACE_CONFIRMADO_NO_IMPORTADO');
  assert.equal(tool.datum,'OEM_REFERENCE_UNCONFIRMED');
  assert.match(tool.cadUrl,/^https:\/\/daten\.ukb-gmbh\.de\/dxf\/zip\/\d+\.DXF\.zip$/);
 }
});
