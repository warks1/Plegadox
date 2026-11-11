import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {chromium} from 'playwright';
const server=spawn('python3',['-m','http.server','4396','--bind','127.0.0.1'],{stdio:'ignore'});
let browser;
try{
 browser=await chromium.launch({headless:true,args:['--no-sandbox']});
 for(const device of [{name:'PC',w:1440,h:900,mobile:false},{name:'iPhone',w:390,h:844,mobile:true}]){
  const context=await browser.newContext({viewport:{width:device.w,height:device.h},
   isMobile:device.mobile,hasTouch:device.mobile});
  const page=await context.newPage(),errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  await page.goto('http://127.0.0.1:4396/',{waitUntil:'domcontentloaded',timeout:30000});
  await page.waitForFunction(()=>!!window.PLEGADOX_STATE,null,{timeout:30000});
  await page.locator('[data-tab="programacion"]').click();
  const mode=page.locator('#sequencePlannerMode');
  assert.equal(await mode.inputValue(),'manual',
   'La omega preprogramada 1→2→4→3 se respeta al abrir por primera vez');
  assert.equal(await page.locator('#sequenceAutoRecalculate').isVisible(),true);
  // Una corrección manual nunca puede ser reemplazada por el planificador.
  await page.locator('#resetOrder').click();
  assert.equal(await mode.inputValue(),'manual');
  const ordered=await page.evaluate(()=>window.PLEGADOX_STATE().piece.order);
  assert.deepEqual(ordered,[0,1,2,3]);
  await page.locator('#sequenceAutoRecalculate').click();
  await page.waitForFunction(()=>document.querySelector('#sequenceAutoStatus').textContent
   .includes('Analizadas'),null,{timeout:60000});
  assert.deepEqual(await page.evaluate(()=>window.PLEGADOX_STATE().piece.order),
   ordered,'el análisis manual no sobrescribe ningún golpe');
  await mode.selectOption('auto');
  assert.equal(await mode.inputValue(),'auto');
  await page.waitForFunction(()=>document.querySelector('#sequenceAutoStatus').textContent
   .includes('Analizadas'),null,{timeout:60000});
  assert.equal(await page.locator('#sequenceAutoDetails').isVisible(),true);
  // Una pieza nueva sí entra en Automático; el operario conserva siempre
  // los botones para editar a mano la propuesta de la aplicación.
  await page.locator('#newBtn').click();
  assert.equal(await mode.inputValue(),'auto');
  assert.equal((await page.evaluate(()=>window.PLEGADOX_STATE().piece.order)).length,1);
  assert.deepEqual(errors,[],device.name+': sin errores de navegador');
  await context.close();
 }
 console.log('R30_AUTOMATIC_SEQUENCE_BROWSER_OK');
}finally{await browser?.close();server.kill();}
