import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {chromium} from 'playwright';
const server=spawn('python3',['-m','http.server','4298','--bind','127.0.0.1'],{stdio:'ignore'});
let browser;
try{
 browser=await chromium.launch({headless:true,args:['--no-sandbox']});
 const context=await browser.newContext({viewport:{width:1280,height:860}});
 const page=await context.newPage();
 const errors=[];page.on('pageerror',err=>errors.push(err.message));
 await page.goto('http://127.0.0.1:4298/index.html',{waitUntil:'networkidle'});
 await page.waitForFunction(()=>!!navigator.serviceWorker?.controller,{timeout:30000});
 const checks=await page.evaluate(async()=>{
  const reg=await navigator.serviceWorker.ready;
  const cacheKeys=await caches.keys();
  const cache=await caches.open(cacheKeys.find(k=>k.startsWith('plegadox-static-')));
  const entries=await Promise.all(['index.html','styles.css','app.js','icons.svg','manifest.webmanifest']
   .map(async p=>Boolean(await cache.match('./'+p))));
  return {active:!!reg.active,entries};
 });
 assert.ok(checks.active&&checks.entries.every(Boolean),'Precache offline incompleta '+JSON.stringify(checks));
 await page.locator('[data-tab="programacion"]').click();
 await page.locator('#pieceName').fill('OMEGA OFFLINE');
 await page.locator('#pieceName').dispatchEvent('change');
 await context.setOffline(true);
 await page.reload({waitUntil:'domcontentloaded'});
 await page.locator('#machineCanvas').waitFor({state:'visible',timeout:15000});
 await page.locator('[data-tab="programacion"]').click();
 assert.equal(await page.locator('#pieceName').inputValue(),'OMEGA OFFLINE',
  'La pieza debe conservarse localmente sin conexión');
 await page.locator('[data-tab="simulacion"]').click();
 assert.ok(await page.locator('#cockpitTools .cp-tool-card').count()>0);
 assert.deepEqual(errors,[],'Errores al abrir PlegadoX sin conexión: '+errors.join('; '));
 console.log('PREMIUM_PWA_OFFLINE_OK');
}finally{await browser?.close();server.kill();}
