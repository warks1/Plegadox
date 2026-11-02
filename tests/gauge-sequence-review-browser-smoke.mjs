import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {mkdirSync} from 'node:fs';
import {chromium} from 'playwright';
mkdirSync('test-results',{recursive:true});
const server=spawn('python3',['-m','http.server','4354','--bind','127.0.0.1'],{stdio:'ignore'});
let browser;
try{
 browser=await chromium.launch({headless:true,args:['--no-sandbox']});
 for(const dev of [{name:'pc',w:1440,h:900,mobile:false},
  {name:'iphone',w:390,h:844,mobile:true}]){
  const context=await browser.newContext({viewport:{width:dev.w,height:dev.h},
   isMobile:dev.mobile,hasTouch:dev.mobile});
  const page=await context.newPage(),errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  await page.goto('http://127.0.0.1:4354/',{waitUntil:'networkidle',timeout:30000});
  await page.locator('[data-tab="programacion"]').click();
  assert.equal(await page.locator('#gaugeReviewRows .px-gauge-operation').count(),4);
  assert.match(await page.locator('#workshopAuditStatus').textContent(),/NO VALIDADO PARA FABRICAR/);
  const buttons=await page.locator('#gaugeReviewRows .px-gauge-operation').all();
  for(const [i,button] of buttons.entries()){
   assert.match(await button.textContent(),new RegExp('G'+(i+1)+' · P'));
   assert.match(await button.textContent(),/2D|muestras/);
   const time=Number(await button.getAttribute('data-time'));
   assert.ok(time>=i*5&&time<(i+1)*5);
  }
  const time=Number(await page.locator('#gaugeReviewRows .px-gauge-operation').nth(2).getAttribute('data-time'));
  await page.locator('#gaugeReviewRows .px-gauge-operation').nth(2).click();
  assert.equal(await page.locator('#tab-simulacion').evaluate(el=>el.classList.contains('active')),true);
  const check=await page.evaluate(()=>window.PLEGADOX_STATE());
  assert.ok(Math.abs(check.sim.time-time)<.01,'Saltar al instante del golpe G3');
  assert.deepEqual(check.piece.order,[0,1,3,2]);
  assert.deepEqual(check.piece.angles,[90,-90,-90,90]);
  await page.locator('[data-tab="programacion"]').click();
  await page.locator('.bend-stop-select[data-bend="3"]').selectOption('2');
  const updated=await page.evaluate(async()=>{
   const {scanGaugeSequence}=await import('/gauge-sequence-review.js');
   return scanGaugeSequence(window.PLEGADOX_STATE().piece);
  });
  assert.deepEqual(updated.operations.map(x=>x.stopNumber),[1,1,2,1]);
  assert.equal(await page.locator('#gaugeReviewRows .px-gauge-operation').count(),4);
  assert.match(await page.locator('#gaugeReviewRows .px-gauge-operation').nth(2).textContent(),/SUPPORT 2/);
  await page.screenshot({path:'test-results/gauge-sequence-review-'+dev.name+'.png',fullPage:false});
  assert.deepEqual(errors,[],'Sin errores JS en '+dev.name);
  console.log('GAUGE_SEQUENCE_BROWSER_OK '+dev.name);
  await context.close();
 }
}finally{await browser?.close();server.kill();}
