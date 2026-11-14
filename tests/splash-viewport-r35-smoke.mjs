import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {chromium} from 'playwright';

const server=spawn('python3',['-m','http.server','4345','--bind','127.0.0.1'],{stdio:'ignore'});
let browser;
try{
 browser=await chromium.launch({headless:true,args:['--no-sandbox']});
 const devices=[
  {name:'PC 16:9',width:1440,height:900},
  {name:'Tablet vertical',width:820,height:1180},
  {name:'iPhone vertical',width:390,height:844},
  {name:'iPhone horizontal',width:844,height:390},
  {name:'Pantalla estrecha',width:320,height:568}
 ];
 for(const device of devices){
  const page=await browser.newPage({viewport:{width:device.width,height:device.height}});
  const errors=[];
  page.on('pageerror',error=>errors.push(error.message));
  await page.goto('http://127.0.0.1:4345/splash-foto-premium.html',{waitUntil:'load'});
  await page.waitForFunction(()=>document.querySelector('#photo')?.naturalWidth>0);
  const layout=await page.evaluate(()=>{
   const rect=id=>{
    const e=document.getElementById(id),r=e.getBoundingClientRect();
    return {x:r.x,y:r.y,w:r.width,h:r.height,right:r.right,bottom:r.bottom};
   };
   const photo=document.getElementById('photo');
   return {screen:rect('screen'),image:rect('photo'),progress:rect('progress'),
    message:rect('message'),fit:getComputedStyle(photo).objectFit,
    natural:[photo.naturalWidth,photo.naturalHeight]};
  });
  assert.ok(Math.abs(layout.screen.w-device.width)<2,device.name+' sin ancho completo');
  assert.ok(Math.abs(layout.screen.h-device.height)<2,device.name+' sin alto completo');
  assert.deepEqual(layout.natural,[1672,941],device.name+' boceto original');
  assert.equal(layout.fit,'contain',device.name+' no deformar imagen');
  assert.ok(layout.image.x>=-2&&layout.image.right<=device.width+2,device.name+' imagen desbordada');
  assert.ok(layout.progress.x>=-2&&layout.progress.right<=device.width+2,device.name+' barra cortada horizontalmente');
  assert.ok(layout.progress.y>=-2&&layout.progress.bottom<=device.height+2,device.name+' barra cortada verticalmente');
  assert.ok(layout.message.x>=-2&&layout.message.right<=device.width+2,device.name+' mensaje fuera del visor');
  await page.evaluate(()=>window.PlegadoXLoading.setProgress(73));
  assert.equal(await page.locator('#percent').textContent(),'73%');
  assert.deepEqual(errors,[],device.name+' errores JS');
  await page.close();
 }
 console.log('SPLASH_VIEWPORT_R35_OK');
}finally{await browser?.close();server.kill();}
