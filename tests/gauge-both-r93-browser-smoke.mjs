import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {mkdirSync} from 'node:fs';
import {chromium} from 'playwright';

mkdirSync('test-results',{recursive:true});
const server=spawn('python3',['-m','http.server','4393','--bind','127.0.0.1'],{stdio:'ignore'});
let browser;
try{
 browser=await chromium.launch({headless:true,args:['--no-sandbox']});
 for(const dev of [{id:'pc',w:1440,h:900,mobile:false},
  {id:'iphone',w:390,h:844,mobile:true}]){
  const context=await browser.newContext({viewport:{width:dev.w,height:dev.h},
   hasTouch:dev.mobile,isMobile:dev.mobile,deviceScaleFactor:1});
  const page=await context.newPage(),errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  await page.goto('http://127.0.0.1:4393/',{waitUntil:'networkidle',timeout:30000});
  await page.locator('[data-tab="simulacion"]').click();
  const frame=async sub=>page.evaluate(async sub=>{
   const {normalized,EXAMPLE}=await import('/engine.js');
   const {technicalScene}=await import('/technical-section.js');
   const state=window.PLEGADOX_STATE();
   if(!state.piece.name.includes('R93 VIDEO G2')){
    const testPiece=normalized({...EXAMPLE,name:'R93 VIDEO G2',
     flanges:[50,30,50,30,20],punch:'goose',die:'v16',
     gaugeSideByBend:['auto','before','auto','auto']});
    Object.assign(state.piece,testPiece);
   }
   state.sim.playing=false;
   state.sim.time=5+5*sub;
   window.PLEGADOX_MACHINE_VIEW.perspective=true;
   window.PLEGADOX_REDRAW();
   const scene=technicalScene(state.piece,state.sim.time);
   return {sub,setupValid:scene.gaugeSetup.valid,
    setupNeedsCorrection:scene.gaugePlan.needsSetupCorrection,
    predictedPenetration:scene.gaugePlan.penetrationCount,
    retractionEnabled:scene.gaugePlan.enabled,
    unverified:scene.gaugePlan.withdrawalUnverified,
    movement:scene.gaugeTransition?.phase??'quieto',
    anchor:scene.gaugeAnchor,reference:scene.gaugeReference.distance};
  },sub);
  const before=await frame(.25);
  assert.equal(before.setupValid,true);
  assert.equal(before.setupNeedsCorrection,false);
  assert.ok(before.predictedPenetration>0);
  assert.equal(before.retractionEnabled,true);
  assert.equal(before.movement,'quieto');
  const screenshot=page.locator('#machineCanvas');
  const beforePixels=await screenshot.evaluate(c=>c.toDataURL());
  await screenshot.screenshot({path:'test-results/r93-tope-contacto-'+dev.id+'.png'});
  const clamping=await frame(.40);
  assert.equal(clamping.movement,'retroceso-antes-plegado');
  const during=await frame(.60);
  assert.equal(during.unverified,false);
  assert.equal(during.movement,'retirado-durante-plegado');
  assert.equal(during.setupValid,true,
   'Pestaña ya plegada permite apoyo 2D, pero no certifica CAD OEM');
  assert.match(await page.locator('#activeGaugeReference').textContent(),
   /retirada previa: SÍ/,
   'La retirada 2D debe aparecer en el texto del operario');
  const afterPixels=await screenshot.evaluate(c=>c.toDataURL());
  assert.notEqual(afterPixels,beforePixels,
   'La vista 3D debe mostrar desplazamiento durante el plegado');
  await screenshot.screenshot({path:'test-results/r93-tope-retirado-'+dev.id+'.png'});
  assert.deepEqual(errors,[],'Sin errores JavaScript en '+dev.id);
  console.log('R93_GAUGE_BROWSER_'+dev.id+'='+JSON.stringify({before,clamping,during}));
  await context.close();
 }
}finally{await browser?.close();server.kill();}
