import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {chromium} from 'playwright';

const server=spawn('python3',['-m','http.server','4392','--bind','127.0.0.1'],{stdio:'ignore'});
let browser;
try{
 browser=await chromium.launch({headless:true,args:['--no-sandbox']});
 const devices=[
  {name:'PC',w:1440,h:900,mobile:false},
  {name:'iPhone vertical',w:390,h:844,mobile:true},
  {name:'iPhone horizontal',w:844,h:390,mobile:true},
  {name:'tablet',w:820,h:1180,mobile:true}
 ];
 for(const dev of devices){
  const context=await browser.newContext({
   viewport:{width:dev.w,height:dev.h},isMobile:dev.mobile,
   hasTouch:dev.mobile,deviceScaleFactor:1
  });
  const page=await context.newPage(),errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  // Ralentizar SOLO la prueba, nunca el arranque publicado: permite
  // observar dos fotogramas distintos de la chapa antes de terminar.
  await page.route('**/app.js*',async route=>{
   await new Promise(resolve=>setTimeout(resolve,1350));
   await route.continue();
  });
  await page.goto('http://127.0.0.1:4392/',{waitUntil:'commit',timeout:30000});
  const splash=page.locator('#pxTitaniumSplash');
  await splash.waitFor({state:'visible',timeout:15000});
  assert.match(await splash.textContent(),/02 · TITANIUM/);
  assert.match(await splash.textContent(),/A\.M\.S TECNOLIGICS/);
  assert.match(await splash.textContent(),/© 2026 A\.M\.S TECNOLIGICS/);
  assert.ok(await page.locator('.px-splash-stage animate').count()>0);
  const sheet=page.locator('#pxSplashSheet');
  const ram=page.locator('#pxSplashRam');
  const before=await sheet.getAttribute('d');
  const top=await ram.getAttribute('transform');
  await page.waitForTimeout(730);
  const after=await sheet.getAttribute('d');
  const moved=await ram.getAttribute('transform');
  assert.notEqual(after,before,dev.name+': la chapa debe plegarse, no permanecer estática');
  assert.notEqual(moved,top,dev.name+': el punzón debe moverse');
  const geometry=await page.evaluate(()=>{
   const el=document.querySelector('#pxTitaniumSplash'),svg=document.querySelector('.px-splash-stage');
   const bounds=svg.getBoundingClientRect();
   const logo=document.querySelector('.px-splash-logo').getBoundingClientRect();
   const bar=document.querySelector('.px-splash-load-bar');
   return {scrollWidth:el.scrollWidth,clientWidth:el.clientWidth,
    svgLeft:bounds.left,svgRight:bounds.right,
    logoLeft:logo.left,logoRight:logo.right,
    progress:Number(bar.getAttribute('aria-valuenow'))};
  });
  assert.ok(geometry.scrollWidth<=geometry.clientWidth+2,dev.name+': sin desplazamiento horizontal');
  assert.ok(geometry.svgLeft>=-2&&geometry.svgRight<=dev.w+2,dev.name+': cabina visible');
  assert.ok(geometry.logoLeft>=-2&&geometry.logoRight<=dev.w+2,dev.name+': marca sin recortes');
  assert.ok(geometry.progress>=0&&geometry.progress<100,'No anunciar 100% antes de inicializar');
  await splash.waitFor({state:'hidden',timeout:35000});
  assert.equal(await page.locator('.px-splash-load-bar').getAttribute('aria-valuenow'),'100');
  await page.waitForFunction(()=>!!window.PLEGADOX_STATE(),null,{timeout:30000});
  assert.ok(await page.locator('#machineCanvas').isVisible(),dev.name+': aplicación operativa');
  assert.deepEqual(errors,[],dev.name+': sin fallos JavaScript');
  await context.close();
 }
 console.log('TITANIUM_02_SELECTED_SPLASH_BROWSER_OK');
}finally{await browser?.close();server.kill();}
