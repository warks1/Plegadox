import assert from 'node:assert/strict';
import {readFileSync,mkdirSync} from 'node:fs';
import {spawn} from 'node:child_process';
import {chromium} from 'playwright';
mkdirSync('test-results',{recursive:true});
const server=spawn('python3',['-m','http.server','4454','--bind','127.0.0.1'],
 {stdio:'ignore'});
let browser;
try{
 browser=await chromium.launch({headless:true,args:['--no-sandbox']});
 const context=await browser.newContext({viewport:{width:1280,height:800},
  isMobile:true,hasTouch:true,deviceScaleFactor:2.5,acceptDownloads:true,
  userAgent:'Mozilla/5.0 (Linux; Android 14; SM-X700) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36'});
 const page=await context.newPage(),errors=[];
 page.on('pageerror',error=>errors.push(error.message));
 await page.goto('http://127.0.0.1:4454/',{waitUntil:'networkidle',timeout:45000});
 await page.waitForFunction(()=>typeof window.PLEGADOX_STATE==='function',null,
  {timeout:30000});
 const seeded=await page.evaluate(async()=>{
  const cad=await import('/machine-cad.js');
  const mf=await import('/machine-gauge-fingers.js');
  const axis=await import('/machine-axis-motion.js');
  const geom=await import('/machine-axis-geometry.js');
  const cfg=await import('/machine-config.js');
  const profile=await import('/machine-selection.js');
  const machine=cfg.getActiveMachineConfig();
  const machineId=profile.getActiveMachineProfile().id;
  const key=cad.machineConfigurationKey(machine);
  const record=cad.saveMachineCad(localStorage,{kind:'stop',
   points:[[-30,-20],[30,-20],[30,40],[-30,40]],
   offsetX:0,offsetY:0,zMin:-40,zMax:40,
   source:'Ensayo geometrico CAD Z1 y Z2 sin OEM',
   machineConfigKey:key});
  mf.saveGaugeFingers(localStorage,{
   version:1,unit:'mm',machineConfigKey:key,profileKind:'stop',
   sameSectionConfirmed:true,profileFingerprint:mf.gaugeSectionFingerprint(record),
   source:'Referencia transversal de ensayo no CNC',
   referenceSceneTime:0,
   fingers:{Z1:{zMin:-20,zMax:-5},Z2:{zMin:5,zMax:20}}
  });
  const limits=Object.fromEntries(['Y1','Y2','X','R','Z1','Z2']
   .map(k=>[k,{min:-500,max:500,maxSpeed:null}]));
  const first={Y1:0,Y2:0,X:0,R:0,Z1:0,Z2:0};
  const piece=window.PLEGADOX_STATE().piece;
  const trace=axis.saveAxisMotion(localStorage,{
   unit:'mm',timeUnit:'s',source:'programmed',
   sourceDescription:'Ensayo de choque entre dedos CAD sin maquina real',
   machineId,pieceKey:axis.motionPieceKey(piece),limits,
   poses:[
    {time:0,sceneTime:0,axes:first},
    {time:1,sceneTime:0,axes:{...first,Z1:22,Z2:-22}}
   ]
  });
  const mapping=geom.saveAxisMapping(localStorage,{
   version:1,unit:'mm',machineConfigKey:key,
   signs:{Y:1,X:1,R:1,Z1:1,Z2:1},
   activeFinger:'Z1',referenceSceneTime:0,
   ramTiltTolerance:0,
   source:'Calibración para ensayo sintético, no CNC'
  });
  document.getElementById('machineAxisCheck').click();
  return {piece,trace,mapping,machineId};
 });
 await page.waitForFunction(()=>document.getElementById('machineAxisStatus')?.
  textContent.includes('2 DXF:'),null,{timeout:20000});
 const status=await page.locator('#machineAxisStatus').textContent();
 assert.match(status,/solapes MODELADOS/);
 const finding=await page.locator('#machineAxisFindings').textContent();
 assert.match(finding,/gaugeZ1/);
 assert.match(finding,/gaugeZ2/);
 assert.match(finding,/Interferencia entre dos perfiles CAD declarados/);
 await page.evaluate(()=>document.getElementById('machineAxisEvidencePanel').open=true);
 await page.locator('#machineAxisEvidencePanel')
  .screenshot({path:'test-results/r130-galaxy-evidencia-cad-cnc.png'});
 const [download]=await Promise.all([
  page.waitForEvent('download',{timeout:20000}),
  page.evaluate(()=>document.getElementById('machineAxisReportDownload').click())
 ]);
 const report=JSON.parse(readFileSync(await download.path(),'utf8'));
 assert.equal(report.format,'plegadox-cnc-evidence-r130');
 assert.equal(report.machineId,seeded.machineId);
 assert.equal(report.report.evidenceSummary.cadPairCount>=1,true);
 assert.equal(report.report.canApproveForMachine,false);
 assert.equal(report.certified,false);
 assert.equal(report.report.events.some(ev=>ev.moving==='gaugeZ1'&&
  ev.against==='gaugeZ2'&&ev.evidenceCode==='DOS_PERFILES_CAD'),true);
 const changed=await page.evaluate(async()=>{
  const {scanAxisCADMovement}=await import('/machine-axis-geometry.js');
  const {getActiveMachineConfig}=await import('/machine-config.js');
  const {loadAxisMotion}=await import('/machine-axis-motion.js');
  const {loadAxisMapping}=await import('/machine-axis-geometry.js');
  const part=window.PLEGADOX_STATE().piece;
  const changed={...part,stopByBend:[2,...part.stopByBend.slice(1)]};
  return scanAxisCADMovement(changed,{
   machine:getActiveMachineConfig(),
   axisMotion:loadAxisMotion(localStorage),mapping:loadAxisMapping(localStorage)
  }).status;
 });
 assert.equal(changed,'TRAZA_DE_OTRA_PIEZA');
 assert.deepEqual(errors,[]);
 console.log('R130_GALAXY_CNC_EVIDENCE_REPORT_TRACE_STALE_OK');
 await context.close();
}finally{await browser?.close();server.kill();}
