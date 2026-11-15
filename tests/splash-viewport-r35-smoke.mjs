import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {chromium} from 'playwright';
const server=spawn('python3',['-m','http.server','4345','--bind','127.0.0.1'],{stdio:'ignore'});
let browser;
try{
 browser=await chromium.launch({headless:true,args:['--no-sandbox']});
 for(const device of [
  {name:'PC',width:1440,height:900},
  {name:'Tablet vertical',width:820,height:1180},
  {name:'iPhone vertical',width:390,height:844},
  {name:'iPhone horizontal',width:844,height:390},
  {name:'Pantalla estrecha',width:320,height:568}
 ]){
  const page=await browser.newPage({viewport:{width:device.width,height:device.height}}),errors=[];
  page.on('pageerror',error=>errors.push(error.message));
  await page.goto('http://127.0.0.1:4345/splash-foto-premium.html',{waitUntil:'load'});
  await page.waitForFunction(()=>document.querySelector('#photo')?.naturalWidth>0);
  const data=await page.evaluate(()=>{
   const box=id=>{const b=document.getElementById(id).getBoundingClientRect();return {
    left:b.left,right:b.right,top:b.top,bottom:b.bottom,width:b.width,height:b.height};};
   const img=document.getElementById('photo');
   return {frame:box('screen'),photo:box('photo'),progress:box('progress'),
    bars:document.querySelectorAll('[role=progressbar]').length,
    src:img.getAttribute('src'),natural:[img.naturalWidth,img.naturalHeight],
    overflow:document.documentElement.scrollWidth>window.innerWidth+2 ||
     document.documentElement.scrollHeight>window.innerHeight+2};
  });
  assert.equal(data.src,'./plegadox-premium-selected.png');
  assert.deepEqual(data.natural,[1672,941]);
  assert.equal(data.bars,1);
  assert.equal(data.overflow,false,device.name+': sin scroll');
  assert.ok(data.frame.left>=-2&&data.frame.right<=device.width+2,device.name+': arte completo X');
  assert.ok(data.frame.top>=-2&&data.frame.bottom<=device.height+2,device.name+': arte completo Y');
  assert.ok(Math.abs(data.frame.width/data.frame.height-1672/941)<.01,device.name+': proporciones exactas');
  assert.ok(data.progress.left>=data.frame.left-2&&data.progress.right<=data.frame.right+2);
  assert.ok(data.progress.top>=data.frame.top-2&&data.progress.bottom<=data.frame.bottom+2);
  await page.evaluate(()=>window.PlegadoXLoading.setProgress(73));
  assert.equal(await page.locator('#percent').textContent(),'73%');
  assert.deepEqual(errors,[],device.name+': sin errores JS');
  await page.close();
 }
 console.log('SPLASH_BOCETO1_ORIGINAL_RESPONSIVE_OK');
}finally{await browser?.close();server.kill();}
