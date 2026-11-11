import test from 'node:test';
import assert from 'node:assert/strict';
import {EXAMPLE} from '../engine.js';
import {setupCandidates,planCompleteSetup,SETUP_LIMITATIONS} from '../automatic-setup-planner.js';

const mockPairs={
 candidates:[
  {dieId:'v16',punchId:'straight88',score:8,goose:false},
  {dieId:'v16-30',punchId:'straight30',score:1,goose:false},
  {dieId:'v16',punchId:'goose',score:4,goose:true}
 ],targetOpening:16,reasons:[],choice:null,alternatives:[]
};
const fakePlan=async(piece,opts)=>{
 const safer=piece.die==='v16-30';
 const entry={order:[...piece.order],riskVector:[0,safer?0:1,0,0,0,0,0,0],
  hard:safer?0:1,soft:0};
 return {current:entry,best:entry,order:[...entry.order],
  incomplete:false,finalRisks:{cross:0,overlap:0},
  deepChecked:1,compared:1,verified:false,options:opts};
};
test('R31 registra punzón y matriz actuales, alternativas y pata de cabra invertida',()=>{
 const r=setupCandidates(EXAMPLE,{pairs:mockPairs,limit:8});
 assert.equal(r.selected[0].dieId,'v16');
 assert.equal(r.selected[0].punchId,'straight88');
 assert.ok(r.selected.some(x=>x.punchId==='goose'&&x.orientation==='reversed'));
 assert.ok(r.available>=4);
 assert.equal(r.verified,false);
});
test('coteja una omega ya existente y sugiere matriz/punzón distintos sin alterar la pieza original',async()=>{
 const input=structuredClone(EXAMPLE);
 const result=await planCompleteSetup(input,{toolPairs:mockPairs,
  maxSetups:3,plan:fakePlan});
 assert.equal(result.status,'PRESELECCION_2D_PENDIENTE_DE_VALIDACION');
 assert.equal(result.chosen.die,'v16-30');
 assert.equal(result.chosen.punch,'straight30');
 assert.equal(result.foundAlternative,true);
 assert.equal(result.canPropose,true);
 assert.equal(result.verified,false);
 assert.equal(result.canApproveForMachine,false);
 assert.deepEqual(input,EXAMPLE);
});
test('elección manual de herramientas: se compara y conserva exactamente la pareja elegida',async()=>{
 const result=await planCompleteSetup(EXAMPLE,{toolPairs:mockPairs,plan:fakePlan,
  lockTools:true});
 assert.equal(result.checked,1);
 assert.equal(result.chosen.die,'v16');
 assert.equal(result.chosen.punch,'straight88');
 assert.equal(result.changes.die,false);
 assert.equal(result.changes.punch,false);
});
test('bloqueo del orden manual se transmite al evaluador sin modificar secuencia',async()=>{
 const requests=[];
 const input={...EXAMPLE,order:[3,2,1,0]};
 const result=await planCompleteSetup(input,{
  toolPairs:mockPairs,maxSetups:3,lockOrder:true,
  plan:async(p,opts)=>{requests.push(opts.lockOrder);return fakePlan(p,opts);}
 });
 assert.ok(requests.every(Boolean));
 assert.deepEqual(result.chosen.order,[3,2,1,0]);
 assert.equal(result.changes.order,false);
});
test('errores, falta de datos y geometría provisional nunca dan autorización CNC',async()=>{
 const result=await planCompleteSetup(EXAMPLE,{
  toolPairs:mockPairs,maxSetups:3,plan:async()=>{throw Error('CAD no disponible');}
 });
 assert.equal(result.canPropose,false);
 assert.equal(result.chosen,null);
 assert.equal(result.canApproveForMachine,false);
 assert.match(result.limitations,/mesa\/trancha/);
 assert.match(SETUP_LIMITATIONS,/NO garantiza/);
 assert.ok(result.results.every(x=>!x.usable));
});
test('cancelación descarta resultados parciales sin cambiar la pieza',async()=>{
 let cancelled=false;
 const r=await planCompleteSetup(EXAMPLE,{toolPairs:mockPairs,
  maxSetups:3,plan:fakePlan,
  onProgress:()=>{cancelled=true;},cancelled:()=>cancelled});
 assert.equal(r,null);
});
test('con herramientas de catálogo reales no inventa dimensiones ni una pareja ficticia',()=>{
 const result=setupCandidates(EXAMPLE,{limit:3});
 assert.ok(result.eligiblePairs>0);
 assert.ok(result.selected.every(x=>typeof x.dieId==='string'&&typeof x.punchId==='string'));
 assert.equal(result.selected[0].manual,true);
});
