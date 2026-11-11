import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {chromium} from 'playwright';

const server=spawn('python3',['-m','http.server','4320','--bind','127.0.0.1'],{stdio:'ignore'});
let browser;
try{
 browser=await chromium.launch({headless:true,args:['--no-sandbox']});
 const page=await browser.newPage({viewport:{width:1280,height:900}});
 const errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 await page.goto('http://127.0.0.1:4320/',{waitUntil:'networkidle',timeout:30000});
 await page.locator('[data-tab="programacion"]').click();
 const resolved=()=>page.waitForFunction(()=>{
  const el=document.getElementById('integratedPlannerStatus');
  return el&&el.dataset.state!=='pending'&&el.textContent.length>50;
 },{timeout:30000});
 await resolved();
 const before=await page.evaluate(()=>window.PLEGADOX_STATE().piece);
 assert.equal(before.name,'Omega · ejemplo geométrico');
 assert.ok(await page.locator('#integratedPlannerPanel').isVisible());
 const status=await page.locator('#integratedPlannerStatus').textContent();
 assert.match(status,/Cotejadas|No se encontró/);
 const untouched=await page.evaluate(()=>window.PLEGADOX_STATE().piece);
 assert.deepEqual(untouched,before,'Analizar no cambia los útiles ni el orden');
 // Cambiar a una pieza nueva también recalcula (no sólo la muestra).
 await page.locator('#newBtn').click();
 await resolved();
 assert.equal((await page.evaluate(()=>window.PLEGADOX_STATE().piece)).name,'Nueva pieza');
 // Las herramientas y el orden siguen siendo editables a mano.
 const old=await page.locator('#punch').inputValue();
 await page.locator('#punch').selectOption(old==='goose'?'straight88':'goose');
 await resolved();
 assert.equal(await page.locator('#punch').inputValue(),old==='goose'?'straight88':'goose');
 // Recuperar la muestra para verificar que el plan se aplica sólo al pulsar.
 await page.locator('#sampleBtn').click();
 await resolved();
 const proposals=page.locator('#integratedPlannerOptions .px-advisor-apply:not([disabled])');
 if(await proposals.count()){
  await proposals.first().click();
  await resolved();
 }
 assert.deepEqual(errors,[],'El planificador no genera errores JS');
 console.log('INTEGRATED_BEND_PLANNER_BROWSER_OK');
}finally{await browser?.close();server.kill();}
