import assert from 'node:assert/strict';
import {chromium} from 'playwright';
import {spawn} from 'node:child_process';
import {mkdirSync} from 'node:fs';
mkdirSync('test-results',{recursive:true});
const server=spawn('python3',['-m','http.server','4323','--bind','127.0.0.1'],{stdio:'ignore'});
let browser;
try{
 browser=await chromium.launch({headless:true,args:['--no-sandbox']});
 for(const viewport of [
  {name:'pc',width:1440,height:900,mobile:false},
  {name:'iphone',width:390,height:844,mobile:true}
 ]){
  const context=await browser.newContext({
   viewport:{width:viewport.width,height:viewport.height},
   isMobile:viewport.mobile,hasTouch:viewport.mobile
  });
  const page=await context.newPage(),errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  await page.goto('http://127.0.0.1:4323/',{waitUntil:'networkidle'});
  await page.locator('[data-tab="programacion"]').click();
  const snapshot=async()=>{
   await page.locator('[data-tab="simulacion"]').click();
   const v=await page.evaluate(()=>{
    const c=document.querySelector('#machineCanvas');
    const ico=document.querySelector('.cp-float-tool:first-child svg path:last-of-type');
    return {image:c.toDataURL(),icon:ico?.getAttribute('d'),
      tool:window.PLEGADOX_STATE().piece.punch};
   });
   await page.locator('[data-tab="programacion"]').click();
   return v;
  };
  await page.locator('#punch').selectOption('straight88');
  const straight=await snapshot();
  await page.locator('#punch').selectOption('goose');
  const goose=await snapshot();
  assert.equal(goose.tool,'goose');
  assert.notEqual(goose.image,straight.image,'Pata de cabra 90° debe cambiar la geometría de la máquina');
  assert.notEqual(goose.icon,straight.icon,'El pictograma de cabina no puede seguir siendo recto');
  const actual=await page.evaluate(async()=>{
   const {sectionPunch}=await import('/tool-profiles.js');
   const {PUNCHES}=await import('/engine.js');
   return sectionPunch(PUNCHES.find(p=>p.id==='goose'));
  });
  assert.equal(actual.model,'gooseneck');
  assert.equal(actual.height,130);
  await page.locator('#punch').selectOption('ref-goose-50-100-r1');
  await page.locator('[data-tab="simulacion"]').click();
  const picture=await page.evaluate(async()=>{
   const {sectionPunch,sectionBounds}=await import('/tool-profiles.js');
   const {PUNCHES}=await import('/engine.js');
   const shape=sectionPunch(PUNCHES.find(p=>p.id==='ref-goose-50-100-r1'));
   return {shape,bounds:sectionBounds(shape.points),active:window.PLEGADOX_STATE().piece.punch};
  });
  assert.equal(picture.active,'ref-goose-50-100-r1');
  assert.equal(picture.shape.height,100);
  assert.equal(picture.bounds.maxX-picture.bounds.minX,50);
  assert.equal(picture.shape.tipRadius,1);
  await page.screenshot({path:'test-results/pata-cabra-'+viewport.name+'.png',fullPage:false});
  assert.deepEqual(errors,[],viewport.name+' sin errores JS');
  await context.close();
  console.log('GOOSENECK_BROWSER_OK '+viewport.name);
 }
}finally{await browser?.close();server.kill();}
