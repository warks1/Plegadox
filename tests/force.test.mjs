import test from 'node:test';
import assert from 'node:assert/strict';
import {EXAMPLE,normalized,estimateAirBendForce,REFERENCE_RM_MPA} from '../engine.js';
const near=(a,b)=>assert.ok(Math.abs(a-b)<1e-8, a+' != '+b);
test('S235 V16 2 mm 500 mm: kN, t y kN/m coherentes',()=>{
 const r=estimateAirBendForce(EXAMPLE);
 near(r.kN,79.875);near(r.tonneForce,79.875/9.80665);
 near(r.kNPerMetre,159.75);
 assert.equal(r.rmMPa,450);assert.equal(r.materialReference,true);
 assert.equal(r.exceedsNominal,false);assert.equal(r.verified,false);
 assert.equal(r.conventionalAirBend90,true);
});
test('espesor doble implica fuerza cuádruple y V doble fuerza mitad',()=>{
 const a=estimateAirBendForce(EXAMPLE);
 const b=estimateAirBendForce({...EXAMPLE,thickness:4});
 const c=estimateAirBendForce({...EXAMPLE,die:'v32'});
 near(b.kN/a.kN,4);near(c.kN/a.kN,.5);
});
test('resistencia y longitud proporcionales; la Rm se guarda con la pieza',()=>{
 const a=estimateAirBendForce(EXAMPLE);
 const b=estimateAirBendForce({...EXAMPLE,width:1000,rmMPa:600});
 near(b.kN/a.kN,2*600/450);
 assert.equal(b.materialReference,false);
 assert.equal(normalized({...EXAMPLE,rmMPa:600}).rmMPa,600);
 assert.equal(normalized(EXAMPLE).rmMPa,null);
});
test('un cálculo mayor de 85 t genera advertencia, no aprobación de seguridad',()=>{
 const r=estimateAirBendForce({...EXAMPLE,thickness:10,width:2000,die:'v16'});
 assert.equal(r.exceedsNominal,true);
 assert.ok(r.loadPercent>100);
 assert.equal(r.conventionalAirBend90,false);
 assert.equal(r.verified,false);
});
test('el signo ±90 no cambia la fuerza, otros ángulos se señalan fuera de ámbito',()=>{
 const a=estimateAirBendForce(EXAMPLE),b=estimateAirBendForce({...EXAMPLE,angles:[-90,90,90,-90]});
 near(a.kN,b.kN);
 assert.equal(estimateAirBendForce({...EXAMPLE,angles:[45,90,90,90]}).conventionalAirBend90,false);
 assert.equal(REFERENCE_RM_MPA.alu1050,110);
});

test('el comparador usa desarrollo nominal en función de la V con radio estimado',()=>{
 const {development}=await import('../engine.js');
 const a=development({...EXAMPLE,die:'v16'});
 const b=development({...EXAMPLE,die:'v32'});
 assert.notEqual(a.length,b.length);
 assert.ok(b.radius>a.radius);
 assert.equal(a.nominal,b.nominal);
 const fixed=development({...EXAMPLE,die:'v16',radius:2.5});
 const fixedV32=development({...EXAMPLE,die:'v32',radius:2.5});
 near(fixed.length,fixedV32.length);
});
