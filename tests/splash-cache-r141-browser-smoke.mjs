import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {chromium} from 'playwright';
const port=4511;
const server=spawn('python3',['-m','http.server',String(port),'--bind','127.0.0.1'],{stdio:'ignore'});
let browser;
try{
 browser=await chromium.launch({headless:true,args:['--no-sandbox']});
 const context=await browser.newContext({
  viewport:{width:800,height:1280},deviceScaleFactor:2.5,
  isMobile:true,hasTouch:true,userAgent:
   'Mozilla/5.0 (Linux; Android 14; SM-X700) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36'
 });
 const page=await context.newPage(),errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 await page.goto('http://127.0.0.1:'+port+'/index.html',{waitUntil:'networkidle',timeout:45000});
 await page.waitForFunction(()=>!!navigator.serviceWorker?.controller,null,{timeout:35000});
 await page.waitForFunction(()=>!!window.PLEGADOX_STATE?.(),null,{timeout:22000});
 const cache=await page.evaluate(async()=>{
  const build=await (await fetch('./build-info.json')).json();
  const store=await caches.open(build.cache);
  return {build:build.build,
   photo:!!(await store.match('./plegadox-premium-selected.png')),
   html:!!(await store.match('./splash-foto-premium.html'))};
 });
 assert.equal(cache.build,'PLEGADOX-20261117-R141');
 assert.equal(cache.photo,true,'PNG premium precargado');
 assert.equal(cache.html,true,'HTML premium precargado');
 await context.setOffline(true);
 await page.reload({waitUntil:'domcontentloaded',timeout:30000});
 await page.waitForFunction(()=>document.getElementById('pxSplashImmediate')
  ?.naturalWidth===1672,null,{timeout:16000});
 await page.waitForFunction(()=>document.getElementById('pxSplashReference')
  ?.contentDocument?.getElementById('photo')?.naturalWidth===1672,null,{timeout:16000});
 await page.waitForFunction(()=>!!window.PLEGADOX_STATE?.(),null,{timeout:22000});
 const ready=await page.evaluate(()=>{
  const frame=document.getElementById('pxSplashReference');
  return {
   immediate:document.getElementById('pxSplashImmediate').naturalHeight,
   framePhoto:frame.contentDocument.getElementById('photo').naturalHeight,
   bar:frame.contentDocument.querySelectorAll('[role=progressbar]').length
  };
 });
 assert.equal(ready.immediate,941);
 assert.equal(ready.framePhoto,941);
 assert.equal(ready.bar,1);
 assert.deepEqual(errors,[]);
 console.log('R141_GALAXY_PREMIUM_SPLASH_CACHE_OFFLINE_OK');
 await context.close();
}finally{await browser?.close();server.kill();}
