import test from 'node:test';
import assert from 'node:assert/strict';
import {EXAMPLE,PUNCHES,stage,profile,orientedForMachine,presentedForMachine,presentedAtStage} from '../engine.js';
import {sectionPunch,sectionDie} from '../tool-profiles.js';

const approximate=(x,y,tolerance=.03)=>assert.ok(Math.abs(x-y)<tolerance,`Esperado ${y}; recibido ${x}`);
test('un punzón de 30°, 60° y 88° tiene transiciones diferentes',()=>{
 const tool=a=>sectionPunch({angle:a,height:120,tip:.6,type:'recto'});
 const p30=tool(30),p60=tool(60),p88=tool(88);
 const taper=p=>p.points[2][1];
 assert.ok(taper(p30)>taper(p60) && taper(p60)>taper(p88),'30° debe tener la punta más larga');
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

test('en el cambio de golpe 1 a 2 el movimiento de presentación es continuo',()=>{
 const before=presentedAtStage(EXAMPLE,stage(EXAMPLE,4.999));
 const after=presentedAtStage(EXAMPLE,stage(EXAMPLE,5.001));
 assert.equal(before.repositioning,true);
 assert.equal(after.repositioning,false);
 const worst=Math.max(...before.points.map((p,i)=>
   Math.hypot(p.x-after.points[i].x,p.y-after.points[i].y)));
 assert.ok(worst<1,'La posición física no debe teleportarse entre golpes; salto '+worst);
});
test('la reorientación cambia la cara con una proyección de volteo sin deformar las alas 2D del desarrollo',()=>{
 const input=EXAMPLE;
 const mid=presentedAtStage(input,stage(input,4.6));
 assert.equal(mid.repositioning,true);
 assert.ok(mid.progress>0&&mid.progress<1);
 const final=profile(input,[1,1,1,1]);
 assert.equal(final.points.length,input.flanges.length+1);
 assert.equal(input.angles[1],-90);
});

test('el contorno 50×100 de pata de cabra de fotografía no se convierte en un punzón recto',()=>{
 const tool=PUNCHES.find(x=>x.id==='ref-goose-50-100-r1');
 assert.ok(tool);
 assert.equal(tool.profileAccuracy,'provisional');
 assert.equal(tool.tip,2,'radio de punta R1 equivale a diámetro de 2 mm');
 const profile=sectionPunch(tool),pts=profile.points;
 const xmin=Math.min(...pts.map(p=>p[0])),xmax=Math.max(...pts.map(p=>p[0]));
 const ymin=Math.min(...pts.map(p=>p[1])),ymax=Math.max(...pts.map(p=>p[1]));
 approximate(xmax-xmin,50);
 approximate(ymax-ymin,100);
 assert.ok(pts.length>=9,'debe existir escote interno real');
 assert.notDeepEqual(pts,sectionPunch({angle:88,height:100,type:'recto',tip:2}).points);
});

test('la reorientación espera a retirar la chapa antes de empezar a girarla',()=>{
 const lift=presentedAtStage(EXAMPLE,stage(EXAMPLE,4.30));
 const rotate=presentedAtStage(EXAMPLE,stage(EXAMPLE,4.60));
 const lower=presentedAtStage(EXAMPLE,stage(EXAMPLE,4.90));
 assert.equal(lift.repositioning,true);
 assert.equal(lift.progress,0,'al retirar todavía no gira');
 assert.ok(lift.clearanceLift>0,'la chapa se eleva al retirarla');
 assert.ok(rotate.progress>.3&&rotate.progress<.7,'el giro se hace tras retirada');
 assert.ok(rotate.clearanceLift>0);
 assert.equal(lower.progress,1,'al volver a bajar ya está orientada');
 assert.ok(lower.clearanceLift>0);
 const end=presentedAtStage(EXAMPLE,stage(EXAMPLE,4.999999));
 assert.ok(end.clearanceLift<.001,'acaba de presentar sin salto vertical');
});
test('el volteo intermedio conserva longitudes en 3D y sólo comprime su proyección en 2D',()=>{
 const p=EXAMPLE;
 for(const time of [4.3,4.55,4.7,4.9]){
  const st=stage(p,time),result=presentedAtStage(p,st);
  const source=profile(p,st.fractions).points;
  assert.equal(result.points3D.length,source.length);
  for(let i=0;i<source.length-1;i++){
   const a=source[i],b=source[i+1];
   const length=Math.hypot(b.x-a.x,b.y-a.y);
   const c=result.points3D[i],d=result.points3D[i+1];
   const length3D=Math.hypot(d.x-c.x,d.y-c.y,d.z-c.z);
   approximate(length3D,length,.00001);
  }
 }
});
