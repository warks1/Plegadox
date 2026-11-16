import test from 'node:test';
import assert from 'node:assert/strict';
import {EXAMPLE,normalized,stage} from '../engine.js';
import {resolveGaugeSetup,foldedStopFaceCandidate} from '../gauge-contact-solver.js';

const makePiece=()=>normalized(EXAMPLE);
const checkWith=validSegment=>{
 const seen=[];
 const evaluate=(piece,st,ref,_config,stop)=>{
  const segment=ref.segmentIndex;
  seen.push({segment,stop,manualDraft:piece.gaugeSegmentByBend[st.activeBend]!==null});
  const valid=typeof validSegment==='function'?
   validSegment(segment,ref,stop):segment===validSegment;
  const foldedWingContact=segment>0&&segment<piece.flanges.length-1&&
   valid&&stop===1;
  return {valid,ref,stopNumber:stop,foldedWingContact,
   faceAccessible:valid,clearanceWarning:false,verified:false,
   reason:valid?'apoyo nominal 2D':'sin apoyo frontal'};
 };
 return {evaluate,seen};
};

test('R104: solo cuando fallan ambos cantos libres busca pestaña ya plegada',()=>{
 const p=makePiece(),before=JSON.stringify(p),st=stage(p,5.1);
 const {evaluate,seen}=checkWith(2);
 const result=resolveGaugeSetup(p,st,{}, {evaluate});
 assert.equal(result.valid,true);
 assert.equal(result.manual,false);
 assert.equal(result.autoSelected,true);
 assert.equal(result.ref.segmentIndex,2);
 assert.equal(result.ref.freeEdge,false);
 assert.equal(result.foldedWingContact,true);
 assert.equal(result.autoSupportKind,'CARA_EXTERIOR_PREPLEGADA_2D');
 assert.equal(result.needsFoldedFaceReview,true);
 assert.ok(seen.some(x=>x.segment===0));
 assert.ok(seen.some(x=>x.segment===p.flanges.length-1));
 assert.equal(JSON.stringify(p),before,'no modificar el programa del operario');
 assert.deepEqual(p.order,[0,1,3,2]);
});

test('R104: con canto libre válido conserva preferencia y no investiga interiores',()=>{
 const p=makePiece(),st=stage(p,5.1);
 const {evaluate,seen}=checkWith(0);
 const result=resolveGaugeSetup(p,st,{}, {evaluate});
 assert.equal(result.ref.segmentIndex,0);
 assert.equal(result.autoSupportKind,'CANTO_LIBRE_2D');
 assert.equal(result.needsFoldedFaceReview,false);
 assert.ok(!seen.some(x=>x.segment===2));
});

test('R104: STOP 2 no usa soporte de pestaña como si fuera una repisa',()=>{
 const p=makePiece(),st=stage(p,5.1);
 p.stopByBend[st.activeBend]=2;
 const {evaluate,seen}=checkWith(2);
 const result=resolveGaugeSetup(p,st,{}, {evaluate});
 assert.equal(result.valid,false);
 assert.equal(result.noSafeContact,true);
 assert.equal(result.autoSupportKind,'SIN_APOYO_NOMINAL_2D');
 assert.ok(!seen.some(x=>x.segment===2));
});

test('R104: un vértice interior ordinario nunca se convierte en apoyo automático',()=>{
 const p=makePiece(),st=stage(p,5.1);
 const seen=[];
 const evaluate=(piece,_st,ref)=>{
  seen.push(ref.segmentIndex);
  return {ref,valid:ref.segmentIndex===2,foldedWingContact:false,
   clearanceWarning:false,verified:false};
 };
 const result=resolveGaugeSetup(p,st,{}, {evaluate});
 assert.equal(result.valid,false);
 assert.equal(result.noSafeContact,true);
 assert.ok(seen.includes(2));
 assert.equal(result.candidates.some(x=>x.ref.segmentIndex===2),false);
});

test('R104: una selección manual nunca se reemplaza, aunque falle el contacto',()=>{
 const p=makePiece(),st=stage(p,5.1),before=JSON.stringify(p);
 p.gaugeSegmentByBend[st.activeBend]=1;
 const {evaluate,seen}=checkWith(2);
 const result=resolveGaugeSetup(p,st,{}, {evaluate});
 assert.equal(result.manual,true);
 assert.equal(result.autoSelected,false);
 assert.equal(result.ref.segmentIndex,1);
 assert.equal(result.candidates.length,1);
 assert.equal(seen.length,1);
 assert.equal(JSON.stringify({...p,gaugeSegmentByBend:JSON.parse(before).gaugeSegmentByBend}),
  before,'conservar íntegros los demás datos de la pieza');
});

test('R104: cara vertical preplegada requiere fracción de golpe ejecutada',()=>{
 const positions=[
  {x:0,y:0},{x:40,y:0},{x:60,y:0},
  {x:60,y:18},{x:80,y:18}
 ];
 const ref={freeEdge:false,atEnd:true,sourceIndex:2,pivotIndex:1};
 const feature={surface:'vertical-front',point:{x:0,y:0},
  from:{x:0,y:0},to:{x:0,y:20}};
 const done={fractions:[0,0,1,0]};
 const contact=foldedStopFaceCandidate(positions,ref,done,feature,2,true);
 assert.ok(contact,'se admite cara exterior perpendicular ya plegada');
 assert.equal(contact.verified,false);
 assert.equal(contact.overlap,18);
 assert.equal(foldedStopFaceCandidate(positions,ref,
  {fractions:[0,0,0,0]},feature,2,true),null,
  'no afirmar apoyo en un ala que todavía no se ha plegado');
 assert.equal(foldedStopFaceCandidate(positions,ref,done,feature,2,false),
  null,'sin autorización no usar vértice interior');
 assert.equal(foldedStopFaceCandidate(positions,ref,done,
  {...feature,surface:'horizontal-top'},2,true),null,
  'la cara lateral no sustituye la repisa de Support 2');
});

test('R105: cambia el canto original con HOLGURA si otro canto libre está limpio',()=>{
 const p=makePiece(),before=JSON.stringify(p),st=stage(p,5.1);
 const firstSegment=st.activeBend;
 const evaluate=(_piece,_st,ref)=>{
  const isFirst=ref.segmentIndex===firstSegment;
  const otherFree=ref.segmentIndex===0;
  return {valid:isFirst||otherFree,ref,
   foldedWingContact:false,faceAccessible:true,
   clearanceWarning:isFirst,verified:false};
 };
 const result=resolveGaugeSetup(p,st,{}, {evaluate});
 assert.equal(result.valid,true);
 assert.equal(result.ref.freeEdge,true);
 assert.equal(result.ref.segmentIndex,0);
 assert.equal(result.clearanceWarning,false);
 assert.equal(result.autoSelected,true);
 assert.equal(JSON.stringify(p),before);
});

test('R105: no invierte la Omega si las dos alternativas tienen la misma holgura',()=>{
 const p=makePiece(),st=stage(p,5.1);
 const evaluation=(_piece,_st,ref)=>({
  valid:true,ref,foldedWingContact:false,faceAccessible:true,
  clearanceWarning:true,verified:false
 });
 const first=resolveGaugeSetup(p,st,{}, {evaluate:evaluation});
 assert.equal(first.ref.segmentIndex,st.activeBend,
  'Mantener lado de alimentación programado si no mejora el aviso');
 assert.equal(first.autoSelected,false);
 assert.equal(first.clearanceWarning,true);
});

test('R105: no cambia de lado cuando la referencia original ya está limpia',()=>{
 const p=makePiece(),st=stage(p,5.1);
 const evaluation=(_piece,_st,ref)=>({
  valid:true,ref,foldedWingContact:false,faceAccessible:true,
  clearanceWarning:false,verified:false
 });
 const selected=resolveGaugeSetup(p,st,{}, {evaluate:evaluation});
 assert.equal(selected.ref.segmentIndex,st.activeBend);
 assert.equal(selected.autoSelected,false);
});
