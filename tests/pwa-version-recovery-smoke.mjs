import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {chromium} from 'playwright';
const server=spawn('python3',['-m','http.server','4305','--bind','127.0.0.1'],{stdio:'ignore'});
const BUILD='TOPE-20261101-R12';
let browser;
try{
 browser=await chromium.launch({headless:true,args:['--no-sandbox']});
 for(const device of [{name:'PC',width:1440,height:900,mobile:false},
  {name:'iPhone',width:390,height:844,mobile:true}]){
  const context=await browser.newContext({viewport:{width:device.width,height:device.height},
   isMobile:device.mobile,hasTouch:device.mobile});
  const page=await context.newPage(),errors=[];
  page.on('pageerror',error=>errors.push(error.message));
  await page.goto('http://127.0.0.1:4305/?rev='+BUILD,
   {waitUntil:'networkidle',timeout:30000});
  await page.waitForFunction(()=>!!window.PLEGADOX_STATE);
  assert.match(await page.locator('#buildMark').textContent(),new RegExp(BUILD));
  assert.ok(await page.locator('#forceUpdateBtn').isVisible());
  // El usuario puede tener una copia vieja y piezas guardadas localmente.
  await page.locator('[data-tab="programacion"]').click();
  await page.locator('#pieceName').fill('OMEGA PRESERVADA');
  await page.locator('#pieceName').dispatchEvent('change');
  await page.evaluate(async()=>{
   const legacy=await caches.open('plegadox-static-old-legacy');
   await legacy.put('./machine-config.js',new Response('OLD_GAUGE_STILL_REVERSED'));
   localStorage.removeItem('plegadox:verified-loader-build');
  });
  await page.reload({waitUntil:'networkidle'});
  await page.waitForFunction(()=>!!window.PLEGADOX_STATE);
  assert.deepEqual(
   await page.evaluate(async()=>(await caches.keys()).filter(k=>k==='plegadox-static-old-legacy')),
   [],'El arranque nuevo debe vaciar la caché antigua');
  // Verificar las caras reales de la versión cargada, no sólo un texto.
  const read=await page.evaluate(async()=>{
   const {V85_FACTORY,gaugeOutline,gaugeContactFeature}=await import('/machine-config.js');
   const {technicalScene}=await import('/technical-section.js');
   const {gaugePlacement}=await import('/backgauge-placement.js');
   const scene=technicalScene(window.PLEGADOX_STATE().piece,.5);
   const stop=gaugeOutline(V85_FACTORY.stop,1),support=gaugeOutline(V85_FACTORY.support,2);
   return {stop,support,front:gaugeContactFeature(V85_FACTORY.support,2).frontFace,
    placement:gaugePlacement(scene,2),piece:window.PLEGADOX_STATE().piece.name};
  });
  assert.equal(read.stop[4].x,30,'La pestaña baja STOP sobresale a la izquierda');
  assert.equal(read.support[4].x,30,'La pestaña baja SUPPORT sobresale a la izquierda');
  assert.equal(read.front.from.x,read.front.to.x,'Contrahuella vertical');
  assert.ok(read.front.to.y>read.front.from.y,
   'La pared trasera del escalón SUBE, como en el vídeo real');
  assert.equal(read.piece,'OMEGA PRESERVADA','La recuperación no borra la pieza');
  await page.locator('#forceUpdateBtn').click();
  await page.waitForURL(/refresh=/,{timeout:30000});
  await page.waitForFunction(()=>!!window.PLEGADOX_STATE);
  assert.equal(await page.evaluate(()=>window.PLEGADOX_STATE().piece.name),
   'OMEGA PRESERVADA','El botón Actualizar no borra piezas');
  assert.match(await page.locator('#buildMark').textContent(),new RegExp(BUILD));
  assert.deepEqual(errors,[],'Errores de navegador '+device.name);
  await context.close();
 }
 console.log('PWA_VERSION_RECOVERY_OK');
}finally{await browser?.close();server.kill();}
