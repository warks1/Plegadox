import test from 'node:test';
import assert from 'node:assert/strict';
import {EXAMPLE,development} from '../engine.js';
import {MEASUREMENTS_KEY,MEASUREMENT_FORMAT,measurementKey,calibrationSuggestion,
 createMeasurement,persistMeasurement,readMeasurements,deleteMeasurement,
 mergeMeasurements} from '../workshop-measurements.js';
const memory=()=>{
 const values=new Map();
 return {getItem:k=>values.get(k)??null,setItem:(k,v)=>values.set(k,String(v)),
  removeItem:k=>values.delete(k),values};
};
const exact={...EXAMPLE,kFactor:.38,radius:2.4};
const measuredFlat=development(exact).length;
test('K recuperado para un patrón medido con R real, sin confundir signo ±',()=>{
 const p={...EXAMPLE,kFactor:null,radius:null};
 const x=calibrationSuggestion(p,{measuredFlat,measuredRadius:2.4,anglesChecked:true});
 assert.equal(x.available,true);
 assert.ok(Math.abs(x.proposedK-.38)<1e-4);
 assert.equal(x.deviation,Math.round((measuredFlat-development(p).length)*1e5)/1e5);
 assert.deepEqual(p.angles,[90,-90,-90,90]);
});
test('sin radio o sin comprobación de cotas/ángulos NO propone K',()=>{
 assert.equal(calibrationSuggestion(EXAMPLE,{measuredFlat,measuredRadius:null,
  anglesChecked:true}).available,false);
 assert.equal(calibrationSuggestion(EXAMPLE,{measuredFlat,measuredRadius:2.4,
  anglesChecked:false}).available,false);
});
test('medición incompatible fuera de rango K: no truncar/falsear propuesta',()=>{
 const d=development({...EXAMPLE,radius:2.4,kFactor:.6}).length+50;
 const a=calibrationSuggestion(EXAMPLE,{measuredFlat:d,measuredRadius:2.4,anglesChecked:true});
 assert.equal(a.available,false);
 assert.equal(a.proposedK,null);
 assert.match(a.reason,/fuera del intervalo/);
});
test('no permite mediciones inválidas ni confía en un verified verdadero importado',()=>{
 for(const flat of [0,-2,NaN,Infinity,100001])
  assert.throws(()=>createMeasurement(EXAMPLE,{measuredFlat:flat}));
 const record=createMeasurement(EXAMPLE,{measuredFlat,measuredRadius:2.4,
  anglesChecked:true,notes:'Lote 01'},{id:'wm-ensayo-01',now:'2026-11-02T12:00:00Z'});
 assert.equal(record.format,MEASUREMENT_FORMAT);
 assert.equal(record.proposedK,calibrationSuggestion(EXAMPLE,{
  measuredFlat,measuredRadius:2.4,anglesChecked:true}).proposedK);
 const normalized=mergeMeasurements([],[{...record,verified:true,industrialApproval:true}])[0];
 assert.equal(normalized.verified,false);
 assert.equal(normalized.industrialApproval,false);
});
test('registros guardados por material, espesor, V, punzón y geometría',()=>{
 const st=memory();
 const a=createMeasurement(EXAMPLE,{measuredFlat,measuredRadius:2.4,
  anglesChecked:true},{id:'wm-ensayo-01'});
 persistMeasurement(st,a);
 assert.equal(readMeasurements(st).length,1);
 assert.equal(readMeasurements(st)[0].key,measurementKey(EXAMPLE));
 assert.notEqual(measurementKey(EXAMPLE),measurementKey({...EXAMPLE,die:'v24'}));
 assert.notEqual(measurementKey(EXAMPLE),measurementKey({...EXAMPLE,thickness:3}));
 assert.equal(measurementKey(EXAMPLE),measurementKey({...EXAMPLE,kFactor:.35}));
 assert.throws(()=>persistMeasurement(st,a),/ya existe/);
 deleteMeasurement(st,a.id);
 assert.equal(readMeasurements(st).length,0);
});
test('registro corrupto se conserva intacto y nunca se sobreescribe',()=>{
 const st=memory();st.setItem(MEASUREMENTS_KEY,'malformed');
 assert.throws(()=>readMeasurements(st),/dañado/);
 const a=createMeasurement(EXAMPLE,{measuredFlat},{id:'wm-ensayo-01'});
 assert.throws(()=>persistMeasurement(st,a),/dañado/);
 assert.equal(st.getItem(MEASUREMENTS_KEY),'malformed');
});
test('fusionar registros mantiene los originales y rechaza ID en conflicto',()=>{
 const a=createMeasurement(EXAMPLE,{measuredFlat},{id:'wm-ensayo-01'});
 const b=createMeasurement(EXAMPLE,{measuredFlat:measuredFlat+1},{id:'wm-ensayo-02'});
 assert.equal(mergeMeasurements([a],[b]).length,2);
 assert.equal(mergeMeasurements([a],[a]).length,1);
 assert.throws(()=>mergeMeasurements([a],[{...a,notes:'distinto'}]),/Conflicto/);
});
