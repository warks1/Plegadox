import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {chromium} from 'playwright';
import {mkdirSync} from 'node:fs';
mkdirSync('test-results',{recursive:true});
const server=spawn('python3',['-m','http.server','4194','--bind','127.0.0.1'],{stdio:'ignore'});
let browser;
try{
 browser=await chromium.launch({headless:true,args:['--no-sandbox']});
 for(const setup of [{w:1536,h:900,mobile:false},{w:390,h:844,mobile:true}]){
  const context=await browser.newContext({viewport:{width:setup.w,height:setup.h},
   isMobile:setup.mobile,hasTouch:setup.mobile,deviceScaleFactor:setup.mobile?2:1});
  const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto('http://127.0.0.1:4194/',{waitUntil:'networkidle'});
  await page.locator('#machineCanvas').waitFor({state:'visible'});
  await page.locator('#cpBrandTabs [data-brand="Amada"]').click();
  await page.locator('.cp-kind-tabs [data-kind="punch"]').click();
  await page.locator('#cpToolSearch').fill('GN9-12-8806');
  const cards=page.locator('#cockpitTools .cp-tool-card');
  assert.equal(await cards.count(),1,'La pata de cabra real tiene referencia seleccionable');
  await cards.first().click();
  const selected=await page.evaluate(()=>window.PLEGADOX_STATE().piece.punch);
  assert.equal(selected,'conic-gn9-12-8806');
  await page.locator('#showTool3D').click();
  await page.locator('#cockpitSelectedTool3D').waitFor({state:'visible'});
  assert.match(await page.locator('#toolInspectorMeta').textContent(),/CONIC \(tipo Amada\)/);
  await page.screenshot({path:'test-results/gn9-inspector-'+(setup.mobile?'movil':'pc')+'.png',fullPage:false});
  await page.locator('#closeTool3D').click();
  await page.locator('#cpToolSearch').fill('ACT-12-3006');
  assert.equal(await cards.count(),1,'El punzón de 30° figura en la biblioteca');
  await cards.first().click();
  assert.equal(await page.evaluate(()=>window.PLEGADOX_STATE().piece.punch),'conic-act-12-3006');
  await page.locator('.cp-kind-tabs [data-kind="die"]').click();
  await page.locator('#cpToolSearch').fill('V006-30-S');
  assert.equal(await cards.count(),1,'La matriz de 30° y V6 figura en la biblioteca');
  await cards.first().click();
  const p=await page.evaluate(()=>window.PLEGADOX_STATE().piece);
  assert.equal(p.die,'conic-v006-30-s');
  const warning=await page.locator('#collisionDetails').textContent();
  assert.ok(warning.length>25,'Mostrar diagnóstico de contacto');
  await page.locator('#machineSection').click();
  assert.equal(await page.locator('#machineSection').getAttribute('aria-pressed'),'true');
  await page.screenshot({path:'test-results/matriz-30-con-punzon-30-'+(setup.mobile?'movil':'pc')+'.png',fullPage:false});
  assert.deepEqual(errors,[],errors.join(' / '));
  console.log('CATALOG_CONTACT_UI_OK',setup.mobile?'mobile':'desktop');
  await context.close();
 }
}finally{await browser?.close();server.kill();}
