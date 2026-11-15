import test from 'node:test';
import assert from 'node:assert/strict';
import {EXAMPLE} from '../engine.js';
import {recommendTooling} from '../tooling-advisor.js';

const p={...EXAMPLE,flanges:[50,50],angles:[90],order:[0],width:100};
const die={id:'v16',name:'V16 WILA nominal',opening:16,angle:86,
 height:55,length:515,mount:'WILA',maxTPerMetre:120};
const punch=rating=>({id:'wila-test',name:'Punzón WILA 28° nominal',
 angle:28,tip:2,height:163,length:515,mount:'WILA',
 maxTPerMetre:rating});

test('no recomendar WILA BIU por superar 10 t/m aunque la plegadora tenga tonelaje',()=>{
 const result=recommendTooling(p,{dies:[die],punches:[punch(10)]});
 assert.equal(result.choice,null);
 assert.equal(result.candidateCount,0);
});
test('si los dos límites publicados cubren el esfuerzo estimado puede proponerse, sin certificarlo',()=>{
 const result=recommendTooling(p,{dies:[die],punches:[punch(20)]});
 assert.ok(result.choice);
 assert.equal(result.choice.nominalPunchTPerMetre,20);
 assert.equal(result.choice.nominalDieTPerMetre,120);
 assert.ok(result.choice.forceTonnesPerMetre>16&&result.choice.forceTonnesPerMetre<17);
 assert.ok(result.choice.warnings.some(w=>w.includes('Verificar distribución')));
 assert.equal(result.choice.verified,false);
});
test('rechazar también cuando la matriz documentada no admite la carga por metro',()=>{
 const insufficientDie={...die,maxTPerMetre:5};
 const result=recommendTooling(p,{dies:[insufficientDie],punches:[punch(70)]});
 assert.equal(result.choice,null);
});
test('sin límite documentado no declarar carga admisible comprobada',()=>{
 const unknownDie={...die,maxTPerMetre:undefined};
 const result=recommendTooling(p,{dies:[unknownDie],punches:[punch(20)]});
 assert.ok(result.choice);
 assert.equal(result.choice.nominalDieTPerMetre,null);
 assert.ok(result.choice.warnings.some(w=>w.includes('sin documentar')));
 assert.equal(result.choice.verified,false);
});
