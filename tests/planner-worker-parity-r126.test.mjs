import test from 'node:test';
import assert from 'node:assert/strict';
import {Worker} from 'node:worker_threads';
import {DIES,PUNCHES,normalized} from '../engine.js';
import {optimizeBendPlan} from '../integrated-bend-planner.js';
import {getActiveMachineConfig} from '../machine-config.js';
test('worker aislado devuelve el mismo plan con la misma geometría y límites',async()=>{
 const piece=normalized({flanges:[60,80],angles:[90],order:[0],die:'v16',punch:'straight88',thickness:2,width:100});
 const options={machine:getActiveMachineConfig(),maxPairs:1,maxOrders:1,maxFinalists:1,maxVolumeCandidates:1,maxToolCriticalCandidates:1,toolSamples:2,gaugeSamples:8,volumeSamples:4};
 const expected=optimizeBendPlan(piece,options);
 const url=new URL('../planner-worker.js',import.meta.url).href;
 const worker=new Worker(`const {parentPort,workerData}=require('node:worker_threads');import(workerData.url).then(m=>m.evaluatePlannerSnapshot(workerData.snapshot)).then(r=>parentPort.postMessage(r)).catch(e=>{throw e;});`,{eval:true,workerData:{url,snapshot:{piece,options,dies:DIES,punches:PUNCHES,storage:{'plegadox:active-machine:v1':'trumpf-v85'}}}});
 try{const report=await new Promise((resolve,reject)=>{worker.once('message',resolve);worker.once('error',reject);});assert.deepEqual(report,expected);}
 finally{await worker.terminate();}
});
