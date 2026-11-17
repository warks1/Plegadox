import test from 'node:test';
import assert from 'node:assert/strict';
import {CAD_EVIDENCE_SOURCES} from '../cad-evidence.js';
import {listCadImportSources} from '../cad-import-sources.js';
test('R126: Eurostamp 1015 y 1063 con enlace DXF y dimensiones declaradas sin importar',()=>{
 const samples=[
  ['eurostamp-1015','1015',88.5,3,60,'88deg'],
  ['eurostamp-1063','1063',104.65,.8,100,'STRAIGHT-88']
 ];
 const indexed=listCadImportSources();
 for(const [id,code,height,radius,tonnes,variant] of samples){
  const e=CAD_EVIDENCE_SOURCES.find(x=>x.id===id);
  assert.ok(e,id);
  assert.equal(e.kind,'punch');assert.equal(e.maker,'EUROSTAMP');
  assert.equal(e.reference,code);assert.equal(e.variant,variant);
  assert.equal(e.dimensions.heightMm,height);assert.equal(e.dimensions.tipRadiusMm,radius);
  assert.equal(e.dimensions.maxTonnesPerMetre,tonnes);
  assert.equal(e.format,'DXF');assert.equal(e.status,'ENLACE_CONFIRMADO_NO_IMPORTADO');
  assert.equal(e.cadUrl,'https://eurostampsrl.it/dxf/'+code+'.dxf');
  assert.equal(e.mount,code==='1015'?'Amada/Promecam':'Desconocido');
  assert.ok(indexed.some(row=>row.tool.reference===code&&row.tool.cadDownloadUrl===e.cadUrl));
 }
});
test('R126: la auditoría CAD conserva identidades sin duplicaciones',()=>{
 const ids=CAD_EVIDENCE_SOURCES.map(s=>s.id);
 assert.equal(new Set(ids).size,ids.length);
});
