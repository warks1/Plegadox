import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {EXAMPLE} from '../engine.js';
import {technicalScene,technicalCameraBounds} from '../technical-section.js';

const sets=[
 EXAMPLE,
 {...EXAMPLE,name:'Omega con alas largas',flanges:[60,85,120,85,60],
  angles:[90,-90,-90,90],order:[0,1,3,2],thickness:6,die:'v32'},
 {...EXAMPLE,name:'Caja con diferente apoyo',
  flanges:[35,120,80,110,35],angles:[-90,90,-90,90],
  order:[0,3,1,2],gaugeSideByBend:['before','after','before','after']}
];
const inside=(bounds,pt)=>
 pt.x>=bounds.minX-1e-6&&pt.x<=bounds.maxX+1e-6&&
 pt.y>=bounds.minY-1e-6&&pt.y<=bounds.maxY+1e-6;
test('R90: cámara 2D siempre cubre golpe y volteo sin autoencuadre por fotograma',()=>{
 for(const piece of sets){
  const stable=technicalCameraBounds(piece);
  assert.equal(stable,technicalCameraBounds({...piece}),'debe utilizar cache geometrica');
  const operations=piece.order.length;
  for(let op=0;op<operations;op++)
   for(const sub of [0,.16,.36,.44,.52,.68,.83,.84,.86,.88,.90,.92,.94,.96,.98,.9999]){
    const scene=technicalScene(piece,5*(op+sub));
    for(const pt of [...scene.sheetDisplay,...scene.punchPolygon,...scene.diePolygon])
     assert.ok(inside(stable,pt),
      piece.name+' operacion '+op+' sub '+sub+' punto '+JSON.stringify(pt));
   }
 }
});
test('R90: punzón estacionado mantiene LA MISMA coordenada de pantalla durante volteo',()=>{
 const bounds=technicalCameraBounds(EXAMPLE),width=900,height=560;
 const padW=Math.max(28,width*.07),padH=Math.max(30,height*.095);
 const scale=Math.max(.08,Math.min((width-padW*2)/Math.max(60,bounds.maxX-bounds.minX),
  (height-padH*2)/Math.max(100,bounds.maxY-bounds.minY)));
 const my=(bounds.minY+bounds.maxY)/2;
 for(let op=0;op<EXAMPLE.order.length-1;op++){
  const pixels=[.845,.86,.88,.90,.92,.94,.96,.98,.99999]
   .map(sub=>height*.5-(technicalScene(EXAMPLE,5*(op+sub)).kinematics.tipHeight-my)*scale);
  assert.ok(pixels.every(v=>Math.abs(v-pixels[0])<1e-5),
   'Punzón visual salta en el volteo '+op+': '+JSON.stringify(pixels));
 }
});
test('R90: cabina sección y marcadores de interferencia usan idéntica cámara',()=>{
 const tech=readFileSync(new URL('../technical-section.js',import.meta.url),'utf8');
 const machine=readFileSync(new URL('../machine-visual.js',import.meta.url),'utf8');
 assert.match(tech,/const bounds=technicalCameraBounds\(piece\)/);
 assert.match(machine,/const world=technicalCameraBounds\(piece\)/);
});
