import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {mkdirSync} from 'node:fs';
import {chromium} from 'playwright';

const port=4498;
const wait=ms=>new Promise(resolve=>setTimeout(resolve,ms));
mkdirSync('test-results',{recursive:true});
const server=spawn('python3',['-m','http.server',String(port),'--bind','127.0.0.1'],{stdio:'ignore'});
let browser;
try{
 browser=await chromium.launch({headless:true,args:['--no-sandbox']});
 for(const d of [
  {name:'galaxy',w:800,h:1280,slowModules:false},
  {name:'iphone',w:390,h:844,slowModules:true},
  {name:'tablet-horizontal',w:1280,h:800,slowModules:true}
 ]){
  const context=await browser.newContext({viewport:{width:d.w,height:d.h},
   isMobile:true,hasTouch:true,deviceScaleFactor:1});
  const page=await context.newPage(),errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  await page.route('**/plegadox-premium-selected.png',async route=>{
   await wait(d.slowModules?1200:3100);await route.continue();
  });
  await page.route('**/splash-foto-premium.html',async route=>{
   await wait(d.slowModules?1600:3200);await route.continue();
  });
  if(d.slowModules)await page.route('**/app.js*',async route=>{
   await wait(3500);await route.continue();
  });
  await page.goto('http://127.0.0.1:'+port+'/index.html',{waitUntil:'commit',timeout:30000});
  await page.waitForFunction(()=>!!document.getElementById('pxSplashEarlyProgress'),null,{timeout:9000});
  await wait(d.slowModules?250:1250);
  const before=await page.evaluate(()=>{
   const s=document.getElementById('pxTitaniumSplash');
   const i=document.getElementById('pxSplashImmediate');
   const b=document.getElementById('pxSplashEarlyUI');
   const f=document.getElementById('pxSplashReference');
   return {loaded:i.complete&&i.naturalWidth>0,
    photo:getComputedStyle(i).visibility==='visible',
    bar:getComputedStyle(b).visibility==='visible',
    frame:getComputedStyle(f).opacity==='1',
    closed:s.hidden||s.classList.contains('is-complete')};
  });
  assert.equal(before.loaded,false,d.name+' imagen retenida en red');
  assert.equal(before.photo,false,d.name+' foto aun no descargada');
  assert.equal(before.bar,false,d.name+' nunca barra aislada');
  assert.equal(before.frame,false,d.name+' no hay iframe incompleto');
  assert.equal(before.closed,false,d.name+' no cerrar mientras falta la foto');

  await page.waitForFunction(()=>document.getElementById('pxTitaniumSplash')
   ?.classList.contains('is-photo-ready'),null,{timeout:12000});
  const firstPaint=await page.evaluate(()=>{
   const i=document.getElementById('pxSplashImmediate');
   const b=document.getElementById('pxSplashEarlyUI');
   const f=document.getElementById('pxSplashReference');
   return {photo:getComputedStyle(i).visibility==='visible',
    bar:getComputedStyle(b).visibility==='visible',
    original:getComputedStyle(f).opacity==='1'};
  });
  assert.ok(firstPaint.original||(firstPaint.photo&&firstPaint.bar),
   d.name+' foto y barra visibles juntas');
  await page.screenshot({path:'test-results/r140-splash-'+d.name+'.png'});
  if(d.slowModules){
   await page.waitForFunction(()=>document.getElementById('pxSplashReference')
    ?.classList.contains('is-ready'),null,{timeout:12000});
   const state=await page.evaluate(()=>{
    const f=document.getElementById('pxSplashReference'),img=f.contentDocument?.getElementById('photo');
    return {visible:getComputedStyle(f).opacity==='1',loaded:img?.naturalWidth>0,
     bars:f.contentDocument?.querySelectorAll('[role=progressbar]').length,
     earlyHidden:getComputedStyle(document.getElementById('pxSplashEarlyUI')).visibility==='hidden'};
   });
   assert.equal(state.visible,true);
   assert.equal(state.loaded,true);
   assert.equal(state.bars,1);
   assert.equal(state.earlyHidden,true);
  }
  await page.waitForFunction(()=>!!window.PLEGADOX_STATE?.(),null,{timeout:22000});
  await page.waitForFunction(()=>document.getElementById('pxTitaniumSplash')?.hidden,
   null,{timeout:16000});
  assert.deepEqual(errors,[],d.name+' sin errores de JS');
  console.log('R140_PREMIUM_IMAGE_AND_BAR_SYNC_'+d.name.toUpperCase()+'_OK');
  await context.close();
 }
}finally{await browser?.close();server.kill();}
