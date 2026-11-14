import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {chromium} from 'playwright';
import {mkdirSync} from 'node:fs';

mkdirSync('test-results',{recursive:true});
const server=spawn('python3',['-m','http.server','4391','--bind','127.0.0.1'],{stdio:'ignore'});
let browser;
const dxf=(height=104)=>{
 const coords=[[-20,height],[20,height],[20,0],[-20,0]];
 return ['0','SECTION','2','HEADER','9','$INSUNITS','70','4',
  '0','ENDSEC','0','SECTION','2','ENTITIES',
  '0','LWPOLYLINE','8','TOOL','90','4','70','1',
  ...coords.flatMap(([x,y])=>['10',String(x),'20',String(y)]),
  '0','ENDSEC','0','EOF'].join('\n')+'\n';
};
try{
 browser=await chromium.launch({headless:true,args:['--no-sandbox']});
 for(const {name,width,height,mobile} of [
  {name:'pc',width:1440,height:900,mobile:false},
  {name:'iphone',width:390,height:844,mobile:true}
 ]){
  const context=await browser.newContext({
   viewport:{width,height},isMobile:mobile,hasTouch:mobile
  });
  const page=await context.newPage(),errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  await page.goto('http://127.0.0.1:4391/',{
   waitUntil:'networkidle',timeout:30000
  });
  assert.equal(await page.locator('#cpBrandTabs [data-brand="Eurostamp"]').count(),1);
  await page.locator('[data-tab="herramientas"]').click();
  await page.locator('#eurostampCadPanel summary').click();
  assert.equal(await page.locator('#eurostampCadRef option').count(),29);
  await page.locator('#eurostampCadRef').selectOption('eurostamp-p1193');
  assert.match(await page.locator('#eurostampCadSource').getAttribute('href'),/1193-punch-30/);
  const pending=await page.evaluate(async()=>{
   const {PUNCHES}=await import('/engine.js');
   return PUNCHES.find(x=>x.id==='eurostamp-p1193').importedDxf;
  });
  assert.equal(pending,undefined,'no fingir CAD antes de importación');
  await page.locator('#eurostampCadFile').setInputFiles({
   name:'1193.dxf',mimeType:'application/dxf',buffer:Buffer.from(dxf())
  });
  await page.locator('#eurostampCadCommit').waitFor({state:'visible'});
  assert.equal(await page.locator('#eurostampCadCommit').isEnabled(),true);
  await page.locator('#eurostampCadCommit').click();
  assert.match(await page.locator('#eurostampCadStatus').textContent(),
   /Contorno DXF 2D vinculado a Eurostamp 1193/);
  const imported=await page.evaluate(async()=>{
   const {PUNCHES}=await import('/engine.js');
   const {sectionPunch}=await import('/tool-profiles.js');
   const tool=PUNCHES.find(x=>x.id==='eurostamp-p1193');
   return {verified:tool.cadVerified,imported:tool.importedDxf,
    points:sectionPunch(tool).points.length,status:tool.cadStatus};
  });
  assert.equal(imported.imported,true);
  assert.equal(imported.points,4);
  assert.equal(imported.verified,false);
  assert.match(imported.status,/pendiente-montaje/);
  await page.reload({waitUntil:'networkidle'});
  const persisted=await page.evaluate(async()=>{
   const {PUNCHES}=await import('/engine.js');
   const {sectionPunch}=await import('/tool-profiles.js');
   const tool=PUNCHES.find(x=>x.id==='eurostamp-p1193');
   return {found:!!tool,imported:tool.importedDxf,
    points:sectionPunch(tool).points.length};
  });
  assert.equal(persisted.imported,true);
  assert.equal(persisted.points,4);
  await page.screenshot({path:'test-results/eurostamp-R38-'+name+'.png',
   fullPage:false});
  assert.deepEqual(errors,[],'Sin errores JS en '+name);
  await context.close();
  console.log('EUROSTAMP_R38_BROWSER_OK '+name);
 }
}finally{await browser?.close();server.kill();}
