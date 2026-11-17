import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {renderBudget,readQuality,saveQuality} from '../adaptive-render-budget.js';
import {prismMesh,machineVolumeMesh,rotate3D,axisRelativeTrails}
 from '../machine-volume-viewer.js';
import {makePrism} from '../volume-engine.js';

test('R125: Galaxy Chrome de alto DPR entra automáticamente en modo económico',()=>{
 const b=renderBudget({width:900,height:1600,dpr:2.5,
  memory:4,cores:6,android:true});
 assert.equal(b.tier,'eco');assert.equal(b.dpr,1);
 assert.ok(b.machineIntervalMs>=130&&b.sceneIntervalMs>=200);
 const fast=renderBudget({width:1440,height:900,dpr:2,
  memory:16,cores:12,android:false});
 assert.equal(fast.tier,'balanced');
 assert.equal(renderBudget({dpr:3},'high').dpr,2);
 assert.equal(renderBudget({dpr:3},'eco').dpr,1);
});
test('R125: preferencias de calidad válidas y registros dañados se toleran',()=>{
 const storage={value:null,getItem(){return this.value;},
  setItem(k,v){this.value=v;}};
 assert.equal(readQuality(storage),'auto');
 saveQuality(storage,'eco');assert.equal(readQuality(storage),'eco');
 storage.value='desconocido';assert.equal(readQuality(storage),'auto');
 assert.throws(()=>saveQuality(storage,'muy-alta'),/desconocida/);
});
test('R125: prismas fabrican tapas y caras laterales con profundidad Z real',()=>{
 const box=makePrism('ejemplo',[{x:0,y:0},{x:20,y:0},
  {x:20,y:10},{x:0,y:10}],-75,75);
 const faces=prismMesh(box,'die');
 assert.equal(faces.length,8);
 assert.equal(faces.filter(f=>f.surface==='side').length,4);
 const zs=new Set(faces.flatMap(f=>f.points.map(p=>p.z)));
 assert.deepEqual([...zs].sort((a,b)=>a-b),[-75,75]);
 assert.ok(faces.every(f=>f.kind==='die'));
 assert.deepEqual(prismMesh({...box,valid:false}),[]);
 const r=rotate3D({x:10,y:20,z:40},.8,.4);
 assert.ok(Number.isFinite(r.x)&&Number.isFinite(r.y)&&Number.isFinite(r.depth));
});
test('R125: chapa, trancha, mesa, punzón, matriz y tope en escena 3D sin declarar OEM',()=>{
 const solid=makePrism('cuerpo',[{x:0,y:0},{x:10,y:0},
  {x:10,y:10},{x:0,y:10}],-50,50);
 const model={sheet:[solid],objects:{ram:solid,bed:solid,punch:solid,die:solid,gauge:solid},
  cadProfilesUsed:[]};
 const result=machineVolumeMesh(model,1000);
 assert.equal(result.faces.length,48);assert.equal(result.verified,false);
 assert.equal(result.hasOEM,false);
 assert.equal(machineVolumeMesh(model,6).omitted.length,6);
});
test('R125: recorridos solo se muestran con signos de ejes y posiciones declaradas',()=>{
 const base=makePrism('ram',[{x:0,y:0},{x:2,y:0},
  {x:2,y:2},{x:0,y:2}],-100,100);
 const model={objects:{ram:base,gauge:base}};
 const poses=[
  {axes:{Y1:0,Y2:0,X:0,R:0,Z1:0,Z2:0}},
  {axes:{Y1:10,Y2:20,X:40,R:10,Z1:50,Z2:-20}}
 ];
 const signs={Y:1,X:1,R:1,Z1:1,Z2:-1};
 assert.deepEqual(axisRelativeTrails({poses},null,model),[]);
 const tracks=axisRelativeTrails({poses},{signs},model);
 assert.equal(tracks.length,4);
 assert.equal(tracks[0].points[1].y-tracks[0].points[0].y,10);
 assert.equal(tracks[1].points[1].y-tracks[1].points[0].y,20);
 assert.equal(tracks[2].points[1].x-tracks[2].points[0].x,40);
 assert.equal(tracks[3].points[1].z-tracks[3].points[0].z,20);
});
test('R125: visor nuevo no sustituye avisos de colisión ni versión offline',()=>{
 const html=readFileSync(new URL('../index.html',import.meta.url),'utf8');
 const app=readFileSync(new URL('../app.js',import.meta.url),'utf8');
 const sw=readFileSync(new URL('../sw.js',import.meta.url),'utf8');
 for(const id of ['machineSolidToggle','machineSolidCanvas',
  'machineSolidStatus','machineRenderQuality'])
  assert.ok(html.includes('id="'+id+'"'),'Falta '+id);
 assert.match(app,/PLEGADOX_SOLID_ACTIVE/);
 assert.match(sw,/"\.\/machine-volume-viewer\.js"/);
 assert.match(sw,/"\.\/adaptive-render-budget\.js"/);
});
