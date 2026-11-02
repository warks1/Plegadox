import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {mkdirSync} from 'node:fs';
import {chromium} from 'playwright';
mkdirSync('test-results',{recursive:true});
const server=spawn('python3',['-m','http.server','4392','--bind','127.0.0.1'],{stdio:'ignore'});
let browser;
try{
 browser=await chromium.launch({headless:true,args:['--no-sandbox']});
 for(const dev of [{name:'pc',w:1440,h:900,mobile:false},
  {name:'iphone',w:390,h:844,mobile:true}]){
  const context=await browser.newContext({
   viewport:{width:dev.w,height:dev.h},hasTouch:dev.mobile,isMobile:dev.mobile});
  const page=await context.newPage(),errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  await page.goto('http://127.0.0.1:4392/',{waitUntil:'networkidle',timeout:30000});
  await page.locator('[data-tab="programacion"]').click();
  await page.locator('#newBtn').click();
  assert.equal(await page.locator('#touchProgramSvg [data-segment]').count(),2);
  assert.equal(await page.locator('#touchProgramSvg [data-bend]').count(),1);
  await page.locator('#touchProgramSvg [data-segment="0"]').click();
  assert.match(await page.locator('#touchProgramScreen').textContent(),/Ala 1/);
  await page.locator('#touchValue').fill('60');
  await page.locator('#touchProgramApply').click();
  assert.equal(await page.locator('#flangeRows input[aria-label="Longitud ala 1"]').inputValue(),'60');
  await page.locator('#touchProgramSvg [data-bend="0"]').click();
  await page.locator('#touchValue').fill('-90');
  await page.locator('#touchProgramApply').click();
  assert.equal(await page.locator('#flangeRows .angle-input').first().inputValue(),'-90');
  await page.locator('#touchProgramSvg [data-add="true"]').click();
  assert.deepEqual(await page.evaluate(()=>window.PLEGADOX_STATE().piece.flanges),[60,100,50]);
  assert.equal(await page.locator('#touchProgramSvg [data-bend]').count(),2);
  await page.locator('#touchProgramSvg [data-segment="2"]').click();
  await page.locator('#touchValue').fill('35');
  await page.locator('#touchProgramApply').click();
  await page.locator('#touchProgramOrderBtn').click();
  await page.locator('#touchProgramSvg [data-bend="1"]').click();
  await page.locator('#touchProgramSvg [data-bend="0"]').click();
  const piece=await page.evaluate(()=>window.PLEGADOX_STATE().piece);
  assert.deepEqual(piece.flanges,[60,100,35]);
  assert.deepEqual(piece.angles,[-90,90]);
  assert.deepEqual(piece.order,[1,0]);
  assert.equal(await page.locator('#touchProgramOrderBtn').getAttribute('aria-pressed'),'false');
  assert.match(await page.locator('#sequence').textContent(),/1\. Pliegue 2/);
  // Asesor visual: dibujos distintos tomados de los perfiles geométricos
  // usados por la cabina, para pareja y alternativas.
  await page.locator('#sampleBtn').click();
  const option=page.locator('#toolAdvisorOptions .px-advisor-option.primary');
  assert.ok(await option.count());
  assert.equal(await option.locator('.px-advisor-tool-picture').count(),2);
  const data=await option.locator('.px-advisor-tool-picture').evaluateAll(nodes=>
   nodes.map(n=>({kind:n.dataset.kind,tool:n.dataset.toolId,paths:n.querySelectorAll('svg path').length,
    text:n.innerText})));
  assert.deepEqual(data.map(v=>v.kind),['die','punch']);
  assert.ok(data.every(v=>v.paths===1&&v.tool&&/mm/.test(v.text)),
   'Los dibujos son los perfiles acotados del catálogo, no iconos decorativos');
  await option.locator('.px-advisor-tool-picture[data-kind="punch"]').click();
  assert.ok(await page.locator('#advisorToolDialog').evaluate(d=>d.open));
  assert.match(await page.locator('#advisorToolDialog').textContent(),/Altura/);
  await page.locator('.px-tool-dialog-close').click();
  await page.locator('#thickness').fill('3');
  await page.locator('#thickness').dispatchEvent('change');
  assert.equal(await page.locator('#toolAdvisorOptions .px-advisor-option.primary .px-advisor-tool-picture').count(),2,
   'Al cambiar espesor deben cambiar recomendaciones y dibujos juntos');
  assert.deepEqual(errors,[],'Errores JS '+dev.name);
  await page.screenshot({path:'test-results/programacion-tactil-hmi-'+dev.name+'.png',fullPage:false});
  await context.close();
  console.log('TOUCH_PROGRAM_AND_TOOL_DRAWINGS_OK '+dev.name);
 }
}finally{await browser?.close();server.kill();}
