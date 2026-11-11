import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {mkdirSync} from 'node:fs';
import {chromium} from 'playwright';

mkdirSync('test-results',{recursive:true});
const server=spawn('python3',['-m','http.server','4392','--bind','127.0.0.1'],{stdio:'ignore'});
let browser;
try{
 browser=await chromium.launch({headless:true,args:['--no-sandbox']});
 const devices=[
  {name:'PC',slug:'pc',w:1440,h:900,mobile:false},
  {name:'iPhone vertical',slug:'iphone-vertical',w:390,h:844,mobile:true},
  {name:'iPhone horizontal',slug:'iphone-horizontal',w:844,h:390,mobile:true},
  {name:'tablet',slug:'tablet',w:820,h:1180,mobile:true}
 ];
 for(const dev of devices){
  const context=await browser.newContext({
   viewport:{width:dev.w,height:dev.h},isMobile:dev.mobile,
   hasTouch:dev.mobile,deviceScaleFactor:1
  });
  const page=await context.newPage(),errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  // Se retiene app.js SOLO durante la prueba para observar el ciclo de la
  // referencia ORIGINAL antes de que termine la inicialización real.
  await page.route('**/app.js*',async route=>{
   await new Promise(resolve=>setTimeout(resolve,3700));
   await route.continue();
  });
  await page.goto('http://127.0.0.1:4392/',{waitUntil:'commit',timeout:30000});
  const splash=page.locator('#pxTitaniumSplash');
  await splash.waitFor({state:'visible',timeout:15000});
  const original=page.frameLocator('#pxSplashReference');
  const sheet=original.locator('#sheetFront'),ram=original.locator('#punchGroup');
  await sheet.waitFor({state:'attached',timeout:15000});
  assert.match(await original.locator('.version').textContent(),/02 · TITANIUM/);
  assert.match(await original.locator('.company').textContent(),/A\.M\.S TECNOLIGICS/);
  assert.match(await original.locator('.brand').textContent(),/PLEGADOX/);
  assert.match(await original.locator('.copyright').textContent(),/A\.M\.S Tecnoligics/);
  const before=await sheet.getAttribute('d'),ramBefore=await ram.getAttribute('transform');
  await page.waitForTimeout(1900);
  const after=await sheet.getAttribute('d'),ramAfter=await ram.getAttribute('transform');
  assert.notEqual(after,before,dev.name+': la chapa se pliega de forma real, no imagen estática');
  assert.notEqual(ramAfter,ramBefore,dev.name+': el punzón se mueve');
  await page.screenshot({path:'test-results/titanium-original-'+dev.slug+'.png'});
  const geometry=await page.evaluate(()=>{
   const frame=document.getElementById('pxSplashReference');
   const doc=frame.contentDocument;
   const bounds=doc.querySelector('.machineFrame').getBoundingClientRect();
   const logo=doc.querySelector('.brand').getBoundingClientRect();
   const bar=doc.getElementById('progressArea');
   return {scrollWidth:doc.documentElement.scrollWidth,
    clientWidth:doc.documentElement.clientWidth,
    machineLeft:bounds.left,machineRight:bounds.right,
    logoLeft:logo.left,logoRight:logo.right,
    progress:Number(bar.getAttribute('aria-valuenow')),
    replay:!!doc.getElementById('replay'),source:doc.title};
  });
  assert.ok(geometry.scrollWidth<=geometry.clientWidth+2,
   dev.name+': sin desplazamiento horizontal ni contenido oculto');
  assert.ok(geometry.machineLeft>=-2&&geometry.machineRight<=dev.w+2,
   dev.name+': máquina completa en pantalla');
  assert.ok(geometry.logoLeft>=-2&&geometry.logoRight<=dev.w+2,
   dev.name+': logotipo sin recortes');
  assert.equal(geometry.progress<100,true,'La barra no debe indicar listo antes de que termine la carga real');
  assert.equal(geometry.replay,true,'Mantener todos los elementos de la referencia aprobada');
  assert.match(geometry.source,/TITANIUM/);
  await splash.waitFor({state:'hidden',timeout:35000});
  assert.equal(await original.locator('#progressArea').getAttribute('aria-valuenow'),'100');
  await page.waitForFunction(()=>!!window.PLEGADOX_STATE?.(),null,{timeout:30000});
  assert.ok(await page.locator('#machineCanvas').isVisible(),dev.name+': app operativa');
  assert.deepEqual(errors,[],dev.name+': sin fallos JS');
  await context.close();
 }
 console.log('TITANIUM_ORIGINAL_SCREEN_R33_BROWSER_OK');
}finally{await browser?.close();server.kill();}
