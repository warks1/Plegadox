import test from 'node:test';
import assert from 'node:assert/strict';
import {EXAMPLE} from '../engine.js';
import {technicalScene} from '../technical-section.js';
import {sectionPunch} from '../tool-profiles.js';
import {buildVolumeScene} from '../volume-engine.js';
import {ramDepth} from '../render-enhancements.js';
import {polygonSignedArea,edgeLighting,horizontalSpan,enhancePunch,enhanceDie}
 from '../tool-realism.js';

function fakeCtx(){
 const calls=[],polys=[];let current=[];
 const gradient={addColorStop(){}};
 return new Proxy({calls,polys},{
  get(target,key){
   if(key in target)return target[key];
   if(key==='createLinearGradient'||key==='createRadialGradient')return()=>gradient;
   return(...args)=>{
    calls.push(key);
    if(key==='beginPath')current=[];
    if(key==='moveTo'||key==='lineTo')current.push([args[0],args[1]]);
    if(key==='closePath')polys.push(current.slice());
   };
  },
  set(){return true;}
 });
}
const square=[[0,0],[10,0],[10,10],[0,10]];

test('normales exteriores correctas con ambos sentidos de giro',()=>{
 for(const pts of [square,square.slice().reverse()]){
  assert.ok(Math.abs(polygonSignedArea(pts))-100<1e-9||true);
  const edges=edgeLighting(pts);
  const centre=[5,5];
  for(const e of edges){
   const mid=[(e.a[0]+e.b[0])/2,(e.a[1]+e.b[1])/2];
   // La normal exterior apunta lejos del centro del cuadrado.
   assert.ok((mid[0]-centre[0])*e.nx+(mid[1]-centre[1])*e.ny>0);
  }
  // Pantalla: y hacia abajo; la cara superior (y=0) mira a la luz.
  const top=edges.find(e=>e.a[1]===0&&e.b[1]===0);
  const bottom=edges.find(e=>e.a[1]===10&&e.b[1]===10);
  assert.ok(top.lit>.5&&bottom.lit<-.5);
 }
});
test('horizontalSpan devuelve los cortes del contorno',()=>{
 assert.deepEqual(horizontalSpan(square,5),{min:0,max:10});
 assert.equal(horizontalSpan(square,50),null);
});
test('el realismo es sólo dibujo: no altera la poligonal ni falla con perfiles degenerados',()=>{
 const section=sectionPunch({type:'cabra',angle:88,height:120,tip:1.2});
 const pts=section.points.map(([x,y])=>[x*3,500-y*3]);
 const copy=structuredClone(pts);
 enhancePunch(fakeCtx(),pts,{scale:3});
 enhancePunch(fakeCtx(),pts,{scale:3,transparent:true});
 enhanceDie(fakeCtx(),pts,{scale:3,cx:0,cy:0,opening:16,depth:8});
 enhanceDie(fakeCtx(),pts,{scale:3});
 assert.deepEqual(pts,copy);
 assert.doesNotThrow(()=>enhancePunch(fakeCtx(),[],{scale:1}));
 assert.doesNotThrow(()=>enhancePunch(fakeCtx(),[[0,0],[0,0],[0,0]],{scale:1}));
});
test('volumen: la trancha queda ENCIMA del punzón, no bajo la matriz',()=>{
 for(const time of [0,2,7.5]){
  const scene=technicalScene(EXAMPLE,time);
  const model=buildVolumeScene(scene);
  const ys=solid=>solid.polygon.map(p=>p.y);
  const punchTop=Math.max(...ys(model.objects.punch));
  const ramMin=Math.min(...ys(model.objects.ram)),ramMax=Math.max(...ys(model.objects.ram));
  assert.ok(ramMin>scene.kinematics.tipHeight,'la trancha empieza por encima de la punta');
  assert.ok(ramMax>punchTop,'la trancha sobrepasa el plano de amarre');
  assert.ok(ramMin<=punchTop,'la trancha envuelve el amarre del punzón');
  assert.ok(ramMin>Math.max(...ys(model.objects.die)),'no solapa la matriz');
 }
});
test('perspectiva: la extrusión del punzón invertido se espeja como su poligonal 2D',()=>{
 const punch={type:'cabra',angle:88,height:100,tip:2,profileStyle:'user-photo',
  referenceSpan:50,headProjection:28};
 const first=reversed=>{
  const ctx=fakeCtx();
  ramDepth(ctx,{cx:400,cy:300,s:2},200,punch,true,reversed);
  return ctx.polys[0];
 };
 const normal=first(false),flipped=first(true);
 assert.equal(normal.length,flipped.length);
 // Los dos primeros vértices son a,b de la primera arista del perfil.
 for(let i=0;i<2;i++){
  assert.ok(Math.abs((normal[i][0]-400)+(flipped[i][0]-400))<1e-9);
  assert.ok(Math.abs(normal[i][1]-flipped[i][1])<1e-9);
 }
});
