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
const nose=()=>wrap(lw([[-20,100],[20,100],[20,35],[0,0],[-20,35]]));
const vDie=()=>wrap(lw([[-24,80],[-8,80],[0,63],[8,80],[24,80],[24,0],[-24,0]]));
const line=(x,y,x2,y2)=>['0','LINE','8','0','10',String(x),'20',String(y),
 '11',String(x2),'21',String(y2)];
const arc=(cx,cy,r,start,end,extra=[])=>['0','ARC','8','PERFIL',
 '10',String(cx),'20',String(cy),'40',String(r),
 '50',String(start),'51',String(end),...extra];
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
 assert.throws(()=>parseToolDxf(wrap(['0','ARC','10','0','20','0','40','20'])),/Ángulo inicial ARC/);
 assert.throws(()=>parseToolDxf(wrap(lw([[-20,100],[20,100],[20,0],[-20,0]],false))),/cerrada/);
 assert.throws(()=>parseToolDxf(wrap(lw([[-20,100],[20,0],[-20,0],[20,100]]))),/autointersecado|área/);
 assert.throws(()=>parseToolDxf(wrap([...line(0,0,40,0),...line(40,0,40,90),...line(40,90,0,90)])),/cerrar el contorno/);
 assert.throws(()=>validateContour([[-20,0],[20,0],[20,0],[-20,100]]),/duplicados/);
});
test('un perfil CAD con ARC real y LINE se ensambla por los extremos en cualquier orden',()=>{
 const shape=wrap([
  ...line(-20,0,20,0),
  ...arc(0,80,20,0,180),
  ...line(20,0,20,80),
  ...line(-20,80,-20,0)
 ]);
 const parsed=parseToolDxf(shape);
 assert.equal(parsed.width,40);
 assert.ok(Math.abs(parsed.height-100)<.001);
 assert.ok(parsed.points.length>20);
 assert.equal(parsed.unitsAssumed,false);
});
test('un arco ARC OCS inclinado o sin ángulos no se importa como sección plana',()=>{
 const base=[...line(-20,0,20,0),...line(20,0,20,80),
  ...arc(0,80,20,0,180,['210','1']),...line(-20,80,-20,0)];
 assert.throws(()=>parseToolDxf(wrap(base)),/fuera del plano XY|extrusión OCS/);
 assert.throws(()=>parseToolDxf(wrap([...arc(0,80,30000,0,180)])),/800 puntos|dos segmentos/);
});
test('punch y matriz importados comparten el contorno DXF con la sección técnica (no CAD certificado)',()=>{
 const dPunch=parseToolDxf(nose()),dDie=parseToolDxf(vDie());
 const punch=importedTool(dPunch,{kind:'punch',name:'Punzón DXF',angle:88,length:415,tip:.8});
 const die=importedTool(dDie,{kind:'die',name:'Matriz DXF',angle:88,length:415,opening:16});
 assert.equal(punch.verifiedSpecs,false);assert.equal(die.verifiedSpecs,false);
 assert.equal(punch.profileAccuracy,'provisional');
 assert.equal(punch.datumVerified,false);
 assert.deepEqual(sectionPunch(punch).points,dPunch.points);
 assert.deepEqual(sectionDie(die).points,dDie.points);
 registerImportedTools(DIES,PUNCHES,[punch,die]);
 const scene=technicalScene({...EXAMPLE,punch:punch.id,die:die.id},2.8);
 assert.equal(scene.punch.importedDxf,true);
 assert.equal(scene.die.importedDxf,true);
 assert.equal(scene.punchPolygon.length,dPunch.points.length);
 assert.equal(scene.diePolygon.length,dDie.points.length);
 assert.equal(scene.verified,false);
});
test('importación persistente y rehidratación de una biblioteca personalizada',()=>{
 const memory=new Map();
 const storage={getItem:k=>memory.get(k)||null,setItem:(k,v)=>memory.set(k,v)};
 const tool=importedTool(parseToolDxf(vDie()),
  {kind:'die',name:'Matriz guardada',angle:88,length:500,opening:16});
 assert.equal(persistImportedTool(storage,tool),1);
 assert.ok(memory.get(TOOL_DXF_STORAGE_KEY));
 const loaded=loadImportedTools(storage);
 assert.equal(loaded.length,1);
 assert.deepEqual(loaded[0].profilePoints,tool.profilePoints);
 assert.throws(()=>persistImportedTool(storage,tool),/ya está registrada/);
});

test('DXF declara WILA o Promecam sin afirmar homologación del amarre',()=>{
 const contour=parseToolDxf(nose()),dieContour=parseToolDxf(vDie());
 const wila=importedTool(contour,{kind:'punch',name:'BIU OEM importado',
  angle:88,length:415,tip:1,mount:'WILA'});
 const promecam=importedTool(dieContour,{kind:'die',name:'Matriz Promecam importada',
  angle:88,length:415,opening:16,mount:'Amada/Promecam'});
 assert.equal(wila.mount,'WILA');
 assert.equal(promecam.mount,'Amada/Promecam');
 assert.equal(wila.mountVerified,false);
 assert.equal(promecam.mountVerified,false);
 assert.equal(wila.verifiedSpecs,false);
 const undecided=importedTool(contour,{kind:'punch',name:'Sin identificar',
  angle:88,length:415,tip:1});
 assert.equal(undecided.mount,'');
 assert.throws(()=>importedTool(contour,{kind:'punch',name:'Amarre falso',
  angle:88,length:415,tip:1,mount:'Certificado OEM'}),/Tipo de amarre no admitido/);
});
