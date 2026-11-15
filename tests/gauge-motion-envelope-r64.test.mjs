import test from 'node:test';
import assert from 'node:assert/strict';
import {EXAMPLE,normalized} from '../engine.js';
import {technicalScene,technicalWorldBounds} from '../technical-section.js';
import {gaugePlacement,gaugeContourAtContact} from '../backgauge-placement.js';
import {getActiveMachineConfig} from '../machine-config.js';

const epsilon=1e-6;
const inBounds=(bounds,point,label)=>{
 assert.ok(point.x>=bounds.minX-epsilon&&point.x<=bounds.maxX+epsilon,
  label+' fuera de encuadre horizontal: '+JSON.stringify(point));
 assert.ok(point.y>=bounds.minY-epsilon&&point.y<=bounds.maxY+epsilon,
  label+' fuera de encuadre vertical: '+JSON.stringify(point));
};

test('R64: retirada y retorno del tope quedan ENCUADRADOS desde el primer instante de cada golpe',()=>{
 for(const finger of [1,2]){
  const piece=normalized({...EXAMPLE,stopByBend:Array(4).fill(finger)});
  for(const operation of [0,1,2,3]){
   const start=operation*5;
   const early=technicalScene(piece,start+.1);
   const beforeRetraction=technicalScene(piece,start+1.7);
   const middle=technicalScene(piece,start+3.1);
   const finishing=technicalScene(piece,start+4.8);
   const stable=early.gaugeMotionEnvelope;
   // Si el dedo tiene una trayectoria prevista, la cámara debe
   // reservarla incluso cuando el dedo está inmóvil contra la chapa.
   for(const current of [beforeRetraction,middle,finishing]){
    assert.deepEqual(current.gaugeMotionEnvelope,stable,
     'envolvente cambiante en P'+(operation+1)+' y tope '+finger);
   }
   if(!stable)continue;
   const cfg=getActiveMachineConfig();
   const dimensions=finger===2?cfg.support:cfg.stop;
   for(const scene of [early,beforeRetraction,middle,finishing]){
    const place=gaugePlacement(scene,finger);
    const contour=gaugeContourAtContact(place,dimensions);
    for(const waypoint of stable.points){
     const dx=waypoint.x-place.point.x,dy=waypoint.y-place.point.y;
     for(const point of contour){
      inBounds(scene.world,{x:point.x+dx,y:point.y+dy},
       'P'+(operation+1)+' tope '+finger+' t='+scene.stage.time);
     }
    }
    assert.deepEqual(scene.world,technicalWorldBounds(scene));
   }
  }
 }
});

test('R64: un dedo sin recorrido pendiente no introduce aparcamiento artificial',()=>{
 const piece=normalized(EXAMPLE);
 const scene=technicalScene(piece,19.9);
 if(scene.gaugePlan.enabled){
  assert.ok(scene.gaugeMotionEnvelope?.parkPoint);
 }else{
  assert.equal(scene.gaugeMotionEnvelope,null,
   'último golpe sin retirada y sin siguiente referencia');
 }
});
