import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {chromium} from 'playwright';
const server=spawn('python3',['-m','http.server','4397','--bind','127.0.0.1'],{stdio:'ignore'});
let browser;
try{
 browser=await chromium.launch({headless:true,args:['--no-sandbox']});
 for(const device of [{name:'PC',w:1365,h:900,mobile:false},
  {name:'iPhone',w:390,h:844,mobile:true}]){
  const context=await browser.newContext({viewport:{width:device.w,height:device.h},
   isMobile:device.mobile,hasTouch:device.mobile});
  const page=await context.newPage(),errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  await page.goto('http://127.0.0.1:4397/',{waitUntil:'domcontentloaded',timeout:30000});
  await page.waitForFunction(()=>!!window.PLEGADOX_STATE,null,{timeout:30000});
  await page.locator('[data-tab="programacion"]').click();
  const tool=page.locator('#toolingPlannerMode'),sequence=page.locator('#sequencePlannerMode');
  assert.equal(await tool.inputValue(),'auto');
  assert.equal(await sequence.inputValue(),'auto',
   'La omega de muestra participa en el análisis igual que cualquier pieza nueva');
  assert.ok(await page.locator('#setupAutoRecalculate').isVisible());
  assert.ok(await page.locator('#setupAutoFull').isVisible());
  assert.ok(await page.locator('#setupAutoApply').count()===1);
  // Eligiendo una herramienta a mano se bloquea exclusivamente el utillaje.
  await page.locator('#die').selectOption('v16-30');
  assert.equal(await tool.inputValue(),'manual');
  const fixed=await page.evaluate(()=>window.PLEGADOX_STATE().piece.die);
  await page.locator('#resetOrder').click();
  assert.equal(await sequence.inputValue(),'manual');
  assert.equal(await page.evaluate(()=>window.PLEGADOX_STATE().piece.die),fixed);
  await page.locator('#sampleBtn').click();
  assert.equal(await page.evaluate(()=>window.PLEGADOX_STATE().piece.angles.length),4);
  assert.equal(await tool.inputValue(),'manual');
  // El usuario puede volver a Automático para cualquiera de los dos.
  await sequence.selectOption('auto');
  await tool.selectOption('auto');
  assert.equal(await tool.inputValue(),'auto');
  assert.equal(await sequence.inputValue(),'auto');
  assert.deepEqual(errors,[],device.name+': sin errores JS');
  await context.close();
 }
 console.log('R31_TOOLING_SEQUENCE_BROWSER_OK');
}finally{await browser?.close();server.kill();}
