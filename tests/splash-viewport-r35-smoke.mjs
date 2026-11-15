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
  const page=await browser.newPage({viewport:{width:device.width,height:device.height}}),errors=[];
  page.on('pageerror',error=>errors.push(error.message));
  await page.goto('http://127.0.0.1:4345/splash-foto-premium.html',{waitUntil:'load'});
  await page.waitForFunction(()=>document.querySelector('#machineArt')?.naturalWidth>0);
  const d=await page.evaluate(()=>{
   const rect=id=>{const x=document.getElementById(id).getBoundingClientRect();
    return {x:x.x,y:x.y,w:x.width,h:x.height,right:x.right,bottom:x.bottom};};
   const photo=document.getElementById('machineArt');
   return {screen:rect('screen'),image:rect('machineArt'),
    progress:rect('progress'),message:rect('message'),brand:rect('brand'),
    dock:rect('dock'),fit:getComputedStyle(photo).objectFit,
    natural:[photo.naturalWidth,photo.naturalHeight],
    features:document.querySelectorAll('.feature').length,
    bars:document.querySelectorAll('[role=progressbar]').length};
  });
  assert.ok(Math.abs(d.screen.w-device.width)<2,device.name+' ancho completo');
  assert.ok(Math.abs(d.screen.h-device.height)<2,device.name+' alto completo');
  assert.ok(d.natural[0]>0&&d.natural[1]>0,device.name+' SVG montado accesible');
  assert.equal(d.fit,'contain',device.name+' no deformar máquina');
  assert.equal(d.features,6,device.name+' funciones completas');
  assert.equal(d.bars,1,device.name+' no duplicar barra');
  assert.ok(d.image.x>=-2&&d.image.right<=device.width+2,device.name+' máquina sin desborde horizontal');
  assert.ok(d.image.y>=-2&&d.image.bottom<=device.height+2,device.name+' máquina sin desborde vertical');
  assert.ok(d.progress.x>=-2&&d.progress.right<=device.width+2,device.name+' barra horizontal dentro');
  assert.ok(d.progress.y>=-2&&d.progress.bottom<=device.height+2,device.name+' barra vertical dentro');
  assert.ok(d.message.x>=-2&&d.message.right<=device.width+2,device.name+' mensaje dentro');
  await page.evaluate(()=>window.PlegadoXLoading.setProgress(73));
  assert.equal(await page.locator('#percent').textContent(),'73 %');
  assert.deepEqual(errors,[],device.name+' errores JS');
  await page.close();
 }
 console.log('SPLASH_VIEWPORT_R52_OK');
}finally{await browser?.close();server.kill();}
