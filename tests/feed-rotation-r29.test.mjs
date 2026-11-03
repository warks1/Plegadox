import test from 'node:test';
import assert from 'node:assert/strict';
import {EXAMPLE,normalized} from '../engine.js';
import {orientFeedIn3D,technicalScene} from '../technical-section.js';

const near=(a,b,tol=1e-6)=>
 assert.ok(Math.abs(a-b)<tol,`Esperado ${b}, obtenido ${a}`);
const length=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y,a.z-b.z);

test('un giro rígido de alimentación conserva las tres dimensiones del tramo',()=>{
 const input=[{x:0,y:0,z:0},{x:30,y:40,z:0}];
 for(const turn of [0,Math.PI/6,Math.PI/2,Math.PI]){
  for(const mirror of [false,true]){
   const pts=orientFeedIn3D(input,mirror,turn);
   near(length(...pts),50);
   near(pts[1].y,40);
  }
 }
 const middle=orientFeedIn3D(input,false,Math.PI/2);
 near(middle[1].x,0);
 near(middle[1].z,-30);
 const end=orientFeedIn3D(input,false,Math.PI);
 near(end[1].x,-30);
 near(end[1].z,0);
});

test('rechaza rotaciones y vértices no finitos',()=>{
 assert.throws(()=>orientFeedIn3D(null,false,0));
 assert.throws(()=>orientFeedIn3D([{x:1,y:0,z:0}],false,NaN));
 assert.throws(()=>orientFeedIn3D([{x:1,y:0,z:Infinity}],false,0));
});

test('omega 1-2-4-3 conserva las longitudes 3D durante todos los cambios de golpe',()=>{
 const p=normalized({...EXAMPLE,gaugeSideByBend:['after','before','before','after']});
 const before=structuredClone(p);
 let foundFeedDepth=false;
 for(const boundary of [5,10,15]){
  const times=[.01,.12,.24,.40,.52,.60,.68,.76,.85,.96,.9999];
  for(const raw of times){
   const time=boundary-.8+raw*.8;
   const scene=technicalScene(p,time);
   const xyz=scene.presentation.points3D;
   assert.ok(Array.isArray(xyz)&&xyz.length===p.flanges.length+1);
   xyz.forEach((pt,i)=>{
    near(scene.presentation.points[i].x,pt.x);
    near(scene.presentation.points[i].y,pt.y);
   });
   for(let i=0;i<p.flanges.length;i++)
    near(length(xyz[i],xyz[i+1]),p.flanges[i],2e-6);
   if(scene.presentation.changingFeedSide &&
      scene.presentation.feedProgress>.3 &&
      scene.presentation.feedProgress<.7){
    foundFeedDepth=true;
    assert.ok(xyz.some(pt=>Math.abs(pt.z)>10),
      'El giro en alimentación debe ocupar profundidad Z, no acortar X');
   }
  }
 }
 assert.ok(foundFeedDepth,'La prueba debe cubrir una rotación intermedia real');
 assert.deepEqual(p,before,'La animación nunca modifica el programa');
});
