import test from 'node:test';
import assert from 'node:assert/strict';
import {EXAMPLE,normalized} from '../engine.js';
import {selectMachine} from '../machine-selection.js';
import {GAUGE_DIAGNOSTIC_SUBSTEPS,buildGaugeMotionDiagnostic} from '../gauge-motion-diagnostic.js';

const manualOmega=()=>normalized({...EXAMPLE,
 flanges:[50,30,50,30,20],punch:'goose',die:'v16',
 stopByBend:[1,1,1,1],
 gaugeSideByBend:['auto','before','before','auto']
});

test('R97: informe de los 4 golpes conserva pieza, selección manual y posiciones reales',()=>{
 selectMachine('trumpf-v85');
 const piece=manualOmega(),snapshot=JSON.stringify(piece);
 const data=buildGaugeMotionDiagnostic(piece,{build:'PLEGADOX-PRUEBA-R97'});
 assert.equal(data.schema,'plegadox-gauge-motion-diagnostic-v1');
 assert.equal(data.build,'PLEGADOX-PRUEBA-R97');
 assert.equal(data.verified,false);
 assert.equal(data.canApproveForMachine,false);
 assert.deepEqual(data.operationOrder,[1,2,4,3]);
 assert.equal(data.operations.length,4);
 assert.equal(data.samplesPerOperation,GAUGE_DIAGNOSTIC_SUBSTEPS.length);
 assert.equal(JSON.stringify(piece),snapshot,'Exportar nunca cambia la pieza');
 assert.deepEqual(data.piece.order,piece.order);
 assert.deepEqual(data.piece.gaugeSideByBend,piece.gaugeSideByBend);
 assert.deepEqual(data.piece.gaugeSegmentByBend,piece.gaugeSegmentByBend);
 assert.deepEqual(data.piece.gaugePointByBend,piece.gaugePointByBend);
 assert.equal(data.machine.profileId,'trumpf-v85');
 assert.ok(data.operations.every(o=>o.frames.length===data.samplesPerOperation));
 assert.ok(data.operations.every(o=>o.contactObserved),
  'Los cuatro golpes deben registrar el apoyo inicial');
 for(const op of data.operations)for(const frame of op.frames){
  assert.equal(frame.operation,op.operation);
  assert.equal(frame.bend,op.bend);
  assert.equal(frame.stopNumber,op.stopNumber);
  assert.ok(frame.time>(op.operation-1)*5&&frame.time<op.operation*5);
  assert.ok(Number.isFinite(frame.finger.x)&&Number.isFinite(frame.finger.y));
  assert.ok(frame.sheet.length>=2);
  assert.equal(frame.fingerPolygon.length,6);
  assert.ok(['green','amber','red'].includes(frame.risk.level));
  assert.equal(frame.verified,false);
 }
 assert.doesNotThrow(()=>JSON.parse(JSON.stringify(data)));
});

test('R97: golpe 2 exporta contacto, retroceso real y ausencia de penetración tras aparcar',()=>{
 selectMachine('trumpf-v85');
 const data=buildGaugeMotionDiagnostic(manualOmega());
 const g2=data.operations[1];
 const at=sub=>g2.frames.find(x=>x.sub===sub);
 assert.equal(g2.bend,2);
 assert.equal(g2.stopNumber,1);
 assert.equal(at(.25).reference.distance,30);
 assert.equal(at(.25).reference.side,'before');
 assert.equal(at(.25).setup.manual,true);
 assert.equal(at(.25).setup.foldedWingContact,true);
 assert.equal(at(.25).contact.engaged,true);
 assert.equal(at(.25).motion,null,'Antes de sujetar el tope apoya');
 assert.equal(at(.25).prediction.enabled,true);
 assert.ok(at(.25).prediction.penetrationCount>0);
 assert.equal(at(.40).motion.phase,'retroceso-antes-plegado');
 assert.equal(at(.60).motion.phase,'retirado-durante-plegado');
 assert.ok(at(.60).finger.x>at(.25).finger.x);
 assert.equal(at(.60).actualInterference.kind,'sin-interferencia-detectada');
 assert.equal(g2.penetrationAfterRetreat,false);
 assert.equal(g2.withdrawalObserved,true);
 assert.equal(data.operations[0].withdrawalObserved,false);
 assert.equal(data.operations[2].withdrawalObserved,false);
 assert.equal(data.operations[3].withdrawalObserved,false);
});

test('R97: selección Support 2 y escalonamiento quedan en informe',()=>{
 selectMachine('trumpf-v85');
 const p=manualOmega();
 p.stopByBend[3]=2;
 const before=JSON.stringify(p);
 const data=buildGaugeMotionDiagnostic(p);
 assert.deepEqual(data.operations.map(o=>o.stopNumber),[1,1,2,1]);
 assert.equal(data.operations[2].frames[0].stopNumber,2);
 assert.equal(data.operations[2].frames[0].fingerPolygon.length,6);
 assert.equal(JSON.stringify(p),before);
 assert.throws(()=>buildGaugeMotionDiagnostic(p,{samples:[.6,.4]}),/crecientes/);
 assert.throws(()=>buildGaugeMotionDiagnostic(p,{samples:[0]}),/crecientes/);
});
