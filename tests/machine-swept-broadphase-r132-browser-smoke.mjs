import assert from 'node:assert/strict';
import {mkdirSync} from 'node:fs';
import {spawn} from 'node:child_process';
import {chromium} from 'playwright';
mkdirSync('test-results',{recursive:true});
const server=spawn('python3',['-m','http.server','4456','--bind','127.0.0.1'],{stdio:'ignore'});
let browser;
try{
 browser=await chromium.launch({headless:true,args:['--no-sandbox']});
 const context=await browser.newContext({
  viewport:{width:1280,height:800},deviceScaleFactor:2.5,
  isMobile:true,hasTouch:true,
  userAgent:'Mozilla/5.0 (Linux; Android 14; SM-X700) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36'});
 const page=await context.newPage(),errors=[];
 page.on('pageerror',error=>errors.push(error.message));
 await page.goto('http://127.0.0.1:4456/',{waitUntil:'networkidle',timeout:45000});
 await page.waitForFunction(()=>typeof window.PLEGADOX_STATE==='function',
  null,{timeout:30000});
 const probe=await page.evaluate(async()=>{
  const [{makePrism},{translatePrism,sweptPrismPair},
   {sweptBroadphase},{getActiveMachineConfig},
   {machineConfigurationKey,saveMachineCad},
   {getActiveMachineProfile},
   {motionPieceKey,saveAxisMotion},
   {saveAxisMapping},
   {cadSourceFor,listCadImportSources}]=await Promise.all([
    import('/volume-engine.js'),import('/swept-volume.js'),
    import('/machine-swept-broadphase-r132.js'),import('/machine-config.js'),
    import('/machine-cad.js'),import('/machine-selection.js'),
    import('/machine-axis-motion.js'),import('/machine-axis-geometry.js'),
    import('/cad-evidence.js'),import('/cad-import-sources.js')
   ]);
  const rect=(x,y)=>[{x,y},{x:x+2,y},{x:x+2,y:y+2},{x,y:y+2}];
  const a=makePrism('a',rect(-12,0),-10,10),b=translatePrism(a,30,0,0);
  const c=makePrism('c',rect(0,0),-10,10);
  const far=sweptBroadphase(a,translatePrism(a,-2,0,0),c,c);
  const crossing=sweptBroadphase(a,b,c,c);
  const confirmed=sweptPrismPair(a,b,c,c);
  const nonRigid=makePrism('a',rect(100,100),-10,20);
  const deformation=sweptBroadphase(a,nonRigid,c,c);
  const touching=makePrism('c',rect(-10,0),-10,10);
  const tangent=sweptBroadphase(a,a,touching,touching);
  const machine=getActiveMachineConfig();
  const machineId=getActiveMachineProfile().id;
  const key=machineConfigurationKey(machine);
  const {technicalScene}=await import('/technical-section.js');
  const piece=window.PLEGADOX_STATE().piece;
  const tip=technicalScene(piece,0).kinematics.tipHeight;
  const mk=(kind,offsetX,offsetY)=>saveMachineCad(localStorage,{
   kind,source:'Test navegacion Galaxy, CAD NO OEM',
   machineConfigKey:key,points:[[-10,0],[10,0],[10,10],[-10,10]],
   offsetX,offsetY,zMin:-15,zMax:15});
  mk('ram',0,100-tip);mk('bed',0,0);
  mk('stop',150,0);mk('upperClamp',40,100-tip);
  saveAxisMapping(localStorage,{
   version:1,unit:'mm',machineConfigKey:key,
   signs:{Y:-1,X:1,R:1,Z1:1,Z2:1},
   activeFinger:'Z1',referenceSceneTime:0,
   ramTiltTolerance:0,
   source:'Datum sintético para ensayo sin certificado'
  });
  const base={Y1:0,Y2:0,X:10,R:10,Z1:0,Z2:0};
  const limits=Object.fromEntries(['Y1','Y2','X','R','Z1','Z2']
   .map(k=>[k,{min:-3000,max:3000,maxSpeed:800}]));
  saveAxisMotion(localStorage,{
   unit:'mm',timeUnit:'s',source:'programmed',
   sourceDescription:'Prueba Galaxy, barrido Y de 200 mm sin CNC real',
   machineId,pieceKey:motionPieceKey(piece),limits,
   poses:[{time:0,sceneTime:0,axes:base},
    {time:5,sceneTime:0,axes:{...base,Y1:200,Y2:200}}]
  });
  document.getElementById('machineAxisCheck').click();
  return {
   far:far.mayOverlap,crossing:crossing.mayOverlap,
   confirmed:confirmed.intersects,
   invalidNotPruned:deformation.mayOverlap&&!deformation.known,
   touchingNotPruned:tangent.mayOverlap,
   status:document.getElementById('machineAxisStatus').textContent,
   die3163:cadSourceFor('die','EUROSTAMP','3163')[0]?.cadUrl,
   die3165:cadSourceFor('die','EUROSTAMP','3165')[0]?.cadUrl
  };
 });
 assert.equal(probe.far,false);
 assert.equal(probe.crossing,true);
 assert.equal(probe.confirmed,true);
 assert.equal(probe.invalidNotPruned,true);
 assert.equal(probe.touchingNotPruned,true);
 assert.match(probe.status,/parejas separadas sin triangulación/);
 assert.match(probe.status,/solapes MODELADOS/);
 assert.equal(probe.die3163,'https://eurostampsrl.it/dxf/3163.dxf');
 assert.equal(probe.die3165,'https://eurostampsrl.it/dxf/3165.dxf');
 await page.evaluate(()=>{
  document.querySelector('.nav[data-tab="maquina"]').click();
  document.getElementById('machineAxisEvidencePanel').open=true;
 });
 await page.waitForFunction(()=>{
  const e=document.getElementById('machineAxisEvidencePanel');
  return e?.getBoundingClientRect().width>100&&
   getComputedStyle(e).display!=='none';
 },null,{timeout:15000});
 await page.locator('#machineAxisEvidencePanel').screenshot({
  path:'test-results/r132-galaxy-cad-broadphase-evidence.png'});
 assert.deepEqual(errors,[]);
 console.log('R132_GALAXY_BROADPHASE_COLLISION_AND_EUROSTAMP_CAD_OK');
 await context.close();
}finally{await browser?.close();server.kill();}
