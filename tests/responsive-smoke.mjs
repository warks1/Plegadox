import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {chromium} from 'playwright';
import {mkdirSync} from 'node:fs';

mkdirSync('test-results',{recursive:true});
const server=spawn('python3',['-m','http.server','4174','--bind','127.0.0.1'],{stdio:'ignore'});
let browser;
const cases=[
 {name:'telefono-mini',w:320,h:568,touch:true,expected:'mobile'},
 {name:'telefono-compacto',w:360,h:740,touch:true,expected:'mobile'},
 {name:'iphone',w:390,h:844,touch:true,expected:'mobile'},
 {name:'telefono-grande',w:430,h:932,touch:true,expected:'mobile'},
 {name:'telefono-horizontal',w:844,h:390,touch:true,expected:'mobile'},
 {name:'tableta-pequena',w:768,h:1024,touch:true,expected:'tablet'},
 {name:'tableta-moderna',w:834,h:1194,touch:true,expected:'tablet'},
 {name:'tableta-horizontal',w:1024,h:768,touch:true,expected:'tablet'},
 {name:'tableta-grande-horizontal',w:1180,h:820,touch:true,expected:'tablet'},
 {name:'ordenador-compacto',w:1280,h:800,touch:false,expected:'desktop'},
 {name:'ordenador',w:1536,h:900,touch:false,expected:'desktop'},
 {name:'monitor-fullhd',w:1920,h:1080,touch:false,expected:'desktop'},
 {name:'monitor-4k',w:2560,h:1440,touch:false,expected:'desktop'}
];
const visited=[];
try{
 browser=await chromium.launch({headless:true,args:['--no-sandbox']});
 for(const item of cases){
  const context=await browser.newContext({viewport:{width:item.w,height:item.h},isMobile:item.touch,hasTouch:item.touch,deviceScaleFactor:item.touch?2:1});
  const page=await context.newPage(),errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  await page.goto('http://127.0.0.1:4174/',{waitUntil:'networkidle',timeout:30000});
  await page.locator('#machineCanvas').waitFor({state:'visible'});
  await page.waitForFunction(()=>document.documentElement.dataset.layout,{timeout:5000});
  const result=await page.evaluate(()=>{
   const rect=id=>{const r=document.querySelector(id).getBoundingClientRect();return {x:r.left,y:r.top,w:r.width,h:r.height,right:r.right}};
   const body=document.documentElement;
   const canvas=document.querySelector('#machineCanvas');
   const nav=document.querySelector('.sidebar');
   const cards=[...document.querySelectorAll('.cockpit-bottom>.card')];
   return {
    actual:body.scrollWidth,viewport:window.innerWidth,
    layout:body.dataset.layout,orientation:body.dataset.orientation,input:body.dataset.input,
    machine:rect('#machineCanvas'),viewer:rect('.cp-simulation'),sidebar:rect('.sidebar'),navScroll:nav.scrollWidth,
    navClient:nav.clientWidth,play:rect('#playBtn'),toolbar:rect('.cp-player .controls'),
    library:rect('.cp-library'),program:rect('#tab-simulacion'),cards:cards.map(c=>({width:c.getBoundingClientRect().width,x:c.getBoundingClientRect().x,right:c.getBoundingClientRect().right})),
    pixelWidth:canvas.width,pixelHeight:canvas.height
   };
  });
  assert.equal(result.layout,item.expected,item.name+': vista incorrecta '+JSON.stringify(result));
  assert.ok(result.actual<=result.viewport+2,item.name+': desbordamiento horizontal '+JSON.stringify(result));
  assert.ok(result.machine.w>=150&&result.machine.h>=160,item.name+': escena demasiado pequeña '+JSON.stringify(result.machine));
  assert.ok(result.machine.right<=result.viewport+2,item.name+': escena fuera de pantalla');
  assert.ok(result.play.w>=35,item.name+': botón de reproducción demasiado pequeño');
  assert.ok(result.library.right<=result.viewport+2,item.name+': biblioteca recortada '+JSON.stringify(result.library));
  assert.ok(result.cards.every(c=>c.width>70&&c.right<=result.viewport+2),item.name+': panel inferior desbordado '+JSON.stringify(result.cards));
  assert.ok(result.pixelWidth>0&&result.pixelHeight>0,item.name+': canvas no redimensionado');
  assert.deepEqual(errors,[],item.name+': errores de JS '+errors.join('; '));
  if(['telefono-mini','iphone','telefono-horizontal','tableta-pequena','tableta-horizontal','ordenador','monitor-fullhd'].includes(item.name)){
   await page.screenshot({path:'test-results/responsive-'+item.name+'.png',fullPage:true});
  }
  visited.push({name:item.name,layout:result.layout,width:item.w,height:item.h,scrollWidth:result.actual,canvas:[result.machine.w,result.machine.h]});
  await context.close();
 }
 // Same session, actual rotation/resize without page reload; preserve selected piece.
 const context=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true,deviceScaleFactor:2});
 const page=await context.newPage();
 await page.goto('http://127.0.0.1:4174/',{waitUntil:'networkidle'});
 await page.locator('#machineCanvas').waitFor({state:'visible'});
 await page.locator('#cpBrandTabs button[data-brand="Amada"]').click();
 await page.locator('#cockpitTools .cp-tool-card').first().click();
 const chosen=await page.locator('#topPunch').textContent();
 await page.setViewportSize({width:844,height:390});
 await page.waitForFunction(()=>document.documentElement.dataset.layout==='mobile' && document.documentElement.dataset.orientation==='landscape');
 const current=await page.locator('#topPunch').textContent();
 assert.equal(current,chosen,'La herramienta seleccionada debe conservarse al girar');
 const rotated=await page.evaluate(()=>({width:window.innerWidth,scroll:document.documentElement.scrollWidth,canvasWidth:document.querySelector('#machineCanvas').width}));
 assert.ok(rotated.scroll<=rotated.width+2,'Desbordamiento tras rotación '+JSON.stringify(rotated));
 assert.ok(rotated.canvasWidth>0);
 await page.setViewportSize({width:390,height:844});
 await page.waitForFunction(()=>document.documentElement.dataset.orientation==='portrait');
 await page.locator('#playBtn').click();
 await page.waitForTimeout(350);
 assert.ok(Number(await page.locator('#timeline').inputValue())>0,'La simulación debe seguir funcionando después del giro');
 await page.locator('#pauseBtn').click();
 await context.close();
 console.log('RESPONSIVE_OK '+JSON.stringify(visited));
}finally{await browser?.close();server.kill();}
