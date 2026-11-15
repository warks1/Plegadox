import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {mkdirSync} from 'node:fs';
import {chromium} from 'playwright';

mkdirSync('test-results',{recursive:true});
const port=4358;
const server=spawn('python3',['-m','http.server',String(port),'--bind','127.0.0.1'],
 {stdio:'ignore'});
let browser;
try{
 browser=await chromium.launch({headless:true,args:['--no-sandbox']});
 for(const dev of [
  {name:'PC',width:1440,height:900,mobile:false},
  {name:'iPhone',width:390,height:844,mobile:true}
 ]){
  const context=await browser.newContext({
   viewport:{width:dev.width,height:dev.height},isMobile:dev.mobile,
   hasTouch:dev.mobile,serviceWorkers:'block'
  });
  const page=await context.newPage(),errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  let request=null;
  await page.route('**/__plegadox_usb__/status',route=>route.fulfill({
   status:200,contentType:'application/json',
   body:JSON.stringify({mode:'usb',available:true,token:'prueba-r86',
    folder:'MIS_PROYECTOS',maxBytes:4*1024*1024})
  }));
  await page.route('**/__plegadox_usb__/backup',async route=>{
   request=route.request();
   await route.fulfill({
    status:201,contentType:'application/json',
    body:JSON.stringify({saved:true,file:'PlegadoX-PRUEBA-R86.json',
     folder:'MIS_PROYECTOS'})
   });
  });
  await page.goto('http://127.0.0.1:'+port+'/',{
   waitUntil:'networkidle',timeout:30000});
  await page.locator('[data-tab="programacion"]').click();
  await page.locator('#saveUsbBackupBtn').waitFor({state:'visible',timeout:15000});
  assert.equal(await page.locator('#usbBackupHint').isVisible(),true,
   'Debe explicar la carpeta real donde se guardará la copia');
  assert.equal(request,null,'Nunca guardar en USB sin pulsar el botón');
  await page.locator('#saveUsbBackupBtn').click();
  await page.waitForFunction(()=>document.querySelector('#completeProjectStatus')?.
   textContent.includes('PlegadoX-PRUEBA-R86.json'),null,{timeout:10000});
  assert.equal(request?.method(),'POST');
  const headers=request.headers();
  assert.equal(headers['x-plegadox-usb-token'],'prueba-r86');
  assert.match(headers['content-type'],/application\/json/);
  const backup=JSON.parse(request.postData());
  assert.equal(backup.format,'plegadox-complete-project-v1');
  assert.equal(backup.schemaVersion,1);
  assert.deepEqual(backup.piece.order,[0,1,3,2]);
  assert.deepEqual(backup.piece.angles,[90,-90,-90,90]);
  assert.ok(Array.isArray(backup.importedTools));
  assert.ok(Array.isArray(backup.library));
  assert.ok(backup.machine&&Array.isArray(backup.machine.stop));
  assert.ok(request.postDataBuffer().length<=4*1024*1024);
  assert.equal((await page.locator('#completeProjectStatus').getAttribute('data-state')),
   'success');
  assert.deepEqual(errors,[],dev.name+': sin errores de JavaScript');
  await page.screenshot({path:'test-results/usb-directo-r86-'+dev.name+'.png'});
  await context.close();
 }
 // PlegadoX web normal NO puede mostrar el botón ni pedir acceso al USB.
 const context=await browser.newContext({serviceWorkers:'block'});
 const page=await context.newPage();
 await page.route('**/__plegadox_usb__/status',route=>route.fulfill({
  status:404,body:'No se ejecuta desde USB'}));
 await page.goto('http://127.0.0.1:'+port+'/',{waitUntil:'networkidle'});
 assert.equal(await page.locator('#saveUsbBackupBtn').isVisible(),false);
 await context.close();
 console.log('USB_DIRECT_BACKUP_BROWSER_OK PC iPhone web-sin-USB');
}finally{
 await browser?.close();
 server.kill();
}
