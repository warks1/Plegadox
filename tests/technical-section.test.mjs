import test from 'node:test';
import assert from 'node:assert/strict';
import {EXAMPLE,MACHINE,normalized,stage,profile} from '../engine.js';
import {technicalScene} from '../technical-section.js';
import {analyzeSequence} from '../validation.js';
import {sectionPunch} from '../tool-profiles.js';
import {machineToolProjection,machineSheetProjection} from '../machine-visual.js';

const near=(actual,expected,tolerance=1e-8)=>{
 assert.ok(Math.abs(actual-expected)<tolerance,
   'Se esperaba '+expected+' mm; se obtuvo '+actual+' mm');
};
test('misma escala de milímetros: boca de V16 y profundidad nominal',()=>{
 const scene=technicalScene(EXAMPLE,0),{diePolygon,die,dimensions}=scene;
 near(dimensions.opening,16);
 near(dimensions.depth,8/Math.tan(88*Math.PI/360));
 near(diePolygon[1].x,-8);near(diePolygon[3].x,8);
 near(diePolygon[1].y,0);near(diePolygon[3].y,0);
 near(diePolygon[2].y,-die.depth);
});
test('el perfil del punzón conserva exactamente su altura en mm',()=>{
 const scene=technicalScene(EXAMPLE,0);
 const ys=scene.punchPolygon.map(pt=>pt.y);
 near(Math.max(...ys)-Math.min(...ys),scene.punch.height);
});
test('la chapa empieza plana con espesor nominal y no se pliega anticipadamente',()=>{
 const scene=technicalScene(EXAMPLE,0);
 const y=scene.sheet[0].y;
 assert.ok(scene.sheet.every(pt=>Math.abs(pt.y-y)<1e-7));
 near(scene.dimensions.thickness,2);
 assert.deepEqual(scene.stage.fractions,[0,0,0,0]);
});
test('la punta sigue a la cara superior de la chapa durante el contacto orientativo',()=>{
 for(const time of [2.5,2.9,3.3]){
  const s=technicalScene(EXAMPLE,time);
  const tip=Math.min(...s.punchPolygon.map(pt=>pt.y));
  const hinge=s.sheet[s.stage.activeBend+1];
  near(tip,hinge.y+s.dimensions.thickness/2,1e-6);
  assert.ok(s.dimensions.engagement>=0);
 }
});
test('cambiar V16 por V32 modifica la matriz, el radio no se confunde con estética',()=>{
 const a=technicalScene(EXAMPLE,2.6),b=technicalScene({...EXAMPLE,die:'v32'},2.6);
 near(b.dimensions.opening,32);
 assert.ok(b.dimensions.depth>a.dimensions.depth);
 assert.notDeepEqual(a.diePolygon,b.diePolygon);
});
test('el segundo golpe negativo no cambia el signo de la pieza final',()=>{
 const input={...EXAMPLE,order:[0,1,3,2]};
 const s=technicalScene(input,7.7);
 assert.equal(s.stage.activeBend,1);
 assert.equal(s.presentation.flipped,true);
 assert.equal(s.piece.angles[1],-90);
 assert.deepEqual(profile(input,[1,1,1,1]).points,profile(EXAMPLE,[1,1,1,1]).points);
});
test('punzón corto de 15° conserva su ángulo incluido real',()=>{
 const shape=sectionPunch({angle:15,height:50,tip:.6});
 const tangent=shape.points[3],shoulder=shape.points[2];
 const width=shoulder[0]-tangent[0],dy=shoulder[1]-tangent[1];
 near(2*Math.atan2(width,dy)*180/Math.PI,15,1e-6);
 near(Math.min(...shape.points.map(p=>p[1])),0);
});
test('cotas de 2400 mm no se truncan; se avisa del límite de máquina',()=>{
 const p=normalized({...EXAMPLE,width:2400});
 assert.equal(p.width,2400);
 assert.equal(MACHINE.workingWidth,2040);
 const report=analyzeSequence(p);
 assert.ok(report.issues.some(i=>i.code==='machine-width'));
 assert.equal(report.verifiedMachineClearance,false);
});
test('la herramienta nunca se marca como CAD certificado',()=>{
 for(const t of [0,2.8,7.8,16]){
  assert.equal(technicalScene(EXAMPLE,t).verified,false);
 }
});

test('la cabina y sección métrica utilizan idénticas siluetas y posiciones en mm',()=>{
 const combos=[
  {...EXAMPLE,die:'v16',punch:'straight88'},
  {...EXAMPLE,die:'v16-30',punch:'straight30'},
  {...EXAMPLE,die:'v6',punch:'goose'}
 ];
 for(const item of combos)for(const time of [0,2.8,7.8,13.2]){
  const scene=technicalScene(item,time),cx=250,cy=340,scale=1.25;
  const projected=machineToolProjection(scene,cx,cy,scale);
  for(const key of ['punch','die']){
   const metric=scene[key+'Polygon'];
   assert.equal(projected[key].length,metric.length);
   projected[key].forEach(([x,y],i)=>{
    near(x,cx+metric[i].x*scale);
    near(y,cy-metric[i].y*scale);
   });
  }
 }
 assert.throws(()=>machineToolProjection(technicalScene(EXAMPLE,0),0,0,0),/inválida/);
});
test('la vista industrial respeta H y fondo nominal de matrices diferentes',()=>{
 const s30=technicalScene({...EXAMPLE,die:'v16-30'},0);
 const s88=technicalScene(EXAMPLE,0);
 const p30=machineToolProjection(s30,0,100,1).die;
 const p88=machineToolProjection(s88,0,100,1).die;
 near(Math.max(...p30.map(p=>p[1])),100+s30.die.height);
 near(Math.max(...p88.map(p=>p[1])),100+s88.die.height);
 assert.ok(s30.die.depth>s88.die.depth);
 assert.notDeepEqual(p30,p88);
});

test('La chapa de la cabina coincide con la comprobada en 2D durante los 4 golpes y recolocaciones',()=>{
 const p=normalized(EXAMPLE);
 // Retirada, reorientación, presentación, plegado y vuelta a empezar.
 for(let t=0;t<=20;t+=.075){
  const s=technicalScene(p,t),origin=[200,320],scale=1.25;
  const expected=s.sheetDisplay.map(pt=>[origin[0]+pt.x*scale,origin[1]-pt.y*scale]);
  const front=machineSheetProjection(s,...origin,scale,false);
  const perspective=machineSheetProjection(s,...origin,scale,true);
  assert.deepEqual(front,expected,'Escena de chapa 2D t='+t.toFixed(2));
  assert.deepEqual(perspective,expected,
   'La perspectiva no puede dibujar otra chapa fuera del detector de colisiones t='+t.toFixed(2));
 }
});
test('En la transición entre golpes no se alternan dos perfiles distintos según el modo de cámara',()=>{
 for(const t of [4.1999,4.2,4.31,4.5,4.7,4.9,4.9999,5,
   9.1999,9.2,9.6,9.9999,10,14.9999,15,19.9999,20]){
  const s=technicalScene(EXAMPLE,t);
  const front=machineSheetProjection(s,200,300,1,false);
  const perspective=machineSheetProjection(s,200,300,1,true);
  assert.deepEqual(front,perspective,'No permitir traslación falsa de chapa en t='+t);
 }
});
test('la sección gráfica usa el radio interior elegido sin modificar la fibra central',()=>{
 const p={...EXAMPLE,radius:3},q={...EXAMPLE,radius:9};
 const small=technicalScene(p,2.7),large=technicalScene(q,2.7);
 assert.deepEqual(small.sheet,large.sheet);
 assert.ok(Math.abs(small.kinematics.requestedCenterlineRadius-4)<1e-8);
 assert.ok(Math.abs(large.kinematics.requestedCenterlineRadius-10)<1e-8);
 assert.notDeepEqual(small.sheetDisplay,large.sheetDisplay,
   'Al cambiar R debe cambiar la curva visual de la chapa');
 assert.equal(small.verified,false);
});
