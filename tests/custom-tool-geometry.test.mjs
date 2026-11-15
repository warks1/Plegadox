import test from 'node:test';
import assert from 'node:assert/strict';
import {buildCustomTool,customToolRecord} from '../custom-tool-geometry.js';
import {sectionPunch,sectionDie,sectionBounds} from '../tool-profiles.js';
import {persistImportedTool,loadImportedTools,registerImportedTools} from '../tool-dxf.js';

const base={kind:'punch',shape:'straight',name:'Recto 88',
 angle:88,height:120,width:50,length:415,mount:'WILA',
 shankWidth:20,shankHeight:20,tipRadius:1,neckDepth:18};
const store=()=>{const values=new Map();return {
 getItem:k=>values.get(k)??null,setItem:(k,v)=>values.set(k,v)};};
test('crea perfil de punzón recto por cotas y respeta H y anchura',()=>{
 const g=buildCustomTool(base),t=customToolRecord(g),v=sectionPunch(t);
 assert.equal(g.kind,'punch');assert.equal(g.shape,'straight');
 assert.equal(t.mount,'WILA');assert.equal(t.tip,2);
 assert.equal(t.customProfile,true);assert.equal(t.importedDxf,false);
 assert.equal(v.points.length,g.points.length);
 const b=sectionBounds(v.points);
 assert.ok(Math.abs(b.maxY-b.minY-120)<.001);
 assert.ok(b.maxX-b.minX>=49);
});
test('pata de cabra crea contorno distinto con cuello introducido',()=>{
 const a=buildCustomTool(base),b=buildCustomTool({...base,
  shape:'gooseneck',name:'Pata H150',height:150,neckDepth:18});
 assert.equal(b.shape,'gooseneck');assert.equal(b.dimensions.neckDepth,18);
 assert.notDeepEqual(a.points,b.points);
 assert.equal(customToolRecord(b).type,'cabra');
});
test('matriz genera V a la apertura y ángulo declarados',()=>{
 const g=buildCustomTool({kind:'die',name:'V16 Promecam',angle:88,
  height:60,width:50,length:415,mount:'Amada/Promecam',
  opening:16,shoulderRadius:1.5,offset:0});
 const t=customToolRecord(g),b=sectionBounds(sectionDie(t).points);
 assert.equal(t.opening,16);assert.equal(t.angle,88);
 assert.equal(t.mount,'Amada/Promecam');
 assert.equal(t.profileAccuracy,'provisional');
 assert.ok(Math.abs(b.maxY-b.minY-60)<.001);
});
test('no acepta V que atraviesa el bloque ni cuello que se cruza',()=>{
 assert.throws(()=>buildCustomTool({kind:'die',name:'inv',angle:30,height:30,
  width:90,opening:70,shoulderRadius:0,offset:0,
  length:415,mount:'Amada/Promecam'}),/atraviesa/);
 assert.throws(()=>buildCustomTool({...base,shape:'gooseneck',
  neckDepth:45}),/Cuello|cuello/);
});
test('un dibujo personalizable permanece almacenado tras recargar',()=>{
 const storage=store(),tool=customToolRecord(buildCustomTool(base));
 persistImportedTool(storage,tool);
 const restored=loadImportedTools(storage);
 assert.equal(restored.length,1);
 assert.equal(restored[0].customProfile,true);
 const punches=[],dies=[];
 registerImportedTools(dies,punches,restored);
 assert.equal(punches[0].id,tool.id);
 assert.deepEqual(sectionPunch(punches[0]).points,tool.profilePoints);
});
