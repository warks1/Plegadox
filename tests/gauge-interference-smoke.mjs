import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {chromium} from 'playwright';
const server=spawn('python3',['-m','http.server','4301','--bind','127.0.0.1'],{stdio:'ignore'});
let browser;
try{
 browser=await chromium.launch({headless:true,args:['--no-sandbox']});
 for(const config of [{name:'pc',w:1440,h:900,mobile:false},{name:'phone',w:390,h:844,mobile:true}]){
  const context=await browser.newContext({viewport:{width:config.w,height:config.h},
   isMobile:config.mobile,hasTouch:config.mobile});
  const page=await context.newPage(),errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  await page.goto('http://127.0.0.1:4301/',{waitUntil:'networkidle',timeout:30000});
  await page.locator('[data-tab="programacion"]').click();
  await page.locator('#punch').selectOption('straight30');
  await page.locator('#die').selectOption('conic-v010-30-s');
  await page.locator('[data-tab="simulacion"]').click();
  for(const n of [2,1,2]){
   for(const t of [0,2.7,4.6,10.2,13.2]){
    await page.locator('#timeline').evaluate((el,t)=>{
     el.value=String(Math.round(t/20*1000));
     el.dispatchEvent(new Event('input',{bubbles:true}));
    },t);
    // La selección Stop/Support es por pliegue, y puede cambiar al mover
    // la línea de tiempo. Seleccionarla en el golpe que inspeccionamos.
    await page.locator('#chooseGauge'+n).click();
    assert.equal(await page.locator('#chooseGauge'+n).getAttribute('aria-pressed'),'true');
    const check=await page.evaluate(async n=>{
     const {technicalScene}=await import('/technical-section.js');
     const {gaugePlacement}=await import('/backgauge-placement.js');
     const {piece,sim}=window.PLEGADOX_STATE();
     const st=technicalScene(piece,sim.time);
     const place=gaugePlacement(st,n);
     const label=document.querySelector('#activeGaugeReference');
     return {issue:place.gaugeInterference.warning,
      green:place.alignedToSheet,
      warningShown:label.textContent.includes('POSIBLE INTERFERENCIA 2D'),
      dataset:label.dataset.interference,
      stop:place.stopNumber,phase:st.stage.phase,
      reference:place.nominalDistance};
    },n);
    assert.equal(check.stop,n);
    assert.equal(check.warningShown,check.issue,
     'La UI debe reflejar el aviso del perfil del tope '+JSON.stringify(check));
    assert.equal(check.dataset,String(check.issue));
    assert.ok(check.reference>0);
    if(check.issue)assert.equal(check.green,false);
   }
  }
  assert.deepEqual(errors,[],'Excepciones de navegador '+config.name);
  await context.close();
 }
 console.log('GAUGE_INTERFERENCE_SMOKE_OK');
}finally{await browser?.close();server.kill();}
