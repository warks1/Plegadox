import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {makePrism} from '../volume-engine.js';
import {planMachineInterferencePairs,pairGeometryAvailability,
 UPPER_MACHINE_BODIES,LOWER_MACHINE_BODIES,SHEET_CONTACT_EXCLUSIONS}
 from '../machine-interference-pairs-r133.js';
import {EXAMPLE} from '../engine.js';
import {V85_FACTORY} from '../machine-config.js';
import {technicalScene} from '../technical-section.js';
import {machineConfigurationKey} from '../machine-cad.js';
import {motionPieceKey} from '../machine-axis-motion.js';
import {scanAxisCADMovement} from '../machine-axis-geometry.js';
import {scanVolumeTrajectory} from '../volume-trajectory-review.js';
import {cadCoverage} from '../cad-evidence.js';

const pair=(array,a,b)=>array.some(x=>
 x.includes(a)&&x.includes(b));

test('R133: matriz exhaustiva superior/inferior incluye choques omitidos sin repeticiones',()=>{
 const plan=planMachineInterferencePairs(false);
 assert.equal(UPPER_MACHINE_BODIES.length,4);
 assert.equal(LOWER_MACHINE_BODIES.length,5);
 assert.equal(plan.pairs.length,29);
 assert.equal(plan.sheetSweptBodies.length,7);
 assert.ok(pair(plan.pairs,'ram','lowerAdapter'));
 assert.ok(pair(plan.pairs,'ram','lowerClamp'));
 assert.ok(pair(plan.pairs,'upperAdapter','bed'));
 assert.ok(pair(plan.pairs,'upperAdapter','frontSupport'));
 assert.ok(pair(plan.pairs,'upperClamp','frontSupport'));
 assert.ok(pair(plan.pairs,'punch','frontSupport'));
 assert.ok(pair(plan.pairs,'punch','die'));
 assert.ok(!pair(plan.pairs,'ram','upperClamp'));
 assert.ok(!pair(plan.pairs,'bed','lowerAdapter'));
 const identities=plan.pairs.map(([a,b])=>[a,b].sort().join('/'));
 assert.equal(new Set(identities).size,identities.length);
 assert.equal(plan.excludedAssemblyInterfaces.length,16);
 assert.equal(plan.physicalCollisionCertified,false);
});
test('R133: Z1/Z2 tienen combinaciones separadas y autocruce, sin tope sintético ancho',()=>{
 const plan=planMachineInterferencePairs(true);
 assert.equal(plan.pairs.length,39);
 assert.equal(plan.sheetSweptBodies.length,8);
 assert.equal(plan.pairs.some(x=>x.includes('gauge')),false);
 assert.ok(pair(plan.pairs,'gaugeZ1','gaugeZ2'));
 assert.ok(pair(plan.pairs,'gaugeZ1','frontSupport'));
 assert.ok(pair(plan.pairs,'gaugeZ2','ram'));
 const keys=plan.pairs.map(x=>[...x].sort().join('/'));
 assert.equal(new Set(keys).size,keys.length);
 assert.equal(SHEET_CONTACT_EXCLUSIONS.some(x=>x.kind==='punch'),true);
});
test('R133: CAD ausente queda pendiente, no se marca libre; dos perfiles CAD son evidencia',()=>{
 const body=makePrism('real',[
  {x:0,y:0},{x:2,y:0},{x:2,y:3},{x:0,y:3}],-5,5,
  'perfil CAD importado DXF_ASCII_MM · ensayo NO OEM');
 const arr={ram:body,bed:body};
 const available=pairGeometryAvailability(arr,arr,'ram','bed');
 assert.equal(available.checkable,true);
 assert.equal(available.imported,true);
 assert.equal(available.certified,false);
 const missing=pairGeometryAvailability({ram:body},arr,'ram','bed');
 assert.equal(missing.checkable,false);
 assert.ok(missing.missing.some(v=>v.includes('bed (inicio)')));
 assert.equal(missing.certified,false);
 const provisional=makePrism('ficticio',body.polygon,-5,5,'envolvente-ilustrativa-sin-CAD');
 assert.equal(pairGeometryAvailability({...arr,bed:provisional},
  {...arr,bed:provisional},'ram','bed').imported,false);
});
test('R133: cobertura del inventario acepta dos dedos independientes, no uno solo',()=>{
 const fake={points:[[0,0],[3,0],[3,3],[0,3]]};
 const solo=cadCoverage('trumpf-v85',{stopZ1:fake});
 assert.ok(solo.missing.includes('stop'));
 const paired=cadCoverage('trumpf-v85',{stopZ1:fake,stopZ2:fake,
  supportZ1:fake,supportZ2:fake});
 assert.ok(!paired.missing.includes('stop'));
 assert.ok(!paired.missing.includes('support'));
 assert.deepEqual(paired.statuses.find(x=>x.kind==='stop').coveredBy,
  ['stopZ1','stopZ2']);
 assert.equal(paired.canApproveForMachine,false);
 const shared=cadCoverage('trumpf-v85',{stop:fake});
 assert.deepEqual(shared.statuses.find(x=>x.kind==='stop').coveredBy,['stop']);
 const toolActive=cadCoverage('trumpf-v85',{punch:{points:[[0,0]]}});
 assert.ok(!toolActive.missing.includes('punch'));
});
const machine=V85_FACTORY,key=machineConfigurationKey(machine);
const axisNames=['Y1','Y2','X','R','Z1','Z2'];
const limits=Object.fromEntries(axisNames.map(a=>[a,{min:-3000,max:3000,maxSpeed:800}]));
const axes={Y1:0,Y2:0,X:10,R:10,Z1:0,Z2:0};
const motion={unit:'mm',timeUnit:'s',source:'programmed',
 sourceDescription:'Recorrido sintético de ensayo, no CNC OEM',
 machineId:'V85',pieceKey:motionPieceKey(EXAMPLE),limits,
 poses:[{time:0,sceneTime:0,axes},
  {time:5,sceneTime:0,axes:{...axes,Y1:200,Y2:200}}]};
const mapping={unit:'mm',version:1,
 signs:{Y:-1,X:1,R:1,Z1:1,Z2:1},activeFinger:'Z1',
 referenceSceneTime:0,ramTiltTolerance:0,
 source:'Datum sintético, no física real',machineConfigKey:key};
const fixture=()=>{
 const tip=technicalScene(EXAMPLE,0).kinematics.tipHeight;
 const record=(kind,x,y)=>({
  kind,points:[[-10,0],[10,0],[10,10],[-10,10]],
  source:'DXF ficticio para prueba',offsetX:x,offsetY:y,
  zMin:-15,zMax:15,machineConfigKey:key
 });
 return {ram:record('ram',0,100-tip),
  bed:record('bed',0,0),stop:record('stop',150,0),
  upperClamp:record('upperClamp',40,100-tip)};
};
test('R133: informa parejas sin CAD incluso si encuentra otra colisión calculada',()=>{
 const review=scanAxisCADMovement(EXAMPLE,{
  machine,machineCAD:fixture(),mapping,axisMotion:motion});
 assert.equal(review.checked,true);
 assert.ok(review.events.some(e=>e.moving==='ram'&&e.against==='bed'));
 assert.equal(review.collisionPairPlanCount,29);
 assert.ok(review.pairIntervalsChecked>0);
 assert.ok(review.pairIntervalsMissing>0);
 assert.ok(review.uniquePendingPairs>0);
 assert.ok(review.missingPairExamples.some(e=>e.moving==='upperAdapter'));
 assert.ok(review.missingPairExamples.some(e=>e.against==='frontSupport'));
 assert.equal(review.excludedAssemblyInterfaceCount,16);
 assert.equal(review.assemblyInterfacesPending.length,16);
 assert.equal(review.coverage.pairIntervalsMissing,review.pairIntervalsMissing);
 assert.equal(review.coverage.collisionPairPlanCount,29);
 assert.equal(review.pairIntervalsChecked,
  review.cadCadPairIntervals+review.partlyProvisionalPairIntervals);
 assert.ok(review.unknown.some(s=>s.includes('Parejas de interferencia NO evaluadas')));
 assert.ok(review.unknown.some(s=>s.includes('Interfaces de montaje')));
 assert.equal(review.canApproveForMachine,false);
});
test('R133: informe volumétrico conserva cobertura de parejas y no certifica CNC',()=>{
 const result=scanVolumeTrajectory(EXAMPLE,{machine,machineCAD:fixture(),
  axisMotion:motion,axisMapping:mapping,samplesPerOperation:4});
 assert.ok(result.axisGeometry.pairIntervalsMissing>0);
 assert.ok(result.axisGeometry.uniquePendingPairs>0);
 assert.ok(result.axisGeometry.assemblyInterfacesPending.length>0);
 assert.equal(result.canApproveForMachine,false);
});
test('R133: UI y PWA exponen montajes no verificados y módulo para Galaxy',()=>{
 const html=readFileSync(new URL('../index.html',import.meta.url),'utf8');
 const ui=readFileSync(new URL('../machine-cad-ui.js',import.meta.url),'utf8');
 const sw=readFileSync(new URL('../sw.js',import.meta.url),'utf8');
 for(const id of ['machineAxisMountedInterfacesPanel',
  'machineAxisMountInterfaces','machineAxisFindings'])
  assert.ok(html.includes('id="'+id+'"'));
 assert.match(ui,/pairIntervalsMissing/);
 assert.match(ui,/missingPairExamples/);
 assert.match(ui,/assemblyInterfacesPending/);
 assert.match(sw,/"\.\/machine-interference-pairs-r133\.js"/);
});
