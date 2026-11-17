import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {mkdirSync,readFileSync} from 'node:fs';
import {chromium} from 'playwright';
mkdirSync('test-results',{recursive:true});
const server=spawn('python3',['-m','http.server','4458','--bind','127.0.0.1'],{stdio:'ignore'});
let browser;
try{
 browser=await chromium.launch({headless:true,args:['--no-sandbox']});
 const context=await browser.newContext({viewport:{width:1280,height:800},
  isMobile:true,hasTouch:true,deviceScaleFactor:2.5,acceptDownloads:true,
  userAgent:'Mozilla/5.0 (Linux; Android 14; SM-X700) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36'});
 const page=await context.newPage(),errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 await page.goto('http://127.0.0.1:4458/',{waitUntil:'networkidle',timeout:45000});
 await page.waitForFunction(()=>typeof window.PLEGADOX_STATE==='function',
  null,{timeout:30000});
 const review=await page.evaluate(async()=>{
  const [{planMachineInterferencePairs},{getActiveMachineConfig},
   {machineConfigurationKey,saveMachineCad},
   {getActiveMachineProfile},
   {motionPieceKey,saveAxisMotion},
   {saveAxisMapping,scanAxisCADMovement},
   {technicalScene},{cadCoverage}]=await Promise.all([
   import('/machine-interference-pairs-r133.js'),
   import('/machine-config.js'),import('/machine-cad.js'),
   import('/machine-selection.js'),import('/machine-axis-motion.js'),
   import('/machine-axis-geometry.js'),import('/technical-section.js'),
   import('/cad-evidence.js')
  ]);
  const machine=getActiveMachineConfig();
  const key=machineConfigurationKey(machine);
  const piece=window.PLEGADOX_STATE().piece;
  const tip=technicalScene(piece,0).kinematics.tipHeight;
  const record=(kind,x,y)=>saveMachineCad(localStorage,{
   kind,source:'Ensayo integral Galaxy R134, NO CAD OEM',
   machineConfigKey:key,points:[[-10,0],[10,0],[10,10],[-10,10]],
   offsetX:x,offsetY:y,zMin:-15,zMax:15
  });
  record('ram',0,100-tip);record('bed',0,0);
  record('stop',150,0);record('upperClamp',40,100-tip);
  const limits=Object.fromEntries(['Y1','Y2','X','R','Z1','Z2']
   .map(k=>[k,{min:-3000,max:3000,maxSpeed:800}]));
  const axes={Y1:0,Y2:0,X:10,R:10,Z1:0,Z2:0};
  const program=saveAxisMotion(localStorage,{
   unit:'mm',timeUnit:'s',source:'programmed',
   sourceDescription:'Ensayo sintético barrido R134, NO CNC real',
   machineId:getActiveMachineProfile().id,
   pieceKey:motionPieceKey(piece),limits,
   poses:[{time:0,sceneTime:0,axes},
    {time:5,sceneTime:0,axes:{...axes,Y1:200,Y2:200}}]
  });
  const datum=saveAxisMapping(localStorage,{
   version:1,unit:'mm',machineConfigKey:key,
   signs:{Y:-1,X:1,R:1,Z1:1,Z2:1},
   activeFinger:'Z1',referenceSceneTime:0,ramTiltTolerance:0,
   source:'Calibración sintética para Galaxy NO OEM'
  });
  document.getElementById('machineAxisCheck').click();
  const report=scanAxisCADMovement(piece,{
   machine,axisMotion:program,mapping:datum,
   machineId:getActiveMachineProfile().id
  });
  const fake={points:[[0,0],[2,0],[2,2],[0,2]]};
  const coverage=cadCoverage('trumpf-v85',{stopZ1:fake,stopZ2:fake});
  return {
   paired:planMachineInterferencePairs(true).pairs.length,
   planned:report.collisionPairPlanCount,
   omitted:report.uniquePendingPairs,
   missingIntervals:report.pairIntervalsMissing,
   gapCount:report.missingPairExamples.length,
   mounts:report.assemblyInterfacesPending.length,
   ramBed:report.events.some(e=>e.moving==='ram'&&e.against==='bed'),
   stopCovered:coverage.statuses.find(x=>x.kind==='stop').imported,
   certified:report.canApproveForMachine,
   first:report.events.find(e=>e.moving==='ram'&&e.against==='bed')?.
    impactWindowSeconds,
   firstStatus:report.events.find(e=>e.moving==='ram'&&e.against==='bed')?.
    impactWindowStatus,
   computed:report.impactWindowsComputed,
   pending:report.impactWindowsPending,
   physicalTimeVerified:report.firstPhysicalContactVerified
  };
 });
 assert.equal(review.paired,39);
 assert.equal(review.planned,29);
 assert.ok(review.omitted>0,JSON.stringify(review));
 assert.ok(review.missingIntervals>0);
 assert.ok(review.gapCount>0);
 assert.equal(review.mounts,16);
 assert.equal(review.ramBed,true);
 assert.equal(review.stopCovered,true);
 assert.equal(review.certified,false);
 assert.ok(Array.isArray(review.first),JSON.stringify(review));
 assert.equal(review.firstStatus,'VENTANA_MODELADA_ACOTADA');
 assert.ok(review.first[0]>=0&&review.first[1]<=5);
 assert.ok(review.first[1]-review.first[0]<=.02);
 assert.ok(review.computed>0);
 assert.equal(review.physicalTimeVerified,false);
 await page.waitForFunction(()=>document.getElementById('machineAxisStatus')?.
  textContent.includes('parejas pendientes de geometría'),null,{timeout:15000});
 const findings=await page.locator('#machineAxisFindings').textContent();
 assert.match(findings,/COBERTURA INCOMPLETA/);
 assert.match(findings,/Sin comprobar/);
 assert.match(findings,/primera penetración MODELADA acotada/);
 assert.match(findings,/ram \/ bed/);
 await page.evaluate(()=>{
  document.querySelector('.nav[data-tab="maquina"]').click();
  document.getElementById('machineAxisEvidencePanel').open=true;
  document.getElementById('machineAxisMountedInterfacesPanel').open=true;
 });
 await page.waitForFunction(()=>{
  const panel=document.getElementById('machineAxisMountedInterfacesPanel');
  return panel?.getBoundingClientRect().width>100&&
   getComputedStyle(panel).display!=='none';
 },null,{timeout:15000});
 const labels=await page.locator('#machineAxisMountInterfaces li').allTextContents();
 assert.equal(labels.length,16);
 assert.ok(labels.some(t=>t.includes('ram / punch')));
 assert.ok(labels.some(t=>t.includes('bed / die')));
 const [download]=await Promise.all([
  page.waitForEvent('download',{timeout:20000}),
  page.evaluate(()=>document.getElementById('machineAxisReportDownload').click())
 ]);
 const exported=JSON.parse(readFileSync(await download.path(),'utf8'));
 const first=exported.report.events.find(x=>
  x.moving==='ram'&&x.against==='bed');
 assert.ok(Array.isArray(first?.impactWindowSeconds));
 assert.equal(first.firstPhysicalContactVerified,false);
 assert.equal(exported.report.firstPhysicalContactVerified,false);
 assert.equal(exported.certified,false);
 await page.locator('#machineAxisEvidencePanel').screenshot({
  path:'test-results/r134-galaxy-inicio-penetracion-modelada.png'});
 assert.deepEqual(errors,[]);
 console.log('R134_GALAXY_FIRST_PENETRATION_INTERVAL_CNC_JSON_OK');
 await context.close();
}finally{await browser?.close();server.kill();}
