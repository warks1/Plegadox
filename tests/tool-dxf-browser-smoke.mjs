import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {chromium} from 'playwright';
const server=spawn('python3',['-m','http.server','4296','--bind','127.0.0.1'],{stdio:'ignore'});
const dxf=(units=4)=>[
 '0','SECTION','2','HEADER','9','$INSUNITS','70',String(units),'0','ENDSEC',
 '0','SECTION','2','ENTITIES','0','LWPOLYLINE',
 '8','PERFIL','90','7','70','1',
 '10','-24','20','100','10','16','20','100',
 '10','16','20','58','10','2','20','58',
 '10','2','20','32','10','-10','20','0',
 '10','-24','20','32','0','ENDSEC','0','EOF'
].join('\n')+'\n';
let browser;
try{
 browser=await chromium.launch({headless:true,args:['--no-sandbox']});
 const context=await browser.newContext({viewport:{width:1366,height:900}});
 const page=await context.newPage(),errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 await page.goto('http://127.0.0.1:4296/',{waitUntil:'networkidle',timeout:30000});
 await page.locator('[data-tab="herramientas"]').click();
 await page.locator('#toolDxfPanel > summary').click();
 const file=page.locator('#toolDxfFile');
 await file.setInputFiles({name:'Pata-cabra-DXF.dxf',mimeType:'application/dxf',
  buffer:Buffer.from(dxf())});
 await page.waitForFunction(()=>!document.querySelector('#toolDxfCommit').disabled);
 assert.equal(await page.locator('#toolDxfCanvas').isVisible(),true);
 await page.locator('#toolDxfName').fill('Punzón pata de cabra DXF');
 await page.locator('#toolDxfCommit').click();
 assert.match(await page.locator('#toolDxfStatus').textContent(),/añadido a la biblioteca/);
 const punch=await page.evaluate(async()=>{
  const {sectionPunch}=await import('/tool-profiles.js');
  const {PUNCHES}=await import('/engine.js');
  const p=window.PLEGADOX_STATE().piece;
  const t=PUNCHES.find(x=>x.id===p.punch);
  return {id:p.punch,imported:t?.importedDxf,points:sectionPunch(t).points,
   provisional:sectionPunch(t).provisional};
 });
 assert.match(punch.id,/^user-dxf-punch-/);
 assert.equal(punch.imported,true);
 assert.equal(punch.provisional,true);
 assert.equal(punch.points.length,7);
 await page.reload({waitUntil:'networkidle'});
 assert.equal(await page.evaluate(()=>window.PLEGADOX_STATE().piece.punch),punch.id,
  'La herramienta importada persiste después de recargar');
 assert.equal(await page.locator('#punch').inputValue(),punch.id);
 await page.locator('[data-tab="herramientas"]').click();
 await page.locator('#toolDxfPanel > summary').click();
 await page.locator('#toolDxfKind').selectOption('die');
 await page.locator('#toolDxfName').fill('Matriz propia DXF');
 await page.locator('#toolDxfOpening').fill('22');
 await page.locator('#toolDxfFile').setInputFiles({name:'Matriz-DXF.dxf',mimeType:'application/dxf',
  buffer:Buffer.from(dxf())});
 await page.waitForFunction(()=>!document.querySelector('#toolDxfCommit').disabled);
 await page.locator('#toolDxfCommit').click();
 const die=await page.evaluate(async()=>{
  const {technicalScene}=await import('/technical-section.js');
  const scene=technicalScene(window.PLEGADOX_STATE().piece,2.8);
  return {id:window.PLEGADOX_STATE().piece.die,imported:scene.die.importedDxf,
   width:scene.die.opening,polygon:scene.diePolygon.length};
 });
 assert.match(die.id,/^user-dxf-die-/);
 assert.equal(die.imported,true);
 assert.equal(die.width,22);
 assert.equal(die.polygon,7);
 // La importación no debe cambiar los ángulos programados de la pieza omega.
 assert.deepEqual(await page.evaluate(()=>window.PLEGADOX_STATE().piece.angles),[90,-90,-90,90]);
 await page.locator('#toolDxfFile').setInputFiles({name:'Pulgadas.dxf',mimeType:'application/dxf',
  buffer:Buffer.from(dxf(1))});
 assert.equal(await page.locator('#toolDxfCommit').isDisabled(),true);
 assert.match(await page.locator('#toolDxfStatus').textContent(),/no milimétricas/);
 assert.deepEqual(errors,[],'Excepciones navegador DXF');
 console.log('TOOL_DXF_IMPORT_OK');
}finally{await browser?.close();server.kill();}
