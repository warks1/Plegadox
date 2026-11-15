import test from 'node:test';
import assert from 'node:assert/strict';
import {normalized,gaugePointOnProfile} from '../engine.js';
import {technicalScene} from '../technical-section.js';
import {gaugePlacement,gaugeContourAtContact} from '../backgauge-placement.js';
import {gaugeContactFeature,gaugeOutline,getActiveMachineConfig} from '../machine-config.js';
import {selectMachine} from '../machine-selection.js';

/**
 * Datos visibles en vídeo 15/11: G2 (P2), Stop 1 y ala anterior de 30 mm.
 * Ángulos/orden aquí son los de Omega de muestra: diagnóstico aproximado,
 * no se debe confundir con un volcado exacto del proyecto del usuario.
 */
test('R92: diagnosticar apoyo y antigua retirada sobre G2 manual del vídeo',()=>{
 selectMachine('trumpf-v85');
 const piece=normalized({name:'G2 manual · aproximación de vídeo',
  flanges:[50,30,50,30,20],angles:[90,-90,-90,90],
  order:[0,1,3,2],punch:'goose',die:'v16',thickness:2,width:500,
  gaugeSideByBend:['auto','before','before','auto']});
 const result=[];
 for(const sub of [.06,.25,.40,.60]){
  const scene=technicalScene(piece,5+sub*5);
  const place=gaugePlacement(scene,1);
  const ref=scene.gaugeReference;
  const contactPoint=gaugePointOnProfile(scene.sheet,ref);
  const polygon=gaugeContourAtContact(place,getActiveMachineConfig().stop);
  const wallX=place.contact.from.x;
  const shapeEnd=scene.sheet[ref.sourceIndex];
  result.push({sub,phase:scene.stage.phase,
   reference:{segment:ref.segmentIndex,source:ref.sourceIndex,side:ref.side,
    freeEdge:ref.freeEdge,distance:ref.distance},
   setup:{valid:scene.gaugeSetup.valid,reason:scene.gaugeSetup.reason,
    collision:scene.gaugeSetup.interference,autoSelected:scene.gaugeSetup.autoSelected},
   actual:shapeEnd,nominal:contactPoint,
   sheetAtSetup:sub===.06?scene.sheet:null,
   wallX,tipX:Math.max(...scene.sheet.map(p=>p.x)),
   gapToChosenPoint:contactPoint?wallX-contactPoint.x:null,
   gapToSource:shapeEnd?wallX-shapeEnd.x:null,
   xSpan:[Math.min(...polygon.map(p=>p.x)),Math.max(...polygon.map(p=>p.x))],
   planned:{enabled:scene.gaugePlan.enabled,issues:scene.gaugePlan.issues,
    penetrations:scene.gaugePlan.penetrationCount},
   movement:scene.gaugeTransition?.phase??'quieto'});
 }
 console.log('R92_REAL_VIDEO_G2_DIAGNOSTIC='+JSON.stringify(result));
 assert.equal(result.length,4);
 assert.equal(result[0].reference.side,'before');
 assert.equal(result[0].reference.distance,30);
 assert.equal(result[0].gapToChosenPoint,0,'Dedo y referencia nominal comparten X');
});
