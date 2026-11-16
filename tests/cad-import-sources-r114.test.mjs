import test from 'node:test';
import assert from 'node:assert/strict';
import {CAD_EVIDENCE_SOURCES} from '../cad-evidence.js';
import {listCadImportSources,suggestedMountFamily} from '../cad-import-sources.js';

test('R114: la referencia UKB 25.202 ya es accesible desde el importador de útiles',()=>{
 const rows=listCadImportSources();
 const row=rows.find(r=>r.tool.manufacturer==='UKB'&&r.tool.reference==='25.202');
 assert.ok(row);
 assert.equal(row.kind,'die');
 assert.equal(row.tool.angle,84);
 assert.equal(row.tool.opening,8);
 assert.equal(row.tool.height,100);
 assert.equal(row.tool.length,null,'Sin CAD de longitud Z no se supone 415 mm');
 assert.equal(row.tool.cadDownloadUrl,'https://daten.ukb-gmbh.de/dxf/zip/25202.DXF.zip');
 assert.equal(row.tool.verifiedSpecs,false);
 assert.equal(row.tool.cadStatus,'ENLACE_NO_IMPORTADO');
});

test('R114: no confundir varias familias compatibles con amarre Bystronic verificado',()=>{
 assert.equal(suggestedMountFamily('UKB TRUMPF/WILA/BYSTRONIC'),'Desconocido');
 assert.equal(suggestedMountFamily('MONTAJE_PENDIENTE'),'Desconocido');
 assert.equal(suggestedMountFamily('WILA'),'WILA');
 assert.equal(suggestedMountFamily('TRUMPF'),'TRUMPF');
 assert.equal(suggestedMountFamily('Amada/Promecam'),'Amada/Promecam');
 assert.equal(suggestedMountFamily('Bystronic/Beyeler R'),'Bystronic/Beyeler R');
});

test('R114: no duplicar CAD con la misma URL OEM ni mezclar punzones y matrices',()=>{
 const p={manufacturer:'UKB',reference:'25.202',cadSourceUrl:'https://ukb.example',
  cadDownloadUrl:'https://daten.ukb-gmbh.de/dxf/zip/25202.DXF.zip'};
 const rows=listCadImportSources({punches:[],dies:[p],evidence:CAD_EVIDENCE_SOURCES});
 assert.equal(rows.filter(x=>
  x.tool.cadDownloadUrl==='https://daten.ukb-gmbh.de/dxf/zip/25202.DXF.zip').length,1);
 assert.ok(rows.some(x=>x.kind==='punch'));
 assert.ok(rows.some(x=>x.kind==='die'));
});

test('R114: documento parcial sin DXF no aparece como archivo descargable',()=>{
 const rows=listCadImportSources({punches:[],dies:[],evidence:[{
  id:'test-only',kind:'die',maker:'FABRICANTE',reference:'X',
  sourceUrl:'https://example.org/ref',cadUrl:null,dimensions:{heightMm:88}
 }]});
 assert.deepEqual(rows,[]);
});

test('R114: la interfaz usa el inventario CAD sin inferir un montaje por coincidencia de texto',async()=>{
 const fs=await import('node:fs');
 const s=fs.readFileSync(new URL('../tool-import-ui.js',import.meta.url),'utf8');
 assert.match(s,/listCadImportSources\(\)/);
 assert.match(s,/suggestedMountFamily\(tool\.mount\)/);
 assert.ok(!s.includes("/Bystronic|Beyeler/i.test(family)"));
 assert.ok(s.includes('Indica la longitud real del segmento Z'));
});
