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

test('holgura sin penetración no ordena retirada aunque sí conserva el aviso',()=>{
 const plan=planGaugeRetraction({
  sheetSamples:[sample(.48,[{x:0,y:1},{x:40,y:1}])],
  polygon:finger,thickness:2,contact:anchor,
  inspect:()=>({warning:true,kind:'holgura',point:{x:40,y:2.6}})
 });
 assert.equal(plan.known,true);
 assert.equal(plan.enabled,false);
 assert.equal(plan.penetrationCount,0);
 assert.equal(plan.clearanceWarnings,1);
 assert.equal(plan.issues[0].kind,'holgura');
 assert.match(plan.reason,/SIN penetración/);
 assert.equal(gaugeRetractionPath({anchor,target,maxSheetX:47,
  fingerReach:10,sub:.6,enabled:plan.enabled}),null);
});
test('siguiente referencia X/R idéntica no crea una carrera ficticia',()=>{
 const same={x:anchor.x,y:anchor.y};
 for(const sub of [.2,.36,.4,.6,.84,.92,.99,1])
  assert.equal(gaugeRetractionPath({anchor,target:same,sub,enabled:false}),null);
});
test('penetración real sí provoca la retirada preventiva, no por defecto',()=>{
 const plan=planGaugeRetraction({sheetSamples:[sample(.55,[{x:0,y:-2},{x:45,y:-2}])],
  polygon:finger,thickness:2,contact:anchor,
  inspect:()=>({warning:true,kind:'penetracion',point:{x:45,y:-2}})});
 assert.equal(plan.enabled,true);
 assert.equal(plan.penetrationCount,1);
 assert.ok(gaugeRetractionPath({anchor,target,maxSheetX:47,
  fingerReach:10,sub:.60,enabled:plan.enabled}).plannedRetraction>0);
});
