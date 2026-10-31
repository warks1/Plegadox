import test from 'node:test';
import assert from 'node:assert/strict';
import {EXAMPLE,normalized,stage,gaugeReference,stopAtStage} from '../engine.js';
import {technicalScene} from '../technical-section.js';
import {gaugePlacement} from '../backgauge-placement.js';

const epsilon=(a,b)=>assert.ok(Math.abs(a-b)<1e-6, a+' != '+b);
test('golpe 1 usa ala de 50 mm en lugar del extremo global de 250 mm',()=>{
 const p=normalized(EXAMPLE),st=stage(p,0);
 const r=gaugeReference(p,st.activeBend),scene=technicalScene(p,st);
 const stop=gaugePlacement(scene,1);
 assert.equal(r.side,'before');
 assert.equal(r.distance,50);
 assert.equal(stop.nominalDistance,50);
 assert.equal(stop.referenceSide,'before');
 epsilon(stop.point.x,50);
 assert.equal(stop.freeEdge,true);
 assert.equal(stop.verified,false);
});
test('golpe 3 de 1-2-4-3 permite presentar la chapa desde el lado contrario',()=>{
 const p=normalized(EXAMPLE),st=stage(p,10.4);
 assert.equal(st.activeOperation,2);
 assert.equal(st.activeBend,3);
 const r=gaugeReference(p,st.activeBend);
 assert.equal(r.side,'after');
 assert.equal(r.distance,50);
 const scene=technicalScene(p,st),stop=gaugePlacement(scene,2);
 assert.equal(scene.feedMirrored,false);
 assert.equal(stop.referenceSide,'after');
 assert.equal(stop.nominalDistance,50);
 assert.equal(stop.stopNumber,2);
 assert.equal(stop.verified,false);
});
test('cambiar ala de apoyo invierte presentación sin modificar orden ni grados',()=>{
 const p=normalized(EXAMPLE),ref=structuredClone(p);
 const before=technicalScene({...p,gaugeSideByBend:['before',...p.gaugeSideByBend.slice(1)]},0);
 const after=technicalScene({...p,gaugeSideByBend:['after',...p.gaugeSideByBend.slice(1)]},0);
 assert.equal(before.feedMirrored,true);
 assert.equal(after.feedMirrored,false);
 assert.ok(before.sheet[0].x>0 && after.sheet[0].x<0);
 assert.equal(gaugePlacement(before,1).nominalDistance,50);
 assert.equal(gaugePlacement(after,1).nominalDistance,50);
 assert.deepEqual(p,ref);
});
test('el tope conserva su ancla durante la bajada de un mismo golpe',()=>{
 const p=normalized(EXAMPLE);
 const atStart=gaugePlacement(technicalScene(p,.7),1);
 const atPress=gaugePlacement(technicalScene(p,2.9),1);
 assert.deepEqual(atStart.point,atPress.point);
 assert.equal(atPress.nominalDistance,50);
});
test('longitudes 20 y 180 mm: automático coge 20, manual selecciona 180',()=>{
 const p=normalized({flanges:[20,180],angles:[90],order:[0],stopByBend:[1]});
 assert.equal(gaugeReference(p,0).side,'before');
 assert.equal(gaugeReference(p,0).distance,20);
 const other=normalized({...p,gaugeSideByBend:['after']});
 assert.equal(gaugeReference(other,0).distance,180);
 const stop=gaugePlacement(technicalScene(other,.1),1);
 assert.equal(stop.nominalDistance,180);
});
test('el tipo de dedo no modifica la cara ni la distancia programada',()=>{
 const p=normalized({...EXAMPLE,stopByBend:[1,2,1,2]});
 const a=stopAtStage(p,10.4),b=stopAtStage({...p,stopByBend:[1,2,2,1]},10.4);
 assert.equal(a.reference.distance,b.reference.distance);
 assert.equal(a.reference.side,b.reference.side);
 assert.notEqual(a.value,b.value);
});
test('al reordenar golpes se mantiene el lado seleccionado por pliegue físico',()=>{
 const p=normalized({...EXAMPLE,gaugeSideByBend:['after','before','after','before']});
 const alt=normalized({...p,order:[3,0,1,2]});
 assert.equal(stopAtStage(alt,.5).reference.side,'before');
 assert.equal(stopAtStage(alt,5.5).reference.side,'after');
 assert.deepEqual(alt.angles,p.angles);
});

test('no anuncia contacto verificado al apoyar en un vértice interior',()=>{
 const p=normalized(EXAMPLE);
 const scene=technicalScene(p,5.2);
 const placement=gaugePlacement(scene,1);
 assert.equal(placement.sourceIndex,1);
 assert.equal(placement.freeEdge,false);
 assert.equal(placement.alignedToSheet,false);
 assert.match(placement.state,/vértice interior/);
 assert.equal(placement.verified,false);
});
