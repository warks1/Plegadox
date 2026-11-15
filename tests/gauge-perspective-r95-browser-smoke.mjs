import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {mkdirSync} from 'node:fs';
import {chromium} from 'playwright';

// Capturas reproducibles de la regresión que muestra la grabación
// ScreenRecording_11-15-2026 21-16-05_1.mp4, R94 3D.
// G1 automático con ala de 20 mm y G2 manual pestaña ya plegada.
mkdirSync('test-results',{recursive:true});
const server=spawn('python3',['-m','http.server','4395','--bind','127.0.0.1'],{stdio:'ignore'});
let browser;
try{
 browser=await chromium.launch({headless:true,args:['--no-sandbox']});
 for(const device of [{id:'pc',width:1366,height:850,mobile:false},
  {id:'iphone',width:390,height:844,mobile:true}]){
  const ctx=await browser.newContext({viewport:{width:device.width,height:device.height},
   isMobile:device.mobile,hasTouch:device.mobile,deviceScaleFactor:1});
  const page=await ctx.newPage(),errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  await page.goto('http://127.0.0.1:4395/',{waitUntil:'networkidle',timeout:30000});
  await page.locator('[data-tab="simulacion"]').click();
  const record=async(name,time,perspective)=>{
   const info=await page.evaluate(async({time,perspective})=>{
    const {EXAMPLE,normalized}=await import('/engine.js');
    const {technicalScene}=await import('/technical-section.js');
    const {gaugePlacement}=await import('/backgauge-placement.js');
    const piece=normalized({...EXAMPLE,name:'R95 VISIBILIDAD REAL 3D',
     flanges:[20,30,50,30,20],die:'v16',punch:'goose',
     gaugeSideByBend:['auto','before','before','auto'],
     stopByBend:[1,1,1,1]});
    const state=window.PLEGADOX_STATE();
    Object.assign(state.piece,piece);
    state.sim.playing=false;state.sim.time=time;
    window.PLEGADOX_MACHINE_VIEW.perspective=perspective;
    window.PLEGADOX_REDRAW();
    const scene=technicalScene(state.piece,time),placement=gaugePlacement(scene,1);
    return {stage:scene.stage.phase,contact:placement.alignedToSheet,
     reference:scene.gaugeReference.distance,wallX:placement.contact?.from?.x,
     sheetX:scene.sheet[scene.gaugeReference.sourceIndex]?.x,
     retreat:scene.gaugeTransition?.phase??'quieto',
     nose:placement.contact?.from,config:window.PLEGADOX_MACHINE_VIEW.perspective};
   },{time,perspective});
   await page.locator('#machineCanvas').screenshot({
    path:'test-results/r95-'+name+'-'+device.id+'.png'});
   assert.equal(info.config,perspective);
   assert.ok(Number.isFinite(info.wallX));
   console.log('R95_VIS_'+name+'_'+device.id+'='+JSON.stringify(info));
   return info;
  };
  const g1=await record('g1-3d-contact',.8,true);
  assert.equal(g1.contact,true,'G1: el canto libre debe apoyarse en tope');
  await record('g1-2d-control',.8,false);
  const g2=await record('g2-3d-contact',6.25,true);
  assert.equal(g2.contact,true,'G2: pestaña preplegada debe apoyar');
  assert.ok(g2.wallX>g2.sheetX,'Stop debe quedar detrás de pestaña, no en matriz');
  const g2Bent=await record('g2-3d-withdrawn',8.0,true);
  assert.equal(g2Bent.retreat,'retirado-durante-plegado');
  assert.ok(g2Bent.wallX>g2.wallX,'Tope apartándose del ala');
  assert.deepEqual(errors,[],device.id+' Javascript errors');
  await ctx.close();
 }
}finally{await browser?.close();server.kill();}
