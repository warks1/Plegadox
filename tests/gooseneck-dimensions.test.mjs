import test from 'node:test';
import assert from 'node:assert/strict';
import {PUNCHES,EXAMPLE,getTooling} from '../engine.js';
import {sectionPunch,sectionBounds} from '../tool-profiles.js';
import {insidePolygon} from '../tool-collision.js';
import {segmentContactKind} from '../validation.js';
import {technicalScene} from '../technical-section.js';
import {machineToolProjection} from '../machine-visual.js';
const approx=(v,to)=>assert.ok(Math.abs(v-to)<1e-8, 'Esperado '+to+', recibido '+v);
const goose=PUNCHES.filter(t=>t.type==='cabra');
const polygon=tool=>sectionPunch(tool).points.map(([x,y])=>({x,y}));

test('foto aportada: H100 del hombro inferior a la punta, 50 mm de alcance y R1',()=>{
 const t=PUNCHES.find(p=>p.id==='ref-goose-50-100-r1');
 const section=sectionPunch(t),bounds=sectionBounds(section.points);
 assert.equal(t.type,'cabra');
 assert.equal(section.model,'gooseneck');
 assert.equal(section.profileSource,'user-photo');
 approx(section.height,100);
 approx(bounds.maxY-bounds.minY,100);
 approx(section.headSpan,50);
 approx(bounds.maxX-bounds.minX,50);
 approx(section.tipRadius,1);
 assert.equal(section.roundedNose,true);
 assert.equal(insidePolygon({x:-30,y:50},polygon(t)),true,'Pared de la pata maciza');
 assert.equal(insidePolygon({x:-2,y:50},polygon(t)),false,'Hueco lateral DESPEJADO');
});
test('todas las patas de cabra tienen cuello abierto, no punzón recto, y H no se escala ni limita',()=>{
 assert.ok(goose.length>=7,'Revisar catálogo de patas de cabra');
 for(const tool of goose){
  const section=sectionPunch(tool),bounds=sectionBounds(section.points);
  assert.equal(section.model,'gooseneck',tool.id);
  approx(section.height,tool.height);
  approx(bounds.maxY-bounds.minY,tool.height);
  approx(section.tipRadius,(tool.tip||.8)/2);
  const recto=sectionPunch({...tool,type:'recto',profileStyle:null});
  assert.notDeepEqual(section.points,recto.points,tool.id);
  assert.equal(section.provisional,true,'La geometría sin CAD se declara provisional');
  assert.equal(insidePolygon({x:-.2,y:tool.height*.52},polygon(tool)),false,
   tool.id+': el lateral de descarga no puede quedar macizo');
 }
});
test('GN9 vs GN6 y Amada W55/W95 conservan alturas nominales y siluetas distintas',()=>{
 const gn9=PUNCHES.find(t=>t.id==='conic-gn9-12-8806');
 const gn6=PUNCHES.find(t=>t.id==='conic-gn6-12-8806');
 const w55=PUNCHES.find(t=>t.id==='amada-841-w55');
 const w95=PUNCHES.find(t=>t.id==='amada-841-w95');
 assert.equal(sectionPunch(gn9).neckOffset,9);
 assert.equal(sectionPunch(gn6).neckOffset,6);
 assert.notDeepEqual(sectionPunch(gn9).points,sectionPunch(gn6).points);
 assert.notDeepEqual(sectionPunch(w55).points,sectionPunch(w95).points);
 assert.equal(sectionPunch(w55).height,200);
 assert.equal(sectionPunch(w95).height,200);
 for(const id of ['amada-846-w55-h220','amada-846-w95-h220'])
  assert.equal(sectionPunch(PUNCHES.find(p=>p.id===id)).height,220);
});
test('no hay cruces, autointersecciones o solapamientos de caras en ninguna pata de cabra',()=>{
 for(const t of goose){
  const vertices=polygon(t);
  for(let i=0;i<vertices.length;i++){
   const a=vertices[i],b=vertices[(i+1)%vertices.length];
   for(let j=i+2;j<vertices.length;j++){
    if(i===0&&j===vertices.length-1)continue;
    const c=vertices[j],d=vertices[(j+1)%vertices.length];
    const kind=segmentContactKind(a,b,c,d);
    assert.notEqual(kind,'cross',t.id+' cruza '+i+'/'+j);
    assert.notEqual(kind,'overlap',t.id+' solapa '+i+'/'+j);
   }
  }
 }
});
test('la máquina proyecta exactamente el mismo perfil que el inspector y el motor 2D',()=>{
 for(const t of goose){
  const p={...EXAMPLE,punch:t.id};
  const scene=technicalScene(p,2);
  const fromMachine=machineToolProjection(scene,0,0,1).punch;
  assert.deepEqual(fromMachine,scene.punchPolygon.map(v=>[v.x,-v.y]));
  assert.equal(getTooling(p).punch.id,t.id);
  assert.equal(scene.punch.height,t.height);
 }
});
