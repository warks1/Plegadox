import test from 'node:test';
import assert from 'node:assert/strict';
import {EXAMPLE} from '../engine.js';
import {technicalScene} from '../technical-section.js';
import {V85_FACTORY} from '../machine-config.js';
import {triangulateSimplePolygon,intersectionArea2D,makePrism,prismOverlap,
 buildVolumeScene,inspectVolumeFrame} from '../volume-engine.js';
import {scanVolumeTrajectory} from '../volume-trajectory-review.js';
const box=(x1,y1,x2,y2)=>[
 {x:x1,y:y1},{x:x2,y:y1},{x:x2,y:y2},{x:x1,y:y2}
];
test('intersección volumétrica exige penetración XY y solape real en Z',()=>{
 const a=makePrism('a',box(0,0,10,10),0,10);
 const b=makePrism('b',box(5,5,15,15),5,15);
 const c=makePrism('c',box(5,5,15,15),10,20);
 assert.ok(prismOverlap(a,b).intersects);
 assert.ok(Math.abs(prismOverlap(a,b).volume-125)<1e-6);
 assert.equal(prismOverlap(a,c).intersects,false);
});
test('polígono cóncavo no se convierte incorrectamente en su caja envolvente',()=>{
 const l=[{x:0,y:0},{x:4,y:0},{x:4,y:1},{x:1,y:1},{x:1,y:4},{x:0,y:4}];
 assert.equal(triangulateSimplePolygon(l).length,4);
 const empty=intersectionArea2D(l,box(2,2,3,3));
 assert.equal(empty.area,0);
 assert.equal(empty.geometryValid,true);
 const hit=intersectionArea2D(l,box(0,0,2,2));
 assert.ok(Math.abs(hit.area-3)<1e-6);
});
test('datos Cybelec 2040 mm se usan para los prismas de trancha y mesa',()=>{
 const scene=technicalScene(EXAMPLE,0);
 const model=buildVolumeScene(scene,{machine:V85_FACTORY});
 assert.equal(model.objects.ram.zMax-model.objects.ram.zMin,2040);
 assert.equal(model.objects.bed.zMax-model.objects.bed.zMin,2040);
 assert.equal(model.objects.gauge.provenance,'Z-del-dedo-desconocida-envolvente-conservadora');
 assert.ok(model.sheet.length>0);
 assert.equal(model.verified,false);
});
test('motor no emite una falsa autorización industrial',()=>{
 const report=inspectVolumeFrame(technicalScene(EXAMPLE,0),{machine:V85_FACTORY});
 assert.equal(report.verified,false);
 assert.equal(report.canApproveForMachine,false);
 assert.ok(report.model.objects.ram.valid);
});
test('barrido recorre todos los golpes, manteniendo signos y orden original',()=>{
 const copy=structuredClone(EXAMPLE);
 const scan=scanVolumeTrajectory(EXAMPLE,{samplesPerOperation:4,
  inspect:(_part,time)=>({issues:time<.16?[{kind:'bed',severity:'interferencia-envolvente',volumeMm3:12}]:[],
   model:{sheet:[],objects:{}}})});
 assert.equal(scan.operations.length,4);
 assert.ok(scan.framesChecked>=4*6);
 assert.equal(scan.operations[0].bend,0);
 assert.equal(scan.operations[2].bend,3);
 assert.equal(scan.byKind.bed,1);
 assert.equal(scan.canApproveForMachine,false);
 assert.equal(scan.continuousCollisionVerified,false);
 assert.deepEqual(EXAMPLE,copy);
});
test('intervalo barrido indica riesgo entre poses aunque sus extremos estén libres',()=>{
 const mk=(x)=>makePrism('s',box(x,0,x+1,1),0,1);
 const fixed=makePrism('ram',box(4,0,6,1),0,1);
 const scan=scanVolumeTrajectory({...EXAMPLE,flanges:[50,50],angles:[90],order:[0]},{
  samplesPerOperation:4,inspect:(_p,time)=>({
   issues:[],model:{sheet:[mk(time<1?0:10)],
    objects:{ram:fixed,bed:null,gauge:null,punch:null,die:null}}
  })
 });
 assert.ok(scan.uncertainSweptIntervals>0);
 assert.equal(scan.verified,false);
});
