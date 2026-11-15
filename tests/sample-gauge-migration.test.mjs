import test from 'node:test';
import assert from 'node:assert/strict';
import {EXAMPLE,normalized,stage} from '../engine.js';
import {getActiveMachineConfig} from '../machine-config.js';
import {selectMachine} from '../machine-selection.js';
import {resolveGaugeSetup} from '../gauge-contact-solver.js';
import {migrateLegacyOmegaGauge} from '../sample-gauge-migration.js';

const previous={...EXAMPLE,gaugeSideByBend:['before','before','before','after']};
test('Omega histórica de ejemplo se repara sin modificar orden ni ángulos',()=>{
 const upgraded=migrateLegacyOmegaGauge(previous);
 assert.deepEqual(upgraded.gaugeSideByBend,['auto','auto','auto','auto']);
 assert.deepEqual(upgraded.angles,[90,-90,-90,90]);
 assert.deepEqual(upgraded.order,[0,1,3,2]);
 assert.deepEqual(previous.gaugeSideByBend,['before','before','before','after']);
});
test('taller: una referencia manual no se migra',()=>{
 const p={...previous,name:'Mi pieza de cliente'};
 assert.strictEqual(migrateLegacyOmegaGauge(p),p);
 const q={...previous,gaugeSegmentByBend:[null,0,null,null]};
 assert.strictEqual(migrateLegacyOmegaGauge(q),q);
 const edited={...previous,flanges:[50,49,50,50,50]};
 assert.strictEqual(migrateLegacyOmegaGauge(edited),edited);
});
test('Omega 1-2-4-3 ofrece apoyo frontal 2D en los 4 golpes',()=>{
 selectMachine('trumpf-v85');
 const p=normalized(EXAMPLE),m=getActiveMachineConfig();
 for(let operation=0;operation<4;operation++){
  const decision=resolveGaugeSetup(p,stage(p,operation*5+.1),m);
  assert.equal(decision.valid,true,'sin apoyo frontal nominal en operación '+(operation+1));
  assert.equal(decision.ref.freeEdge,true);
  assert.equal(decision.interference.warning,false);
  assert.equal(decision.verified,false);
 }
});
