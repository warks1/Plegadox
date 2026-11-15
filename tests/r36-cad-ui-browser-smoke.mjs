import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {readFileSync,mkdirSync} from 'node:fs';
import {chromium} from 'playwright';

const pairs=items=>items.join('\n')+'\n';
const line=(x1,y1,x2,y2)=>['0','LINE','10',String(x1),'20',String(y1),
 '11',String(x2),'21',String(y2)];
const arc=(cx,cy,r,start,end)=>['0','ARC','10',String(cx),'20',String(cy),
 '40',String(r),'50',String(start),'51',String(end)];
const cadDXF=pairs([
 '0','SECTION','2','HEADER','9','$INSUNITS','70','4','0','ENDSEC',
 '0','SECTION','2','ENTITIES',
 ...line(-20,0,20,0),...arc(0,80,20,0,180),
 ...line(20,0,20,80),...line(-20,80,-20,0),
 '0','ENDSEC','0','EOF'
]);
mkdirSync('test-results',{recursive:true});
const server=spawn('python3',['-m','http.server','4371','--bind','127.0.0.1'],
 {stdio:'ignore'});
let browser;
try{
 browser=await chromium.launch({headless:true,args:['--no-sandbox']});
 const page=await browser.newPage({viewport:{width:1440,height:900},
  acceptDownloads:true});
 const errors=[];
 page.on('pageerror',err=>errors.push(err.message));
 await page.goto('http://127.0.0.1:4371/',{waitUntil:'networkidle',timeout:40000});
 await page.locator('[data-tab="maquina"]').click();
 assert.ok(await page.locator('#machineCadPanel').isVisible());
 await page.locator('#machineCadKind').selectOption('ram');
 await page.locator('#machineCadOffsetX').fill('0');
 await page.locator('#machineCadOffsetY').fill('180');
 await page.locator('#machineCadZMin').fill('-60');
 await page.locator('#machineCadZMax').fill('60');
 await page.locator('#machineCadSource').fill('Plano de prueba DXF ARC + LINE');
 await page.locator('#machineCadFile').setInputFiles({
  name:'tram-cad-arc.dxf',mimeType:'application/dxf',buffer:Buffer.from(cadDXF)});
 await page.locator('#machineCadSave').click();
 await page.waitForFunction(()=>{
  const raw=localStorage.getItem('plegadox:machine-cad:v1');
  return raw&&JSON.parse(raw).ram?.points.length>20;
 });
 const stored=await page.evaluate(()=>JSON.parse(
  localStorage.getItem('plegadox:machine-cad:v1')));
 assert.equal(stored.ram.kind,'ram');
 assert.equal(stored.ram.offsetY,180);
 assert.equal(stored.ram.zMin,-60);
 assert.ok(stored.ram.points.length>20);
 assert.ok(Math.abs(stored.ram.dimensionHeight-100)<.001);
 assert.equal(stored.ram.industrialVerified,false);
 assert.ok(await page.locator('#machineRamProfile').isVisible());
 await page.screenshot({path:'test-results/r36-cad-arc-maquina.png',fullPage:false});
 const downloadCad=page.waitForEvent('download');
 await page.locator('#machineAxisTemplate').click();
 const axis=JSON.parse(readFileSync(await (await downloadCad).path(),'utf8'));
 assert.equal(axis.unit,'mm');
 assert.equal(axis.limits.X.min,null,'no inventar límites físicos CNC');
 assert.equal(axis.poses.length,0,'no fabricar una trayectoria falsa');
 await page.locator('#machineAxisMappingPanel summary').click();
 const downloadMapping=page.waitForEvent('download');
 await page.locator('#machineAxisMappingTemplate').click();
 const map=JSON.parse(readFileSync(await (await downloadMapping).path(),'utf8'));
 assert.equal(map.signs.X,null,'no suponer signo de X');
 assert.equal(map.activeFinger,null,'no suponer dedo CNC activo');
 assert.match(map.machineConfigKey,/^machine-[0-9a-f]{8}$/);
 const completed={...map,signs:{Y:1,X:1,R:1,Z1:1,Z2:1},
  activeFinger:'Z1',referenceSceneTime:0,ramTiltTolerance:.5,
  source:'Ensayo de referencia y sentidos de ejes de prueba'};
 await page.locator('#machineAxisMappingImport').setInputFiles({
  name:'datum-ensayo.json',mimeType:'application/json',
  buffer:Buffer.from(JSON.stringify(completed))});
 await page.waitForFunction(()=>{
  const data=localStorage.getItem('plegadox:axis-cad-mapping:v1');
  return data&&JSON.parse(data).machineConfigKey.startsWith('machine-');
 });
 const imported=await page.evaluate(()=>JSON.parse(
  localStorage.getItem('plegadox:axis-cad-mapping:v1')));
 assert.equal(imported.machineConfigKey,map.machineConfigKey);
 assert.equal(imported.certified,false);
 await page.locator('#machineCadDelete').click();
 const remaining=await page.evaluate(()=>JSON.parse(
  localStorage.getItem('plegadox:machine-cad:v1')));
 assert.equal(remaining.ram,undefined);
 assert.deepEqual(errors,[]);
 console.log('R36_CAD_ARC_UI_OK');
}finally{await browser?.close();server.kill();}
