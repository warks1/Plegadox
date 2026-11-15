import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {mkdirSync} from 'node:fs';
import {chromium} from 'playwright';
mkdirSync('test-results',{recursive:true});
const server=spawn('python3',['-m','http.server','4354','--bind','127.0.0.1'],{stdio:'ignore'});
let browser;
try{
 browser=await chromium.launch({headless:true,args:['--no-sandbox']});
 for(const dev of [{name:'pc',w:1440,h:900,mobile:false},
  {name:'iphone',w:390,h:844,mobile:true}]){
  const context=await browser.newContext({viewport:{width:dev.w,height:dev.h},
   isMobile:dev.mobile,hasTouch:dev.mobile});
  const page=await context.newPage(),errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  await page.goto('http://127.0.0.1:4354/',{waitUntil:'networkidle',timeout:30000});
  await page.locator('[data-tab="programacion"]').click();
  assert.equal(await page.locator('#gaugeReviewRows .px-gauge-operation').count(),4);
  assert.match(await page.locator('#workshopAuditStatus').textContent(),/NO VALIDADO PARA FABRICAR/);
  const buttons=await page.locator('#gaugeReviewRows .px-gauge-operation').all();
  for(const [i,button] of buttons.entries()){
   assert.match(await button.textContent(),new RegExp('G'+(i+1)+' · P'));
   assert.match(await button.textContent(),/2D|muestras/);
   const time=Number(await button.getAttribute('data-time'));
   assert.ok(time>=i*5&&time<(i+1)*5);
  }
  const time=Number(await page.locator('#gaugeReviewRows .px-gauge-operation').nth(2).getAttribute('data-time'));
  await page.locator('#gaugeReviewRows .px-gauge-operation').nth(2).click();
  assert.equal(await page.locator('#tab-simulacion').evaluate(el=>el.classList.contains('active')),true);
  const check=await page.evaluate(()=>window.PLEGADOX_STATE());
  assert.ok(Math.abs(check.sim.time-time)<.01,'Saltar al instante del golpe G3');
  assert.deepEqual(check.piece.order,[0,1,3,2]);
  assert.deepEqual(check.piece.angles,[90,-90,-90,90]);
  // R83: comprobar en PC/iPhone que un apoyo sin choque 2D es verde,
  // aunque la geometría OEM de los dedos aún no esté certificada.
  const traffic=await page.evaluate(async()=>{
   const {technicalScene}=await import('/technical-section.js');
   const {gaugePlacement}=await import('/backgauge-placement.js');
   const {gaugeRiskStatus}=await import('/gauge-risk-status.js');
   const {piece}=window.PLEGADOX_STATE();
   const scene=technicalScene(piece,5+5*.30),p=gaugePlacement(scene,1);
   return {risk:gaugeRiskStatus(p).level,setupValid:p.setupValid};
  });
  assert.equal(traffic.setupValid,true);
  assert.equal(traffic.risk,'green','CAD pendiente no debe marcar naranja si no existe choque 2D');
  // Comprobar EL MOVIMIENTO QUE VE EL OPERARIO en los cuatro golpes,
  // no sólo el texto del diagnóstico: ninguna holgura nominal debe
  // sacar el dedo de su posición durante sujeción y plegado.
  for(let operation=0;operation<4;operation++)for(const sub of [.4,.6]){
   const time=operation*5+sub*5;
   const displayed=await page.evaluate(async time=>{
    const {technicalScene}=await import('/technical-section.js');
    const scene=technicalScene(window.PLEGADOX_STATE().piece,time);
    return {planned:scene.gaugePlan.enabled,transition:scene.gaugeTransition,
     anchor:scene.gaugeAnchor,operation:scene.stage.activeOperation};
   },time);
   assert.equal(displayed.operation,operation);
   assert.equal(displayed.planned,false,
    'G'+(operation+1)+' no debe retroceder por la simple holgura 2D');
   assert.equal(displayed.transition,null,
    'G'+(operation+1)+' no debe retirar el dedo durante el golpe');
  }
  await page.locator('[data-tab="programacion"]').click();
  await page.locator('.bend-stop-select[data-bend="3"]').selectOption('2');
  const updated=await page.evaluate(async()=>{
   const {scanGaugeSequence}=await import('/gauge-sequence-review.js');
   return scanGaugeSequence(window.PLEGADOX_STATE().piece);
  });
  assert.deepEqual(updated.operations.map(x=>x.stopNumber),[1,1,2,1]);
  assert.equal(await page.locator('#gaugeReviewRows .px-gauge-operation').count(),4);
  assert.match(await page.locator('#gaugeReviewRows .px-gauge-operation').nth(2).textContent(),/SUPPORT 2/);
  await page.screenshot({path:'test-results/gauge-sequence-review-'+dev.name+'.png',fullPage:false});
  assert.deepEqual(errors,[],'Sin errores JS en '+dev.name);
  console.log('GAUGE_SEQUENCE_BROWSER_OK '+dev.name);
  await context.close();
 }
}finally{await browser?.close();server.kill();}
