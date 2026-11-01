import test from 'node:test';
import assert from 'node:assert/strict';
import {EXAMPLE,normalized} from '../engine.js';
import {technicalScene,technicalWorldBounds} from '../technical-section.js';
import {gaugePlacement,gaugeContourAtContact} from '../backgauge-placement.js';
import {getV85} from '../machine-config.js';

const inside=(bounds,pts,message)=>{
 for(const pt of pts){
  assert.ok(pt.x>=bounds.minX-1e-6&&pt.x<=bounds.maxX+1e-6,
   message+': X '+pt.x+' fuera de '+bounds.minX+'..'+bounds.maxX);
  assert.ok(pt.y>=bounds.minY-1e-6&&pt.y<=bounds.maxY+1e-6,
   message+': Y '+pt.y+' fuera de '+bounds.minY+'..'+bounds.maxY);
 }
};
const contourAt=(scene,number)=>{
 const place=gaugePlacement(scene,number),cfg=getV85();
 return {place,contour:gaugeContourAtContact(place,number===2?cfg.support:cfg.stop)};
};
test('el encuadre métrico contiene el tope ENTERO con cada apoyo, en todos los golpes',()=>{
 for(const mode of [1,2]){
  const p=normalized({...EXAMPLE,stopByBend:[mode,mode,mode,mode]});
  for(const time of [0,.5,2.9,4.2,4.35,4.6,4.8,4.99,5,
   5.5,7.7,9.25,9.6,9.999,10,12,14.4,14.7,14.999,15,17.3,20]){
   const s=technicalScene(p,time),{contour}=contourAt(s,mode);
   inside(s.world,contour,'modo '+mode+' / t='+time);
   inside(s.world,[...s.sheetDisplay,...s.sheet,...s.punchPolygon,...s.diePolygon],
    'pieza y útiles / t='+time);
   assert.deepEqual(s.world,technicalWorldBounds(s));
  }
 }
});
test('el recorrido rígido completo permanece dentro del encuadre al retirar y regresar',()=>{
 const p=normalized(EXAMPLE),cfg=getV85();
 for(const boundary of [5,10,15]){
  // Recorrido de retirada: t=4.2..5; t=9.2..10; t=14.2..15.
  for(const fraction of [.002,.11,.24,.45,.57,.74,.88,.998]){
   const t=boundary-.8+fraction*.8;
   const s=technicalScene(p,t),n=p.stopByBend[s.stage.activeBend]||1;
   assert.ok(s.gaugeTransition,'Sin transición en '+t);
   const {place,contour}=contourAt(s,n);
   const movement=s.gaugeTransition;
   const retractX=Math.max(movement.from.x,movement.to.x)+Math.max(12,s.die.opening||16);
   const keyframes=[
    movement.from,movement.to,
    {x:retractX,y:movement.from.y},{x:retractX,y:movement.to.y}
   ];
   for(const anchor of keyframes){
    const dx=anchor.x-place.point.x,dy=anchor.y-place.point.y;
    inside(s.world,contour.map(pt=>({x:pt.x+dx,y:pt.y+dy})),
     'encuadre de tope retirado / t='+t);
   }
   assert.equal(gaugeContourAtContact(place,n===2?cfg.support:cfg.stop).length,6,
    'El tope conserva su silueta entera; no se espeja parcialmente');
  }
 }
 assert.deepEqual(p.order,[0,1,3,2]);
 assert.deepEqual(p.angles,[90,-90,-90,90]);
});
