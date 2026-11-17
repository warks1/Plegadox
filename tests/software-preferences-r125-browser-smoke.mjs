import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {chromium} from 'playwright';
const server=spawn('python3',['-m','http.server','4445','--bind','127.0.0.1'],{stdio:'ignore'});
let browser;
try{
 browser=await chromium.launch({headless:true,executablePath:process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE||undefined,args:['--no-sandbox']});
 for(const width of [390,768,1440]){
  const context=await browser.newContext({viewport:{width,height:900}}),page=await context.newPage(),errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  await page.goto('http://127.0.0.1:4445/',{waitUntil:'networkidle'});
  await page.waitForSelector('#pref-density',{state:'attached'});
  const piece=await page.evaluate(()=>JSON.stringify(window.PLEGADOX_STATE().piece));
  await page.locator('[data-tab=software]').click();
  await page.locator('#pref-density').selectOption('touch');
  await page.locator('#pref-textSize').selectOption('extra');
  await page.locator('#pref-startup').selectOption('software');
  assert.equal(await page.locator('html').getAttribute('data-pref-density'),'touch');
  await page.reload({waitUntil:'networkidle'});
  await page.waitForSelector('#tab-software.active');
  assert.equal(await page.locator('#pref-textSize').inputValue(),'extra');
  assert.equal(await page.evaluate(()=>JSON.stringify(window.PLEGADOX_STATE().piece)),piece);
  const exported=page.waitForEvent('download');await page.locator('#preferencesExport').click();assert.equal((await exported).suggestedFilename(),'PlegadoX-preferencias.json');
  await page.locator('#preferencesImport').setInputFiles({name:'settings.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify({format:'plegadox-preferences',version:1,preferences:{density:'touch',speed:'.5'},view:{preset:'wide',depth:2.1}}))});
  await page.waitForFunction(()=>document.getElementById('preferencesStatus').textContent.includes('importadas'));
  assert.equal(await page.locator('#speed').inputValue(),'.5');
  assert.equal(await page.evaluate(()=>window.PLEGADOX_MACHINE_VIEW.depth),2.1);
  await page.locator('#preferencesReset').click();assert.equal(await page.locator('#pref-density').inputValue(),'standard');
  assert.deepEqual(errors,[]);await context.close();
 }
 console.log('Preferencias: PC, tablet y móvil correctos');
}finally{await browser?.close();server.kill();}
