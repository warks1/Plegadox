import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {mkdirSync,readFileSync} from 'node:fs';
import {chromium} from 'playwright';
mkdirSync('test-results',{recursive:true});
const server=spawn('python3',['-m','http.server','4460','--bind','127.0.0.1'],{stdio:'ignore'});
let browser;
try{
 browser=await chromium.launch({headless:true,args:['--no-sandbox']});
 const context=await browser.newContext({
  viewport:{width:1280,height:800},deviceScaleFactor:2.5,
  isMobile:true,hasTouch:true,acceptDownloads:true,
  userAgent:'Mozilla/5.0 (Linux; Android 14; SM-X700) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36'
 });
 const page=await context.newPage(),errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 await page.goto('http://127.0.0.1:4460/',{
  waitUntil:'networkidle',timeout:45000});
 await page.waitForFunction(()=>typeof window.PLEGADOX_STATE==='function'&&
  typeof window.PLEGADOX_SOLID_RENDER_STATS==='function',
  null,{timeout:30000});
 await page.locator('#machineSolidToggle').click();
 await page.waitForFunction(()=>document.querySelector('#machineSolidStatus')?.
  textContent.startsWith('Sólidos dibujados:'),null,{timeout:20000});
 let state=await page.evaluate(()=>({
  cnc:document.querySelector('#machineCncGaugeEvidence')?.dataset.level,
  text:document.querySelector('#machineCncGaugeEvidence')?.textContent,
  sheet:document.querySelector('#machineGaugeEvidence')?.textContent,
  stats:window.PLEGADOX_SOLID_RENDER_STATS()
 }));
 assert.equal(state.cnc,'neutral');
 assert.match(state.text,/CNC DEL TOPE/);
 assert.match(state.sheet,/diagnóstico de sección 2D/);
 const synthetic=await page.evaluate(async()=>{
  const [{getActiveMachineConfig},{machineConfigurationKey,saveMachineCad},
   {saveAxisMotion,motionPieceKey},{saveAxisMapping},
   {technicalScene},{buildVolumeScene},{scanAxisCADMovement},
   {getActiveMachineProfile}]=await Promise.all([
   import('/machine-config.js'),import('/machine-cad.js'),
   import('/machine-axis-motion.js'),import('/machine-axis-geometry.js'),
   import('/technical-section.js'),import('/volume-engine.js'),
   import('/machine-axis-geometry.js'),import('/machine-selection.js')
  ]);
  const machine=getActiveMachineConfig();
  const key=machineConfigurationKey(machine);
  const piece=window.PLEGADOX_STATE().piece;
  const stop={kind:'stop',source:'DXF de ensayo R136, no OEM',
   machineConfigKey:key,
   points:[[-5,-5],[5,-5],[5,5],[-5,5]],
   offsetX:0,offsetY:0,zMin:-15,zMax:15};
  saveMachineCad(localStorage,stop);
  const base=buildVolumeScene(technicalScene(piece,0),{machine,machineCAD:{stop}});
  const gauge=base.objects.gauge;
  const cx=(Math.min(...gauge.polygon.map(p=>p.x))+
   Math.max(...gauge.polygon.map(p=>p.x)))/2;
  const cy=(Math.min(...gauge.polygon.map(p=>p.y))+
   Math.max(...gauge.polygon.map(p=>p.y)))/2;
  const bed={...stop,kind:'bed',offsetX:cx-30,offsetY:cy};
  saveMachineCad(localStorage,bed);
  const axes={Y1:0,Y2:0,X:0,R:0,Z1:0,Z2:0};
  const limits=Object.fromEntries(['Y1','Y2','X','R','Z1','Z2']
   .map(axis=>[axis,{min:-3000,max:3000,maxSpeed:1000}]));
  const motion=saveAxisMotion(localStorage,{
   unit:'mm',timeUnit:'s',source:'programmed',
   sourceDescription:'Barrido de dedo para prueba Galaxy, NO CNC real',
   machineId:getActiveMachineProfile().id,
   pieceKey:motionPieceKey(piece),limits,
   poses:[{time:0,sceneTime:0,axes},
    {time:5,sceneTime:0,axes:{...axes,X:-60}}]
  });
  const mapping=saveAxisMapping(localStorage,{
   version:1,unit:'mm',
   signs:{Y:1,X:1,R:1,Z1:1,Z2:1},
   activeFinger:'Z1',referenceSceneTime:0,ramTiltTolerance:0,
   machineConfigKey:key,source:'Datum sintético de ensayo NO OEM'
  });
  const report=scanAxisCADMovement(piece,{
   machine,machineCAD:{stop,bed},axisMotion:motion,mapping,
   machineId:getActiveMachineProfile().id
  });
  const contact=report.events.find(e=>
   e.moving==='gauge'&&e.against==='bed'&&
   e.createdDuringThisInterval===true);
  document.getElementById('machineAxisCheck').click();
  return {
   contact:contact?.evidenceCode,
   scanChecked:report.checked,
   published:window.PLEGADOX_CNC_GAUGE_SNAPSHOT?.status.code,
   publishedLevel:document.getElementById('machineCncGaugeEvidence')?.dataset.level,
   reportCertified:report.canApproveForMachine
  };
 });
 assert.equal(synthetic.scanChecked,true);
 assert.equal(synthetic.contact,'DOS_PERFILES_CAD');
 assert.equal(synthetic.published,'TOPE_PENETRACION_NUEVA_CAD');
 assert.equal(synthetic.publishedLevel,'red');
 assert.equal(synthetic.reportCertified,false);
 state=await page.evaluate(()=>({
  stats:window.PLEGADOX_SOLID_RENDER_STATS(),
  text:document.getElementById('machineCncGaugeEvidence').textContent,
  planar:document.getElementById('machineGaugeEvidence').textContent
 }));
 assert.match(state.text,/ROJO · PENETRACIÓN NUEVA MODELADA DEL TOPE/);
 assert.match(state.text,/SIN sincronizar/);
 assert.match(state.planar,/diagnóstico de sección 2D/);
 // El nuevo semáforo no invalida triángulos en cada movimiento del ratón.
 const before=state.stats;
 await page.evaluate(()=>window.dispatchEvent(new CustomEvent('plegadox:cncGaugeReview',{
  detail:window.PLEGADOX_CNC_GAUGE_SNAPSHOT
 })));
 const after=await page.evaluate(()=>window.PLEGADOX_SOLID_RENDER_STATS());
 assert.equal(after.misses,before.misses,
  'Actualizar la señal CNC no debe volver a triangular la pose orbital');
 assert.ok(after.hits>=before.hits);
 // Una evidencia de otra pieza/máquina no puede quedar roja en un visor.
 await page.evaluate(()=>{
  const snap={...window.PLEGADOX_CNC_GAUGE_SNAPSHOT,
   pieceKey:'pieza-desactualizada'};
  window.PLEGADOX_CNC_GAUGE_SNAPSHOT=snap;
  window.dispatchEvent(new CustomEvent('plegadox:cncGaugeReview',{detail:snap}));
 });
 assert.equal(await page.locator('#machineCncGaugeEvidence').getAttribute('data-level'),
  'neutral');
 assert.match(await page.locator('#machineCncGaugeEvidence').textContent(),
  /INFORME DESACTUALIZADO|INFORME_DESACTUALIZADO|SIN EVIDENCIA CNC/);
 await page.evaluate(()=>{document.querySelector('.nav[data-tab="maquina"]').click();
  document.getElementById('machineAxisEvidencePanel').open=true;
 });
 const [download]=await Promise.all([
  page.waitForEvent('download',{timeout:20000}),
  page.evaluate(()=>document.getElementById('machineAxisReportDownload').click())
 ]);
 const exported=JSON.parse(readFileSync(await download.path(),'utf8'));
 assert.equal(exported.certified,false);
 assert.ok(exported.report.events.some(e=>
  e.moving==='gauge'&&e.against==='bed'&&e.createdDuringThisInterval));
 await page.locator('#machineCncGaugeEvidence').screenshot({
  path:'test-results/r136-galaxy-cnc-tope-dual-status.png'});
 assert.deepEqual(errors,[]);
 console.log('R136_GALAXY_DUAL_GAUGE_STATUS_NO_FALSE_ORANGE_AND_CACHE_OK');
 await context.close();
}finally{await browser?.close();server.kill();}
