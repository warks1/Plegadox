import test from 'node:test';
import assert from 'node:assert/strict';
import {buildCustomTool} from '../custom-tool-geometry.js';
import {parseToolDxf} from '../tool-dxf.js';
import {exportToolContourDxf,safeToolDxfName} from '../tool-dxf-export.js';
const inputs=[
 {kind:'die',name:'V16/88º Promecam',angle:88,height:60,width:50,
  opening:16,shoulderRadius:1.5,offset:0,length:415,mount:'Amada/Promecam'},
 {kind:'punch',name:'Punzón recto WILA 88',shape:'straight',angle:88,
  height:120,width:50,length:415,shankWidth:20,shankHeight:20,
  tipRadius:1,mount:'WILA'},
 {kind:'punch',name:'Pata de cabra 90',shape:'gooseneck',angle:90,
  height:150,width:60,length:415,shankWidth:20,shankHeight:22,
  tipRadius:1,neckDepth:18,mount:'WILA'}
];
test('perfiles por cotas se exportan como DXF 2D y vuelven a entrar al importador',()=>{
 for(const input of inputs){
  const model=buildCustomTool(input);
  const exported=exportToolContourDxf(model);
  assert.match(exported,/\n9\n\$INSUNITS\n70\n4\n/);
  assert.match(exported,/\n0\nLWPOLYLINE\n/);
  assert.match(exported,/\n70\n1\n/);
  const reimported=parseToolDxf(exported);
  assert.equal(reimported.points.length,model.points.length);
  assert.ok(Math.abs(reimported.height-model.height)<.01);
  assert.ok(Math.abs(reimported.width-model.width)<.01);
  assert.equal(reimported.unitsAssumed,false);
 }
});
test('nombres de exportación no contienen rutas ni caracteres peligrosos',()=>{
 assert.equal(safeToolDxfName('Pata de cabra / WILA Nº1'),
  'pata-de-cabra-wila-no1-NO-CERTIFICADO.dxf');
 assert.equal(safeToolDxfName('../../\\<script>alert(1)'),
  'script-alert-1-NO-CERTIFICADO.dxf');
});
test('no admite polígono autointersecado ni valores no finitos',()=>{
 assert.throws(()=>exportToolContourDxf({
  name:'invalido',points:[[0,0],[20,20],[0,20],[20,0]]
 }),/intersec|contorno|perfil/i);
 assert.throws(()=>exportToolContourDxf({
  name:'invalido',points:[[0,0],[NaN,2],[20,2]]
 }));
});
