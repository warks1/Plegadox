import test from 'node:test';
import assert from 'node:assert/strict';
import {parseToolDxf,importedTool,validateContour,loadImportedTools,
 persistImportedTool,registerImportedTools,TOOL_DXF_STORAGE_KEY} from '../tool-dxf.js';
import {sectionPunch,sectionDie} from '../tool-profiles.js';
import {PUNCHES,DIES,EXAMPLE} from '../engine.js';
import {technicalScene} from '../technical-section.js';
const pairs=a=>a.join('\n')+'\n';
const wrap=(entities,units=4)=>pairs([
 '0','SECTION','2','HEADER','9','$INSUNITS','70',String(units),'0','ENDSEC',
 '0','SECTION','2','ENTITIES',...entities,'0','ENDSEC','0','EOF']);
const lw=(coords,closed=true)=>['0','LWPOLYLINE','8','PERFIL','90',String(coords.length),'70',closed?'1':'0',
 ...coords.flatMap(([x,y,b])=>['10',String(x),'20',String(y),...(b?['42',String(b)]:[])])];
const rectangle=()=>wrap(lw([[-20,100],[20,100],[20,0],[-20,0]]));
const line=(x,y,x2,y2)=>['0','LINE','8','0','10',String(x),'20',String(y),
 '11',String(x2),'21',String(y2)];
test('DXF ASCII cerrado conserva cotas y reubica el contorno en milímetros',()=>{
 const d=parseToolDxf(rectangle());
 assert.equal(d.width,40);
 assert.equal(d.height,100);
 assert.equal(d.points.length,4);
 assert.equal(d.unitsAssumed,false);
 assert.deepEqual(d.points[0],[-20,100]);
});
test('un único anillo de LINE se reordena aunque las entidades estén mezcladas',()=>{
 const d=parseToolDxf(wrap([
 ...line(20,0,-20,0),...line(-20,100,20,100),
 ...line(-20,0,-20,100),...line(20,100,20,0)]));
 assert.equal(d.points.length,4);
 assert.equal(d.height,100);
});
test('arcos bulge de LWPOLYLINE se muestrean sin cambiar la forma a un rectángulo',()=>{
 const d=parseToolDxf(wrap(lw([
 [-20,100],[20,100],[20,0,.2],[-20,0]
 ])));
 assert.ok(d.points.length>5);
 assert.ok(d.height>95);
});
test('rechaza unidades pulgadas, entidades no compatibles, contornos abiertos y autointersección',()=>{
 assert.throws(()=>parseToolDxf(wrap(lw([[-20,100],[20,100],[20,0],[-20,0]]),1)),/no milimétricas/);
 assert.throws(()=>parseToolDxf(wrap(['0','ARC','10','0','20','0','40','20'])),/ARC no admitida/);
 assert.throws(()=>parseToolDxf(wrap(lw([[-20,100],[20,100],[20,0],[-20,0]],false))),/cerrada/);
 assert.throws(()=>parseToolDxf(wrap(lw([[-20,100],[20,0],[-20,0],[20,100]]))),/autointersecado|área/);
 assert.throws(()=>parseToolDxf(wrap([...line(0,0,40,0),...line(40,0,40,90),...line(40,90,0,90)])),/cerrar el contorno/);
 assert.throws(()=>validateContour([[-20,0],[20,0],[20,0],[-20,100]]),/duplicados/);
});
test('punch y matriz importados comparten el contorno DXF con la sección técnica (no CAD certificado)',()=>{
 const d=parseToolDxf(rectangle());
 const punch=importedTool(d,{kind:'punch',name:'Punzón DXF',angle:88,length:415,tip:.8});
 const die=importedTool(d,{kind:'die',name:'Matriz DXF',angle:88,length:415,opening:16});
 assert.equal(punch.verifiedSpecs,false);assert.equal(die.verifiedSpecs,false);
 assert.equal(punch.profileAccuracy,'provisional');
 assert.deepEqual(sectionPunch(punch).points,d.points);
 assert.deepEqual(sectionDie(die).points,d.points);
 registerImportedTools(DIES,PUNCHES,[punch,die]);
 const scene=technicalScene({...EXAMPLE,punch:punch.id,die:die.id},2.8);
 assert.equal(scene.punch.importedDxf,true);
 assert.equal(scene.die.importedDxf,true);
 assert.equal(scene.punchPolygon.length,d.points.length);
 assert.equal(scene.diePolygon.length,d.points.length);
 assert.equal(scene.verified,false);
});
test('importación persistente y rehidratación de una biblioteca personalizada',()=>{
 const memory=new Map();
 const storage={getItem:k=>memory.get(k)||null,setItem:(k,v)=>memory.set(k,v)};
 const tool=importedTool(parseToolDxf(rectangle()),
  {kind:'die',name:'Matriz guardada',angle:88,length:500,opening:16});
 assert.equal(persistImportedTool(storage,tool),1);
 assert.ok(memory.get(TOOL_DXF_STORAGE_KEY));
 const loaded=loadImportedTools(storage);
 assert.equal(loaded.length,1);
 assert.deepEqual(loaded[0].profilePoints,tool.profilePoints);
 assert.throws(()=>persistImportedTool(storage,tool),/ya está registrada/);
});
