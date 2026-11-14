import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {chromium} from 'playwright';
import {mkdirSync} from 'node:fs';
mkdirSync('test-results',{recursive:true});
const server=spawn('python3',['-m','http.server','4302','--bind','127.0.0.1'],{stdio:'ignore'});
let browser;
try{
 browser=await chromium.launch({headless:true,args:['--no-sandbox']});
 for(const device of [{name:'pc',width:1440,height:900,mobile:false},
  {name:'movil',width:390,height:844,mobile:true}]){
  const context=await browser.newContext({viewport:{width:device.width,height:device.height},
   isMobile:device.mobile,hasTouch:device.mobile});
  const page=await context.newPage(),errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  await page.goto('http://127.0.0.1:4302/',{waitUntil:'networkidle',timeout:30000});
  await page.locator('[data-tab="simulacion"]').click();
  for(const n of [1,2]){
   await page.locator('#chooseGauge'+n).click();
   const check=await page.evaluate(async n=>{
    const {technicalScene}=await import('/technical-section.js');
    const {gaugePlacement,gaugeContourAtContact}=await import('/backgauge-placement.js');
    const {getV85}=await import('/machine-config.js');
    const {piece}=window.PLEGADOX_STATE();
    const place=gaugePlacement(technicalScene(piece,.5),n);
    const outline=gaugeContourAtContact(place,n===2?getV85().support:getV85().stop);
    return {selected:piece.stopByBend[0],point:place.point,
     inFront:place.sheetInFront,contact:place.contact,supported:place.contactEngaged,
     outline,seat:place.seat,
     text:document.querySelector('#activeGaugeReference')?.textContent};
   },n);
   assert.equal(check.selected,n);
   assert.equal(check.inFront,true,'chapa delante de todo el dedo '+n);
   assert.equal(check.supported,true,'contacto físico nominal '+n);
   assert.ok(!check.text.includes('CHAPA POR DETRÁS'));
   assert.equal(check.seat.required,false,
    'la parada es frontal y no obliga a apoyar encima de la repisa');
   assert.equal(check.seat.seated,true);
   assert.equal(check.contact.surface,'vertical-front');
   assert.equal(check.contact.to.x,check.contact.from.x);
   assert.equal(check.contact.to.x,check.point.x);
   assert.equal(check.outline[0].x,check.contact.from.x);
   assert.equal(check.outline[5].x,check.contact.to.x);
   assert.ok(check.outline.every(pt=>pt.x>=check.point.x),
    'cuerpo del dedo completo por detrás del canto');
   await page.screenshot({path:'test-results/tope-contacto-completo-'+device.name+'-'+n+'.png'});
  }
  assert.deepEqual(errors,[],'Errores de navegación en '+device.name);
  await context.close();
 }
 console.log('FRONT_GAUGE_CONTACT_OK');
}finally{await browser?.close();server.kill();}
