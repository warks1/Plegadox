import test from 'node:test';
import assert from 'node:assert/strict';
import {EXAMPLE,normalized,stage,presentedAtStage,
 repositionAxisProgress} from '../engine.js';
import {technicalScene} from '../technical-section.js';

test('si cambian simultáneamente cara y ala, las dos rotaciones NO coinciden en el centro',()=>{
 assert.deepEqual(repositionAxisProgress(0,true,true),{face:0,feed:0});
 assert.deepEqual(repositionAxisProgress(.25,true,true),{face:.5,feed:0});
 assert.deepEqual(repositionAxisProgress(.5,true,true),{face:1,feed:0});
 assert.deepEqual(repositionAxisProgress(.75,true,true),{face:1,feed:.5});
 assert.deepEqual(repositionAxisProgress(1,true,true),{face:1,feed:1});
 assert.deepEqual(repositionAxisProgress(.5,true,false),{face:.5,feed:.5});
 assert.deepEqual(repositionAxisProgress(.5,false,true),{face:.5,feed:.5});
});
test('cambio G1→G2 con ala siguiente/ala anterior: pieza no colapsa a un punto',()=>{
 const p=normalized({...EXAMPLE,gaugeSideByBend:['after','before','before','after']});
 const a=presentedAtStage(p,stage(p,4.6));
 assert.equal(a.repositioning,true);
 assert.ok(Math.abs(a.faceProgress-1)<1e-6);
 assert.ok(Math.abs(a.feedProgress)<1e-6);
 const scene=technicalScene(p,4.6);
 const xs=scene.presentation.points.map(x=>x.x);
 const ys=scene.presentation.points.map(x=>x.y);
 const spanX=Math.max(...xs)-Math.min(...xs);
 const spanY=Math.max(...ys)-Math.min(...ys);
 assert.ok(spanX>10,'La chapa no puede colapsar por escala X=0 en el centro: '+spanX);
 assert.ok(spanY>10,'La chapa no puede colapsar por escala Y=0 en el centro: '+spanY);
 assert.deepEqual(p.order,[0,1,3,2]);
 assert.deepEqual(p.angles,[90,-90,-90,90]);
});
test('entre golpes se mantiene continuidad del perfil y del tope sin teleport',async()=>{
 const {gaugePlacement}=await import('../backgauge-placement.js');
 const p=normalized({...EXAMPLE,gaugeSideByBend:['after','before','before','after']});
 for(const t of [5,10,15]){
  const before=technicalScene(p,t-.0001),after=technicalScene(p,t);
  const sheetJump=Math.max(...before.sheet.map((x,i)=>
   Math.hypot(x.x-after.sheet[i].x,x.y-after.sheet[i].y)));
  assert.ok(sheetJump<.3,'Chapa saltó '+sheetJump+' mm en t='+t);
  const x=gaugePlacement(before,1),y=gaugePlacement(after,1);
  assert.ok(Math.hypot(x.point.x-y.point.x,x.point.y-y.point.y)<.3,
   'Tope se teleportó al cambiar golpe '+t/5);
 }
});
