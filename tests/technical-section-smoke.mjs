import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {chromium} from 'playwright';
import {mkdirSync} from 'node:fs';
mkdirSync('test-results',{recursive:true});
const server=spawn('python3',['-m','http.server','4199','--bind','127.0.0.1'],{stdio:'ignore'});
let browser;
try{
 browser=await chromium.launch({headless:true,args:['--no-sandbox']});
 for(const v of [
   {name:'pc',w:1536,h:900,touch:false},
   {name:'tablet',w:834,h:1194,touch:true},
   {name:'movil',w:390,h:844,touch:true}
 ]){
  const context=await browser.newContext({
   viewport:{width:v.w,height:v.h},deviceScaleFactor:v.touch?2:1,
   isMobile:v.touch,hasTouch:v.touch
  });
  const page=await context.newPage(),errors=[];
  page.on('pageerror',err=>errors.push(err.message));
  await page.goto('http://127.0.0.1:4199/',{waitUntil:'networkidle',timeout:30000});
  await page.locator('#machineCanvas').waitFor({state:'visible'});
  const before=await page.locator('#machineCanvas').evaluate(c=>c.toDataURL());
  await page.locator('#machineSection').click();
  assert.equal(await page.locator('#machineSection').getAttribute('aria-pressed'),'true');
  assert.match(await page.locator('#machineGraphicMode').textContent(),/SECCIÓN EN MM/);
  assert.match(await page.locator('#machineModeNote').textContent(),/escala común/);
  const after=await page.locator('#machineCanvas').evaluate(c=>c.toDataURL());
  assert.notEqual(before,after,'El modo técnico debe dibujar geometría diferente');
  const width=await page.evaluate(()=>({scroll:document.documentElement.scrollWidth,width:innerWidth}));
  assert.ok(width.scroll<=width.width+3,
   'La sección no puede crear desbordamiento horizontal: '+JSON.stringify(width));
  await page.screenshot({path:'test-results/seccion-metrica-'+v.name+'.png',fullPage:false});
  await page.locator('#timeline').evaluate(input=>{
    input.value='390';input.dispatchEvent(new Event('input',{bubbles:true}));
  });
  assert.match(await page.locator('#phaseText').textContent(),/[-−]90°/);
  const second=await page.locator('#machineCanvas').evaluate(c=>c.toDataURL());
  assert.notEqual(after,second,'El segundo golpe debe actualizar la sección');
  if(v.name==='pc'){
   await page.screenshot({path:'test-results/seccion-metrica-menos90.png',fullPage:false});
  }
  await page.locator('#machineSection').click();
  assert.equal(await page.locator('#machineSection').getAttribute('aria-pressed'),'false');
  assert.deepEqual(errors,[], 'Errores en '+v.name+': '+errors.join(' / '));
  console.log('TECHNICAL_SECTION_OK '+v.name);
  await context.close();
 }
}finally{
 await browser?.close();server.kill();
}
