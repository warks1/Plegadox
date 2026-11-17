import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {mkdirSync} from 'node:fs';
import {chromium} from 'playwright';

mkdirSync('test-results',{recursive:true});
const server=spawn('python3',['-m','http.server','4449','--bind','127.0.0.1'],{stdio:'ignore'});
let browser;
try{
 browser=await chromium.launch({headless:true,args:['--no-sandbox']});
 for(const target of [
  {id:'galaxy',w:1280,h:800,dpr:2.5,mobile:true,
   agent:'Mozilla/5.0 (Linux; Android 14; SM-X700) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36'},
  {id:'pc',w:1440,h:900,dpr:1,mobile:false,
   agent:'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36'}
 ]){
  const context=await browser.newContext({viewport:{width:target.w,height:target.h},
   deviceScaleFactor:target.dpr,isMobile:target.mobile,hasTouch:target.mobile,
   userAgent:target.agent});
  const page=await context.newPage(),errors=[];
  // El runner CI puede exponer 2 CPU incluso con una resolución de PC.
  // Emular hardware de escritorio potente para el caso equilibrado.
  if(target.id==='pc')await page.addInitScript(()=>{
   Object.defineProperty(navigator,'hardwareConcurrency',{configurable:true,get:()=>12});
   Object.defineProperty(navigator,'deviceMemory',{configurable:true,get:()=>16});
  });
  page.on('pageerror',err=>errors.push(err.message));
  await page.goto('http://127.0.0.1:4449/',{waitUntil:'networkidle',timeout:40000});
  await page.waitForFunction(()=>typeof window.PLEGADOX_SOLID_RENDER==='function',
   null,{timeout:30000});
  const before=await page.evaluate(()=>JSON.stringify(window.PLEGADOX_STATE().piece));
  const budget=await page.evaluate(()=>window.PLEGADOX_GRAPHICS_BUDGET());
  assert.equal(budget.tier,target.id==='galaxy'?'eco':'balanced');
  await page.locator('#machineSolidToggle').click();
  await page.waitForFunction(()=>document.querySelector('#machineSolidStatus')
   .textContent.startsWith('Sólidos dibujados:'),null,{timeout:20000});
  assert.equal(await page.locator('#machineSolidToggle').getAttribute('aria-pressed'),'true');
  assert.equal(await page.locator('#machineSolidCanvas').isVisible(),true);
  assert.ok((await page.locator('#machineSolidStatus').textContent()).includes('No habilita aprobación'));
  await page.locator('#machineSolidCanvas').screenshot({
   path:'test-results/r125-solids-'+target.id+'-initial.png'});
  const beforePng=await page.locator('#machineSolidCanvas').screenshot();
  const box=await page.locator('#machineSolidCanvas').boundingBox();
  const x=box.x+box.width*.5,y=box.y+box.height*.55;
  await page.mouse.move(x,y);
  await page.mouse.down();await page.mouse.move(x+90,y-34,{steps:4});await page.mouse.up();
  const afterPng=await page.locator('#machineSolidCanvas').screenshot();
  assert.ok(!beforePng.equals(afterPng),'Orbitar debe cambiar los píxeles, '+target.id);
  await page.locator('#machineOptionsButton').click();
  await page.locator('#machineRenderQuality').selectOption('eco');
  assert.equal(await page.evaluate(()=>window.PLEGADOX_GRAPHICS_BUDGET().dpr),1);
  await page.locator('#machineRenderQuality').selectOption('high');
  assert.equal(await page.evaluate(()=>window.PLEGADOX_GRAPHICS_BUDGET().tier),'high');
  await page.locator('#machineSolidReset').click();
  await page.locator('#machineSolidCanvas').screenshot({
   path:'test-results/r125-solids-'+target.id+'-high.png'});
  await page.locator('#machineSolidToggle').click();
  assert.equal(await page.locator('#machineSolidToggle').getAttribute('aria-pressed'),'false');
  assert.equal(await page.locator('#machineSolidCanvas').isVisible(),false);
  assert.equal(await page.evaluate(()=>JSON.stringify(window.PLEGADOX_STATE().piece)),before);
  const dims=await page.evaluate(()=>({
   scroll:document.documentElement.scrollWidth,width:window.innerWidth
  }));
  assert.ok(dims.scroll<=dims.width+2,'Desbordamiento horizontal '+JSON.stringify(dims));
  assert.deepEqual(errors,[],'Errores de navegador '+target.id);
  console.log('R125_SOLIDS_'+target.id.toUpperCase()+'_OK');
  await context.close();
 }
}finally{
 await browser?.close();
 server.kill();
}
