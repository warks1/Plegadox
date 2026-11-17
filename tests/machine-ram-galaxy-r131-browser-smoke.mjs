import assert from 'node:assert/strict';
import {mkdirSync} from 'node:fs';
import {spawn} from 'node:child_process';
import {chromium} from 'playwright';
mkdirSync('test-results',{recursive:true});
const server=spawn('python3',['-m','http.server','4455','--bind','127.0.0.1'],{stdio:'ignore'});
let browser;
try{
 browser=await chromium.launch({headless:true,args:['--no-sandbox']});
 const context=await browser.newContext({
  viewport:{width:1280,height:800},deviceScaleFactor:2.5,
  isMobile:true,hasTouch:true,
  userAgent:'Mozilla/5.0 (Linux; Android 14; SM-X700) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36'});
 const page=await context.newPage(),errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 await page.goto('http://127.0.0.1:4455/',{waitUntil:'networkidle',timeout:45000});
 await page.waitForFunction(()=>typeof window.PLEGADOX_SOLID_RENDER==='function',null,
  {timeout:30000});
 await page.locator('#machineSolidToggle').click();
 await page.waitForFunction(()=>window.PLEGADOX_SOLID_RENDER_STATS().misses>=1,null,
  {timeout:25000});
 const initial=await page.evaluate(()=>({
  frame:window.PLEGADOX_SOLID_RENDER_STATS(),
  details:window.PLEGADOX_SOLID_CACHE_DETAILS(),
  budget:window.PLEGADOX_GRAPHICS_BUDGET()
 }));
 assert.equal(initial.budget.tier,'eco');
 assert.equal(initial.budget.maxCanvasPixels,1200000);
 assert.equal(initial.details.capacity,2);
 const afterSeek=await page.evaluate(()=>{
  window.PLEGADOX_SEEK_PREVIEW({operation:1,fraction:.2});
  const middle=window.PLEGADOX_SOLID_RENDER_STATS();
  window.PLEGADOX_SEEK_PREVIEW({operation:0,fraction:0});
  return {middle,back:window.PLEGADOX_SOLID_RENDER_STATS()};
 });
 assert.ok(afterSeek.middle.misses>initial.frame.misses);
 assert.equal(afterSeek.back.misses,afterSeek.middle.misses,
  'Al volver al golpe ya preparado, Galaxy reutiliza escena CAD');
 assert.ok(afterSeek.back.hits>afterSeek.middle.hits);
 await page.evaluate(()=>{
  document.getElementById('machineRenderQuality').value='high';
  document.getElementById('machineRenderQuality')
   .dispatchEvent(new Event('change',{bubbles:true}));
  const canvas=document.getElementById('machineSolidCanvas');
  canvas.style.width='2300px';canvas.style.height='1250px';
  window.PLEGADOX_SOLID_RENDER_FORCE();
 });
 const pixels=await page.evaluate(async()=>{
  const canvas=document.getElementById('machineSolidCanvas');
  const {canvasRenderSize}=await import('/machine-canvas-memory-r131.js');
  const budget=window.PLEGADOX_GRAPHICS_BUDGET();
  const rect=canvas.getBoundingClientRect();
  const expectedCapped=rect.width*rect.height*
   budget.dpr*budget.dpr>budget.maxCanvasPixels;
  const UHD=canvasRenderSize(3840,2160,2,budget.maxCanvasPixels);
  return {pixels:canvas.width*canvas.height,
   max:budget.maxCanvasPixels,expectedCapped,
   syntheticCap:UHD.capped,syntheticPixels:UHD.pixelCount,
   text:document.getElementById('machineSolidStatus').textContent};
 });
 assert.ok(pixels.pixels<=pixels.max,'Canvas UHD supera el presupuesto de memoria');
 assert.equal(pixels.syntheticCap,true,'La protección también cubre una pantalla 4K real');
 assert.ok(pixels.syntheticPixels<=pixels.max);
 assert.equal(pixels.text.includes('protección memoria'),pixels.expectedCapped,
  'El indicador debe coincidir con los píxeles CSS efectivos, no con un tamaño inline recortado por el layout');
 await page.evaluate(()=>{
  const canvas=document.getElementById('machineSolidCanvas');
  canvas.style.width='';canvas.style.height='';
  document.getElementById('machineRenderQuality').value='eco';
  document.getElementById('machineRenderQuality').dispatchEvent(new Event('change',{bubbles:true}));
  window.PLEGADOX_SOLID_RENDER_FORCE();
 });
 await page.locator('#machineSolidCanvas').screenshot({path:'test-results/r131-galaxy-memoria-eco.png'});
 assert.ok((await page.locator('#machineSolidStatus').textContent()).includes('Sólidos dibujados:'));
 assert.deepEqual(errors,[]);
 console.log('R131_GALAXY_MEMORY_BUDGET_LRU_AND_Y_TILT_OK');
 await context.close();
}finally{await browser?.close();server.kill();}
