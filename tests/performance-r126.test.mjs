import test from 'node:test';
import assert from 'node:assert/strict';
import {createPlannerRunner,plannerStorageSnapshot} from '../planner-worker-client.js';
import {renderBudget} from '../render-budget.js';
test('cancelar el cálculo anterior impide aplicar respuestas antiguas',async()=>{
 const workers=[];
 const runner=createPlannerRunner(()=>{const w={terminate(){this.terminated=true;},postMessage(s){this.snapshot=s;}};workers.push(w);return w;});
 const first=runner.run({piece:'old'});const rejected=assert.rejects(first,{name:'AbortError'});
 const second=runner.run({piece:'new'});await rejected;
 assert.equal(workers[0].terminated,true);
 workers[0].onmessage({data:{ok:true,report:'stale'}});
 workers[1].onmessage({data:{ok:true,report:'current'}});
 assert.equal(await second,'current');assert.equal(workers[1].terminated,true);
});
test('fallo de worker no lanza cálculo síncrono',async()=>{
 const runner=createPlannerRunner(()=>{throw Error('unsupported');});
 await assert.rejects(runner.run({}),/segundo plano/);
});
test('snapshot sólo incluye configuración geométrica, no biblioteca ni preferencias',()=>{
 const values={'plegadox:active-machine:v1':'trumpf-v85','plegadox:machine-cad:v1':'{}','plegadox:piece:v1':'private','plegadox:software-preferences:v1':'{}'};
 const keys=Object.keys(values),storage={length:keys.length,key:i=>keys[i],getItem:k=>values[k]};
 assert.deepEqual(plannerStorageSnapshot(storage),{'plegadox:active-machine:v1':'trumpf-v85','plegadox:machine-cad:v1':'{}'});
});
test('modo ligero reduce píxeles y refresco sin parámetros físicos',()=>{
 const light=renderBudget('light',{memory:16,cores:12}),quality=renderBudget('quality',{memory:2,cores:2});
 assert.equal(light.pixelRatio,1);assert.equal(quality.pixelRatio,2);
 assert.deepEqual(renderBudget('auto',{memory:4}),light);
 assert.deepEqual(renderBudget('auto',{}),quality);
 assert.ok(light.sceneMs>quality.sceneMs);
});
