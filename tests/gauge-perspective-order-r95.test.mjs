import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {EXAMPLE,normalized} from '../engine.js';
import {technicalScene} from '../technical-section.js';
import {gaugePlacement,gaugeContourAtContact} from '../backgauge-placement.js';
import {getActiveMachineConfig} from '../machine-config.js';
import {selectMachine} from '../machine-selection.js';
import {gaugePerspectiveContours} from '../machine-visual.js';

test('R95: la matriz NO oculta el tope en el orden de dibujo 3D',()=>{
 const source=readFileSync(new URL('../machine-visual.js',import.meta.url),'utf8');
 const render=source.slice(source.indexOf('function stageScene('));
 const backdrop=render.indexOf('rearMachineBackdrop(ctx,w,h,cx,baseY,scale)');
 const die=render.indexOf('drawDie(ctx,scene,cx,baseY,scale)');
 const perspective=render.indexOf('if(perspective)rearMachine(ctx,w,h,cx,baseY,scale,placement,true)');
 const sheet=render.indexOf('drawSheet(ctx,transformed,t,scale,st.press>.4)');
 const ramForeground=render.indexOf('drawPunchForeground(ctx,scene');
 assert.ok(backdrop>=0&&die>=0&&perspective>=0&&sheet>=0&&ramForeground>=0);
 assert.ok(backdrop<die&&die<perspective&&perspective<sheet&&sheet<ramForeground,
  'En perspectiva: bancada → matriz → tope → chapa → punzón');
 assert.match(render,/if\(!perspective\)rearMachine\(ctx,w,h,cx,baseY,scale,placement,false\)/,
  'El orden anterior se conserva para la vista lateral 2D');
 assert.doesNotMatch(render,/drawHiddenGaugeNoseGuide/,
  'No pintar dedos fantasma ni depender del apoyo lateral para que se vean');
});

test('R95: la posición del dedo físico y de su cara frontal no cambia en 3D',()=>{
 selectMachine('trumpf-v85');
 for(const [p,tm] of [
  [normalized({...EXAMPLE,flanges:[20,30,50,30,20],stopByBend:[1,1,1,1]}),.7],
  [normalized({...EXAMPLE,flanges:[50,30,50,30,20],
    gaugeSideByBend:['auto','before','before','auto']}),6.25],
  [normalized({...EXAMPLE,flanges:[50,30,50,30,20],
    gaugeSideByBend:['auto','before','before','auto']}),8.00]
 ]){
  const scene=technicalScene(p,tm),stop=gaugePlacement(scene,1);
  const world=gaugeContourAtContact(stop,getActiveMachineConfig().stop);
  const screen=world.map(x=>[420+x.x*2,400-x.y*2]);
  const perspective=gaugePerspectiveContours(screen,2,true);
  assert.deepEqual(perspective.near,screen,
   'El frente del tope NO debe moverse al pasar de 2D a perspectiva');
  assert.ok(perspective.far.every((v,i)=>v[0]>screen[i][0]),
   'Su volumen extruido siempre queda detrás del frente de apoyo');
  assert.ok(Math.abs(stop.contact.from.x-stop.point.x)<1e-7);
 }
});
