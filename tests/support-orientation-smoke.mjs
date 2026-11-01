import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {chromium} from 'playwright';
import {mkdirSync} from 'node:fs';
mkdirSync('test-results',{recursive:true});
const server=spawn('python3',['-m','http.server','4295','--bind','127.0.0.1'],{stdio:'ignore'});
let browser;
try{
 browser=await chromium.launch({headless:true,args:['--no-sandbox']});
 for(const device of [{name:'desktop',w:1536,h:900,touch:false},{name:'mobile',w:390,h:844,touch:true}]){
  const context=await browser.newContext({viewport:{width:device.w,height:device.h},
   isMobile:device.touch,hasTouch:device.touch});
  const page=await context.newPage(),errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  await page.goto('http://127.0.0.1:4295/',{waitUntil:'networkidle',timeout:30000});
  await page.locator('[data-tab="maquina"]').click();
  const before=await page.locator('#machineSupportProfile').evaluate(el=>el.toDataURL());
  const geometry=await page.evaluate(async()=>{
   const {getV85,gaugeOutline,gaugeContactFeature}=await import('/machine-config.js');
   const {technicalScene}=await import('/technical-section.js');
   const {gaugePlacement,gaugeContourAtContact}=await import('/backgauge-placement.js');
   const cfg=getV85();
   const old=gaugeOutline(cfg.support),mirrored=gaugeOutline(cfg.support,2);
   const scene=technicalScene(window.PLEGADOX_STATE().piece,.5);
   const place=gaugePlacement(scene,2);
   return {old,mirrored,face:gaugeContactFeature(cfg.support,2),
    world:gaugeContourAtContact(place,cfg.support),place,
    dimensions:cfg.support};
  });
  assert.deepEqual(geometry.dimensions,[70,100,8,25,12,8]);
  assert.deepEqual(geometry.mirrored,geometry.old);
  assert.equal(geometry.mirrored[5].x,0,'la cara baja delantera está a la izquierda');
  assert.equal(geometry.mirrored[4].x,30,'el primer escalón mira hacia la chapa');
  assert.equal(geometry.face.point.x,30,'escalón de Support al lado opuesto');
  assert.deepEqual(geometry.world[5],geometry.place.contact.from);
  assert.deepEqual(geometry.world[4],geometry.place.contact.to);
  assert.equal(geometry.face.from.y,geometry.face.to.y);
  assert.equal(geometry.place.contact.point.y,geometry.place.point.y-1);
  await page.screenshot({path:'test-results/support-orientation-'+device.name+'.png',fullPage:false});
  const input=page.locator('#machineSupportFields input[data-path="support.0"]');
  await input.fill('55');await input.dispatchEvent('change');
  const after=await page.locator('#machineSupportProfile').evaluate(el=>el.toDataURL());
  assert.notEqual(before,after,'El esquema espejado debe actualizarse al cambiar L1');
  const updated=await page.evaluate(async()=>{
   const {getV85,gaugeOutline}=await import('/machine-config.js');
   return {values:getV85().support,pts:gaugeOutline(getV85().support,2)};
  });
  assert.equal(updated.values[0],55);
  assert.equal(updated.pts[3].x,45);
  assert.deepEqual(errors,[],'Errores de ejecución del visor '+device.name);
  await context.close();
 }
 console.log('SUPPORT_ORIENTATION_OK');
}finally{await browser?.close();server.kill();}
