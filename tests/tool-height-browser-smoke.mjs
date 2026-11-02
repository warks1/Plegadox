import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {chromium} from 'playwright';
import {mkdirSync} from 'node:fs';
mkdirSync('test-results',{recursive:true});
const server=spawn('python3',['-m','http.server','4388','--bind','127.0.0.1'],{stdio:'ignore'});
let browser;
try{
 browser=await chromium.launch({headless:true,args:['--no-sandbox']});
 for(const dev of [{name:'pc',width:1440,height:900,mobile:false},
  {name:'iphone',width:390,height:844,mobile:true}]){
  const context=await browser.newContext({viewport:{width:dev.width,height:dev.height},
   isMobile:dev.mobile,hasTouch:dev.mobile});
  const page=await context.newPage(),errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  await page.goto('http://127.0.0.1:4388/',{waitUntil:'networkidle',timeout:30000});
  await page.waitForFunction(()=>Boolean(window.PLEGADOX_STATE));
  await page.locator('#cpBrandTabs [data-brand="Amada"]').click();
  await page.locator('.cp-kind-tabs [data-kind="punch"]').click();
  const w55=page.locator('.cp-tool-card').filter({hasText:'841 W55'}).first();
  assert.ok(await w55.count(),'La referencia 841 W55 debe estar seleccionable');
  await w55.click();
  const details=await page.locator('#cockpitToolInfo').textContent();
  assert.match(details,/ALTURA EN EL DIBUJO|COTA TOTAL DE FICHA/);
  assert.match(details,/200 mm/);
  await page.locator('#showTool3D').click();
  const meta=await page.locator('#toolInspectorMeta').textContent();
  assert.match(meta,/H TOTAL 200 mm/);
  assert.match(meta,/Punta R0,6/,'AMADA R0,6 no debe aparecer como R0,3');
  await page.locator('#closeTool3D').click();
  // Elegir pata de cabra de croquis del usuario: H útil100, no H total 100.
  await page.locator('#cpBrandTabs [data-brand="Genéricos"]').click();
  const photo=page.locator('.cp-tool-card').filter({hasText:'foto 50'}).first();
  assert.ok(await photo.count());
  await photo.click();
  const photoInfo=await page.locator('#cockpitToolInfo').textContent();
  assert.match(photoInfo,/H total dibujada ≈128 mm/);
  assert.match(photoInfo,/ESTIMADA|estimado|estimación/);
  const shape=await page.evaluate(async()=>{
   const {PUNCHES,DIES}=await import('/engine.js');
   const {auditToolLibraryHeights}=await import('/tool-height-audit.js');
   return auditToolLibraryHeights(PUNCHES,DIES);
  });
  assert.deepEqual(shape.mismatches,[],'Ninguna referencia puede desviarse de H declarada');
  assert.equal(shape.verifiedForManufacture,false);
  await page.screenshot({path:'test-results/cotas-h-punzones-'+dev.name+'.png',fullPage:false});
  assert.deepEqual(errors,[],'Sin fallos JS en '+dev.name);
  await context.close();
  console.log('HEIGHT_PROFILE_BROWSER_OK '+dev.name);
 }
}finally{await browser?.close();server.kill();}
