import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {chromium} from 'playwright';
const server=spawn('python3',['-m','http.server','4331','--bind','127.0.0.1'],{stdio:'ignore'});
let browser;
try{
 browser=await chromium.launch({headless:true,args:['--no-sandbox']});
 for(const d of [{name:'pc',w:1440,h:900,mobile:false},
                 {name:'iphone',w:390,h:844,mobile:true}]){
  const context=await browser.newContext({
   viewport:{width:d.w,height:d.h},isMobile:d.mobile,hasTouch:d.mobile
  });
  const page=await context.newPage(),errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  await page.goto('http://127.0.0.1:4331/',{waitUntil:'networkidle',timeout:30000});
  await page.locator('[data-tab="programacion"]').click();
  await page.locator('#punch').selectOption('ref-goose-50-100-r1');
  const before=await page.evaluate(async()=>{
   const {technicalScene}=await import('/technical-section.js');
   const p=window.PLEGADOX_STATE().piece;
   return {scene:technicalScene(p,2.4),angle:p.angles,order:p.order};
  });
  await page.locator('#punchOrientation').selectOption('reversed');
  assert.equal(await page.locator('#punchOrientation').inputValue(),'reversed');
  const after=await page.evaluate(async()=>{
   const {technicalScene}=await import('/technical-section.js');
   const p=window.PLEGADOX_STATE().piece;
   return {scene:technicalScene(p,2.4),orientation:p.punchOrientation,
    angle:p.angles,order:p.order};
  });
  assert.equal(after.orientation,'reversed');
  for(let i=0;i<before.scene.punchPolygon.length;i++){
   assert.ok(Math.abs(before.scene.punchPolygon[i].x+
    after.scene.punchPolygon[i].x)<1e-7,'Invertir TODO el punzón, punto '+i);
   assert.ok(Math.abs(before.scene.punchPolygon[i].y-
    after.scene.punchPolygon[i].y)<1e-7);
  }
  assert.deepEqual(after.angle,before.angle);
  assert.deepEqual(after.order,before.order);
  assert.deepEqual(after.scene.diePolygon,before.scene.diePolygon);
  await page.reload({waitUntil:'networkidle'});
  assert.equal(await page.locator('#punchOrientation').inputValue(),'reversed',
   'Orientación del montaje se conserva en la pieza guardada');
  await page.locator('[data-tab="simulacion"]').click();
  assert.ok(await page.locator('#playBtn').isVisible());
  await page.locator('#playBtn').click();
  await page.waitForFunction(()=>window.PLEGADOX_STATE().sim.time>.1,null,{timeout:4000});
  await page.locator('#pauseBtn').click();
  assert.deepEqual(errors,[],d.name+': sin fallos de navegador');
  await context.close();
 }
 console.log('PUNCH_INSTALL_ORIENTATION_OK');
}finally{await browser?.close();server.kill();}
