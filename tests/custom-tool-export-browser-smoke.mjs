import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {readFileSync,mkdirSync} from 'node:fs';
import {chromium} from 'playwright';
import {parseToolDxf} from '../tool-dxf.js';
mkdirSync('test-results',{recursive:true});
const server=spawn('python3',['-m','http.server','4385','--bind','127.0.0.1'],{stdio:'ignore'});
let browser;
try{
 browser=await chromium.launch({headless:true,args:['--no-sandbox']});
 for(const device of [{name:'pc',width:1280,height:800,mobile:false},
  {name:'iphone',width:390,height:844,mobile:true}]){
  const context=await browser.newContext({viewport:{width:device.width,height:device.height},
   hasTouch:device.mobile,isMobile:device.mobile,acceptDownloads:true});
  const page=await context.newPage(),errors=[];
  page.on('pageerror',error=>errors.push(error.message));
  await page.goto('http://127.0.0.1:4385/',{waitUntil:'networkidle',timeout:30000});
  await page.locator('.nav[data-tab="herramientas"]').click();
  const panel=page.locator('#customToolPanel');
  if(!(await panel.getAttribute('open')))await panel.locator('summary').click();
  await page.locator('#customToolKind').selectOption('die');
  await page.locator('#customToolName').fill('V16/88 PROMECAM PERSONALIZADA');
  await page.locator('#customToolMount').selectOption('Amada/Promecam');
  await page.locator('#customToolHeight').fill('60');
  await page.locator('#customToolWidth').fill('50');
  await page.locator('#customToolAngle').fill('88');
  await page.locator('#customToolOpening').fill('16');
  await page.locator('#customToolShoulderRadius').fill('1.5');
  await page.locator('#customToolShoulderRadius').dispatchEvent('change');
  const status=await page.locator('#customToolStatus').textContent();
  assert.match(status,/Contorno válido/);
  const downloadEvent=page.waitForEvent('download');
  await page.locator('#customToolExportDxf').click();
  const download=await downloadEvent;
  assert.match(download.suggestedFilename(),/NO-CERTIFICADO\.dxf$/);
  const dxf=readFileSync(await download.path(),'utf8');
  const parsed=parseToolDxf(dxf);
  assert.equal(parsed.unitsAssumed,false);
  assert.ok(Math.abs(parsed.height-60)<.01);
  assert.ok(Math.abs(parsed.width-50)<.01);
  await page.locator('#customToolSave').click();
  const restored=await page.evaluate(()=>{
   const arr=JSON.parse(localStorage.getItem('plegadox:tool-dxf:v1')||'[]');
   return arr.at(-1);
  });
  assert.equal(restored.customProfile,true);
  assert.equal(restored.opening,16);
  assert.equal(restored.customDimensions.shoulderRadius,1.5);
  assert.equal(restored.mount,'Amada/Promecam');
  assert.ok(Array.isArray(restored.profilePoints)&&restored.profilePoints.length>5);
  await page.locator('#customToolSavedSelect').selectOption(restored.id);
  await page.locator('#customToolLoadSaved').click();
  assert.equal(await page.locator('#customToolOpening').inputValue(),'16');
  assert.equal(await page.locator('#customToolHeight').inputValue(),'60');
  assert.equal(await page.locator('#customToolMount').inputValue(),'Amada/Promecam');
  await page.locator('#customToolWidth').fill('54');
  await page.locator('#customToolWidth').dispatchEvent('change');
  await page.locator('#customToolSave').click();
  const revisions=await page.evaluate(()=>JSON.parse(localStorage.getItem('plegadox:tool-dxf:v1')||'[]'));
  assert.equal(revisions.length,2,'La modificación crea nueva herramienta sin sobrescribir la anterior');
  assert.equal(revisions[0].customDimensions.width,50);
  assert.equal(revisions[1].customDimensions.width,54);
  assert.notEqual(revisions[0].id,revisions[1].id);
  await page.screenshot({path:'test-results/creador-dxf-'+device.name+'.png'});
  assert.deepEqual(errors,[],'Errores de JS en '+device.name);
  await context.close();
 }
 console.log('CUSTOM_TOOL_DXF_EXPORT_UI_OK');
}finally{await browser?.close();server.kill();}
