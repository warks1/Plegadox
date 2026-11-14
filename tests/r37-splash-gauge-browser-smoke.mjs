import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {chromium} from 'playwright';
const server=spawn('python3',['-m','http.server','4397','--bind','127.0.0.1'],{stdio:'ignore'});
let browser;
try{
 browser=await chromium.launch({headless:true,args:['--no-sandbox']});
 for(const device of [
  {name:'pc',width:1440,height:900,mobile:false},
  {name:'iphone',width:390,height:844,mobile:true}]){
  const context=await browser.newContext({viewport:{width:device.width,height:device.height},
   isMobile:device.mobile,hasTouch:device.mobile});
  const page=await context.newPage(),errors=[];
  page.on('pageerror',err=>errors.push(err.message));
  await page.goto('http://127.0.0.1:4397/splash-foto-premium.html',
   {waitUntil:'networkidle',timeout:30000});
  const photo=page.locator('#frame'),bar=page.locator('#progress');
  const p=await photo.boundingBox(),b=await bar.boundingBox();
  assert.ok(p&&b,'La fotografía y el progreso deben aparecer');
  assert.ok(b.x>=p.x-1&&b.y>=p.y-1&&
   b.x+b.width<=p.x+p.width+1&&b.y+b.height<=p.y+p.height+1,
   'La barra REAL no puede ir fuera de la foto y DUPLICAR el porcentaje de la imagen');
  assert.ok(Math.abs((b.y-p.y)/p.height-.814)<.025,'Progreso alineado con el boceto original');
  if(device.mobile)assert.equal(await page.locator('#foldLive').isVisible(),true);
  await page.goto('http://127.0.0.1:4397/',{waitUntil:'networkidle',timeout:30000});
  await page.waitForFunction(()=>typeof window.PLEGADOX_STATE==='function');
  await page.locator('[data-tab="simulacion"]').click();
  await page.locator('#timeline').evaluate(el=>{
   el.value='260';el.dispatchEvent(new Event('input',{bubbles:true}));
  });
  await page.locator('#chooseContactShelf').click();
  const result=await page.evaluate(async()=>{
   const {piece,sim}=window.PLEGADOX_STATE();
   const {technicalScene}=await import('/technical-section.js');
   const {gaugePlacement}=await import('/backgauge-placement.js');
   const scene=technicalScene(piece,sim.time);
   return {modes:[...piece.gaugeContactByBend],
    selected:gaugePlacement(scene,piece.stopByBend[scene.stage.activeBend]).contact.surface,
    bend:scene.stage.activeBend};
  });
  assert.equal(result.modes[result.bend],'shelf');
  assert.equal(result.selected,'horizontal-top');
  assert.equal(result.modes.filter(m=>m==='shelf').length,1,'No modificar el resto de pliegues');
  await page.locator('#chooseContactFront').click();
  assert.ok((await page.locator('#activeGaugeReference').textContent()).includes('CONTACTO FRONTAL'));
  assert.deepEqual(errors,[],'Error de JS en '+device.name);
  await context.close();
  console.log('R37_FRONT_AND_SPLASH_BROWSER_OK '+device.name);
 }
}finally{await browser?.close();server.kill();}
