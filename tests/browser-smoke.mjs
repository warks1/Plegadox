import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {chromium} from 'playwright';
import {mkdirSync} from 'node:fs';
mkdirSync('test-results',{recursive:true});

const server=spawn('python3',['-m','http.server','4173','--bind','127.0.0.1'],{stdio:'ignore'});
let browser;
try{
  browser=await chromium.launch({headless:true,args:['--no-sandbox']});
  const desktop=await browser.newContext({viewport:{width:1536,height:900},deviceScaleFactor:1});
  const page=await desktop.newPage(),errors=[];
  page.on('pageerror',err=>errors.push(err.message));
  await page.goto('http://127.0.0.1:4173/',{waitUntil:'networkidle',timeout:30000});
  await page.locator('#machineCanvas').waitFor({state:'visible'});
  assert.ok(await page.locator('#cockpitTools .cp-tool-card').count()>0,'Hay tarjetas de herramientas');
  await page.locator('[data-tab="herramientas"]').click();
  const card= id=>page.locator('#punchCards .tool[data-tool-id="'+id+'"]');
  const shape30=await card('straight30').locator('svg path').getAttribute('d');
  const shapeGoose=await card('ref-goose-50-100-r1').locator('svg path').getAttribute('d');
  const shapeGn9=await card('conic-gn9-12-8806').locator('svg path').getAttribute('d');
  const shapeGn6=await card('conic-gn6-12-8806').locator('svg path').getAttribute('d');
  assert.notEqual(shape30,shapeGoose,'La pata de cabra no puede dibujarse como punzón recto');
  assert.notEqual(shapeGn9,shapeGn6,'GN9 y GN6 tienen escotes diferentes');
  assert.equal(await page.locator('#punchCards .tool svg.tool-geometry').count(),
    await page.locator('#punchCards .tool').count(),'Todas las fichas de punzón deben tener su dibujo');
  assert.equal(await page.locator('#dieCards .tool svg.tool-geometry').count(),
    await page.locator('#dieCards .tool').count(),'Todas las matrices deben tener dibujo');
  await page.locator('#dieCards .tool[data-tool-id="conic-v006-30-s"]').click();
  assert.equal(await page.evaluate(()=>window.PLEGADOX_STATE().piece.die),'conic-v006-30-s',
    'La selección de V6/30 debe modificar la matriz del programa');
  assert.match(await page.locator('#dieCards .tool[data-tool-id="conic-v006-30-s"]').getAttribute('class'),/selected/);
  await page.locator('[data-tab="simulacion"]').click();

  await page.locator('#showTool3D').click();
  assert.ok(await page.locator('#cockpitSelectedTool3D').isVisible(),'Visor 3D de herramienta se abre');
  await page.locator('#closeTool3D').click();
  // El catálogo de portada debe mostrar los 30° y las patas de cabra reales.
  assert.ok(await page.locator('#cockpitTools .cp-tool-card').filter({hasText:'GN9-12-8806'}).count(),
    'La pata de cabra GN9 debe ser visible sin desplegar todo el catálogo');
  assert.ok(await page.locator('#cockpitTools .cp-tool-card').filter({hasText:'V006-30-S'}).count(),
    'La matriz V6/30 debe ser visible inicialmente');
  const initialIcon=await page.locator('.cp-float-tool:first-child svg > path').getAttribute('d');
  await page.locator('#cpBrandTabs button[data-brand="Amada"]').click();
  await page.locator('.cp-kind-tabs [data-kind="punch"]').click();
  assert.ok(await page.locator('#cockpitTools .cp-tool-card').count()>=7,'Punzones Amada cargados');
  await page.locator('#cockpitTools .cp-tool-card').first().click();
  const selectedIcon=await page.locator('.cp-float-tool:first-child svg > path').getAttribute('d');
  assert.notEqual(selectedIcon,initialIcon,'El pictograma debe reflejar el punzón seleccionado');

  await page.locator('#playBtn').click();
  await page.waitForTimeout(800);
  assert.ok(Number(await page.locator('#timeline').inputValue())>0,'El tiempo de simulación avanza');
  await page.locator('#pauseBtn').click();
  await page.screenshot({path:'test-results/plegadox-desktop.png',fullPage:true});
  const preview=await page.screenshot({type:'jpeg',quality:43,fullPage:false});
  console.log('UI_SCREENSHOT_BEGIN');
  const data=preview.toString('base64');
  for(let i=0;i<data.length;i+=1800)console.log('UI_IMAGE_CHUNK:'+data.slice(i,i+1800));
  console.log('UI_SCREENSHOT_END');
  await page.locator('[data-tab="programacion"]').click();
  await page.locator('.angle-input').first().fill('-90');
  await page.locator('.angle-input').first().dispatchEvent('change');
  assert.equal(await page.locator('.angle-input').first().inputValue(),'-90');
  await page.locator('[data-tab="simulacion"]').click();
  const label=await page.locator('#cockpitAngle').textContent();
  assert.ok(label.includes('-90'),'Se conserva el signo negativo');
  assert.deepEqual(errors,[],'Sin errores JavaScript en escritorio: '+errors.join('; '));
  const mobile=await browser.newContext({viewport:{width:390,height:844},deviceScaleFactor:1,isMobile:true,hasTouch:true});
  const phone=await mobile.newPage(),mobileErrors=[];
  phone.on('pageerror',err=>mobileErrors.push(err.message));
  await phone.goto('http://127.0.0.1:4173/',{waitUntil:'networkidle',timeout:30000});
  await phone.locator('#machineCanvas').waitFor({state:'visible'});
  await phone.locator('[data-tab="herramientas"]').click();
  assert.ok(await phone.locator('#punchCards .tool svg.tool-geometry').count()>5,
    'Los punzones deben tener su propio dibujo también en móvil');
  await phone.locator('[data-tab="simulacion"]').click();
  await phone.locator('#cpBrandTabs button[data-brand="Bystronic"]').click();
  assert.ok(await phone.locator('#cockpitTools .cp-tool-card').count()>0,'Herramientas Bystronic visibles en móvil');
  const scroll=await phone.evaluate(()=>({actual:document.documentElement.scrollWidth,viewport:window.innerWidth}));
  assert.ok(scroll.actual<=scroll.viewport+4,'Sin desbordamiento horizontal global en móvil: '+JSON.stringify(scroll));
  await phone.screenshot({path:'test-results/plegadox-mobile.png',fullPage:true});
  assert.deepEqual(mobileErrors,[],'Sin errores JavaScript en móvil: '+mobileErrors.join('; '));
  console.log('OK: escritorio, móvil, catálogo, selección y animación sin errores JS');
}finally{
 await browser?.close();
 server.kill();
}
