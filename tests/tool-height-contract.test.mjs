import test from 'node:test';
import assert from 'node:assert/strict';
import {PUNCHES,DIES,EXAMPLE} from '../engine.js';
import {sectionPunch,sectionDie,sectionBounds} from '../tool-profiles.js';
import {toolHeightAudit,auditToolLibraryHeights} from '../tool-height-audit.js';
import {auditForWorkshop} from '../workshop-audit.js';
const eq=(actual,expected,id)=>assert.ok(Math.abs(actual-expected)<1e-6,
 id+': esperado '+expected+' mm y dibujado '+actual+' mm');
test('TODOS los punzones y matrices del catálogo conservan su cota H sin redimensionarla al dibujar',()=>{
 const summary=auditToolLibraryHeights(PUNCHES,DIES);
 assert.deepEqual(summary.mismatches.map(x=>x.id),[]);
 assert.equal(summary.records.length,PUNCHES.length+DIES.length);
 assert.equal(summary.verifiedForManufacture,false);
 for(const t of PUNCHES){
  const audit=toolHeightAudit(t,'punch');
  const dims=sectionPunch(t);
  eq(audit.measuredNominal,t.height,t.id);
  if(t.profileStyle!=='user-photo')eq(dims.height,t.height,t.id);
  assert.equal(audit.geometryVerified,false);
 }
 for(const t of DIES){
  const audit=toolHeightAudit(t,'die');
  eq(audit.drawnHeight,t.height,t.id);
  assert.equal(audit.heightMatches,true);
 }
});
test('CONIC GN9/GN6 H120, AMADA W55/W95 H200/H220: H total, no H útil ni escala arbitraria',()=>{
 const refs=['conic-gn9-12-8806','conic-gn6-12-8806',
  'amada-841-w55','amada-841-w95','amada-846-w110',
  'amada-846-w55-h220','amada-846-w95-h220'];
 for(const id of refs){
  const t=PUNCHES.find(x=>x.id===id);
  const p=sectionPunch(t),b=sectionBounds(p.points),a=toolHeightAudit(t);
  assert.equal(a.nominalType,'total',id);
  eq(b.maxY-b.minY,t.height,id);
  assert.equal(p.model,'gooseneck',id);
  // El vástago debe ser más estrecho que el cuerpo de la pata de cabra.
  const maxWidth=b.maxX-b.minX;
  const topPoints=p.points.filter(([x,y])=>Math.abs(y-t.height)<1e-6);
  assert.ok(topPoints.length>=2,id+': falta el vástago superior');
  assert.ok(Math.max(...topPoints.map(x=>x[0]))-
   Math.min(...topPoints.map(x=>x[0]))<maxWidth*.8,id+': el vástago no puede ocupar todo el ancho de la pata');
 }
});
test('foto 50 / H útil100 R1: no confundir extensión de vástago sin cota con H nominal',()=>{
 const t=PUNCHES.find(x=>x.id==='ref-goose-50-100-r1'),shape=sectionPunch(t);
 const a=toolHeightAudit(t),b=sectionBounds(shape.points);
 assert.equal(t.height,100);
 assert.equal(a.nominalType,'working');
 eq(a.measuredNominal,100,t.id);
 eq(b.maxX-b.minX,50,t.id);
 eq(shape.tipRadius,1,t.id);
 eq(a.drawnHeight,128,t.id);
 assert.equal(a.estimatedUpperHeight,28);
 assert.equal(a.documentedHeight,false);
 assert.equal(a.geometryVerified,false);
 assert.ok(a.issues.some(x=>x.includes('no está acotado')));
 const report=auditForWorkshop({...EXAMPLE,punch:t.id});
 assert.ok(report.issues.some(x=>x.code==='head-projection-punzón'));
 assert.equal(report.status,'SIN_VALIDACION_INDUSTRIAL');
});
test('las siete referencias AMADA publicadas R0,6 son R0,6, no R0,3 (diámetro Ø1,2)',()=>{
 for(const id of ['amada-831','amada-841-w55','amada-841-w95',
  'amada-846-w110','amada-804','amada-846-w55-h220','amada-846-w95-h220']){
  const tool=PUNCHES.find(x=>x.id===id),section=sectionPunch(tool);
  assert.equal(tool.tip,1.2,id);
  eq(section.tipRadius,.6,id);
 }
});
test('matriz Rolleri H total120 y útil100: no añadir ni sustraer cotas del perfil',()=>{
 const t=DIES.find(x=>x.id==='rolleri-tmr100-16-30');
 const s=sectionDie(t),a=toolHeightAudit(t);
 eq(s.height,120,t.id);
 eq(a.declaredHeight,120,t.id);
 eq(a.workingHeight,100,t.id);
 eq(a.drawnHeight,120,t.id);
 assert.equal(a.heightMatches,true);
 assert.equal(a.geometryVerified,false);
});
