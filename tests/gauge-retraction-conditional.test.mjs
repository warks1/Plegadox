import test from 'node:test';
import assert from 'node:assert/strict';
import {planGaugeRetraction,gaugeRetractionPath,GAUGE_REPOSITION_START} from '../gauge-retract-motion.js';
const anchor={x:40,y:0},target={x:70,y:0};
const finger=[{x:40,y:-9},{x:50,y:-9},{x:50,y:0},{x:40,y:0}];
const sample=(p,q)=>({at:p,sheet:q});
test('sin colisión prevista no retrocede en la fase de plegado',()=>{
 const plan=planGaugeRetraction({
  sheetSamples:[sample(.48,[{x:0,y:1},{x:38,y:1}]),
   sample(.68,[{x:0,y:1},{x:38,y:1}])],
  polygon:finger,thickness:1,contact:anchor
 });
 assert.equal(plan.enabled,false);
 assert.equal(plan.known,true);
 assert.equal(gaugeRetractionPath({anchor,target,maxSheetX:42,
  fingerReach:10,sub:.6,enabled:plan.enabled}),null);
 const moving=gaugeRetractionPath({anchor,target,maxSheetX:42,
  fingerReach:10,sub:.92,enabled:false});
 assert.equal(moving.phase,'reubicacion-siguiente-golpe');
 assert.equal(moving.plannedRetraction,0);
 assert.equal(moving.withdrawn,false);
});
test('si entra dentro del dedo durante el plegado solicita retirada ANTES',()=>{
 const plan=planGaugeRetraction({
  sheetSamples:[sample(.48,[{x:0,y:-4},{x:47,y:-4}])],
  polygon:finger,thickness:2,contact:anchor
 });
 assert.equal(plan.enabled,true);
 assert.equal(plan.issues[0].kind,'penetracion');
 const motion=gaugeRetractionPath({anchor,target,maxSheetX:47,
  fingerReach:10,sub:.4,enabled:plan.enabled});
 assert.equal(motion.phase,'retroceso-antes-plegado');
 assert.ok(motion.point.x>anchor.x);
});
test('si no hay siguiente golpe ni choque el tope no se desplaza',()=>{
 assert.equal(gaugeRetractionPath({anchor,target:null,maxSheetX:42,
  fingerReach:10,sub:.95,enabled:false}),null);
});
test('sin secciones válidas no presentar resultado de retirada como verificado',()=>{
 const plan=planGaugeRetraction({sheetSamples:[{at:.5,sheet:[]}],polygon:finger});
 assert.equal(plan.known,false);
 assert.equal(plan.verified,false);
});
test('fase de reposicionamiento no equivale a retroceso de chapa',()=>{
 const motion=gaugeRetractionPath({anchor,target,maxSheetX:45,
  fingerReach:10,sub:GAUGE_REPOSITION_START,enabled:false});
 assert.equal(motion.phase,'reubicacion-siguiente-golpe');
 assert.equal(motion.point.x,anchor.x);
});
