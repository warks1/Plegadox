import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {chromium} from 'playwright';
const server=spawn('python3',['-m','http.server','4213','--bind','127.0.0.1'],{stdio:'ignore'});
let browser;
try{
 browser=await chromium.launch({headless:true,args:['--no-sandbox']});
 for(const screen of [{name:'PC',w:1536,h:900,mobile:false},{name:'MOBILE',w:390,h:844,mobile:true}]){
  const ctx=await browser.newContext({viewport:{width:screen.w,height:screen.h},isMobile:screen.mobile,hasTouch:screen.mobile});
  const page=await ctx.newPage(),errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  await page.goto('http://127.0.0.1:4213/',{waitUntil:'networkidle'});
  await page.locator('[data-tab="simulacion"]').click();
  await page.locator('#timeline').evaluate(input=>{input.value='0';input.dispatchEvent(new Event('input',{bubbles:true}));});
  const first=await page.locator('#machineCanvas').evaluate(canvas=>canvas.toDataURL());
  assert.match(await page.locator('#activeGaugeReference').textContent(),/50,0 mm/);
  assert.match(await page.locator('#activeGaugeReference').textContent(),/cara frontal inferior STOP 1/);
  await page.locator('#chooseGauge2').click();
  assert.match(await page.locator('#activeGaugeReference').textContent(),/primer escalón SUPPORT 2/);
  const second=await page.locator('#machineCanvas').evaluate(canvas=>canvas.toDataURL());
  assert.notEqual(first,second,'Seleccionar escalón debe cambiar la geometría visible del dedo');
  const measure=await page.evaluate(async()=>{
   const {technicalScene}=await import('/technical-section.js');
   const {gaugePlacement,gaugeContourAtContact}=await import('/backgauge-placement.js');
   const {getV85}=await import('/machine-config.js');
   const {piece,sim}=window.PLEGADOX_STATE();
   const scene=technicalScene(piece,sim.time);
   const chosen=gaugePlacement(scene,2),stop=gaugePlacement(scene,1);
   const contour=gaugeContourAtContact(chosen,getV85().support);
   return {chosen,stop,contour,order:piece.order,angles:piece.angles};
  });
  assert.equal(measure.chosen.contact.kind,'support-step');
  assert.equal(measure.stop.contact.kind,'stop-face');
  assert.equal(measure.chosen.contact.point.x,measure.stop.contact.point.x);
  assert.equal(measure.chosen.contact.mirrorX,false);
  assert.equal(measure.chosen.contact.surface,'horizontal-top');
  assert.equal(measure.stop.contact.surface,'vertical-front');
  assert.equal(measure.chosen.contact.from.y,measure.chosen.contact.to.y);
  assert.equal(measure.chosen.contact.point.y,measure.chosen.point.y-1);
  assert.equal(measure.chosen.nominalDistance,50);
  assert.deepEqual(measure.order,[0,1,3,2]);
  assert.deepEqual(measure.angles,[90,-90,-90,90]);
  await page.locator('[data-tab="maquina"]').click();
  await page.locator('#machineSupportFields input[data-path="support.0"]').waitFor();
  assert.equal(await page.locator('#machineSupportFields input[data-path="support.0"]').inputValue(),'70');
  assert.equal(await page.locator('#machineSupportFields input[data-path="support.1"]').inputValue(),'100');
  assert.equal(await page.locator('#machineSupportFields input[data-path="support.2"]').inputValue(),'8');
  assert.equal(await page.locator('#machineSupportFields input[data-path="support.3"]').inputValue(),'25');
  assert.deepEqual(errors,[],'Sin errores JS en '+screen.name);
  console.log('STOP_SUPPORT_CONTACT_'+screen.name+'_OK');
  await ctx.close();
 }
}finally{await browser?.close();server.kill();}
