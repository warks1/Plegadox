import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {mkdirSync} from 'node:fs';
import {chromium} from 'playwright';
mkdirSync('test-results',{recursive:true});
const server=spawn('python3',['-m','http.server','4453','--bind','127.0.0.1'],{stdio:'ignore'});
let browser;
try{
 browser=await chromium.launch({headless:true,args:['--no-sandbox']});
 const context=await browser.newContext({viewport:{width:1280,height:800},
  deviceScaleFactor:2.5,hasTouch:true,isMobile:true,
  userAgent:'Mozilla/5.0 (Linux; Android 14; SM-X700) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36'});
 const page=await context.newPage(),errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 await page.goto('http://127.0.0.1:4453/',{waitUntil:'networkidle',timeout:45000});
 await page.waitForFunction(()=>typeof window.PLEGADOX_SOLID_RENDER==='function',
  null,{timeout:20000});
 await page.locator('#machineSolidToggle').click();
 const details=await page.evaluate(async()=>{
  const cad=await import('/machine-cad.js');
  const config=await import('/machine-config.js');
  const machine=config.getActiveMachineConfig();
  const key=cad.machineConfigurationKey(machine);
  cad.saveMachineCad(localStorage,{kind:'stopZ1',
   points:[[0,0],[12,0],[12,20],[0,20]],
   offsetX:0,offsetY:0,zMin:-120,zMax:-100,
   source:'Ensayo independiente Z1, no OEM',machineConfigKey:key});
  cad.saveMachineCad(localStorage,{kind:'stopZ2',
   points:[[0,0],[23,0],[23,15],[0,15]],
   offsetX:28,offsetY:3,zMin:100,zMax:120,
   source:'Ensayo independiente Z2, no OEM',machineConfigKey:key});
  const values={machineGaugeZTime:'0',
   machineGaugeZ1Min:'-120',machineGaugeZ1Max:'-100',
   machineGaugeZ2Min:'100',machineGaugeZ2Max:'120',
   machineGaugeZSource:'Ensayo de calibracion de perfiles independientes'};
  for(const [id,value] of Object.entries(values))
   document.getElementById(id).value=value;
  document.getElementById('machineGaugeZKind').value='stop';
  document.getElementById('machineGaugeZIdentical').checked=false;
  document.getElementById('machineGaugeZSave').click();
  window.dispatchEvent(new CustomEvent('plegadox:machineChanged'));
  return {
   saved:document.getElementById('machineGaugeZStatus').textContent,
   status:document.getElementById('machineSolidStatus').textContent
  };
 });
 assert.match(details.saved,/dos DXF individuales/,
  'El formulario de dos CAD no debe exigir la sección idéntica: '+JSON.stringify(details));
 await page.waitForFunction(()=>document.querySelector('#machineSolidStatus')?
  .textContent.includes('DOS_PERFILES_DXF_INDEPENDIENTES'),null,{timeout:20000});
 const model=await page.evaluate(async()=>{
  const {getActiveMachineConfig}=await import('/machine-config.js');
  const {technicalScene}=await import('/technical-section.js');
  const {buildVolumeScene}=await import('/volume-engine.js');
  const state=window.PLEGADOX_STATE();
  const m=buildVolumeScene(technicalScene(state.piece,0),
   {machine:getActiveMachineConfig()});
  return {paired:m.gaugeReferenceOnly,status:m.gaugeFingerReview.status,
   missing:m.missingCadComponents,
   z1:m.objects.gaugeZ1?.polygon?.[0],z2:m.objects.gaugeZ2?.polygon?.[0]};
 });
 assert.equal(model.paired,true,JSON.stringify(model));
 assert.notDeepEqual(model.z1,model.z2,'Perfiles independientes deben dibujarse distintos');
 assert.equal(model.missing.includes('stop'),false);
 await page.locator('#machineSolidCanvas')
  .screenshot({path:'test-results/r129-galaxy-cad-independiente-z1-z2.png'});
 const before=await page.evaluate(()=>window.PLEGADOX_SOLID_RENDER_STATS());
 const box=await page.locator('#machineSolidCanvas').boundingBox();
 await page.mouse.move(box.x+box.width*.5,box.y+box.height*.5);
 await page.mouse.down();
 await page.mouse.move(box.x+box.width*.5+84,box.y+box.height*.5+32,{steps:8});
 await page.mouse.up();
 const after=await page.evaluate(()=>window.PLEGADOX_SOLID_RENDER_STATS());
 assert.equal(after.misses,before.misses,'Orbitar Galaxy no debe reimportar CAD');
 const blocked=await page.evaluate(async()=>{
  const cad=await import('/machine-cad.js');
  const row=cad.loadMachineCad(localStorage).stopZ2;
  cad.saveMachineCad(localStorage,{...row,source:'Otra revision CAD Z2 incompatible'});
  window.dispatchEvent(new CustomEvent('plegadox:machineChanged'));
  return document.getElementById('machineGaugeZStatus').textContent;
 });
 assert.match(blocked,/Bloqueadas cotas|BLOQUEADAS|Bloqueadas/);
 await page.waitForFunction(()=>document.querySelector('#machineSolidStatus')?
  .textContent.includes('DXF_CAMBIADO_Z2'),null,{timeout:20000});
 assert.equal(await page.evaluate(()=>window.PLEGADOX_STATE().piece.width),500);
 assert.deepEqual(errors,[],'Errores en Chrome Galaxy');
 console.log('R129_GALAXY_INDEPENDENT_DXF_Z1_Z2_INVALIDATION_OK');
 await context.close();
}finally{await browser?.close();server.kill();}
