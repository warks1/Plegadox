import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {chromium} from 'playwright';

const server=spawn('python3',['-m','http.server','4277','--bind','127.0.0.1'],{stdio:'ignore'});
let browser;
try {
 browser=await chromium.launch({headless:true,args:['--no-sandbox']});
 const page=await browser.newPage({viewport:{width:1280,height:900}});
 const errors=[];page.on('pageerror',err=>errors.push(err.message));
 await page.addInitScript(()=>{
  // Simular ausencia de la API nativa anterior a Safari 16 / Firefox 112.
  CanvasRenderingContext2D.prototype.roundRect=undefined;
 });
 await page.goto('http://127.0.0.1:4277/',{waitUntil:'networkidle',timeout:30000});
 await page.locator('#machineCanvas').waitFor({state:'visible'});
 await page.locator('[data-tab="programacion"]').click();
 await page.locator('#finalCanvas').waitFor({state:'visible'});
 await page.locator('[data-tab="simulacion"]').click();
 await page.locator('#machineSection').click();
 await page.locator('#machineCanvas').waitFor({state:'visible'});
 await page.locator('[data-tab="maquina"]').click();
 await page.locator('#machineRamProfile').waitFor({state:'visible'});
 assert.deepEqual(errors,[],'No deben fallar los lienzos por faltar roundRect: '+errors.join('; '));
 console.log('CANVAS_LEGACY_OK');
}finally{
 await browser?.close();
 server.kill();
}
