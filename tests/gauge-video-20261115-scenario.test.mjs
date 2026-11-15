import test from 'node:test';
import assert from 'node:assert/strict';
import {EXAMPLE,normalized} from '../engine.js';
import {technicalScene} from '../technical-section.js';
import {gaugePlacement} from '../backgauge-placement.js';
import {gaugeRiskStatus} from '../gauge-risk-status.js';
import {selectMachine} from '../machine-selection.js';

/**
 * Aproximación al vídeo 15-11-2026, NO reconstrucción exacta:
 * capturas muestran alas consecutivas 50/30/50/30/20 mm, V16,
 * pata de cabra y referencias manuales 20, 30, 50 mm.
 * Los ángulos y el orden se conservan del ejemplo Omega, pues el
 * vídeo no aporta un export de los datos de la pieza para confirmarlos.
 */
test('aproximación a selección manual del vídeo: el error de apoyo no se oculta con retroceso',()=>{
 selectMachine('trumpf-v85');
 const p=normalized({...EXAMPLE,name:'Escenario ilustrativo vídeo 15-11',
  flanges:[50,30,50,30,20],die:'v16',punch:'goose',
  stopByBend:[1,1,1,1],
  gaugeSideByBend:['before','before','before','auto'],
  gaugeSegmentByBend:[0,1,2,null],
  gaugePointByBend:[20,30,50,null]});
 const original=JSON.stringify(p),report=[];
 for(let op=0;op<p.order.length;op++){
  const start=technicalScene(p,5*(op+.25));
  const during=technicalScene(p,5*(op+.60));
  const initialPlace=gaugePlacement(start,1),duringPlace=gaugePlacement(during,1);
  const initialStatus=gaugeRiskStatus(initialPlace);
  const duringStatus=gaugeRiskStatus(duringPlace);
  report.push({golpe:op+1,pliegue:p.order[op]+1,
   referencia:start.gaugeReference?.distance,manual:!!start.gaugeSetup.manual,
   apoyoValido:start.gaugeSetup.valid,motivo:start.gaugeSetup.reason,
   inicial:initialStatus.level,durante:duringStatus.level,
   penetracionesPredichas:during.gaugePlan.penetrationCount,
   holguras:during.gaugePlan.clearanceWarnings,
   retroceso:during.gaugePlan.enabled,
   fase:during.gaugeTransition?.phase??'quieto'});
  if(!start.gaugeSetup.valid){
   assert.equal(during.gaugePlan.enabled,false,
    'Un apoyo inválido no debe activar retirada anticolisión ficticia');
   assert.equal(during.gaugeTransition?.plannedRetraction??0,0);
   assert.ok(['amber','red'].includes(initialStatus.level),
    'Nunca anunciar apoyo inválido como verde');
  }
 }
 assert.equal(report.length,4);
 assert.equal(JSON.stringify(p),original);
 console.log('VIDEO_15NOV_APPROX_REPORT='+JSON.stringify(report));
 assert.ok(report.some(x=>x.manual),'El escenario conserva selección del operario');
});

test('mismo golpe G2 aproximado: comparar alternativa automática sin tocar referencia manual original',()=>{
 selectMachine('trumpf-v85');
 const manual=normalized({...EXAMPLE,flanges:[50,30,50,30,20],
  punch:'goose',die:'v16',stopByBend:[1,1,1,1],
  gaugeSideByBend:['before','before','before','auto'],
  gaugeSegmentByBend:[0,1,2,null],
  gaugePointByBend:[20,30,50,null]});
 const snapshot=JSON.stringify(manual);
 const automatic=normalized({...manual,
  gaugeSideByBend:['before','auto','before','auto'],
  gaugeSegmentByBend:[0,null,2,null],
  gaugePointByBend:[20,null,50,null]});
 const start=technicalScene(automatic,5*(1+.25));
 const during=technicalScene(automatic,5*(1+.60));
 const info={valid:start.gaugeSetup.valid,
  reason:start.gaugeSetup.reason,
  autoSelected:start.gaugeSetup.autoSelected,
  reference:start.gaugeReference,
  penetrations:during.gaugePlan.penetrationCount,
  enabled:during.gaugePlan.enabled,
  phase:during.gaugeTransition?.phase??'quieto'};
 console.log('VIDEO_15NOV_G2_AUTO_ALTERNATIVE='+JSON.stringify(info));
 assert.equal(start.gaugeSetup.manual,false);
 assert.equal(JSON.stringify(manual),snapshot,'Nunca sustituir la elección manual');
 assert.equal(start.gaugePlan.setupValid,start.gaugeSetup.valid);
 if(start.gaugeSetup.valid){
  assert.equal(start.gaugeReference.freeEdge,true);
  assert.equal(during.gaugePlan.enabled,during.gaugePlan.penetrationCount>0,
   'Sólo retirar cuando hay penetración y apoyo válido, según R76');
 }else{
  assert.equal(during.gaugePlan.enabled,false,
   'No declarar segura una alternativa automática sin apoyo válido');
 }
});
