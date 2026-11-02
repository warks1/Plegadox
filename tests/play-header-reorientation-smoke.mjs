import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {chromium} from 'playwright';
import {mkdirSync} from 'node:fs';
mkdirSync('test-results',{recursive:true});
const server=spawn('python3',['-m','http.server','4371','--bind','127.0.0.1'],{stdio:'ignore'});
let browser;
try{
 browser=await chromium.launch({headless:true,args:['--no-sandbox']});
 for(const dev of [{name:'pc',w:1440,h:900,mobile:false},
  {name:'iphone',w:390,h:844,mobile:true}]){
  const context=await browser.newContext({viewport:{width:dev.w,height:dev.h},
   hasTouch:dev.mobile,isMobile:dev.mobile});
  const page=await context.newPage(),errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  await page.goto('http://127.0.0.1:4371/',{waitUntil:'networkidle',timeout:30000});
  await page.waitForFunction(()=>Boolean(window.PLEGADOX_STATE));
  const green=page.locator('#topPlayBtn');
  assert.ok(await green.isVisible());
  assert.equal(await green.getAttribute('aria-pressed'),'false');
  const before=await page.evaluate(()=>window.PLEGADOX_STATE().sim.time);
  await green.click();
  assert.equal(await green.getAttribute('aria-pressed'),'true');
  assert.equal(await green.textContent(),'Ⅱ');
  await page.waitForTimeout(320);
  const running=await page.evaluate(()=>({
   time:window.PLEGADOX_STATE().sim.time,
   playing:window.PLEGADOX_STATE().sim.playing}));
  assert.ok(running.playing&&running.time>before+.05,
   'El Play VERDE de cabecera debe mover la simulación, no sólo cambiar el icono');
  await green.click();
  assert.equal(await green.getAttribute('aria-pressed'),'false');
  assert.equal(await page.evaluate(()=>window.PLEGADOX_STATE().sim.playing),false);
  const stopped=await page.evaluate(()=>window.PLEGADOX_STATE().sim.time);
  await page.waitForTimeout(125);
  assert.equal(await page.evaluate(()=>window.PLEGADOX_STATE().sim.time),stopped,
   'Pausar desde la cabecera debe detener el tiempo');
  await page.locator('#playBtn').click();
  assert.equal(await green.getAttribute('aria-pressed'),'true',
   'Play inferior y superior comparten el mismo estado');
  await page.locator('#pauseBtn').click();
  assert.equal(await green.getAttribute('aria-pressed'),'false',
   'Pausa inferior debe actualizar cabecera');
  // Selección real del vídeo: primer golpe por ala siguiente y segundo
  // por la anterior, a la vez que cambia el signo a -90.
  await page.locator('[data-tab="simulacion"]').click();
  await page.locator('#timeline').evaluate(input=>{
   input.value='230';input.dispatchEvent(new Event('input',{bubbles:true}));
  });
  await page.locator('#chooseSideAfter').click();
  await page.locator('#timeline').evaluate(input=>{
   input.value='395';input.dispatchEvent(new Event('input',{bubbles:true}));
  });
  const mid=await page.evaluate(async()=>{
   const {technicalScene}=await import('/technical-section.js');
   const state=window.PLEGADOX_STATE();
   const scene=technicalScene(state.piece,4.6);
   const xs=scene.presentation.points.map(p=>p.x);
   const ys=scene.presentation.points.map(p=>p.y);
   return {spanX:Math.max(...xs)-Math.min(...xs),
    spanY:Math.max(...ys)-Math.min(...ys),
    sides:state.piece.gaugeSideByBend,
    angles:state.piece.angles,order:state.piece.order};
  });
  assert.ok(mid.spanX>10&&mid.spanY>10,'La pieza no debe colapsar en el volteo '+JSON.stringify(mid));
  assert.deepEqual(mid.angles,[90,-90,-90,90]);
  assert.deepEqual(mid.order,[0,1,3,2]);
  await green.click();
  await page.waitForTimeout(1250);
  assert.equal(await page.evaluate(()=>window.PLEGADOX_STATE().sim.playing),true,
   'La reproducción debe seguir durante el cambio de golpe');
  assert.deepEqual(errors,[],'Errores de navegador '+dev.name);
  await green.click();
  await page.screenshot({path:'test-results/play-header-volteo-'+dev.name+'.png',fullPage:false});
  await context.close();
  console.log('HEADER_PLAY_REORIENTATION_OK '+dev.name);
 }
}finally{await browser?.close();server.kill();}
