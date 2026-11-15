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
  await page.route('**/app.js*',async route=>{
   await new Promise(resolve=>setTimeout(resolve,1700));await route.continue();
  });
  await page.goto('http://127.0.0.1:4392/',{waitUntil:'commit',timeout:30000});
  const splash=page.locator('#pxTitaniumSplash');
  await splash.waitFor({state:'visible',timeout:15000});
  const view=page.frameLocator('#pxSplashReference');
  await view.locator('#photo').waitFor({state:'visible',timeout:15000});
  await page.waitForFunction(()=>{
   const img=document.querySelector('#pxSplashReference')?.contentDocument?.getElementById('photo');
   return !!img&&img.complete&&img.naturalWidth===1672;
  },null,{timeout:20000});
  const info=await page.evaluate(()=>{
   const doc=document.getElementById('pxSplashReference').contentDocument;
   const bounds=id=>{const b=doc.getElementById(id).getBoundingClientRect();return {
    left:b.left,right:b.right,top:b.top,bottom:b.bottom,width:b.width,height:b.height};};
   return {photo:bounds('photo'),screen:bounds('screen'),progress:bounds('progress'),
    bars:doc.querySelectorAll('[role=progressbar]').length,
    src:doc.getElementById('photo').getAttribute('src'),
    percent:Number(doc.getElementById('progress').getAttribute('aria-valuenow')),
    scroll:doc.documentElement.scrollWidth>doc.documentElement.clientWidth+2};
  });
  assert.equal(info.src,'./plegadox-premium-selected.png',device.name+': no cambiar el boceto');
  assert.equal(info.bars,1);
  assert.equal(info.scroll,false);
  assert.ok(info.screen.left>=-2&&info.screen.right<=device.w+2);
  assert.ok(info.screen.top>=-2&&info.screen.bottom<=device.h+2);
  assert.ok(info.percent>=0&&info.percent<100);
  await page.screenshot({path:'test-results/boceto1-aprobado-r68-'+device.slug+'.png'});
  await splash.waitFor({state:'hidden',timeout:35000});
  assert.equal(await view.locator('#progress').getAttribute('aria-valuenow'),'100');
  await page.waitForFunction(()=>!!window.PLEGADOX_STATE?.(),null,{timeout:30000});
  assert.equal(await page.locator('#machineCanvas').isVisible(),true);
  assert.deepEqual(errors,[],device.name+': sin errores JS');
  await context.close();
 }
 console.log('BOCETO1_ORIGINAL_INICIO_OK');
}finally{await browser?.close();server.kill();}
