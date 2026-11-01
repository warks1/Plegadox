import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {chromium} from 'playwright';
import {mkdirSync} from 'node:fs';

mkdirSync('test-results',{recursive:true});
const server=spawn('python3',['-m','http.server','4312','--bind','127.0.0.1'],{stdio:'ignore'});
let browser;
try{
 browser=await chromium.launch({headless:true,args:['--no-sandbox']});
 for(const device of [
  {name:'escritorio',width:1440,height:900,mobile:false},
  {name:'iphone',width:390,height:844,mobile:true}
 ]){
  const context=await browser.newContext({
   viewport:{width:device.width,height:device.height},
   isMobile:device.mobile,hasTouch:device.mobile
  });
  const page=await context.newPage(),errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  await page.goto('http://127.0.0.1:4312/',{waitUntil:'networkidle',timeout:30000});
  await page.locator('[data-tab="simulacion"]').click();
  await page.locator('#machineSection').click();
  assert.equal(await page.locator('#machineSection').getAttribute('aria-pressed'),'true');
  for(const t of [.5,4.6,4.83,5.1,9.5,10.5,14.7,15.3]){
   const result=await page.evaluate(async time=>{
    const {technicalScene}=await import('/technical-section.js');
    const {gaugePlacement,gaugeContourAtContact}=await import('/backgauge-placement.js');
    const {getV85}=await import('/machine-config.js');
    const piece=window.PLEGADOX_STATE().piece;
    const s=technicalScene(piece,time),n=piece.stopByBend[s.stage.activeBend]===2?2:1;
    const place=gaugePlacement(s,n),cfg=getV85();
    const contour=gaugeContourAtContact(place,n===2?cfg.support:cfg.stop);
    const rect=document.querySelector('#machineCanvas').getBoundingClientRect();
    const w=rect.width,h=rect.height,drawH=h-(w<500?67:0);
    const bounds=s.world,padW=Math.max(28,w*.07),padH=Math.max(30,drawH*.095);
    const scale=Math.max(.08,Math.min((w-padW*2)/Math.max(60,bounds.maxX-bounds.minX),
      (drawH-padH*2)/Math.max(100,bounds.maxY-bounds.minY)));
    const mx=(bounds.minX+bounds.maxX)/2,my=(bounds.minY+bounds.maxY)/2;
    return {points:contour.map(pt=>({
     x:w*.5+(pt.x-mx)*scale,y:drawH*.5-(pt.y-my)*scale
    })),w,drawH};
   },t);
   assert.ok(result.points.length>=6,'El tope no tiene contorno visible');
   for(const point of result.points){
    assert.ok(point.x>=0&&point.x<=result.w,
     device.name+' / '+t+' tope recortado X: '+JSON.stringify(result));
    assert.ok(point.y>=0&&point.y<=result.drawH,
     device.name+' / '+t+' tope recortado Y: '+JSON.stringify(result));
   }
  }
  await page.screenshot({path:'test-results/tope-encuadrado-'+device.name+'.png',fullPage:false});
  assert.deepEqual(errors,[],'Errores de consola en '+device.name);
  await context.close();
 }
 console.log('GAUGE_FRAMING_BROWSER_OK');
}finally{await browser?.close();server.kill();}
