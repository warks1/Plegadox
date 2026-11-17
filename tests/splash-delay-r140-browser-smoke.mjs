import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {mkdirSync} from 'node:fs';
import {chromium} from 'playwright';

const port=4498;
const wait=ms=>new Promise(resolve=>setTimeout(resolve,ms));
const gate=()=>{let release;const promise=new Promise(resolve=>{release=resolve;});
 return {promise,release};};
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
  const photoGate=gate(),frameGate=gate();
  await page.route('**/plegadox-premium-selected.png',async route=>{
   await photoGate.promise;await route.continue();
  });
  await page.route('**/splash-foto-premium.html',async route=>{
   await frameGate.promise;await route.continue();
  });
  if(d.slowModules)await page.route('**/app.js*',async route=>{
   await wait(5500);await route.continue();
  });
  try{
   await page.goto('http://127.0.0.1:'+port+'/index.html',{waitUntil:'commit',timeout:30000});
   await page.waitForFunction(()=>!!document.getElementById('pxSplashEarlyProgress'),null,{timeout:12000});
   // Capturar el estado por mutación, no por temporizadores dependientes de la CPU.
   await page.evaluate(()=>{
    const splash=document.getElementById('pxTitaniumSplash');
    const photo=document.getElementById('pxSplashImmediate');
    const bar=document.getElementById('pxSplashEarlyUI');
    const frame=document.getElementById('pxSplashReference');
    window.__r140Transitions=[];
    const observe=()=>{
     window.__r140Transitions.push({
      ready:splash.classList.contains('is-photo-ready'),
      photo:getComputedStyle(photo).visibility==='visible',
      bar:getComputedStyle(bar).visibility==='visible',
      frame:getComputedStyle(frame).opacity==='1',
      complete:splash.classList.contains('is-complete')
     });
    };
    new MutationObserver(observe).observe(splash,{attributes:true,attributeFilter:['class']});
    observe();
   });
   if(!d.slowModules){
    // Los módulos terminan deliberadamente mientras la foto está BLOQUEADA.
    await page.waitForFunction(()=>typeof window.PLEGADOX_STATE==='function',
     null,{timeout:25000});
   }else await wait(300);
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
   assert.equal(before.loaded,false,d.name+' la imagen sigue bloqueada');
   assert.equal(before.photo,false,d.name+' no mostrar foto no descargada');
   assert.equal(before.bar,false,d.name+' no mostrar barra aislada');
   assert.equal(before.frame,false,d.name+' iframe sin foto oculto');
   assert.equal(before.closed,false,d.name+' no cerrar mientras falta el PNG');

   photoGate.release();
   await page.waitForFunction(()=>window.__r140Transitions?.some(
    s=>s.ready&&s.photo&&s.bar&&!s.complete),null,{timeout:18000});
   assert.ok(await page.evaluate(()=>window.__r140Transitions.some(
    s=>s.ready&&s.photo&&s.bar&&!s.complete)),
    d.name+' foto y barra aparecieron en el mismo estado visual');

   if(d.slowModules){
    await page.screenshot({path:'test-results/r140-splash-'+d.name+'.png'});
    frameGate.release();
    await page.waitForFunction(()=>document.getElementById('pxSplashReference')
     ?.classList.contains('is-ready'),null,{timeout:14000});
    const actual=await page.evaluate(()=>{
     const frame=document.getElementById('pxSplashReference');
     const img=frame.contentDocument?.getElementById('photo');
     return {visible:getComputedStyle(frame).opacity==='1',
      image:img?.naturalWidth>0,
      bars:frame.contentDocument?.querySelectorAll('[role=progressbar]').length,
      earlyHidden:getComputedStyle(document.getElementById('pxSplashEarlyUI')).visibility==='hidden'};
    });
    assert.equal(actual.visible,true,d.name+' iframe terminado visible');
    assert.equal(actual.image,true,d.name+' fotografía del iframe decodificada');
    assert.equal(actual.bars,1,d.name+' sólo una barra definitiva');
    assert.equal(actual.earlyHidden,true,d.name+' ocultar barra inicial al revelar iframe');
   }else frameGate.release();
   await page.waitForFunction(()=>!!window.PLEGADOX_STATE?.(),null,{timeout:20000});
   await page.waitForFunction(()=>document.getElementById('pxTitaniumSplash')?.hidden,
    null,{timeout:20000});
   assert.deepEqual(errors,[],d.name+' sin errores JS');
   console.log('R140_PREMIUM_SPLASH_ATOMIC_'+d.name.toUpperCase()+'_OK');
  }finally{
   photoGate.release();
   frameGate.release();
   await context.close();
  }
 }
}finally{
 await browser?.close();
 server.kill();
}
