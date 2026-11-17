import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {mkdirSync} from 'node:fs';
import {chromium} from 'playwright';
mkdirSync('test-results',{recursive:true});
const server=spawn('python3',['-m','http.server','4451','--bind','127.0.0.1'],{stdio:'ignore'});
let browser;
try{
 browser=await chromium.launch({headless:true,args:['--no-sandbox']});
 const context=await browser.newContext({
  viewport:{width:1280,height:800},deviceScaleFactor:2.5,
  hasTouch:true,isMobile:true,acceptDownloads:true,
  userAgent:'Mozilla/5.0 (Linux; Android 14; SM-X700) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36'
 });
 const page=await context.newPage(),errors=[];
 page.on('pageerror',error=>errors.push(error.message));
 await page.goto('http://127.0.0.1:4451/',{waitUntil:'networkidle',timeout:45000});
 await page.waitForFunction(()=>typeof window.PLEGADOX_SOLID_RENDER==='function');
 await page.locator('#machineSolidToggle').click();
 await page.waitForFunction(()=>document.querySelector('#machineSolidStatus')?.textContent
  .startsWith('Sólidos dibujados:'),null,{timeout:30000});
 assert.ok((await page.locator('#machineGaugeEvidence').textContent())
  .includes('diagnóstico de sección 2D'));
 await page.locator('#machineSolidCanvas').screenshot({path:'test-results/r127-galaxy-gauge-3d.png'});
 const initial=await page.locator('#machineSolidCanvas').screenshot();
 const stats=await page.evaluate(()=>window.PLEGADOX_SOLID_RENDER_STATS());
 const totalStatus=await page.locator('#machineSolidStatus').textContent();
 const count=s=>Number(s.match(/Sólidos dibujados: (\d+)/)?.[1]);
 assert.ok(count(totalStatus)>0);
 await page.locator('#machineOptionsButton').click();
 await page.locator('#machineShowGauge').uncheck();
 await page.waitForFunction((countInitial)=>{
  const t=document.querySelector('#machineSolidStatus').textContent;
  const count=Number(t.match(/Sólidos dibujados: (\d+)/)?.[1]);
  return count<countInitial;
 },count(totalStatus),{timeout:12000});
 const after=await page.locator('#machineSolidCanvas').screenshot();
 assert.ok(!initial.equals(after),'Ocultar tope modifica malla visible');
 assert.ok((await page.locator('#machineGaugeEvidence').textContent())
  .includes('diagnóstico de sección 2D'),
  'Ocultar capa no debe borrar el diagnóstico físico');
 assert.deepEqual(await page.evaluate(()=>window.PLEGADOX_SOLID_RENDER_STATS()),{
  hits:(await page.evaluate(()=>window.PLEGADOX_SOLID_RENDER_STATS())).hits,
  misses:stats.misses
 });
 const dl=page.waitForEvent('download',{timeout:15000});
 await page.locator('#machineCapture').click();
 const download=await dl;
 assert.match(download.suggestedFilename(),/solidos-3D\.png$/);
 await download.saveAs('test-results/r127-captura-real-3d.png');
 await page.locator('#machineShowGauge').check();
 await page.locator('#machineSolidToggle').click();
 assert.equal(await page.locator('#machineSolidCanvas').isVisible(),false);
 assert.deepEqual(errors,[]);
 console.log('R127_GALAXY_GAUGE_LAYERS_CAPTURE_OK');
 await context.close();
}finally{await browser?.close();server.kill();}
