import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {chromium} from 'playwright';
import {mkdirSync} from 'node:fs';

mkdirSync('test-results',{recursive:true});
const server=spawn('python3',['-m','http.server','4390','--bind','127.0.0.1'],{stdio:'ignore'});
let browser;
try{
 browser=await chromium.launch({headless:true,args:['--no-sandbox']});
 for(const device of [
  {name:'pc',width:1440,height:900,mobile:false},
  {name:'iphone',width:390,height:844,mobile:true}
 ]){
  const context=await browser.newContext({
   viewport:{width:device.width,height:device.height},
   isMobile:device.mobile,hasTouch:device.mobile
  });
  const page=await context.newPage(),errors=[];
  page.on('pageerror',error=>errors.push(error.message));
  await page.goto('http://127.0.0.1:4390/',{waitUntil:'networkidle',timeout:30000});
  await page.locator('[data-tab="simulacion"]').click();
  for(const {time,operation,bend} of [
   {time:5.5,operation:1,bend:1},
   {time:15.5,operation:3,bend:2}
  ]){
   await page.locator('#timeline').evaluate((input,value)=>{
    input.value=String(value);
    input.dispatchEvent(new Event('input',{bubbles:true}));
   },time/20*1000);
   for(const n of [1,2]){
    await page.locator('#chooseGauge'+n).click();
    const result=await page.evaluate(async()=>{
     const {technicalScene}=await import('/technical-section.js');
     const {gaugePlacement,gaugeContourAtContact}=await import('/backgauge-placement.js');
     const {getV85}=await import('/machine-config.js');
     const {piece,sim}=window.PLEGADOX_STATE();
     const scene=technicalScene(piece,sim.time);
     const n=piece.stopByBend[scene.stage.activeBend];
     const gauge=gaugePlacement(scene,n);
     const cfg=getV85();
     return {time:sim.time,operation:scene.stage.activeOperation,
      bend:scene.stage.activeBend,n,reference:gauge.nominalDistance,
      contact:gauge.contact,point:gauge.point,front:gauge.frontFlange,
      warning:gauge.gaugeInterference.warning,engaged:gauge.contactEngaged,
      profile:gaugeContourAtContact(gauge,n===1?cfg.stop:cfg.support),
      label:document.querySelector('#activeGaugeReference')?.textContent};
    });
    assert.equal(result.operation,operation);
    assert.equal(result.bend,bend);
    assert.equal(result.n,n);
    assert.equal(result.reference,50);
    assert.equal(result.contact.surface,'vertical-front');
    assert.ok(Math.abs(result.point.x-51)<1e-7,'e/2 desde fibra en golpe '+(operation+1));
    assert.equal(result.front?.kind,'folded-flange-front');
    assert.equal(result.warning,false,'Chapa NO penetra en el dedo '+n);
    assert.equal(result.engaged,true);
    assert.equal(result.contact.from.x,result.point.x);
    assert.equal(result.contact.to.x,result.point.x);
    assert.ok(result.profile.every(pt=>pt.x>=result.point.x-1e-8),
     'Dedo completo por detrás de la cara exterior');
    assert.match(result.label,/cara exterior de ala plegada/);
    assert.doesNotMatch(result.label,/sobre primer escalón|CHAPA POR DETRÁS DEL TOPE/);
    await page.screenshot({path:'test-results/R37-V85-golpe-'+(operation+1)+
     '-dedo-'+n+'-'+device.name+'.png',fullPage:false});
   }
  }
  assert.deepEqual(errors,[],'Consola navegador sin errores en '+device.name);
  await context.close();
  console.log('R37_V85_FACE_CONTACT_BROWSER_OK '+device.name);
 }
}finally{await browser?.close();server.kill();}
