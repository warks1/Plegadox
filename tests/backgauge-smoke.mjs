import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {chromium} from 'playwright';

const server=spawn('python3',['-m','http.server','4199','--bind','127.0.0.1'],{stdio:'ignore'});
let browser;
try{
 browser=await chromium.launch({headless:true,args:['--no-sandbox']});
 for(const display of [
  {name:'desktop',width:1536,height:900,mobile:false},
  {name:'mobile',width:390,height:844,mobile:true}
 ]){
  const context=await browser.newContext({
   viewport:{width:display.width,height:display.height},
   hasTouch:display.mobile,isMobile:display.mobile,deviceScaleFactor:1
  });
  const page=await context.newPage(),errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  await page.goto('http://127.0.0.1:4199/',{waitUntil:'networkidle'});
  await page.locator('[data-tab="programacion"]').click();
  await page.locator('#sampleBtn').click();
  assert.equal(await page.locator('.bend-stop-select').count(),4);
  assert.equal(await page.locator('.bend-stop-select[data-bend="0"]').inputValue(),'1');
  await page.locator('.bend-stop-select[data-bend="3"]').selectOption('2');
  assert.deepEqual(await page.evaluate(()=>window.PLEGADOX_STATE().piece.stopByBend),[1,1,1,2]);
  await page.locator('[data-tab="simulacion"]').click();
  const before=await page.locator('#machineCanvas').evaluate(el=>el.toDataURL());
  assert.equal(await page.locator('#chooseGauge1').getAttribute('aria-pressed'),'true');
  await page.locator('#chooseGauge2').click();
  const after=await page.locator('#machineCanvas').evaluate(el=>el.toDataURL());
  assert.notEqual(after,before,'La geometría del tope debe cambiar en la máquina');
  assert.equal(await page.locator('#chooseGauge2').getAttribute('aria-pressed'),'true');
  assert.match(await page.locator('#activeGaugeLabel').textContent(),/TOPE 2 · SUPPORT/);
  assert.deepEqual(await page.evaluate(()=>window.PLEGADOX_STATE().piece.stopByBend),[2,1,1,2]);
  await page.locator('#timeline').evaluate(input=>{
   input.value='300';input.dispatchEvent(new Event('input',{bubbles:true}));
  });
  assert.match(await page.locator('#activeGaugeLabel').textContent(),/TOPE 1 · STOP/);
  await page.locator('#timeline').evaluate(input=>{
   input.value='560';input.dispatchEvent(new Event('input',{bubbles:true}));
  });
  assert.match(await page.locator('#activeGaugeLabel').textContent(),/TOPE 2 · SUPPORT/);
  assert.match(await page.locator('#activeGaugeLabel').textContent(),/pliegue 4/);
  await page.reload({waitUntil:'networkidle'});
  await page.locator('[data-tab="simulacion"]').click();
  await page.locator('#timeline').evaluate(input=>{
   input.value='560';input.dispatchEvent(new Event('input',{bubbles:true}));
  });
  assert.match(await page.locator('#activeGaugeLabel').textContent(),/TOPE 2 · SUPPORT/);
  const stored=await page.evaluate(()=>JSON.parse(localStorage.getItem('plegadox:piece:v1')));
  assert.deepEqual(stored.stopByBend,[2,1,1,2]);
  const size=await page.evaluate(()=>({scroll:document.documentElement.scrollWidth,width:innerWidth}));
  assert.ok(size.scroll<=size.width+4,'Sin desbordamiento horizontal en '+display.name);
  assert.deepEqual(errors,[],'Sin excepciones JS en '+display.name);
  console.log('BACKGAUGE_'+display.name.toUpperCase()+'_OK',JSON.stringify(stored.stopByBend));
  await context.close();
 }
}finally{await browser?.close();server.kill();}
