import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {chromium} from 'playwright';
import {mkdirSync} from 'node:fs';

mkdirSync('test-results',{recursive:true});
const server=spawn('python3',['-m','http.server','4198','--bind','127.0.0.1'],{stdio:'ignore'});
let browser;
try {
 browser=await chromium.launch({headless:true,args:['--no-sandbox']});
 for(const device of [
  {name:'desktop',width:1536,height:900,touch:false},
  {name:'tablet',width:834,height:1194,touch:true},
  {name:'phone',width:390,height:844,touch:true}
 ]){
  const context=await browser.newContext({viewport:{width:device.width,height:device.height},
   hasTouch:device.touch,isMobile:device.touch,deviceScaleFactor:device.touch?2:1,acceptDownloads:true});
  const page=await context.newPage(),errors=[];
  page.on('pageerror',err=>errors.push(err.message));
  await page.goto('http://127.0.0.1:4198/',{waitUntil:'networkidle',timeout:30000});
  await page.locator('[data-tab="maquina"]').click();
  await page.locator('#machineStopFields input').first().waitFor({state:'visible'});
  assert.equal(await page.locator('#machineRamFields input[data-path="ram.0"]').inputValue(),'1340');
  assert.equal(await page.locator('#machineBedFields input[data-path="bed.2"]').inputValue(),'25.25');
  assert.equal(await page.locator('#machineStopFields input[data-path="stop.2"]').inputValue(),'18');
  assert.equal(await page.locator('#machineSupportFields input[data-path="support.2"]').inputValue(),'8');
  assert.equal(await page.locator('#machineSupportFields input[data-path="preferredDistance"]').inputValue(),'80');
  const rows=await page.locator('.machine-number-field').count();
  assert.ok(rows>=43,'Debe haber cotas editables en las cuatro secciones: '+rows);
  await page.screenshot({path:'test-results/v85-'+device.name+'.png',fullPage:false});
  const path='#machineStopFields input[data-path="stop.2"]';
  const before=await page.locator('#machineStopProfile').evaluate(c=>c.toDataURL());
  await page.locator(path).fill('23');
  await page.locator(path).press('Tab');
  assert.equal(await page.locator(path).inputValue(),'23');
  assert.notEqual(await page.locator('#machineStopProfile').evaluate(c=>c.toDataURL()),before,
   'El dibujo Stop debe cambiar cuando cambia L3');
  const persisted=await page.evaluate(()=>JSON.parse(localStorage.getItem('plegadox:trumpf-v85:v1')));
  assert.equal(persisted.stop[2],23,'La cota modificada se guarda');
  await page.reload({waitUntil:'networkidle'});
  await page.locator('[data-tab="maquina"]').click();
  assert.equal(await page.locator(path).inputValue(),'23','La cota se mantiene tras recargar');
  await page.locator('#machineRamFields input[data-path="ramWidth"]').fill('1800');
  await page.locator('#machineRamFields input[data-path="ramWidth"]').press('Tab');
  const configured=await page.evaluate(async()=>{
   const {getV85}=await import('./machine-config.js');
   return getV85().ramWidth;
  });
  assert.equal(configured,1800);
  const downloadPromise=page.waitForEvent('download');
  await page.locator('#machineExport').click();
  const download=await downloadPromise;
  assert.match(download.suggestedFilename(),/Plegadox.*V85/);
  await page.locator('#machineResetValues').click();
  assert.equal(await page.locator(path).inputValue(),'18','Restaurar cotas del control');
  assert.equal(await page.locator('#machineRamFields input[data-path="ramWidth"]').inputValue(),'2040');

  await page.locator('[data-tab="programacion"]').click();
  await page.locator('#die').selectOption('rolleri-tmr100-16-30');
  assert.equal(await page.evaluate(()=>window.PLEGADOX_STATE().piece.die),'rolleri-tmr100-16-30');
  await page.locator('#die').selectOption('v16-30');
  assert.equal(await page.evaluate(()=>window.PLEGADOX_STATE().piece.die),'v16-30');
  await page.locator('#machineSection').click();
  assert.equal(await page.locator('#machineSection').getAttribute('aria-pressed'),'true');
  const overflow=await page.evaluate(()=>({sw:document.documentElement.scrollWidth,vw:innerWidth}));
  assert.ok(overflow.sw<=overflow.vw+3,'No se puede desbordar el smartphone '+JSON.stringify(overflow));
  assert.deepEqual(errors,[],'Sin excepciones de JavaScript: '+errors.join(' / '));
  console.log('V85_EDITOR_OK',JSON.stringify({screen:device.name,fields:rows,v16:true,stopSaved:true}));
  await context.close();
 }
}finally{
 await browser?.close();
 server.kill();
}
