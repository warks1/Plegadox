import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {chromium} from 'playwright';
import {mkdirSync} from 'node:fs';
mkdirSync('test-results',{recursive:true});
const server=spawn('python3',['-m','http.server','4203','--bind','127.0.0.1'],{stdio:'ignore'});
let browser;
try{
 browser=await chromium.launch({headless:true,args:['--no-sandbox']});
 for(const v of [{name:'desktop',w:1536,h:900,mobile:false},
                 {name:'movil',w:390,h:844,mobile:true}]){
  const ctx=await browser.newContext({viewport:{width:v.w,height:v.h},
   isMobile:v.mobile,hasTouch:v.mobile,deviceScaleFactor:1});
  const page=await ctx.newPage(),errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  await page.goto('http://127.0.0.1:4203/',{waitUntil:'networkidle'});
  await page.locator('#machineCanvas').waitFor({state:'visible'});
  for(const pos of [0,170,565,930]){
   await page.locator('#timeline').evaluate((input,pos)=>{
    input.value=String(pos);input.dispatchEvent(new Event('input',{bubbles:true}));
   },pos);
   const punch=await page.evaluate(async()=>{
    const {technicalScene}=await import('/technical-section.js');
    const {machineToolProjection}=await import('/machine-visual.js');
    const state=window.PLEGADOX_STATE(),scene=technicalScene(state.piece,state.sim.time);
    const canvas=document.querySelector('#machineCanvas'),r=canvas.getBoundingClientRect();
    const scale=Math.min(r.width/740,r.height/510);
    const proj=machineToolProjection(scene,r.width*.48,r.height*.665,scale).punch;
    const xmin=Math.max(0,Math.floor(Math.min(...proj.map(p=>p[0]))));
    const xmax=Math.min(r.width,Math.ceil(Math.max(...proj.map(p=>p[0]))));
    const ymin=Math.max(0,Math.floor(Math.min(...proj.map(p=>p[1]))));
    const ymax=Math.min(r.height,Math.ceil(Math.max(...proj.map(p=>p[1]))));
    const factor=canvas.width/r.width;
    const pixels=canvas.getContext('2d').getImageData(
     Math.floor(xmin*factor),Math.floor(ymin*factor),
     Math.max(1,Math.floor((xmax-xmin)*factor)),
     Math.max(1,Math.floor((ymax-ymin)*factor))).data;
    let pale=0;
    for(let i=0;i<pixels.length;i+=4){
     if(pixels[i]>205&&pixels[i+1]>209&&pixels[i+2]>212&&pixels[i+3]>200)pale++;
    }
    return {pale,w:xmax-xmin,h:ymax-ymin};
   });
   assert.ok(punch.w>5&&punch.h>10,'Contorno de punzón en pantalla '+v.name+' '+pos);
   assert.ok(punch.pale>20,'Punzón debe ser CLARO y visible '+v.name+' t='+pos+' '+JSON.stringify(punch));
  }
  await page.locator('#chooseGauge2').click();
  assert.match(await page.locator('#activeGaugeLabel').textContent(),/TOPE 2/);
  await page.locator('#machineSection').click();
  assert.match(await page.locator('#machineGraphicMode').textContent(),/SECCIÓN EN MM/);
  const section1=await page.locator('#machineCanvas').evaluate(c=>c.toDataURL());
  await page.locator('#chooseGauge1').click();
  const section2=await page.locator('#machineCanvas').evaluate(c=>c.toDataURL());
  assert.notEqual(section2,section1,'El tope debe cambiar también en la sección mm');
  await page.screenshot({path:'test-results/punch-and-stop-'+v.name+'.png',fullPage:false});
  assert.deepEqual(errors,[],v.name+' sin excepciones de interfaz');
  console.log('PUNCH_STOP_VISIBILITY_'+v.name.toUpperCase()+'_OK');
  await ctx.close();
 }
}finally{await browser?.close();server.kill();}
