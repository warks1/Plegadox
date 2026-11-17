import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {mkdirSync} from 'node:fs';
import {chromium} from 'playwright';

mkdirSync('test-results',{recursive:true});
const server=spawn('python3',['-m','http.server','4461','--bind','127.0.0.1'],{
 stdio:'ignore'
});
let browser;
try{
 browser=await chromium.launch({headless:true,args:['--no-sandbox']});
 const context=await browser.newContext({
  viewport:{width:1280,height:800},deviceScaleFactor:2.5,
  isMobile:true,hasTouch:true,
  userAgent:'Mozilla/5.0 (Linux; Android 14; SM-X700) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36'
 });
 const page=await context.newPage(),errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 await page.goto('http://127.0.0.1:4461/index.html',{
  waitUntil:'networkidle',timeout:45000
 });
 await page.waitForFunction(()=>typeof window.PLEGADOX_STATE==='function',
  null,{timeout:30000});
 const state=await page.evaluate(async()=>{
  const manifest=await (await fetch('./manifest.webmanifest')).json();
  const maskable=manifest.icons.find(i=>i.purpose==='maskable');
  const img=new Image();
  const result=await new Promise((resolve,reject)=>{
   img.onload=()=>resolve({width:img.naturalWidth,height:img.naturalHeight});
   img.onerror=()=>reject(Error('SVG maskable no carga en Chrome Galaxy'));
   img.src='./icon-android-maskable.svg';
  });
  const canvas=document.createElement('canvas');
  canvas.width=512;canvas.height=512;
  canvas.id='r137MaskablePreview';canvas.style.cssText=
   'position:fixed;inset:20px auto auto 20px;width:240px;height:240px;z-index:1000';
  const ctx=canvas.getContext('2d',{willReadFrequently:true});
  ctx.drawImage(img,0,0,512,512);
  const pixel=(x,y)=>[...ctx.getImageData(x,y,1,1).data];
  const corners=[pixel(0,0),pixel(511,0),pixel(0,511),pixel(511,511)];
  const data=ctx.getImageData(160,140,192,230).data;
  let bright=0,blue=0;
  for(let i=0;i<data.length;i+=4){
   if(data[i]+data[i+1]+data[i+2]>380)bright++;
   if(data[i+2]>data[i]+30&&data[i+1]>data[i]+15)blue++;
  }
  document.body.append(canvas);
  return {
   name:manifest.name,shortName:manifest.short_name,
   background:manifest.background_color,
   maskable:maskable?.src,normal512:manifest.icons.find(i=>
    i.src==='./icon-premium-512.png')?.purpose,
   width:result.width,height:result.height,
   corners,bright,blue,
   splashFrame:document.getElementById('pxSplashReference')?.getAttribute('src'),
   splashSrc:document.getElementById('pxSplashReference')?.contentDocument
    ?.getElementById('photo')?.getAttribute('src')??null,
   iOSIcon:document.querySelector('link[rel="apple-touch-icon"]')?.getAttribute('href'),
   version:document.querySelector('meta[name="plegadox-build"]')?.content
  };
 });
 assert.equal(state.name,'PlegadoX');
 assert.equal(state.shortName,'PlegadoX');
 assert.equal(state.background,'#060c16');
 assert.equal(state.maskable,'./icon-android-maskable.svg');
 assert.equal(state.normal512,'any');
 assert.equal(state.width,512);
 assert.equal(state.height,512);
 for(const rgba of state.corners){
  assert.equal(rgba[3],255,'Esquinas transparentes podrían producir el cuadro blanco de Android');
  assert.ok(rgba[0]<80&&rgba[1]<80&&rgba[2]<100,
   'El fondo exterior del icono debe ser oscuro');
 }
 assert.ok(state.bright>100,'El símbolo metálico premium ha desaparecido');
 assert.ok(state.blue>100,'Se ha perdido el acento azul industrial');
 assert.equal(state.splashFrame,'./splash-foto-premium.html');
 assert.equal(state.splashSrc,'./plegadox-premium-selected.png');
 assert.equal(state.iOSIcon,'./icon-premium-180.png');
 assert.match(state.version,/^PLEGADOX-\d{8}-R\d+$/);
 await page.locator('#r137MaskablePreview').screenshot({
  path:'test-results/r137-galaxy-icono-android-maskable.png'
 });
 assert.deepEqual(errors,[]);
 console.log('R137_GALAXY_MASKABLE_OPAQUE_NO_WHITE_SQUARE_AND_PREMIUM_SPLASH_OK');
 await context.close();
}finally{
 await browser?.close();server.kill();
}
