import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {mkdirSync} from 'node:fs';
import {chromium} from 'playwright';

mkdirSync('test-results',{recursive:true});
const server=spawn('python3',['-m','http.server','4398','--bind','127.0.0.1'],{stdio:'ignore'});
let browser;
try{
 browser=await chromium.launch({headless:true,args:['--no-sandbox']});
 for(const d of [{name:'pc',w:1440,h:900,mobile:false},
  {name:'iphone',w:390,h:844,mobile:true}]){
  const context=await browser.newContext({viewport:{width:d.w,height:d.h},
   isMobile:d.mobile,hasTouch:d.mobile});
  const page=await context.newPage();
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto('http://127.0.0.1:4398/',{waitUntil:'networkidle',timeout:30000});
  await page.locator('[data-tab="programacion"]').click();
  await page.locator('#newBtn').click();
  const root=page.locator('#touchProgramPanel');
  assert.equal(await root.getAttribute('data-input-mode'),d.mobile?'touch':'mouse');
  assert.equal(await page.locator('#touchProgramPad').isVisible(),d.mobile,
   'Keypad sólo para pantalla táctil; PC usa teclado físico');
  if(!d.mobile){
   const first=page.locator('#touchProgramSvg [data-segment="0"]');
   await first.click();
   assert.match(await page.locator('#touchProgramScreen').textContent(),/Ala 1/);
   await page.locator('#touchProgramSvg [data-segment="0"]').dblclick();
   assert.equal(await page.locator('#touchValue').evaluate(x=>document.activeElement===x),true,
    'Doble clic debe preparar la edición con teclado PC');
   await page.locator('#touchValue').fill('125');
   await page.locator('#touchValue').press('Enter');
   assert.equal(await page.locator('#flangeRows input[aria-label="Longitud ala 1"]').inputValue(),'125');

   await page.locator('#touchProgramSvg [data-bend="0"]').click();
   await page.locator('#touchValue').fill('-90');
   await page.locator('#touchValue').press('Enter');
   assert.equal(await page.locator('#flangeRows .angle-input').first().inputValue(),'-90');
   const x=page.locator('#touchProgramSvg [data-segment="0"]');
   const box=await x.boundingBox();
   assert.ok(box&&box.width>40,'El ala debe tener zona de clic y arrastre');
   const startX=box.x+box.width*.5,startY=box.y+box.height*.5;
   await page.mouse.move(startX,startY);
   await page.mouse.down();
   await page.mouse.move(startX+65,startY,{steps:9});
   await page.mouse.up();
   const updated=await page.evaluate(()=>window.PLEGADOX_STATE().piece);
   assert.ok(updated.flanges[0]>125&&updated.flanges[0]<250,
    'Arrastrar a la derecha debe alargar el ala seleccionada: '+updated.flanges[0]);
   assert.deepEqual(updated.angles,[-90]);
   assert.deepEqual(updated.order,[0]);
   // Pan with mouse on empty SVG background; no change to dimensions.
   const svg=page.locator('#touchProgramSvg');
   const r=await svg.boundingBox();
   const pre=await svg.locator('g').first().getAttribute('transform');
   await page.mouse.move(r.x+12,r.y+15);
   await page.mouse.down();
   await page.mouse.move(r.x+80,r.y+45,{steps:5});
   await page.mouse.up();
   const post=await svg.locator('g').first().getAttribute('transform');
   assert.notEqual(pre,post,'Arrastrar el fondo debe desplazar la vista');
   await page.mouse.move(r.x+r.width/2,r.y+r.height/2);
   await page.mouse.wheel(0,-180);
   const zoom=await svg.locator('g').first().getAttribute('transform');
   assert.notEqual(post,zoom,'Rueda de ratón debe ampliar o alejar la vista');
   // Double click/drag must never create new bends accidentally.
   assert.deepEqual(await page.evaluate(()=>window.PLEGADOX_STATE().piece.angles),[-90]);
  }else{
   await page.locator('#touchProgramSvg [data-segment="0"]').tap();
   assert.match(await page.locator('#touchProgramScreen').textContent(),/Ala 1/);
   await page.locator('#touchProgramPad [data-key="clear"]').tap();
   await page.locator('#touchProgramPad [data-key="6"]').tap();
   await page.locator('#touchProgramPad [data-key="0"]').tap();
   await page.locator('#touchProgramApply').tap();
   assert.equal(await page.locator('#flangeRows input[aria-label="Longitud ala 1"]').inputValue(),'60');
  }
  assert.deepEqual(errors,[],d.name+': sin errores de JS');
  await page.screenshot({path:'test-results/editor-raton-'+d.name+'.png',fullPage:false});
  console.log('MOUSE_OR_TOUCH_PROGRAMMER_OK '+d.name);
  await context.close();
 }
}finally{await browser?.close();server.kill();}
