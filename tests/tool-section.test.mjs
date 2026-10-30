import test from 'node:test';
import assert from 'node:assert/strict';
import {EXAMPLE,stage,profile,orientedForMachine,presentedForMachine} from '../engine.js';
import {sectionPunch,sectionDie} from '../tool-profiles.js';

const approximate=(x,y,tolerance=.03)=>assert.ok(Math.abs(x-y)<tolerance,`Esperado ${y}; recibido ${x}`);
test('un punzón de 30°, 60° y 88° tiene transiciones diferentes',()=>{
 const tool=a=>sectionPunch({angle:a,height:120,tip:.6,type:'recto'});
 const p30=tool(30),p60=tool(60),p88=tool(88);
 const taper=p=>p.points[2][1];
 assert.ok(taper(p30)<taper(p60) && taper(p60)<taper(p88));
 assert.ok(p30.points[0][1]===p88.points[0][1]);
 assert.notDeepEqual(p30.points,p60.points);
 assert.notDeepEqual(p60.points,p88.points);
});
test('la cuña mide el ángulo incluido representado',()=>{
 for(const angle of [30,60,88]){
  const p=sectionPunch({angle,height:120,tip:1});
  const [x0,y0]=p.points[2], [x1,y1]=p.points[3];
  const dx=x0-x1,dy=y0-y1;
  const included=2*Math.atan2(dx,dy)*180/Math.PI;
  approximate(included,angle);
 }
});
test('una V6/30 tiene profundidad distinta de V6/88',()=>{
 const a=sectionDie({opening:6,angle:30,height:80}),b=sectionDie({opening:6,angle:88,height:80});
 assert.ok(a.depth>b.depth);
 approximate(a.depth,3/Math.tan(15*Math.PI/180));
});
test('la presentación de −90 coloca el ala nueva sobre matriz sin alterar la pieza final',()=>{
 const p={...EXAMPLE,angles:[90,-90,-90,90],order:[0,1,3,2]};
 const raw=orientedForMachine(p,[1,1,0,0],1);
 const physical=presentedForMachine(p,[1,1,0,0],1);
 assert.equal(physical.flipped,true);
 assert.ok(raw[3].y<0,'El pliegue negativo está abajo en coordenadas de pieza');
 assert.ok(physical.points[3].y>0,'El ala de trabajo queda arriba al presentar pieza volteada');
 const final=profile(p,[1,1,1,1]);
 assert.ok(final.points.every(pt=>Number.isFinite(pt.y)));
});
test('el primer pliegue positivo no requiere volteo',()=>{
 const p=presentedForMachine(EXAMPLE,[1,0,0,0],0);
 assert.equal(p.flipped,false);
 assert.ok(p.points[2].y>0);
});
test('el proceso aún empieza con chapa recta y no aplica pliegue antes del golpe',()=>{
 const s=stage(EXAMPLE,0),p=profile(EXAMPLE,s.fractions);
 assert.ok(p.points.every(pt=>pt.y===0));
 assert.equal(s.finished,0);
});
test('para la matriz y el punzón se usan geometrías identificadas como provisionales',()=>{
 assert.equal(sectionPunch({angle:88,profileAccuracy:'provisional'}).provisional,true);
 assert.equal(sectionDie({opening:16,angle:88}).provisional,true);
});
