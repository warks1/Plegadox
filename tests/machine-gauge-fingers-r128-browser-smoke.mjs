import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {mkdirSync} from 'node:fs';
import {chromium} from 'playwright';
mkdirSync('test-results',{recursive:true});
const server=spawn('python3',['-m','http.server','4452','--bind','127.0.0.1'],{stdio:'ignore'});
let browser;
try{
 browser=await chromium.launch({headless:true,args:['--no-sandbox']});
 const context=await browser.newContext({viewport:{width:1280,height:800},
  isMobile:true,hasTouch:true,deviceScaleFactor:2.5,
  userAgent:'Mozilla/5.0 (Linux; Android 14; SM-X700) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36'});
 const page=await context.newPage(),errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 await page.goto('http://127.0.0.1:4452/',{waitUntil:'networkidle',timeout:45000});
 await page.waitForFunction(()=>typeof window.PLEGADOX_SOLID_RENDER==='function',
  null,{timeout:25000});
 await page.locator('#machineSolidToggle').click();
 await page.waitForFunction(()=>document.querySelector('#machineSolidStatus')?.
  textContent.includes('Dedos Z1/Z2:'),null,{timeout:25000});
 assert.match(await page.locator('#machineSolidStatus').textContent(),/FALTAN_Z1_Z2/);
 const loaded=await page.evaluate(async()=>{
  const {getActiveMachineConfig}=await import('/machine-config.js');
  const {machineConfigurationKey,saveMachineCad}=await import('/machine-cad.js');
  const machine=getActiveMachineConfig();
  saveMachineCad(localStorage,{kind:'stop',
   points:[[-30,-10],[30,-10],[30,45],[-30,45]],
   offsetX:0,offsetY:0,zMin:-50,zMax:50,
   source:'Perfil test DXF de dos dedos sin certificar',
   machineConfigKey:machineConfigurationKey(machine)});
  window.dispatchEvent(new CustomEvent('plegadox:machineChanged'));
  const values={
   machineGaugeZTime:'0',
   machineGaugeZ1Min:'-120',
   machineGaugeZ1Max:'-100',
   machineGaugeZ2Min:'100',
   machineGaugeZ2Max:'120',
   machineGaugeZSource:'Registro de prueba de datos Z1/Z2 NO OEM'
  };
  for(const [id,value] of Object.entries(values))
   document.getElementById(id).value=value;
  document.getElementById('machineGaugeZKind').value='stop';
  document.getElementById('machineGaugeZIdentical').checked=true;
  document.getElementById('machineGaugeZSave').click();
  return document.getElementById('machineGaugeZStatus').textContent;
 });
 assert.match(loaded,/Z1 y Z2 declarados/);
 await page.waitForFunction(()=>document.querySelector('#machineSolidStatus')?.
  textContent.includes('DOS_DEDOS_Z_EN_POSE_DECLARADA'),
  null,{timeout:20000});
 assert.match(await page.locator('#machineGaugeEvidence').textContent(),/Dos dedos independientes/);
 await page.locator('#machineSolidCanvas')
  .screenshot({path:'test-results/r128-dos-dedos-z-galaxy.png'});
 const before=await page.evaluate(()=>window.PLEGADOX_SOLID_RENDER_STATS());
 const rect=await page.locator('#machineSolidCanvas').boundingBox();
 await page.mouse.move(rect.x+rect.width/2,rect.y+rect.height/2);
 await page.mouse.down();
 await page.mouse.move(rect.x+rect.width/2+90,rect.y+rect.height/2+40,
  {steps:7});
 await page.mouse.up();
 const after=await page.evaluate(()=>window.PLEGADOX_SOLID_RENDER_STATS());
 assert.equal(after.misses,before.misses,
  'La malla de ambos dedos se reutiliza al orbitar en Galaxy');
 await page.evaluate(()=>window.PLEGADOX_SEEK_PREVIEW({operation:1,fraction:.2}));
 await page.waitForFunction(()=>document.querySelector('#machineSolidStatus')?.
  textContent.includes('OTRA_POSE'),null,{timeout:20000});
 assert.equal((await page.locator('#machineSolidStatus').textContent())
  .includes('DOS_DEDOS_Z_EN_POSE_DECLARADA'),false);
 await page.evaluate(()=>window.PLEGADOX_SEEK_PREVIEW({operation:0,fraction:0}));
 await page.waitForFunction(()=>document.querySelector('#machineSolidStatus')?.
  textContent.includes('DOS_DEDOS_Z_EN_POSE_DECLARADA'),null,{timeout:20000});
 await page.reload({waitUntil:'networkidle'});
 assert.match(await page.locator('#machineGaugeZStatus').textContent(),/Z1 y Z2 declarados/);
 assert.deepEqual(errors,[]);
 console.log('R128_GALAXY_DUAL_Z_CAD_POSE_AND_CACHE_OK');
 await context.close();
}finally{await browser?.close();server.kill();}
