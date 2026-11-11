import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {chromium} from 'playwright';
const server=spawn('python3',['-m','http.server','4389','--bind','127.0.0.1'],{stdio:'ignore'});
let browser;
try{
 browser=await chromium.launch({headless:true,args:['--no-sandbox']});
 for(const view of [{name:'pc',w:1440,h:900,mobile:false},{name:'iphone',w:390,h:844,mobile:true}]){
  const context=await browser.newContext({viewport:{width:view.w,height:view.h},
   isMobile:view.mobile,hasTouch:view.mobile});
  const page=await context.newPage(),errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  page.on('dialog',d=>d.accept());
  await page.goto('http://127.0.0.1:4389/',{waitUntil:'commit',timeout:30000});
  const splash=page.locator('#pxTitaniumSplash');
  await splash.waitFor({state:'visible',timeout:30000});
  assert.equal(await splash.isVisible(),true,view.name+': el splash aparece al entrar');
  const original=page.frameLocator('#pxSplashReference');
  await original.locator('#sheetFront').waitFor({state:'attached'});
  assert.match(await original.locator('.company').textContent(),/A\.M\.S TECNOLIGICS/);
  assert.match(await original.locator('.version').textContent(),/02 · TITANIUM/);
  assert.equal(await original.locator('#punchGroup').count(),1);
  await splash.waitFor({state:'hidden',timeout:30000});
  await page.waitForFunction(()=>!!window.PLEGADOX_STATE,null,{timeout:30000});
  await page.locator('[data-tab="programacion"]').click();
  assert.ok(await page.locator('#cybelecReferenceBtn').isVisible());
  await page.locator('#cybelecReferenceBtn').click();
  const state=await page.evaluate(()=>window.PLEGADOX_STATE().piece);
  assert.deepEqual(state.order,[0,1,3,2]);
  assert.deepEqual(state.angles,[90,-90,-90,90]);
  assert.equal(state.die,'v16-30');
  await page.locator('[data-tab="desarrollo"]').click();
  assert.match(await page.locator('#cybelecDevelopmentCompare').textContent(),/233,94 mm/);
  assert.match(await page.locator('#cybelecDevelopmentCompare').textContent(),/G3→P4/);
  await page.locator('[data-tab="simulacion"]').click();
  assert.match(await page.locator('#cybelecSequenceHint').textContent(),/G4→P3/);
  assert.match(await page.locator('#simSequence .op').nth(2).textContent(),/P4/);
  assert.deepEqual(errors,[],view.name+': no se producen errores JS');
  await context.close();
 }
 console.log('R29_TITANIUM_CYBELEC_BROWSER_OK');
}finally{await browser?.close();server.kill();}
