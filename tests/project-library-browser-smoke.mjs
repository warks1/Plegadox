import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {mkdirSync} from 'node:fs';
import {chromium} from 'playwright';
mkdirSync('test-results',{recursive:true});
const server=spawn('python3',['-m','http.server','4341','--bind','127.0.0.1'],{stdio:'ignore'});
let browser;
try{
 browser=await chromium.launch({headless:true,args:['--no-sandbox']});
 for(const dev of [{name:'pc',w:1440,h:900,mobile:false},
  {name:'iphone',w:390,h:844,mobile:true}]){
  const context=await browser.newContext({
   viewport:{width:dev.w,height:dev.h},isMobile:dev.mobile,hasTouch:dev.mobile});
  const page=await context.newPage(),errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  page.on('dialog',d=>d.accept());
  await page.goto('http://127.0.0.1:4341/',{waitUntil:'networkidle',timeout:30000});
  await page.locator('[data-tab="programacion"]').click();
  assert.ok(await page.locator('#projectLibraryPanel').isVisible());
  assert.equal(await page.locator('#libraryItems .px-library-entry').count(),0);
  await page.locator('#libraryClient').fill('Taller prueba');
  await page.locator('#librarySaveBtn').click();
  assert.equal(await page.locator('#libraryItems .px-library-entry').count(),1);
  assert.match(await page.locator('#libraryActiveLabel').textContent(),/revisión 1/);
  await page.locator('#pieceName').fill('OMEGA SEGUNDA REVISION');
  await page.locator('#pieceName').dispatchEvent('change');
  assert.match(await page.locator('#libraryActiveLabel').textContent(),
   /Cambios sin guardar/);
  await page.locator('#librarySaveBtn').click();
  assert.match(await page.locator('#libraryActiveLabel').textContent(),/revisión 2/);
  await page.locator('#libraryItems button').filter({hasText:'Abrir r1'}).click();
  assert.equal(await page.locator('#pieceName').inputValue(),'Omega · ejemplo geométrico');
  await page.locator('#newBtn').click();
  await page.locator('#pieceName').fill('PIEZA CLIENTE B');
  await page.locator('#pieceName').dispatchEvent('change');
  await page.locator('#libraryClient').fill('Cliente B');
  await page.locator('#librarySaveBtn').click();
  assert.equal(await page.locator('#libraryItems .px-library-entry').count(),2);
  await page.reload({waitUntil:'networkidle'});
  await page.locator('[data-tab="programacion"]').click();
  assert.equal(await page.locator('#libraryItems .px-library-entry').count(),2);
  assert.equal(await page.locator('#pieceName').inputValue(),'PIEZA CLIENTE B');
  await page.locator('#pieceName').fill('BETA SIN GUARDAR');
  await page.locator('#pieceName').dispatchEvent('change');
  await page.reload({waitUntil:'networkidle'});
  await page.locator('[data-tab="programacion"]').click();
  assert.equal(await page.locator('#pieceName').inputValue(),'BETA SIN GUARDAR');
  assert.match(await page.locator('#libraryActiveLabel').textContent(),
   /Cambios sin guardar/,'Una recarga no debe fingir guardado en biblioteca');
  // La eliminación requiere confirmación; la otra pieza sigue intacta.
  await page.locator('#libraryItems .px-library-entry')
   .filter({hasText:'PIEZA CLIENTE B'}).getByRole('button',{name:'Eliminar'}).click();
  assert.equal(await page.locator('#libraryItems .px-library-entry').count(),1);
  assert.match(await page.locator('#libraryItems').textContent(),/OMEGA SEGUNDA REVISION/);
  await page.screenshot({path:'test-results/biblioteca-piezas-'+dev.name+'.png',fullPage:false});
  assert.deepEqual(errors,[],dev.name+' sin excepciones');
  console.log('PROJECT_LIBRARY_UI_OK '+dev.name);
  await context.close();
 }
}finally{await browser?.close();server.kill();}
