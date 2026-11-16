import test from 'node:test';
import assert from 'node:assert/strict';
import {inspectToolDxfLayers,parseToolDxf} from '../tool-dxf.js';
const text=[
 '0','SECTION','2','HEADER','9','$INSUNITS','70','4',
 '0','ENDSEC','0','SECTION','2','ENTITIES',
 '0','LWPOLYLINE','8','OEM_PERFIL','90','4','70','1',
 '10','-12','20','110','10','12','20','110',
 '10','12','20','0','10','-12','20','0',
 '0','LINE','8','DIMENSIONES','10','-300','20','120',
 '11','300','21','120',
 '0','ENDSEC','0','EOF',''
].join('\n');
test('R120: DXF OEM con línea de cotas separada no importa geometría extra sin permiso',()=>{
 assert.throws(()=>parseToolDxf(text),/varios contornos|mezclar|cadenas|sobrantes/);
 const inventory=inspectToolDxfLayers(text);
 assert.deepEqual(inventory.layers.map(x=>x.name),['DIMENSIONES','OEM_PERFIL']);
 assert.equal(inventory.entityCount,2);
 assert.equal(inventory.profileCertified,false);
});
test('R120: seleccionar capa de contorno de forma explícita conserva cotas reales',()=>{
 const model=parseToolDxf(text,{entityLayer:'OEM_PERFIL'});
 assert.equal(model.width,24);
 assert.equal(model.height,110);
 assert.equal(model.unitsAssumed,false);
 assert.throws(()=>parseToolDxf(text,{entityLayer:'DIMENSIONES'}),
  /contorno cerrado|segmentos LINE|no forman/);
 assert.throws(()=>parseToolDxf(text,{entityLayer:'OTRA'}),
  /no contiene entidades/);
});
test('R120: inventario de capas no convierte un DXF incompleto en CAD válido',()=>{
 assert.equal(inspectToolDxfLayers(text).layers.find(x=>
  x.name==='DIMENSIONES').types.LINE,1);
 assert.ok(parseToolDxf(text,{entityLayer:'OEM_PERFIL'}).points.length>=4);
});
