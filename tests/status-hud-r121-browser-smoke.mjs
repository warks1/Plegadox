import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {mkdirSync} from 'node:fs';
import {chromium} from 'playwright';

mkdirSync('test-results',{recursive:true});
const server=spawn('python3',['-m','http.server','4409','--bind','127.0.0.1'],{stdio:'ignore'});
let browser;
try{
 browser=await chromium.launch({headless:true,args:['--no-sandbox']});
 for(const target of [{id:'iphone',w:390,h:844,mobile:true},
  {id:'tablet',w:768,h:1024,mobile:true},
  {id:'pc',w:1366,h:860,mobile:false}]){
  const ctx=await browser.newContext({viewport:{width:target.w,height:target.h},
   isMobile:target.mobile,hasTouch:target.mobile,deviceScaleFactor:1});
  const page=await ctx.newPage(),errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  await page.goto('http://127.0.0.1:4409/',{waitUntil:'networkidle',timeout:30000});
  await page.locator('[data-tab="simulacion"]').click();
  await page.waitForFunction(()=>!!window.PLEGADOX_REDRAW);
  for(const perspective of [false,true]){
   const result=await page.evaluate(async({perspective})=>{
    const {EXAMPLE,normalized}=await import('/engine.js');
    const {technicalScene}=await import('/technical-section.js');
    const {machineToolProjection,gaugeStatusCardLayout,toolWarningHudLayout}
     =await import('/machine-visual.js');
    const state=window.PLEGADOX_STATE();
    Object.assign(state.piece,normalized(EXAMPLE));
    state.sim.playing=false;state.sim.time=17.5;
    window.PLEGADOX_MACHINE_VIEW.perspective=perspective;
    window.PLEGADOX_REDRAW();
    const canvas=document.querySelector('#machineCanvas');
    const r=canvas.getBoundingClientRect(),w=r.width,h=r.height;
    const scale=Math.min(w/740,h/510)*(window.PLEGADOX_MACHINE_VIEW.zoom||1);
    const scene=technicalScene(state.piece,17.5);
    const die=machineToolProjection(scene,w*.48,h*.665,scale).die;
    const ys=die.map(x=>x[1]);
    const dieTop=Math.min(...ys),dieBottom=Math.max(...ys);
    const gauge=gaugeStatusCardLayout(w,h,w*.6,h*.665,1,'green',scale);
    const warning=toolWarningHudLayout(w,h);
    return {w,h,dieTop,dieBottom,gauge,warning,perspective};
   },{perspective});
   assert.ok(result.dieTop>result.gauge.y+result.gauge.height+8,
    'El TOPE tapa matriz en '+target.id+' '+perspective+' '+JSON.stringify(result));
   assert.ok(result.dieTop>result.warning.y+result.warning.height+8,
    'El aviso naranja tapa matriz en '+target.id+' '+perspective);
   assert.ok(result.warning.y>=result.gauge.y+result.gauge.height,
    'Dos avisos se superponen en '+target.id);
   await page.locator('#machineCanvas').screenshot({
    path:'test-results/r121-hud-'+target.id+'-'+(perspective?'perspectiva':'perfil')+'.png'});
  }
  assert.deepEqual(errors,[],'JavaScript: '+target.id);
  await ctx.close();
 }
}finally{await browser?.close();server.kill();}
