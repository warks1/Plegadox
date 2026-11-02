import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {mkdirSync} from 'node:fs';
import {chromium} from 'playwright';

mkdirSync('test-results',{recursive:true});
const server=spawn('python3',['-m','http.server','4323','--bind','127.0.0.1'],{stdio:'ignore'});
let browser;
try{
 browser=await chromium.launch({headless:true,args:['--no-sandbox']});
 for(const device of [
  {name:'pc',w:1440,h:900,mobile:false},
  {name:'mobile',w:390,h:844,mobile:true}
 ]){
  const context=await browser.newContext({viewport:{width:device.w,height:device.h},
   isMobile:device.mobile,hasTouch:device.mobile});
  const page=await context.newPage(),errors=[];
  page.on('pageerror',err=>errors.push(err.message));
  await page.goto('http://127.0.0.1:4323/',{waitUntil:'networkidle',timeout:30000});
  const state=()=>page.evaluate(()=>({
   playing:window.PLEGADOX_STATE().sim.playing,
   time:window.PLEGADOX_STATE().sim.time,
   error:window.PLEGADOX_STATE().sim.error,
   order:window.PLEGADOX_STATE().piece.order,
   angles:window.PLEGADOX_STATE().piece.angles
  }));
  await page.locator('#playBtn').click();
  assert.equal((await state()).playing,true,'Play debe iniciar');
  assert.equal(await page.locator('#topPlayBtn').getAttribute('aria-pressed'),'true');
  await page.waitForFunction(()=>window.PLEGADOX_STATE().sim.time>.18,null,{timeout:4000});
  await page.locator('#topPlayBtn').click();
  const stopped=await state();
  assert.equal(stopped.playing,false,'Play de cabecera debe pausar');
  await page.waitForTimeout(150);
  assert.equal((await state()).time,stopped.time,'Pausa no puede avanzar fotogramas');
  await page.locator('#restartBtn').click();
  assert.equal((await state()).time,0,'Reiniciar vuelve a la chapa plana');
  // Validar transición G1 -> G2 de omega 1,2,4,3 en reproducción real.
  await page.evaluate(()=>{
   const s=window.PLEGADOX_STATE().sim;
   s.playing=false;s.time=4.94;s.last=null;
  });
  await page.locator('#playBtn').click();
  await page.waitForFunction(()=>window.PLEGADOX_STATE().sim.time>5.08,null,{timeout:4000});
  const next=await page.evaluate(async()=>{
   const {stage}=await import('/engine.js');
   const {piece,sim}=window.PLEGADOX_STATE();
   const st=stage(piece,sim.time);
   return {activeOperation:st.activeOperation,activeBend:st.activeBend,
    negative:piece.angles[st.activeBend],order:piece.order,playing:sim.playing};
  });
  assert.equal(next.activeOperation,1);
  assert.equal(next.activeBend,1);
  assert.equal(next.negative,-90,'El segundo pliegue debe conservar su signo');
  assert.deepEqual(next.order,[0,1,3,2]);
  assert.equal(next.playing,true,'No debe detenerse entre golpes');
  await page.locator('#pauseBtn').click();
  // No se bloquea en la última etapa: vuelve al comienzo y continúa.
  await page.evaluate(()=>{
   const {piece,sim}=window.PLEGADOX_STATE();
   sim.time=piece.order.length*5-.03;sim.last=null;sim.playing=false;
  });
  await page.locator('#topPlayBtn').click();
  await page.waitForFunction(()=>{
   const s=window.PLEGADOX_STATE().sim;return s.time>.02&&s.time<1.5&&s.playing;
  },null,{timeout:4000});
  await page.locator('#pauseBtn').click();
  assert.equal((await state()).error,null,'Sin error en motor de reproducción');

  // No conservar la selección gráfica iniciada para la pieza anterior.
  await page.locator('[data-tab="programacion"]').click();
  await page.locator('#sampleBtn').click();
  await page.locator('#touchProgramOrderBtn').click();
  await page.locator('#touchProgramSvg [data-bend="0"]').click();
  assert.equal(await page.locator('#touchProgramOrderBtn').getAttribute('aria-pressed'),'true');
  await page.locator('#newBtn').click();
  assert.equal(await page.locator('#touchProgramOrderBtn').getAttribute('aria-pressed'),'false');
  assert.match(await page.locator('#touchProgramStatus').textContent(),/reiniciada/i);
  assert.deepEqual(errors,[],device.name+': sin errores JavaScript');
  await page.screenshot({path:'test-results/reproduccion-r26-'+device.name+'.png'});
  await context.close();
 }
 console.log('R26_PLAY_CONTINUITY_AND_ORDER_RESET_OK');
}finally{await browser?.close();server.kill();}
