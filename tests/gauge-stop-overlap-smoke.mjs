import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {chromium} from 'playwright';
const server=spawn('python3',['-m','http.server','4312','--bind','127.0.0.1'],{stdio:'ignore'});
let browser;
try{
 browser=await chromium.launch({headless:true,args:['--no-sandbox']});
 for(const device of [{name:'PC',width:1536,height:900,mobile:false},
  {name:'iPhone',width:390,height:844,mobile:true}]){
  const context=await browser.newContext({viewport:{width:device.width,height:device.height},
   isMobile:device.mobile,hasTouch:device.mobile});
  const page=await context.newPage(),errors=[];
  page.on('pageerror',error=>errors.push(error.message));
  await page.goto('http://127.0.0.1:4312/',{waitUntil:'networkidle',timeout:30000});
  await page.waitForFunction(()=>!!window.PLEGADOX_STATE);
  await page.locator('[data-tab="simulacion"]').click();
  await page.locator('#timeline').evaluate(input=>{
   input.value='25';input.dispatchEvent(new Event('input',{bubbles:true}));
  });
  for(const n of [1,2]){
   await page.locator('#chooseGauge'+n).click();
   const res=await page.evaluate(async stopNumber=>{
    const {technicalScene}=await import('/technical-section.js');
    const {gaugePlacement,gaugeStopOverlap}=await import('/backgauge-placement.js');
    const {gaugeContactFeature,getV85}=await import('/machine-config.js');
    const {piece,sim}=window.PLEGADOX_STATE();
    const cfg=getV85(),kind=stopNumber===2?'support':'stop';
    const feature=gaugeContactFeature(cfg[kind],stopNumber);
    const place=gaugePlacement(technicalScene(piece,sim.time),stopNumber);
    return {mode:place.stopNumber,seated:place.seat.seated,
     engaged:place.contactEngaged,measured:gaugeStopOverlap(feature,piece.thickness),
     label:document.querySelector('#activeGaugeReference').textContent};
   },n);
   assert.equal(res.mode,n);
   assert.equal(res.seated,true);
   assert.equal(res.engaged,true);
   assert.equal(res.measured.valid,true);
   assert.match(res.label,/contacto nominal 2D/);
   assert.match(res.label,/chapa sobre primer escalón|chapa contra cara frontal inferior/);
  }
  await page.locator('#timeline').evaluate(input=>{
   input.value='230';input.dispatchEvent(new Event('input',{bubbles:true}));
  });
  const after=await page.evaluate(async()=>{
   const {technicalScene}=await import('/technical-section.js');
   const {gaugePlacement}=await import('/backgauge-placement.js');
   const {piece,sim}=window.PLEGADOX_STATE();
   const place=gaugePlacement(technicalScene(piece,sim.time),2);
   return {moving:place.moving,engaged:place.contactEngaged,
    label:document.querySelector('#activeGaugeReference').textContent};
  });
  assert.equal(after.moving,true);
  assert.equal(after.engaged,false);
  assert.match(after.label,/sin contacto confirmado/);
  assert.deepEqual(errors,[],'Errores JS '+device.name);
  await context.close();
 }
 console.log('GAUGE_STOP_OVERLAP_SMOKE_OK');
}finally{await browser?.close();server.kill();}
