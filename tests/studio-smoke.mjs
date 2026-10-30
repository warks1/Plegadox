import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {chromium} from 'playwright';
import {mkdirSync} from 'node:fs';

mkdirSync('test-results',{recursive:true});
const server=spawn('python3',['-m','http.server','4175','--bind','127.0.0.1'],{stdio:'ignore'});
let browser;
try{
 browser=await chromium.launch({headless:true,args:['--no-sandbox']});
 const page=await browser.newPage({viewport:{width:1672,height:941},deviceScaleFactor:1});
 const errors=[];page.on('pageerror',error=>errors.push(error.message));
 await page.goto('http://127.0.0.1:4175/',{waitUntil:'networkidle',timeout:30000});
 await page.locator('#machineCanvas').waitFor({state:'visible'});
 await page.waitForFunction(()=>document.getElementById('machinePerspective')?.getAttribute('aria-pressed')==='true',{timeout:5000});
 // The approved layout shows both categories, not a fake static image.
 assert.equal(await page.locator('.cp-kind-tabs [data-kind="all"]').getAttribute('aria-pressed'),'true');
 assert.equal(await page.locator('#cockpitTools [data-category="punch"]').count(),1);
 assert.equal(await page.locator('#cockpitTools [data-category="die"]').count(),1);
 const compactCount=await page.locator('#cockpitTools .cp-tool-card').count();
 assert.ok(compactCount>=12,'La portada conserva las 12 herramientas básicas y añade las destacadas');
 assert.ok(await page.locator('#cockpitTools .cp-tool-card').filter({hasText:'GN9-12-8806'}).count(),
  'La portada incluye una pata de cabra documentada');
 assert.ok(await page.locator('#cockpitTools .cp-tool-card').filter({hasText:'V006-30-S'}).count(),
  'La portada incluye V6 de 30 grados');
 await page.locator('#cpShowAllTools').click();
 const fullCount=await page.locator('#cockpitTools .cp-tool-card').count();
 assert.ok(fullCount>compactCount,'Catálogo completo accesible con el botón');
 await page.locator('#cpShowAllTools').click();
 assert.equal(await page.locator('#cockpitTools .cp-tool-card').count(),compactCount,
  'La portada recupera la misma selección al contraer el catálogo');
 assert.ok(await page.locator('#machineGraphicMode').textContent()==='PERSPECTIVA 2.5D');
 await page.screenshot({path:'test-results/studio-desktop.png',fullPage:true});
 const before=await page.evaluate(()=>window.PLEGADOX_STATE().piece.flanges.length);
 await page.locator('#cpAddFold').click();
 const after=await page.evaluate(()=>window.PLEGADOX_STATE().piece.flanges.length);
 assert.equal(after,before+1,'Añadir pliegue crea un nuevo ala');
 assert.equal(await page.locator('#simSequence .op').count(),after-1);
 await page.locator('#machinePerspective').click();
 assert.equal(await page.locator('#machinePerspective').getAttribute('aria-pressed'),'false');
 assert.equal(await page.locator('#machineGraphicMode').textContent(),'PERFIL 2D');
 await page.locator('#machinePerspective').click();
 await page.locator('#machineSection').click();
 assert.equal(await page.locator('#machineSection').getAttribute('aria-pressed'),'true');
 await page.locator('#machineTransparent').click();
 assert.equal(await page.locator('#machineTransparent').getAttribute('aria-pressed'),'true');
 await page.screenshot({path:'test-results/studio-modos.png',fullPage:false});
 await page.locator('#machineSection').click();
 await page.locator('#machineTransparent').click();
 await page.locator('#cpBrandTabs [data-brand="Amada"]').click();
 await page.locator('.cp-kind-tabs [data-kind="die"]').click();
 assert.ok(await page.locator('#cockpitTools .cp-tool-card').count()>=2);
 await page.locator('#cockpitTools .cp-tool-card').first().click();
 const saved=await page.evaluate(()=>({die:window.PLEGADOX_STATE().piece.die,kind:window.PLEGADOX_STATE().piece.punch}));
 assert.ok(saved.die.startsWith('amada')||saved.die.startsWith('conic-'),'La matriz seleccionada en Amada o CONIC tipo Amada debe modificar la programación: '+saved.die);
 await page.locator('.cp-kind-tabs [data-kind="all"]').click();
 assert.equal(await page.locator('#cockpitTools [data-category="punch"]').count(),1);
 assert.equal(await page.locator('#cockpitTools [data-category="die"]').count(),1);
 await page.locator('#playBtn').click();
 await page.waitForTimeout(520);
 assert.ok(Number(await page.locator('#timeline').inputValue())>0,'Reproducción no se ha roto');
 await page.locator('#pauseBtn').click();
 await page.locator('#showTool3D').click();
 assert.ok(await page.locator('#cockpitSelectedTool3D').isVisible());
 assert.deepEqual(errors,[],'JavaScript sin excepciones');
 console.log('STUDIO_OK',JSON.stringify({tools:await page.locator('#cockpitTools .cp-tool-card').count(),flanges:after,selectedDie:saved.die,errors:errors.length}));
 // Native touch controls + no horizontal overflow on smaller phones.
 const phone=await browser.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true,deviceScaleFactor:2});
 const mobileErrors=[];phone.on('pageerror',e=>mobileErrors.push(e.message));
 await phone.goto('http://127.0.0.1:4175/',{waitUntil:'networkidle'});
 await phone.locator('#machineCanvas').waitFor({state:'visible'});
 await phone.locator('#machinePerspective').click();
 await phone.locator('#machinePerspective').click();
 await phone.locator('#cpAddFold').click();
 const width=await phone.evaluate(()=>({scroll:document.documentElement.scrollWidth,screen:innerWidth}));
 assert.ok(width.scroll<=width.screen+2,'Sin desbordamiento tras activar controles');
 assert.deepEqual(mobileErrors,[],'Sin fallos en móvil');
 await phone.screenshot({path:'test-results/studio-mobile.png',fullPage:true});
 console.log('STUDIO_MOBILE_OK');
}finally{await browser?.close();server.kill();}
