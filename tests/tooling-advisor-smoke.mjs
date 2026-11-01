import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {chromium} from 'playwright';
import {mkdirSync} from 'node:fs';
mkdirSync('test-results',{recursive:true});
const server=spawn('python3',['-m','http.server','4313','--bind','127.0.0.1'],{stdio:'ignore'});
let browser;
try{
 browser=await chromium.launch({headless:true,args:['--no-sandbox']});
 for(const dev of [{name:'pc',w:1440,h:900,mobile:false},{name:'iphone',w:390,h:844,mobile:true}]){
  const context=await browser.newContext({viewport:{width:dev.w,height:dev.h},
   isMobile:dev.mobile,hasTouch:dev.mobile});
  const page=await context.newPage(),errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  await page.goto('http://127.0.0.1:4313/',{waitUntil:'networkidle',timeout:30000});
  await page.locator('[data-tab="programacion"]').click();
  const card=page.locator('#toolAdvisorPanel');
  assert.ok(await card.isVisible());
  assert.match(await page.locator('#toolAdvisorResult').textContent(),/Propuesta/);
  const old=await page.locator('#die').inputValue();
  // Al cambiar espesor la recomendación debe cambiar sin tocar la selección del operario.
  await page.locator('#thickness').fill('3');
  await page.locator('#thickness').dispatchEvent('change');
  const info=await page.locator('#toolAdvisorResult').textContent();
  assert.match(info,/24/,'V objetivo para 3 mm es 24');
  assert.equal(await page.locator('#die').inputValue(),old,
   'La recomendación no reemplaza automáticamente la herramienta');
  assert.ok(await page.locator('#toolAdvisorOptions .px-advisor-option').count()>0);
  const expected=await page.evaluate(async()=>{
   const {recommendTooling}=await import('/tooling-advisor.js');
   return recommendTooling(window.PLEGADOX_STATE().piece).choice;
  });
  assert.ok(expected,'Existe una pareja recomendada');
  await page.locator('#toolAdvisorOptions .px-advisor-option.primary button').click();
  assert.equal(await page.locator('#die').inputValue(),expected.dieId,
   'La acción aplica exactamente la matriz aconsejada');
  assert.equal(await page.locator('#punch').inputValue(),expected.punchId,
   'La acción aplica exactamente el punzón aconsejado');
  assert.equal(await page.locator('#toolAdvisorOptions .px-advisor-option.primary button').isDisabled(),true);
  // Una ala demasiado corta debe cancelar sugerencia, no afirmar que V16 es segura.
  await page.locator('#flangeRows input[aria-label="Longitud ala 1"]').fill('1');
  await page.locator('#flangeRows input[aria-label="Longitud ala 1"]').dispatchEvent('change');
  assert.equal(await page.locator('#toolAdvisorResult').getAttribute('data-state'),'none');
  assert.equal(await page.locator('#toolAdvisorOptions button').count(),0);
  await page.screenshot({path:'test-results/asesor-utillaje-'+dev.name+'.png',fullPage:false});
  assert.deepEqual(errors,[],'Errores de navegador '+dev.name);
  await context.close();
 }
 console.log('TOOLING_ADVISOR_BROWSER_OK');
}finally{await browser?.close();server.kill();}
