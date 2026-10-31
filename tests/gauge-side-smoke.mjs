import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {chromium} from 'playwright';

const server=spawn('python3',['-m','http.server','4204','--bind','127.0.0.1'],{stdio:'ignore'});
let browser;
try{
 browser=await chromium.launch({headless:true,args:['--no-sandbox']});
 for(const v of [{name:'desktop',w:1536,h:900,touch:false},
                {name:'mobile',w:390,h:844,touch:true}]){
  const ctx=await browser.newContext({viewport:{width:v.w,height:v.h},
    isMobile:v.touch,hasTouch:v.touch,deviceScaleFactor:1});
  const page=await ctx.newPage(),errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  await page.goto('http://127.0.0.1:4204/',{waitUntil:'networkidle'});
  await page.locator('[data-tab="programacion"]').click();
  await page.locator('#sampleBtn').click();
  assert.equal(await page.locator('.bend-side-select').count(),4);
  assert.equal(await page.locator('.bend-side-select[data-bend="0"]').inputValue(),'before');
  assert.equal(await page.locator('.bend-side-select[data-bend="3"]').inputValue(),'after');
  assert.deepEqual(await page.evaluate(()=>window.PLEGADOX_STATE().piece.order),[0,1,3,2]);
  const initial=await page.evaluate(()=>window.PLEGADOX_STATE().piece.angles);
  await page.locator('[data-tab="simulacion"]').click();
  assert.match(await page.locator('#activeGaugeReference').textContent(),/Ala anterior · 50,0 mm/);
  const a=await page.locator('#machineCanvas').evaluate(c=>c.toDataURL());
  await page.locator('#chooseSideAfter').click();
  const b=await page.locator('#machineCanvas').evaluate(c=>c.toDataURL());
  assert.notEqual(a,b,'Cambiar el lado de apoyo debe invertir la presentación de la chapa');
  assert.match(await page.locator('#activeGaugeReference').textContent(),/Ala siguiente · 50,0 mm/);
  assert.equal(await page.locator('#chooseSideAfter').getAttribute('aria-pressed'),'true');
  await page.locator('#chooseSideBefore').click();
  await page.locator('#timeline').evaluate(input=>{
   input.value='550';input.dispatchEvent(new Event('input',{bubbles:true}));
  });
  assert.match(await page.locator('#activeGaugeReference').textContent(),/Ala siguiente · 50,0 mm/);
  assert.equal(await page.locator('#chooseSideAfter').getAttribute('aria-pressed'),'true');
  await page.locator('#chooseSideBefore').click();
  assert.match(await page.locator('#activeGaugeReference').textContent(),/Ala anterior · 50,0 mm/);
  const newData=await page.evaluate(()=>window.PLEGADOX_STATE().piece);
  assert.deepEqual(newData.angles,initial,'No tocar signos del pliegue');
  assert.deepEqual(newData.order,[0,1,3,2],'Conservar secuencia');
  assert.equal(newData.gaugeSideByBend[3],'before');
  await page.reload({waitUntil:'networkidle'});
  await page.locator('[data-tab="simulacion"]').click();
  await page.locator('#timeline').evaluate(input=>{
   input.value='550';input.dispatchEvent(new Event('input',{bubbles:true}));
  });
  assert.match(await page.locator('#activeGaugeReference').textContent(),/Ala anterior · 50,0 mm/);
  assert.equal(await page.locator('#chooseSideBefore').getAttribute('aria-pressed'),'true');
  assert.deepEqual(errors,[],v.name+': sin excepciones');
  console.log('GAUGE_SIDE_'+v.name.toUpperCase()+'_OK');
  await ctx.close();
 }
}finally{await browser?.close();server.kill();}
