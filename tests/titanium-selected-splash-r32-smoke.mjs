import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {mkdirSync} from 'node:fs';
import {chromium} from 'playwright';
mkdirSync('test-results',{recursive:true});
const server=spawn('python3',['-m','http.server','4392','--bind','127.0.0.1'],{stdio:'ignore'});
let browser;
try{
 browser=await chromium.launch({headless:true,args:['--no-sandbox']});
 for(const device of [
  {name:'PC',slug:'pc',w:1440,h:900,mobile:false},
  {name:'iPhone vertical',slug:'iphone-vertical',w:390,h:844,mobile:true},
  {name:'iPhone horizontal',slug:'iphone-horizontal',w:844,h:390,mobile:true},
  {name:'tablet',slug:'tablet',w:820,h:1180,mobile:true}
 ]){
  const context=await browser.newContext({viewport:{width:device.w,height:device.h},
   isMobile:device.mobile,hasTouch:device.mobile,deviceScaleFactor:1});
  const page=await context.newPage(),errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  // Demorar el motor SOLO en esta prueba: suficiente para inspeccionar
  // la foto original antes del cierre de la pantalla.
  await page.route('**/app.js*',async route=>{
   await new Promise(resolve=>setTimeout(resolve,1700));
   await route.continue();
  });
  await page.goto('http://127.0.0.1:4392/',{waitUntil:'commit',timeout:30000});
  const splash=page.locator('#pxTitaniumSplash');
  await splash.waitFor({state:'visible',timeout:15000});
  const view=page.frameLocator('#pxSplashReference');
  await view.locator('#photo').waitFor({state:'visible',timeout:15000});
  await page.waitForFunction(()=>{
   const img=document.querySelector('#pxSplashReference')?.contentDocument?.getElementById('photo');
   return img?.complete&&img.naturalWidth===1672&&img.naturalHeight===941;
  },null,{timeout:20000});
  const info=await page.evaluate(()=>{
   const iframe=document.querySelector('#pxSplashReference');
   const doc=iframe.contentDocument;
   const photo=doc.querySelector('#photo'),screen=doc.querySelector('#screen');
   const p=photo.getBoundingClientRect(),s=screen.getBoundingClientRect();
   const bar=doc.querySelector('#progress');
   return {width:photo.naturalWidth,height:photo.naturalHeight,
    ratio:p.width/p.height,screenRatio:s.width/s.height,
    entire:p.left>=-1&&p.right<=innerWidth+1&&p.top>=-1&&p.bottom<=innerHeight+1,
    horizontalScroll:doc.documentElement.scrollWidth>doc.documentElement.clientWidth+2,
    progress:Number(bar.getAttribute('aria-valuenow')),
    title:doc.title,loaded:photo.complete};
  });
  assert.deepEqual([info.width,info.height],[1672,941]);
  assert.ok(info.loaded&&info.entire,device.name+': fotografía completa, sin cortes');
  assert.ok(Math.abs(info.ratio-1672/941)<.005,device.name+': sin deformar foto');
  assert.equal(info.horizontalScroll,false,device.name+': no se desplaza a los lados');
  assert.ok(info.progress>=0&&info.progress<100,'No anunciar 100% antes de terminar');
  assert.match(info.title,/Boceto 1 premium seleccionado/);
  await page.screenshot({path:'test-results/boceto1-premium-'+device.slug+'.png'});
  await splash.waitFor({state:'hidden',timeout:35000});
  assert.equal(await view.locator('#progress').getAttribute('aria-valuenow'),'100');
  await page.waitForFunction(()=>!!window.PLEGADOX_STATE?.(),null,{timeout:30000});
  assert.equal(await page.locator('#machineCanvas').isVisible(),true,device.name+': app operativa');
  assert.deepEqual(errors,[],device.name+': sin errores de JavaScript');
  await context.close();
 }
 console.log('BOCETO1_PREMIUM_EXACT_PHOTO_BROWSER_OK');
}finally{await browser?.close();server.kill();}
