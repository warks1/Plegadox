import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {chromium} from 'playwright';

const server=spawn('python3',['-m','http.server','4211','--bind','127.0.0.1'],{stdio:'ignore'});
let browser;
try{
 browser=await chromium.launch({headless:true,args:['--no-sandbox']});
 for(const viewport of [{width:1536,height:900},{width:390,height:844}]){
  const context=await browser.newContext({viewport,isMobile:viewport.width<500,hasTouch:viewport.width<500});
  const page=await context.newPage(),errors=[];
  page.on('pageerror',error=>errors.push(error.message));
  await page.goto('http://127.0.0.1:4211/',{waitUntil:'networkidle'});
  await page.locator('[data-tab="simulacion"]').click();
  await page.evaluate(()=>{
   const s=window.PLEGADOX_STATE();s.sim.time=16.8;s.sim.playing=false;
   window.PLEGADOX_REDRAW();
  });
  // Por defecto el vídeo debe AVANZAR aunque el 2D provisional avise.
  assert.equal(await page.locator('#pauseOnPenetration').isChecked(),false);
  await page.locator('#playBtn').click();
  await page.waitForFunction(()=>window.PLEGADOX_STATE().sim.time>17.6,null,{timeout:7000});
  const continuous=await page.evaluate(()=>window.PLEGADOX_STATE().sim);
  assert.equal(continuous.playing,true,'No se para automáticamente en la vista previa');
  assert.equal(continuous.blocked,null);
  await page.locator('#pauseBtn').click();
  // El operario puede activar manualmente la antigua pausa conservadora.
  await page.locator('#pauseOnPenetration').check();
  assert.match(await page.locator('#playbackModeNote').textContent(),/Pausa diagnóstica activa/);
  await page.evaluate(()=>{
   const s=window.PLEGADOX_STATE();s.sim.time=16.8;s.sim.playing=false;
   window.PLEGADOX_REDRAW();
  });
  await page.locator('#playBtn').click();
  await page.waitForFunction(()=>Boolean(window.PLEGADOX_STATE().sim.blocked),null,{timeout:7000});
  const info=await page.evaluate(()=>window.PLEGADOX_STATE());
  assert.equal(info.sim.playing,false);
  assert.equal(info.sim.blocked.category,'penetration');
  assert.equal(info.sim.blocked.kind,'punch');
  assert.deepEqual(info.piece.order,[0,1,3,2]);
  assert.deepEqual(info.piece.angles,[90,-90,-90,90]);
  assert.equal(info.piece.gaugeSideByBend[3],'after');
  assert.match(await page.locator('#simStatus').textContent(),/DETENIDO/);
  assert.match(await page.locator('#collisionDetails').textContent(),/Reproducción detenida ANTES/);
  await page.locator('#timeline').evaluate(input=>{
   input.value='0';input.dispatchEvent(new Event('input',{bubbles:true}));
  });
  assert.equal((await page.evaluate(()=>window.PLEGADOX_STATE().sim.blocked)),null,
   'Mover manualmente el cursor elimina el aviso obsoleto');
  assert.match(await page.locator('#activeGaugeReference').textContent(),/50,0 mm/);
  // Desactivar la pausa permite completar, reiniciar y repetir la secuencia.
  await page.locator('#pauseOnPenetration').uncheck();
  await page.evaluate(()=>{
   const s=window.PLEGADOX_STATE();
   s.sim.playing=false;s.sim.time=s.piece.order.length*5-.2;s.sim.blocked=null;
   window.PLEGADOX_REDRAW();
  });
  await page.locator('#playBtn').click();
  await page.waitForFunction(()=>{
   const s=window.PLEGADOX_STATE();
   return s.sim.time<1&&s.sim.playing;
  },null,{timeout:5000});
  await page.locator('#pauseBtn').click();
  assert.deepEqual(errors,[], 'sin excepciones en navegador');
  console.log('PUNZON_GUARD_'+viewport.width+'PX_OK');
  await context.close();
 }
}finally{await browser?.close();server.kill();}
