import test from 'node:test';
import assert from 'node:assert/strict';
import {EXAMPLE,stage} from '../engine.js';
import {technicalScene} from '../technical-section.js';
import {contactKinematics} from '../bend-contact.js';

test('R82: sujeción mantiene el contacto sin subida ni segunda bajada',()=>{
 const points=[{x:-50,y:0},{x:0,y:0},{x:50,y:0}];
 const input={points,activeBend:0,opening:16,dieDepth:8.29,thickness:2};
 const approach=contactKinematics({...input,phase:'Aproximación',press:.45});
 const clamping=contactKinematics({...input,phase:'Sujeción',press:.45});
 const bending=contactKinematics({...input,phase:'Plegado',press:.45});
 assert.equal(clamping.tipHeight,approach.tipHeight,'el punzón no puede subir al sujetar');
 assert.equal(clamping.tipHeight,bending.tipHeight,'el punzón no puede bajar dos veces');
 assert.equal(clamping.tipHeight,clamping.sheet[1].y+1,'contacto contra chapa');
});
test('R82: cada golpe Omega baja una vez y sube una vez',()=>{
 assert.deepEqual(EXAMPLE.order,[0,1,3,2]);
 const offsets=[.16,.20,.30,.35,.36,.38,.40,.43999,.44,.48,.52,.58,.63,.6799];
 for(let operation=0;operation<4;operation++){
  const frames=offsets.map(sub=>{
   const time=operation*5+5*sub;
   const scene=technicalScene(EXAMPLE,time);
   return {phase:stage(EXAMPLE,time).phase,tip:scene.kinematics.tipHeight};
  });
  for(let i=1;i<frames.length;i++)
   assert.ok(frames[i].tip<=frames[i-1].tip+1e-5,
    'G'+(operation+1)+' punzón sube antes de terminar plegado '+JSON.stringify({at:offsets[i],a:frames[i-1],b:frames[i]}));
  const clamp=frames.filter(f=>f.phase==='Sujeción');
  assert.ok(clamp.length>=2);
  assert.ok(clamp.every(f=>Math.abs(f.tip-clamp[0].tip)<1e-6),'sin rebote en sujeción G'+(operation+1));
  const returning=[.68001,.70,.74,.78,.82,.83999].map(sub=>
   technicalScene(EXAMPLE,operation*5+5*sub).kinematics.tipHeight);
  for(let i=1;i<returning.length;i++)
   assert.ok(returning[i]>=returning[i-1]-1e-5,'G'+(operation+1)+' baja durante retorno');
 }
});
