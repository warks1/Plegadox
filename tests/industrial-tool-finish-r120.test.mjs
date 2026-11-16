import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {industrialContourFeatures,drawMachinedToolSection} from '../industrial-tool-finish.js';
import {sectionPunch,sectionDie} from '../tool-profiles.js';
const isEdge=(points,[a,b])=>points.some((p,i)=>{
 const q=points[(i+1)%points.length];
 return p[0]===a[0]&&p[1]===a[1]&&q[0]===b[0]&&q[1]===b[1];
});
test('R120: la pintura industrial de matriz usa solo ARISTAS EXISTENTES en el perfil CAD',()=>{
 const points=[[-22,40],[-11,40],[-7,32],[0,15],[7,32],[11,40],
  [22,40],[22,0],[-22,0]];
 const result=industrialContourFeatures(points,'die');
 assert.ok(result.workingEdges.length>0);
 assert.ok(result.workingEdges.every(edge=>isEdge(points,edge)));
 assert.equal(result.bounds.width,44);
 assert.equal(result.bounds.height,40);
});
test('R120: los contornos de pata de cabra y matriz multivía no cambian al dibujar',()=>{
 const punch=sectionPunch({height:150,angle:88,tip:2,type:'cabra',
  reference:'GN9-12-8806'});
 const die=sectionDie({opening:16,height:80,angle:88,outerWidth:60});
 const p0=structuredClone(punch.points),d0=structuredClone(die.points);
 assert.ok(industrialContourFeatures(punch.points,'punch').workingEdges.length>0);
 assert.ok(industrialContourFeatures(die.points,'die').workingEdges.length>0);
 assert.deepEqual(punch.points,p0);
 assert.deepEqual(die.points,d0);
});
test('R120: renderizado mecanizado recorta el brillo DENTRO del polígono original',()=>{
 const steps=[];
 const ctx={createLinearGradient:()=>({addColorStop:(t,c)=>steps.push(['stop',t,c])})};
 for(const action of ['save','restore','beginPath','lineTo','moveTo',
  'closePath','fill','stroke','clip','fillRect'])
  ctx[action]=(...args)=>steps.push([action,...args]);
 const points=[[-10,40],[10,40],[10,0],[-10,0]];
 const result=drawMachinedToolSection(ctx,points,{kind:'die',scale:1});
 assert.equal(result.bounds.height,40);
 assert.ok(steps.some(x=>x[0]==='clip'));
 assert.ok(steps.some(x=>x[0]==='fill'));
 assert.ok(steps.some(x=>x[0]==='stroke'));
 assert.deepEqual(points,[[-10,40],[10,40],[10,0],[-10,0]]);
});
test('R120: no añadir una V nominal ficticia encima de matrices DXF',()=>{
 const scene=readFileSync(new URL('../machine-visual.js',import.meta.url),'utf8');
 assert.match(scene,/drawMachinedToolSection\(ctx,pts,\{kind:'die',scale\}\)/);
 assert.doesNotMatch(scene,/ctx\.moveTo\(cx-half,cy\)/);
 const sw=readFileSync(new URL('../sw.js',import.meta.url),'utf8');
 assert.ok(sw.includes('"./industrial-tool-finish.js"'),
  'PWA offline debe cachear el módulo que usa la vista 2D/3D');
});
