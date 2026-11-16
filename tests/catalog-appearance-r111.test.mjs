import test from 'node:test';
import assert from 'node:assert/strict';
import {CATALOG_PUNCHES,CATALOG_DIES} from '../catalog.js';
import {sectionPunch,sectionDie} from '../tool-profiles.js';
import {validateContour} from '../tool-dxf.js';
import {PUNCHES,DIES,EXAMPLE,normalized} from '../engine.js';
import {technicalScene} from '../technical-section.js';

test('R111: todos los perfiles actuales cierran un sólido 2D sin degeneración',()=>{
 assert.ok(CATALOG_PUNCHES.length>=25);
 assert.ok(CATALOG_DIES.length>=43);
 for(const tool of CATALOG_PUNCHES){
  const shape=sectionPunch(tool);
  const geometry=validateContour(shape.points);
  assert.ok(geometry.height>10,'Punzón sin altura: '+tool.id);
  assert.ok(geometry.width>.5,'Punzón sin ancho: '+tool.id);
 }
 for(const tool of CATALOG_DIES){
  const shape=sectionDie(tool);
  const geometry=validateContour(shape.points);
  assert.ok(geometry.height>10,'Matriz sin altura: '+tool.id);
  assert.ok(geometry.width>.5,'Matriz sin ancho: '+tool.id);
 }
});

test('R111: los punzones CONIC GN6/GN9 y Beyeler R no tienen aristas nulas',()=>{
 for(const id of ['conic-gn9-12-8806','conic-gn6-12-8806','bystronic-r-demo']){
  const tool=CATALOG_PUNCHES.find(p=>p.id===id);
  const outline=sectionPunch(tool).points;
  assert.ok(outline.length>=10);
  assert.doesNotThrow(()=>validateContour(outline));
  for(let i=0;i<outline.length;i++){
   const [x,y]=outline[i],[a,b]=outline[(i+1)%outline.length];
   assert.ok(Math.hypot(x-a,y-b)>.015,'Arista duplicada en '+id);
  }
 }
});

test('R111: las patas de cabra dibujan cuello asimétrico y mantienen apariencia provisional',()=>{
 const examples=CATALOG_PUNCHES.filter(p=>p.type==='cabra');
 assert.ok(examples.length>=7);
 for(const tool of examples){
  const shape=sectionPunch(tool),xs=shape.points.map(p=>p[0]);
  const center=(Math.min(...xs)+Math.max(...xs))/2;
  assert.ok(center<-.5,'Desapareció cuello asimétrico: '+tool.id);
  assert.equal(shape.provisional,true,'Un perfil sintético NO es CAD OEM');
 }
});

test('R111: apariencia de útil seleccionado sincroniza sección y colisión',()=>{
 const tool=CATALOG_PUNCHES.find(p=>p.id==='conic-gn9-12-8806');
 const die=CATALOG_DIES.find(d=>d.angle===30&&d.opening===16);
 assert.ok(tool);assert.ok(die);
 if(!PUNCHES.some(p=>p.id===tool.id))PUNCHES.push(tool);
 if(!DIES.some(d=>d.id===die.id))DIES.push(die);
 const piece=normalized({...EXAMPLE,punch:tool.id,die:die.id});
 const scene=technicalScene(piece,2.7);
 assert.equal(scene.punchPolygon.length,sectionPunch(tool).points.length);
 assert.equal(scene.diePolygon.length,sectionDie(die).points.length);
 assert.deepEqual(scene.diePolygon,
  sectionDie(die).points.map(([x,y])=>({x,y:y-scene.die.height})));
 assert.equal(scene.verified,false,'Apariencia geométrica no certifica uso');
});
