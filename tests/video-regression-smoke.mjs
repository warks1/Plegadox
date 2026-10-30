import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {chromium} from 'playwright';
import {mkdirSync} from 'node:fs';
mkdirSync('test-results',{recursive:true});
const server=spawn('python3',['-m','http.server','4197','--bind','127.0.0.1'],{stdio:'ignore'});
let browser;
try{
 browser=await chromium.launch({headless:true,args:['--no-sandbox']});
 const context=await browser.newContext({viewport:{width:1536,height:900},deviceScaleFactor:1});
 const page=await context.newPage(),errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 await page.goto('http://127.0.0.1:4197/',{waitUntil:'networkidle'});
 await page.locator('#machineCanvas').waitFor({state:'visible'});
 // El visor 3D debe empezar plano y NO mostrar la omega final.
 const sceneInitial=await page.locator('#sceneCanvas').evaluate(c=>c.toDataURL());
 // The second operation of 1-2-4-3 is −90; show this exact moment.
 await page.evaluate(()=>{
  const r=document.querySelector('#timeline');
  r.value='390';r.dispatchEvent(new Event('input',{bubbles:true}));
 });
 assert.match(await page.locator('#phaseText').textContent(),/[-−]90°/);
 const sceneSecond=await page.locator('#sceneCanvas').evaluate(c=>c.toDataURL());
 assert.notEqual(sceneSecond,sceneInitial,
  'El 3D debe representar los pliegues ya ejecutados, no dibujar siempre la pieza final');
 await page.locator('#timeline').evaluate(input=>{
  input.value='1000';input.dispatchEvent(new Event('input',{bubbles:true}));
 });
 const sceneFinal=await page.locator('#sceneCanvas').evaluate(c=>c.toDataURL());
 assert.notEqual(sceneFinal,sceneSecond,'El 3D debe terminar la secuencia de operaciones');
 // El nuevo volumen debe cambiar al variar SOLO el espesor programado.
 await page.locator('[data-tab="programacion"]').click();
 const control=page.locator('#thickness');
 await control.fill('8');await control.dispatchEvent('change');
 await page.locator('#timeline').evaluate(input=>{
  input.value='1000';input.dispatchEvent(new Event('input',{bubbles:true}));
 });
 await page.locator('[data-tab="simulacion"]').click();
 const thick=await page.locator('#sceneCanvas').evaluate(c=>c.toDataURL());
 assert.notEqual(sceneFinal,thick,'El canto 3D debe reaccionar al espesor programado');
 await page.locator('[data-tab="programacion"]').click();
 await control.fill('2');await control.dispatchEvent('change');
 await page.locator('#timeline').evaluate(input=>{
  input.value='1000';input.dispatchEvent(new Event('input',{bubbles:true}));
 });
 await page.locator('[data-tab="simulacion"]').click();

 await page.locator('#timeline').evaluate(input=>{
  input.value='390';input.dispatchEvent(new Event('input',{bubbles:true}));
 });

 await page.screenshot({path:'test-results/video-regression-second-minus90-desktop.png',fullPage:false});
 // Tool profiles 30 / 60 / 88 must genuinely differ visually.
 await page.locator('#cpBrandTabs [data-brand="Genéricos"]').click();
 await page.locator('.cp-kind-tabs [data-kind="punch"]').click();
 const cards=page.locator('#cockpitTools .cp-tool-card');
 assert.ok(await cards.count()>=3);
 const thumbnails=await page.locator('#cockpitTools .cp-tool-card canvas').evaluateAll(items=>items.slice(0,3).map(c=>c.toDataURL()));
 assert.equal(new Set(thumbnails).size,3,'Punzones rectos de 30° 60° 88° no pueden ser siluetas idénticas');
 await cards.nth(1).click();
 await page.locator('#showTool3D').click();
 const modal=page.locator('#cockpitSelectedTool3D');
 assert.ok(await modal.isVisible(),'El inspector 3D debe mostrarse');
 await page.waitForTimeout(200);
 const sz=await modal.boundingBox();
 assert.ok(sz.width>400&&sz.height>270,'Inspector 3D demasiado pequeño en PC '+JSON.stringify(sz));
 const before=await modal.evaluate(c=>c.toDataURL());
 await page.mouse.move(sz.x+sz.width*.35,sz.y+sz.height*.45);
 await page.mouse.down();await page.mouse.move(sz.x+sz.width*.76,sz.y+sz.height*.66,{steps:7});await page.mouse.up();
 const after=await modal.evaluate(c=>c.toDataURL());
 assert.notEqual(before,after,'La herramienta 3D debe rotar con ratón');
 await page.screenshot({path:'test-results/tool-inspector-30deg-desktop.png',fullPage:false});
 await page.locator('#closeTool3D').click();
 assert.ok(!(await modal.isVisible()),'El inspector debe cerrarse');
 assert.deepEqual(errors,[],errors.join('; '));
 await context.close();
 const phone=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true,deviceScaleFactor:2});
 const mobile=await phone.newPage(),err2=[];mobile.on('pageerror',e=>err2.push(e.message));
 await mobile.goto('http://127.0.0.1:4197/',{waitUntil:'networkidle'});
 await mobile.locator('#machineCanvas').waitFor({state:'visible'});
 await mobile.locator('#cpBrandTabs [data-brand="Genéricos"]').click();
 await mobile.locator('.cp-kind-tabs [data-kind="punch"]').click();
 await mobile.locator('#showTool3D').click();
 const r=await mobile.locator('#cockpitSelectedTool3D').boundingBox();
 assert.ok(r.width>=320&&r.height>=190,'Inspector móvil no ocupa espacio útil '+JSON.stringify(r));
 await mobile.screenshot({path:'test-results/tool-inspector-mobile.png',fullPage:false});
 await mobile.locator('#closeTool3D').click();
 assert.deepEqual(err2,[],err2.join('; '));
 console.log('VIDEO_REGRESSION_OK',JSON.stringify({angle:'-90',toolProfiles:'distinct',desktopInspector:[sz.width,sz.height],mobileInspector:[r.width,r.height]}));
 await phone.close();
}finally{await browser?.close();server.kill();}
