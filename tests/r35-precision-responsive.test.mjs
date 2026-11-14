import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {EXAMPLE,normalized,development,DIES,PUNCHES} from '../engine.js';
import {flatBendLayout} from '../flat-layout.js';
import {optimizeBendPlan} from '../integrated-bend-planner.js';
import {measurementKey} from '../workshop-measurements.js';

const near=(a,b)=>assert.ok(Math.abs(a-b)<1e-7,`${a} != ${b}`);
const pair=(d='v16',p='straight88')=>({
 dieId:d,punchId:p,dieName:DIES.find(x=>x.id===d).name,
 punchName:PUNCHES.find(x=>x.id===p).name,score:0
});
const sheet=(_p,order)=>({order,score:0,counts:{cross:0,overlap:0,touch:0,close:0}});
const gauge=()=>({warningCount:0,operations:[]});
const volume=()=>({modeledMachineWarnings:0,uncertainSweptIntervals:0,framesChecked:10});

test('BD medida por pliegue modifica exactamente el largo de corte y marcas de DXF',()=>{
 const base=development(EXAMPLE);
 const input={...EXAMPLE,bendDeductionByBend:[3.5,null,4.2,null]};
 const result=development(input);
 near(result.perBend[0].bd,3.5);
 near(result.perBend[2].bd,4.2);
 assert.equal(result.perBend[1].calibrated,false);
 assert.equal(result.calibratedCount,2);
 near(result.length,base.length+base.perBend[0].bd-3.5+base.perBend[2].bd-4.2);
 const flat=flatBendLayout(input);
 near(flat.length,result.length);
 near(flat.folds[0].position,EXAMPLE.flanges[0]-3.5/2);
 near(flat.folds[1].position,EXAMPLE.flanges[0]+EXAMPLE.flanges[1]-3.5-result.perBend[1].bd/2);
});
test('BD conserva el índice geométrico aunque se cambie el orden manual',()=>{
 const p={...EXAMPLE,order:[3,2,1,0],bendDeductionByBend:[null,3.8,null,4.1]};
 assert.deepEqual(normalized(p).bendDeductionByBend,[null,3.8,null,4.1]);
 assert.equal(development(p).length,development({...p,order:[0,1,2,3]}).length);
 assert.notEqual(measurementKey(p),measurementKey({...p,bendDeductionByBend:[null,3.7,null,4.1]}));
});
test('las BD exteriores se ignoran con datum neutro, sin borrarlas',()=>{
 const input={...EXAMPLE,datum:'neutral',bendDeductionByBend:[4,4,4,4]};
 const result=development(input);
 const baseline=development({...EXAMPLE,datum:'neutral'});
 near(result.length,baseline.length);
 assert.equal(result.calibratedCount,0);
 assert.deepEqual(normalized(input).bendDeductionByBend,[4,4,4,4]);
 assert.deepEqual(normalized({...EXAMPLE,bendDeductionByBend:[NaN,-1,10000,'']}).bendDeductionByBend,[null,null,null,null]);
});
test('el planificador no recomienda ninguna variante con penetración modelada',()=>{
 const r=optimizeBendPlan(EXAMPLE,{
  toolingAdvice:{candidates:[pair()],reasons:[]},sheetEvaluator:sheet,
  gaugeEvaluator:gauge,volumeEvaluator:volume,
  toolEvaluator:p=>({operations:p.order.map(()=>({
   samples:2,possibleToolIntrusion:true,possibleToolInterference:true
  }))}),maxPairs:1,maxOrders:4,maxFinalists:5,maxVolumeCandidates:5
 });
 assert.equal(r.best,null);
 assert.equal(r.status,'SIN_PLAN_SIN_PENETRACIONES_MODELADAS');
 assert.ok(r.manual);
 assert.deepEqual(r.manual.order,EXAMPLE.order);
});
test('no descarta el orden físicamente viable por empate de puntuación de chapa',()=>{
 const r=optimizeBendPlan(EXAMPLE,{
  toolingAdvice:{candidates:[pair()],reasons:[]},sheetEvaluator:sheet,
  gaugeEvaluator:gauge,volumeEvaluator:volume,
  toolEvaluator:p=>({operations:p.order.map(()=>({
   samples:2,possibleToolIntrusion:p.order[0]!==2,
   possibleToolInterference:p.order[0]!==2
  }))}),maxPairs:1,maxOrders:4,maxFinalists:8,maxVolumeCandidates:8
 });
 assert.ok(r.best,'Debe encontrar una secuencia que comience por el pliegue 3');
 assert.equal(r.best.order[0],2);
 assert.equal(r.best.toolPenetrations,0);
});
test('splash conserva foto original y cubre el viewport sin deformarla',()=>{
 const html=readFileSync(new URL('../splash-foto-premium.html',import.meta.url),'utf8');
 assert.match(html,/id="frame"/);
 assert.match(html,/#screen\{position:fixed;inset:0/);
 assert.match(html,/#screen::before/);
 assert.match(html,/object-fit:contain/);
 assert.match(html,/@media\(orientation:portrait\)/);
 assert.match(html,/src="\.\/plegadox-premium-selected\.png"/);
 assert.match(html,/id="progress"/);
});
test('UI incluye compensación individual y estado de medidas',()=>{
 const html=readFileSync(new URL('../index.html',import.meta.url),'utf8');
 const app=readFileSync(new URL('../app.js',import.meta.url),'utf8');
 assert.match(html,/id="bendDeductionInputs"/);
 assert.match(app,/renderBendDeductionCalibration\(\)/);
 assert.match(app,/bendDeductionByBend/);
});
