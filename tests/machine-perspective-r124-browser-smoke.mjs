import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {mkdirSync} from 'node:fs';
import {chromium} from 'playwright';

mkdirSync('test-results',{recursive:true});
const server=spawn('python3',['-m','http.server','4443','--bind','127.0.0.1'],{stdio:'ignore'});
let browser;
try{
 browser=await chromium.launch({headless:true,executablePath:process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE||undefined,args:['--no-sandbox']});
 for(const target of [
  {id:'iphone',w:390,h:844,mobile:true},
  {id:'tablet',w:768,h:1024,mobile:true},
  {id:'pc',w:1440,h:900,mobile:false}
 ]){
  const context=await browser.newContext({viewport:{width:target.w,height:target.h},
   isMobile:target.mobile,hasTouch:target.mobile,deviceScaleFactor:1,
   acceptDownloads:true});
  const page=await context.newPage(),errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  await page.goto('http://127.0.0.1:4443/',{
   waitUntil:'networkidle',timeout:40000});
  await page.waitForFunction(()=>typeof window.PLEGADOX_REDRAW_MACHINE==='function',
   null,{timeout:30000});
  const initial=await page.evaluate(()=>({
   piece:JSON.stringify(window.PLEGADOX_STATE().piece),
   view:JSON.stringify(window.PLEGADOX_MACHINE_VIEW)
  }));
  await page.locator('#machineOptionsButton').click();
  assert.equal(await page.locator('#machineViewStudio').getAttribute('open'),'');
  assert.equal(await page.locator('#machineOptionsButton').getAttribute('aria-expanded'),'true');
  await page.locator('#machineViewPreset').selectOption('deep');
  assert.equal(await page.evaluate(()=>window.PLEGADOX_MACHINE_VIEW.depth),1.6);
  assert.equal(await page.evaluate(()=>window.PLEGADOX_MACHINE_VIEW.perspective),true);
  await page.locator('#machineCanvas').screenshot({
   path:'test-results/r124-perspective-'+target.id+'-profunda.png'});
  const withGauge=await page.locator('#machineCanvas').screenshot();
  await page.locator('#machineShowGauge').uncheck();
  assert.equal(await page.evaluate(()=>window.PLEGADOX_MACHINE_VIEW.showGauge),false);
  const withoutGauge=await page.locator('#machineCanvas').screenshot();
  assert.ok(!withGauge.equals(withoutGauge),
   'Ocultar tope debe cambiar pixeles, no solo checkbox '+target.id);
  await page.locator('#machineShowGauge').check();
  await page.locator('#machineShowGrid').check();
  await page.locator('#machineShowAxes').check();
  await page.locator('#machineShowPunch').uncheck();
  assert.equal(await page.evaluate(()=>window.PLEGADOX_MACHINE_VIEW.showPunch),false);
  await page.locator('#machineShowPunch').check();
  await page.locator('#machineTheme').selectOption('contrast');
  assert.equal(await page.evaluate(()=>window.PLEGADOX_MACHINE_VIEW.theme),'contrast');
  await page.locator('#machineViewPreset').selectOption('elevated');
  assert.equal(await page.evaluate(()=>window.PLEGADOX_MACHINE_VIEW.tilt),1.65);
  await page.locator('#machinePanRight').click();
  assert.equal(await page.evaluate(()=>window.PLEGADOX_MACHINE_VIEW.panX),42);
  await page.locator('#machineCenterView').click();
  assert.equal(await page.evaluate(()=>window.PLEGADOX_MACHINE_VIEW.panX),0);
  await page.locator('#machineZoomRange').evaluate(el=>{
   el.value='1.5';el.dispatchEvent(new Event('input',{bubbles:true}));
  });
  assert.equal(await page.evaluate(()=>window.PLEGADOX_MACHINE_VIEW.zoom),1.5);
  await page.locator('#machineReset').click();
  assert.equal(await page.evaluate(()=>window.PLEGADOX_MACHINE_VIEW.zoom),1);
  await page.locator('#machinePhaseJump').selectOption('0.52');
  assert.equal(await page.evaluate(()=>window.PLEGADOX_STATE().sim.playing),false);
  assert.ok(Math.abs(await page.evaluate(()=>window.PLEGADOX_STATE().sim.time)-2.6)<1e-6);
  await page.locator('#machineNextFold').click();
  assert.equal(await page.evaluate(()=>window.PLEGADOX_STATE().sim.time),5);
  await page.locator('#machinePrevFold').click();
  assert.equal(await page.evaluate(()=>window.PLEGADOX_STATE().sim.time),0);
  const downloadEvent=page.waitForEvent('download',{timeout:10000});
  await page.locator('#machineCapture').click();
  const download=await downloadEvent;
  assert.match(download.suggestedFilename(),/\.png$/);
  await page.locator('#machineCanvas').screenshot({
   path:'test-results/r124-perspective-'+target.id+'-capas.png'});
  await page.locator('#machineFullscreen').click();
  await page.waitForFunction(()=>{
   const f=document.querySelector('.cp-machine-frame');
   return document.fullscreenElement===f||f?.classList.contains('px-view-immersive');
  },null,{timeout:7000});
  assert.equal(await page.locator('#machineFullscreen').getAttribute('aria-pressed'),'true');
  await page.locator('#machineCanvas').screenshot({
   path:'test-results/r124-perspective-'+target.id+'-inmersiva.png'});
  await page.locator('#machineFullscreen').click();
  await page.waitForFunction(()=>{
   const f=document.querySelector('.cp-machine-frame');
   return document.fullscreenElement!==f&&!f?.classList.contains('px-view-immersive');
  },null,{timeout:7000});
  assert.equal(await page.locator('#machineFullscreen').getAttribute('aria-pressed'),'false');
  const after=await page.evaluate(()=>JSON.stringify(window.PLEGADOX_STATE().piece));
  assert.equal(after,initial.piece,
   'Las opciones de Perspectiva NO modifican útiles, pieza ni secuencia');
  await page.reload({waitUntil:'networkidle',timeout:40000});
  await page.waitForFunction(()=>typeof window.PLEGADOX_REDRAW_MACHINE==='function',
   null,{timeout:30000});
  assert.equal(await page.evaluate(()=>window.PLEGADOX_MACHINE_VIEW.theme),'contrast',
   'Preferencias deben sobrevivir a recarga');
  assert.equal(await page.evaluate(()=>window.PLEGADOX_MACHINE_VIEW.showGrid),true);
  const dims=await page.evaluate(()=>({
   scroll:document.documentElement.scrollWidth,
   screen:window.innerWidth
  }));
  assert.ok(dims.scroll<=dims.screen+2,
   'Sin scroll horizontal por el panel en '+target.id+': '+JSON.stringify(dims));
  assert.deepEqual(errors,[],'Errores de navegador '+target.id);
  console.log('R124_PERSPECTIVE_'+target.id.toUpperCase()+'_OK');
  await context.close();
 }
}finally{
 await browser?.close();
 server.kill();
}
