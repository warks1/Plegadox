import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {readFileSync,mkdirSync} from 'node:fs';
import {chromium} from 'playwright';
mkdirSync('test-results',{recursive:true});
const server=spawn('python3',['-m','http.server','4349','--bind','127.0.0.1'],{stdio:'ignore'});
let browser;
try{
 browser=await chromium.launch({headless:true,args:['--no-sandbox']});
 for(const view of [{name:'pc',w:1440,h:900,mobile:false},
  {name:'iphone',w:390,h:844,mobile:true}]){
  const context=await browser.newContext({viewport:{width:view.w,height:view.h},
   isMobile:view.mobile,hasTouch:view.mobile,acceptDownloads:true});
  const page=await context.newPage(),errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  page.on('dialog',d=>d.accept());
  await page.goto('http://127.0.0.1:4349/',{waitUntil:'networkidle',timeout:30000});
  await page.locator('[data-tab="desarrollo"]').click();
  assert.equal(await page.locator('#workshopCalibrationPanel').isVisible(),true);
  const measured=await page.evaluate(async()=>{
   const {development}=await import('/engine.js');
   return development({...window.PLEGADOX_STATE().piece,radius:2.4,kFactor:.38}).length;
  });
  await page.locator('#measurementFlat').fill(String(measured));
  assert.match(await page.locator('#measurementAdvice').textContent(),/Para proponer K/);
  assert.equal(await page.locator('#measurementApplyK').isDisabled(),true);
  await page.locator('#measurementRadius').fill('2.4');
  assert.match(await page.locator('#measurementAdvice').textContent(),/Confirma antes/);
  await page.locator('#measurementAnglesChecked').check();
  assert.match(await page.locator('#measurementAdvice').textContent(),/0,38/);
  assert.equal(await page.locator('#measurementApplyK').isDisabled(),true);
  await page.locator('#measurementNotes').fill('Acero S235 · Lote 09');
  await page.locator('#measurementSave').click();
  assert.equal(await page.locator('#measurementApplyK').isDisabled(),false);
  assert.equal(await page.locator('#measurementHistory .px-measurement-item').count(),1);
  await page.locator('#measurementApplyK').click();
  const current=await page.evaluate(()=>window.PLEGADOX_STATE().piece);
  assert.ok(Math.abs(current.kFactor-.38)<1e-4);
  assert.equal(current.radius,2.4);
  await page.reload({waitUntil:'networkidle'});
  await page.locator('[data-tab="desarrollo"]').click();
  assert.equal(await page.locator('#measurementHistory .px-measurement-item').count(),1);
  const exportDownload=page.waitForEvent('download');
  await page.locator('#measurementExport').click();
  const exported=JSON.parse(readFileSync(await(await exportDownload).path(),'utf8'));
  assert.equal(exported.records.length,1);
  assert.equal(exported.records[0].verified,false);
  await page.locator('[data-tab="programacion"]').click();
  const backupDownload=page.waitForEvent('download');
  await page.locator('#exportCompleteProject').click();
  const backup=JSON.parse(readFileSync(await(await backupDownload).path(),'utf8'));
  assert.equal(backup.measurements.length,1,'El backup R19 incluye ensayos');
  await page.locator('[data-tab="desarrollo"]').click();
  await page.locator('#measurementHistory .px-measurement-item button').click();
  assert.equal(await page.locator('#measurementHistory .px-measurement-item').count(),0);
  await page.locator('[data-tab="programacion"]').click();
  await page.locator('#completeProjectInput').setInputFiles({
   name:'respaldo.json',mimeType:'application/json',
   buffer:Buffer.from(JSON.stringify(backup))});
  await page.waitForFunction(async()=>{
   const {readMeasurements}=await import('/workshop-measurements.js');
   return readMeasurements(localStorage).length===1;
  });
  await page.locator('[data-tab="desarrollo"]').click();
  assert.equal(await page.locator('#measurementHistory .px-measurement-item').count(),1);
  await page.screenshot({path:'test-results/calibracion-'+view.name+'.png',fullPage:false});
  assert.deepEqual(errors,[],'Sin errores JS en '+view.name);
  console.log('WORKSHOP_CALIBRATION_BROWSER_OK '+view.name);
  await context.close();
 }
}finally{await browser?.close();server.kill();}
