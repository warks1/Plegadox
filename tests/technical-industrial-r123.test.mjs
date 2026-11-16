import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {sectionPunch,sectionDie} from '../tool-profiles.js';
import {industrialContourFeatures} from '../industrial-tool-finish.js';
const source=readFileSync(new URL('../technical-section.js',import.meta.url),'utf8');
const machine=readFileSync(new URL('../machine-visual.js',import.meta.url),'utf8');
test('R123: simulación técnica 2D y vista industrial comparten el motor de acabado mecanizado',()=>{
 assert.match(source,/import \{drawMachinedToolSection\} from '\.\/industrial-tool-finish\.js'/);
 assert.match(source,/drawMachinedToolSection\(ctx,dp\.map\(p=>\[p\.x,p\.y\]\),\{kind:'die',scale\}\)/);
 assert.match(source,/drawMachinedToolSection\(ctx,pp\.map\(p=>\[p\.x,p\.y\]\)/);
 assert.match(machine,/drawMachinedToolSection\(ctx,pts,\{kind:'punch',scale,transparent\}\)/);
 assert.match(machine,/drawMachinedToolSection\(ctx,pts,\{kind:'die',scale\}\)/);
});
test('R123: el acabado del punzón cabra conserva la escotadura; no suplanta la CAD original',()=>{
 const profile=sectionPunch({type:'cabra',angle:88,tip:1.6,height:165,reference:'1031'});
 const copy=JSON.stringify(profile.points);
 const result=industrialContourFeatures(profile.points,'punch');
 assert.equal(JSON.stringify(profile.points),copy);
 assert.equal(result.sourcePoints,profile.points.length);
 assert.ok(result.workingEdges.length>0);
});
test('R123: matriz importada conserva V OEM y origen de la sección aun con varias entalladuras',()=>{
 const original=[[-27,50],[-17,50],[-12,31],[-7,50],
  [1,50],[5,38],[11,50],[27,50],[27,0],[-27,0]];
 const d=sectionDie({importedDxf:true,profilePoints:original,
  opening:12,angle:88,height:50});
 assert.deepEqual(d.points,original);
 assert.deepEqual(industrialContourFeatures(d.points,'die').bounds,
  {minX:-27,maxX:27,minY:0,maxY:50,width:54,height:50});
});
