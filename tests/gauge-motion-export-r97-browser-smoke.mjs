import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {spawn} from 'node:child_process';
import {chromium} from 'playwright';
const server=spawn('python3',['-m','http.server','4397','--bind','127.0.0.1'],{stdio:'ignore'});
let browser;
try{
 browser=await chromium.launch({headless:true,args:['--no-sandbox']});
 for(const device of [{name:'pc',width:1440,height:900,mobile:false},
  {name:'iphone',width:390,height:844,mobile:true}]){
  const ctx=await browser.newContext({viewport:{width:device.width,height:device.height},
   acceptDownloads:true,isMobile:device.mobile,hasTouch:device.mobile});
  const page=await ctx.newPage(),errors=[];
  page.on('pageerror',error=>errors.push(error.message));
  await page.goto('http://127.0.0.1:4397/',{waitUntil:'networkidle',timeout:30000});
  await page.locator('[data-tab="programacion"]').click();
  assert.equal(await page.locator('#exportGaugeMotionBtn').count(),1);
  const original=await page.evaluate(async()=>{
   const {EXAMPLE,normalized}=await import('/engine.js');
   const state=window.PLEGADOX_STATE();
   Object.assign(state.piece,normalized({...EXAMPLE,
    flanges:[50,30,50,30,20],punch:'goose',die:'v16',
    gaugeSideByBend:['auto','before','before','auto']}));
   return JSON.stringify(state.piece);
  });
  const pending=page.waitForEvent('download');
  await page.locator('#exportGaugeMotionBtn').click();
  const download=await pending,filename=download.suggestedFilename();
  assert.match(filename,/DIAGNOSTICO-TOPES-2D\.json$/);
  const saved=JSON.parse(await readFile(await download.path(),'utf8'));
  assert.equal(saved.schema,'plegadox-gauge-motion-diagnostic-v1');
  assert.equal(saved.build,'PLEGADOX-20261115-R96',
   'El informe identifica exactamente la compilación desde la que se exporta');
  assert.deepEqual(saved.operationOrder,[1,2,4,3]);
  assert.equal(saved.operations.length,4);
  assert.equal(saved.operations[1].frames.find(f=>f.sub===.25).reference.distance,30);
  assert.equal(saved.operations[1].frames.find(f=>f.sub===.6).motion.phase,
   'retirado-durante-plegado');
  assert.equal(saved.canApproveForMachine,false);
  const after=await page.evaluate(()=>JSON.stringify(window.PLEGADOX_STATE().piece));
  assert.equal(after,original,'La descarga no cambia el orden ni los topes del operario');
  assert.match(await page.locator('#gaugeMotionExportStatus').textContent(),/Diagnóstico descargado/);
  assert.deepEqual(errors,[],device.name+' sin errores JavaScript');
  console.log('GAUGE_DIAGNOSTIC_EXPORT_BROWSER_OK '+device.name+' '+filename);
  await ctx.close();
 }
}finally{await browser?.close();server.kill();}
