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
  await view.locator('#machineArt').waitFor({state:'visible',timeout:15000});
  await page.waitForFunction(()=>{
   const img=document.querySelector('#pxSplashReference')?.contentDocument?.getElementById('machineArt');
   return !!img&&img.complete&&img.naturalWidth>0;
  },null,{timeout:20000});
  const info=await page.evaluate(()=>{
   const iframe=document.querySelector('#pxSplashReference'),doc=iframe.contentDocument;
   const box=id=>{const b=doc.getElementById(id).getBoundingClientRect();
    return {left:b.left,top:b.top,right:b.right,bottom:b.bottom,width:b.width,height:b.height};
   };
   const img=doc.getElementById('machineArt'),screen=box('screen');
   return {screen,art:box('machineArt'),brand:box('brand'),dock:box('dock'),
    progress:box('progress'),features:doc.querySelectorAll('.feature').length,
    progressValue:Number(doc.getElementById('progress').getAttribute('aria-valuenow')),
    progressBars:doc.querySelectorAll('[role=progressbar]').length,
    horizontalScroll:doc.documentElement.scrollWidth>doc.documentElement.clientWidth+2,
    loaded:img.complete,title:doc.title};
  });
  assert.equal(info.progressBars,1,device.name+': una sola barra real');
  assert.equal(info.features,6,device.name+': seis funciones visibles');
  assert.ok(info.loaded,device.name+': SVG ensamblado cargado');
  assert.ok(Math.abs(info.screen.width-device.w)<2,device.name+': splash ocupa todo el ancho');
  assert.ok(Math.abs(info.screen.height-device.h)<2,device.name+': splash ocupa todo el alto');
  assert.equal(info.horizontalScroll,false,device.name+': sin scroll horizontal');
  assert.ok(info.art.left>=-2&&info.art.right<=device.w+2,device.name+': máquina no recortada');
  assert.ok(info.art.top>=-2&&info.art.bottom<=device.h+2,device.name+': máquina no cortada');
  assert.ok(info.dock.top>=info.art.top,device.name+': progreso fuera del arte, sin tapar punzón');
  assert.ok(info.progressValue>=0&&info.progressValue<100,device.name+': sin progreso ficticio 78 %');
  assert.match(info.title,/Pantalla Titanium Industrial Premium/);
  await page.screenshot({path:'test-results/titanium-industrial-r52-'+device.slug+'.png'});
  await splash.waitFor({state:'hidden',timeout:35000});
  assert.equal(await view.locator('#progress').getAttribute('aria-valuenow'),'100');
  await page.waitForFunction(()=>!!window.PLEGADOX_STATE?.(),null,{timeout:30000});
  assert.equal(await page.locator('#machineCanvas').isVisible(),true,device.name+': app operativa');
  assert.deepEqual(errors,[],device.name+': sin errores JavaScript');
  await context.close();
 }
 console.log('TITANIUM_R52_ASSEMBLY_RESPONSIVE_BROWSER_OK');
}finally{await browser?.close();server.kill();}
