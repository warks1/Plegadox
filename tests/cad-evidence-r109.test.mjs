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
 const valid={...second,dimensions:{heightMm:60.01,bodyWidthMm:25}};
 const result=reconcileCadDimensions([src,valid]);
 assert.equal(result.status,'COTAS_RECOPILADAS_NO_CERTIFICADAS');
 assert.equal(result.dimensions.heightMm,60);
 assert.equal(result.dimensions.bodyWidthMm,25);
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

test('R109: se enlazan portamatriz y adaptadores sin confundirlos con matrices',()=>{
 const die=by('ukb-22316');
 const holder=by('ukb-22010');
 const top=by('ukb-50430');
 assert.equal(holder.kind,'lowerAdapter');
 assert.equal(holder.dimensions.heightMm,51.5);
 assert.equal(holder.dimensions.bodyWidthMm,60);
 assert.equal(holder.cadUrl,'https://daten.ukb-gmbh.de/dxf/zip/22010.DXF.zip');
 assert.equal(top.kind,'upperAdapter');
 assert.equal(top.dimensions.heightMm,67);
 assert.equal(top.status,'ENLACE_CONFIRMADO_NO_IMPORTADO');
 assert.equal(die.dimensions.vOpeningMm,16);
 assert.throws(()=>reconcileCadDimensions([die,holder]),
  /referencias.*distintos|tipo.*distintos/);
 const match=reconcileCadDimensions([holder]);
 assert.equal(match.status,'COTAS_RECOPILADAS_NO_CERTIFICADAS');
 assert.equal(match.verified,false);
});

test('R109: un soporte SOCLAM no se completa con alturas de otra variante',()=>{
 const base=by('soclam-4006-34');
 assert.equal(base.kind,'lowerAdapter');
 assert.equal(base.dimensions.heightMm,34);
 assert.equal(base.cadUrl,null);
 assert.equal(reconcileCadDimensions([base]).status,'COTAS_PARCIALES');
 const wrong={...base,id:'soclam-4007-55',reference:'40.07/55',
  variant:'H55-PORTAMATRIZ-DOBLE-V',dimensions:{heightMm:55}};
 assert.throws(()=>reconcileCadDimensions([base,wrong]),
  /referencias.*distintos/);
});

test('R109: WILA sin descarga libre no se registra como DXF instalado',()=>{
 const wila=by('wila-tsu-024');
 assert.equal(wila.kind,'upperAdapter');
 assert.equal(wila.dimensions.heightMm,73);
 assert.equal(wila.dimensions.bodyWidthMm,49.5);
 assert.equal(wila.cadUrl,null);
 assert.equal(wila.access,'MYWILA_O_EMAIL');
 const recon=reconcileCadDimensions([wila]);
 assert.equal(recon.status,'COTAS_RECOPILADAS_NO_CERTIFICADAS');
 assert.equal(recon.cadImported,false);
 assert.equal(recon.canApproveForMachine,false);
});

test('R111: fichas UKB 85° y V30° mantienen referencia y amarre independiente',()=>{
 const ids=['ukb-11151','ukb-11200','ukb-10170',
  'ukb-25406','ukb-29351','ukb-29353','ukb-25501','ukb-29552'];
 for(const id of ids){
  const record=by(id);
  assert.ok(record,'Falta referencia OEM '+id);
  assert.match(record.sourceUrl,/^https:\/\/www\.ukb-gmbh\.de\/en\/\d+\.html$/);
  assert.match(record.cadUrl,/^https:\/\/daten\.ukb-gmbh\.de\/dxf\/zip\/\d+\.DXF\.zip$/);
  assert.equal(record.status,'ENLACE_CONFIRMADO_NO_IMPORTADO');
  assert.equal(reconcileCadDimensions([record]).canApproveForMachine,false);
 }
 assert.equal(by('ukb-11151').dimensions.heightMm,104.5);
 assert.equal(by('ukb-11200').dimensions.heightMm,66.5);
 assert.equal(by('ukb-10170').dimensions.tipRadiusMm,.6);
 assert.equal(by('ukb-25406').dimensions.vOpeningMm,20);
 assert.equal(by('ukb-29351').dimensions.vOpeningMm,8);
 assert.equal(by('ukb-29353').dimensions.vOpeningMm,16);
 assert.equal(by('ukb-25501').dimensions.vOpeningMm,6);
 assert.equal(by('ukb-29552').dimensions.vOpeningMm,12);
 assert.notEqual(by('ukb-22316').mount,by('ukb-29353').mount);
 assert.notEqual(by('ukb-22316').dimensions.shoulderRadiusMm,
  by('ukb-29353').dimensions.shoulderRadiusMm);
 assert.equal(by('ukb-11151').cadImported,undefined,
  'Un enlace no equivale a un archivo físicamente importado');
});
