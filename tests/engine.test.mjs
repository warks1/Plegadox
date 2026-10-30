import test from 'node:test';
import assert from 'node:assert/strict';
import {EXAMPLE,normalized,profile,stage,development,orientedForMachine,selfIntersects,toolAngleCompatibility,getTooling} from '../engine.js';
const near=(a,b)=>assert.ok(Math.abs(a-b)<1e-6, a+' != '+b);
test('Chapa inicialmente plana, no nace omega ya doblada',()=>{
 const p=profile(EXAMPLE);assert.ok(p.points.every(point=>point.y===0));
});
test('Los signos +90 y -90 se representan de manera contraria',()=>{
 const base={flanges:[50,50],angles:[90]};
 const positive=profile(base,[1]).points.at(-1);
 const negative=profile({...base,angles:[-90]},[1]).points.at(-1);
 near(positive.x,negative.x);near(positive.y,-negative.y);
 assert.ok(positive.y>0 && negative.y<0);
});
test('El ejemplo final conserva pliegues +90,-90,-90,+90',()=>{
 const f=profile(EXAMPLE,[1,1,1,1]),dirs=f.directions.map(r=>Math.round(r*180/Math.PI));
 assert.deepEqual(dirs,[0,90,0,-90,0]);
});
test('El orden de operaciones 1-2-4-3 se aplica a tiempo real',()=>{
 const p=normalized(EXAMPLE);assert.deepEqual(p.order,[0,1,3,2]);
 const s=stage(p,15.2);assert.equal(s.activeBend,2);
 assert.equal(s.fractions[0],1);assert.equal(s.fractions[1],1);assert.equal(s.fractions[3],1);
 assert.equal(s.fractions[2],0);
});
test('La geometría final no depende del orden',()=>{
 const p=normalized(EXAMPLE);const a=profile(p,stage(p,20).fractions).points;
 const b=profile({...p,order:[3,2,1,0]},stage({...p,order:[3,2,1,0]},20).fractions).points;
 assert.deepEqual(a,b);
});
test('Durante el plegado no se aplica el ángulo final antes del descenso',()=>{
 const before=stage(EXAMPLE,1.7);assert.equal(before.fractions[0],0);
 const during=stage(EXAMPLE,2.7);assert.ok(during.fractions[0]>0 && during.fractions[0]<1);
});
test('El punto activo coincide con el eje del punzón',()=>{
 const p=normalized(EXAMPLE),pts=orientedForMachine(p,[1,1,0,0],2);
 near(pts[3].x,0);near(pts[3].y,0);
});
test('Cálculo geométrico de desarrollo finito',()=>{
 const d=development(EXAMPLE);assert.ok(Number.isFinite(d.length));
 assert.ok(d.perBend.length===4);assert.ok(d.length>0);
});
test('Normalización protege valores de entrada y orden sin repeticiones',()=>{
 const p=normalized({flanges:[10,-40,15],angles:[190,-999],order:[1,1,19,-1,0],thickness:-5});
 assert.deepEqual(p.order,[1,0]);assert.deepEqual(p.angles,[179,-179]);assert.equal(p.thickness,.2);
});
test('Línea recta no presenta interferencias',()=>assert.equal(selfIntersects(profile(EXAMPLE).points),false));

test('el interior geométrico conserva el signo de giro y compara ambos útiles',()=>{
 const a=toolAngleCompatibility({...EXAMPLE,angles:[120,90,90,90]},0);
 const b=toolAngleCompatibility({...EXAMPLE,angles:[-120,90,90,90]},0);
 near(a.interiorAngle,60);
 near(a.dieAngle,88);
 near(a.punchAngle,88);
 assert.equal(a.warning,true);
 assert.equal(b.warning,true);
 const normal=toolAngleCompatibility(EXAMPLE,0);
 assert.equal(normal.interiorAngle,90);
 assert.equal(normal.warning,false);
 assert.equal(normal.verified,false);
});

test('el núcleo reconoce herramientas de catálogo aunque no se inicie la interfaz',()=>{
 const p=normalized({...EXAMPLE,punch:'amada-831',die:'conic-v010-30-s'});
 assert.equal(p.punch,'amada-831');
 assert.equal(p.die,'conic-v010-30-s');
 const {punch,die}=getTooling(p);
 assert.equal(punch.length,415);
 assert.equal(die.length,835);
});
