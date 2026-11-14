import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {machineCadFromDXF,normalizeMachineCad,loadMachineCad,saveMachineCad,
 positionMachineCad,removeMachineCad,machineConfigurationKey} from '../machine-cad.js';
import {MOTION_AXES,motionPieceKey,normalizeAxisMotion,assessAxisMotion,
 interpolateMotion,saveAxisMotion,loadAxisMotion} from '../machine-axis-motion.js';
import {EXAMPLE} from '../engine.js';
import {technicalScene} from '../technical-section.js';
import {buildVolumeScene} from '../volume-engine.js';
import {scanVolumeTrajectory} from '../volume-trajectory-review.js';

const memory=()=>{
 const data=new Map();
 return {getItem:k=>data.get(k)||null,setItem:(k,v)=>data.set(k,v),
  removeItem:k=>data.delete(k)};
};
const wrap=verts=>[
 '0','SECTION','2','HEADER','9','$INSUNITS','70','4','0','ENDSEC',
 '0','SECTION','2','ENTITIES',
 '0','LWPOLYLINE','90',String(verts.length),'70','1',
 ...verts.flatMap(([x,y])=>['10',String(x),'20',String(y)]),
 '0','ENDSEC','0','EOF'].join('\n')+'\n';
const cad=()=>machineCadFromDXF(wrap([[-40,0],[40,0],[40,170],[-40,170]]),{
 kind:'ram',offsetX:0,offsetY:200,zMin:-1020,zMax:1020,
 source:'Plano V85: geometría de ensayo (NO CAD original)'});
const limits=Object.fromEntries(MOTION_AXES.map(axis=>[axis,{min:0,max:200,maxSpeed:50}]));
const path=()=>({unit:'mm',timeUnit:'s',source:'recorded',
 sourceDescription:'Registro de ensayo sin aprobación',
 machineId:'V85',pieceKey:motionPieceKey(EXAMPLE),limits,
 poses:[
  {time:0,phase:'posicionamiento',axes:{Y1:100,Y2:100,X:60,R:35,Z1:30,Z2:130}},
  {time:5,phase:'aproximación',axes:{Y1:80,Y2:80,X:70,R:36,Z1:35,Z2:135}}
 ]});
test('CAD: el DXF se transforma en contorno de máquina conservando mm, datum y Z',()=>{
 const p=cad();
 assert.equal(p.dimensionWidth,80);
 assert.equal(p.dimensionHeight,170);
 assert.deepEqual([p.zMin,p.zMax],[-1020,1020]);
 assert.equal(p.industrialVerified,false);
 const scene=technicalScene(EXAMPLE,0);
 const translated=positionMachineCad(p,{x:0,y:scene.kinematics.tipHeight});
 assert.equal(translated.polygon[0].x,-40);
 assert.ok(Math.abs(translated.polygon[0].y-(200+scene.kinematics.tipHeight))<1e-9);
 const model=buildVolumeScene(scene,{machineCAD:{ram:p}});
 assert.ok(model.cadProfilesUsed.includes('ram'));
 assert.ok(model.objects.ram.valid);
 assert.equal(model.objects.ram.zMin,-1020);
 assert.match(model.objects.ram.provenance,/CAD importado/);
 assert.equal(model.verified,false);
 assert.ok(model.missingCadComponents.includes('bed'));
});
test('CAD: el montaje se invalida si cambian las cotas configuradas de máquina',()=>{
 const cfg={ram:[1340,28],bed:[820,80],stop:[70,100],support:[70,100],
  ramOrigin:0,holderOrigin:0,ramWidth:2040,holderWidth:2040,toolWorkingDistance:30};
 const profile=normalizeMachineCad({...cad(),machineConfigKey:machineConfigurationKey(cfg)});
 assert.ok(positionMachineCad(profile,{x:0,y:0},{machine:cfg}).polygon.length>3);
 assert.throws(()=>positionMachineCad(profile,{x:0,y:0},
  {machine:{...cfg,ramWidth:2000}}),/revisión actual/);
});
test('CAD: guarda y sustituye contornos sin alterar documentación L de la V85',()=>{
 const db=memory();
 saveMachineCad(db,cad());
 assert.deepEqual(loadMachineCad(db).ram.points,cad().points);
 assert.deepEqual(removeMachineCad(db,'ram'),{});
 assert.deepEqual(loadMachineCad(db),{});
});
test('CAD: rechaza geometrías autointersecadas y Z imposible',()=>{
 const src={kind:'bed',points:[[0,0],[30,40],[30,0],[0,40]],
  offsetX:0,offsetY:0,zMin:-1,zMax:1,source:'Ensayo'};
 assert.throws(()=>normalizeMachineCad(src),/autointersecado|sin área/);
 assert.throws(()=>normalizeMachineCad({...src,points:[[0,0],[10,0],[10,30],[0,30]],
  zMax:-1}),/longitud Z positiva/);
});
test('CAD: la trancha provisional queda por encima de la cabeza del punzón',()=>{
 const scene=technicalScene(EXAMPLE,0);
 const model=buildVolumeScene(scene,{machineCAD:{}});
 assert.ok(model.objects.ram.polygon.every(p=>
  p.y>=scene.kinematics.tipHeight+scene.punch.height-1e-9));
});
test('Ejes: trayecto lineal real interpolado y límites conservados',()=>{
 const p=path(),stored=normalizeAxisMotion(p);
 const midway=interpolateMotion(stored,2.5);
 assert.equal(midway.axes.Y1,90);
 assert.equal(midway.axes.X,65);
 const report=assessAxisMotion(p);
 assert.equal(report.violations.length,0);
 assert.equal(report.status,'RECORRIDO_REGISTRADO_SIN_CERTIFICACION');
 assert.equal(report.canApproveForMachine,false);
 const db=memory();saveAxisMotion(db,p);
 assert.deepEqual(loadAxisMotion(db).poses[0],stored.poses[0]);
});
test('Ejes: detecta sobrecarrera, velocidad excesiva y errores de medida',()=>{
 const p=path();
 p.poses[1].axes.X=360;
 const report=assessAxisMotion(p);
 assert.ok(report.violations.some(v=>v.kind==='travel-limit'&&v.axis==='X'));
 assert.ok(report.violations.some(v=>v.kind==='axis-speed'&&v.axis==='X'));
 assert.equal(report.status,'RECORRIDO_CON_INCIDENCIAS');
 const broken=structuredClone(path());
 delete broken.limits.Z2;
 assert.equal(assessAxisMotion(broken).status,'DATOS_EJES_INCORRECTOS');
});
test('Ejes: muestrea posiciones para inspección física opcional, no certifica entre muestras',()=>{
 const report=assessAxisMotion(path(),{
  samplesPerSegment:12,
  collisionAt:p=>p.axes.X>65?[{collision:true,object:'mesa'}]:[]
 });
 assert.ok(report.framesChecked>0);
 assert.ok(report.violations.some(v=>v.kind==='volume-contact'));
 assert.ok(report.unknown.some(s=>s.includes('intervalos entre muestras')));
});
test('V85: traza de otra geometría o secuencia NO se aplica a la pieza activa',()=>{
 const r=scanVolumeTrajectory(EXAMPLE,{
  samplesPerOperation:4,
  axisMotion:{...path(),pieceKey:'otra-pieza'},
  inspect:()=>({issues:[],model:null})
 });
 assert.equal(r.axisReport.status,'TRAZA_DE_OTRA_PIEZA');
 assert.equal(r.axisReport.checked,false);
 assert.equal(r.canApproveForMachine,false);
 const matching=scanVolumeTrajectory(EXAMPLE,{
  samplesPerOperation:4,axisMotion:path(),inspect:()=>({issues:[],model:null})
 });
 assert.equal(matching.axisReport.checked,true);
 assert.equal(matching.axisReport.violations.length,0);
});
test('UI y caché R36 incluyen importación CAD y trazas físicas',()=>{
 const html=readFileSync(new URL('../index.html',import.meta.url),'utf8');
 const sw=readFileSync(new URL('../sw.js',import.meta.url),'utf8');
 for(const id of ['machineCadPanel','machineCadFile','machineCadSave',
  'machineAxisPanel','machineAxisTemplate','machineAxisImport'])
  assert.ok(html.includes('id="'+id+'"'));
 for(const path of ['machine-cad.js','machine-axis-motion.js','machine-cad-ui.js'])
  assert.ok(sw.includes('"./'+path+'"'));
});
