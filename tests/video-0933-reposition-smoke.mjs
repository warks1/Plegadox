import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {chromium} from 'playwright';

const server=spawn('python3',['-m','http.server','4215','--bind','127.0.0.1'],{stdio:'ignore'});
let browser;
try{
 browser=await chromium.launch({headless:true,args:['--no-sandbox']});
 for(const viewport of [{width:390,height:844,mobile:true},{width:1536,height:900,mobile:false}]){
  const context=await browser.newContext({viewport:{width:viewport.width,height:viewport.height},
   isMobile:viewport.mobile,hasTouch:viewport.mobile});
  const page=await context.newPage(),errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  await page.goto('http://127.0.0.1:4215/',{waitUntil:'networkidle'});
  await page.locator('[data-tab="simulacion"]').click();
  for(const t of [4.9999,5,9.9999,10,14.9999,15]){
   await page.locator('#timeline').evaluate((input,t)=>{
    input.value=String(Math.round(t/20*1000));
    input.dispatchEvent(new Event('input',{bubbles:true}));
   },t);
   const data=await page.evaluate(async time=>{
    const {technicalScene}=await import('/technical-section.js');
    const {machineSheetProjection}=await import('/machine-visual.js');
    const {piece}=window.PLEGADOX_STATE(),scene=technicalScene(piece,time);
    return {sheet:scene.sheet,projected:machineSheetProjection(scene,0,0,1,true),
     flat:machineSheetProjection(scene,0,0,1,false),
     angles:piece.angles,order:piece.order,
     gaugeSides:piece.gaugeSideByBend};
   },t);
   assert.deepEqual(data.projected,data.flat,'No mostrar otra chapa en 3D '+t);
   assert.deepEqual(data.order,[0,1,3,2]);
   assert.deepEqual(data.angles,[90,-90,-90,90]);
  }
  assert.deepEqual(errors,[],viewport.mobile?'Errores móviles':'Errores escritorio');
  console.log('REPOSICION_0933_'+(viewport.mobile?'MOBILE':'DESKTOP')+'_OK');
  await context.close();
 }
}finally{await browser?.close();server.kill();}
