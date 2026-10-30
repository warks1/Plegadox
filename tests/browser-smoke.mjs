import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {chromium} from 'playwright';
import {mkdirSync,readFileSync} from 'node:fs';
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
  await page.locator('[data-tab="desarrollo"]').click();
  assert.match(await page.locator('#forceDetails').textContent(),/Rm 450 MPa/);
  const startForce=await page.locator('#devSummary .result-item').filter({hasText:'Fuerza aire aprox.'}).locator('b').textContent();
  await page.locator('#rmMPa').fill('600');
  await page.locator('#rmMPa').dispatchEvent('change');
  const newForce=await page.locator('#devSummary .result-item').filter({hasText:'Fuerza aire aprox.'}).locator('b').textContent();
  assert.notEqual(newForce,startForce,'La resistencia Rm introducida debe cambiar la fuerza');
  assert.equal(await page.evaluate(()=>window.PLEGADOX_STATE().piece.rmMPa),600);
  await page.locator('[data-tab="programacion"]').click();
  await page.locator('#material').selectOption('alu5754');
  assert.equal(await page.evaluate(()=>window.PLEGADOX_STATE().piece.rmMPa),null,
    'La resistencia manual de acero NO se arrastra al aluminio');
  await page.locator('[data-tab="desarrollo"]').click();
  assert.match(await page.locator('#forceDetails').textContent(),/Rm 260 MPa/);
  await page.locator('[data-tab="programacion"]').click();
  await page.locator('#material').selectOption('s235');
  await page.locator('[data-tab="desarrollo"]').click();

  assert.ok(await page.locator('#vComparisonRows tr').count()>=10,'Comparador V6–V50 visible');
  const forceV16=await page.locator('#vComparisonRows tr[data-die-id="v16"] td').nth(5).textContent();
  const forceV32=await page.locator('#vComparisonRows tr[data-die-id="v32"] td').nth(5).textContent();
  assert.notEqual(forceV16,forceV32,'La fuerza debe cambiar al cambiar V');
  await page.locator('#vComparisonRows tr[data-die-id="v32"] button').click();
  assert.equal(await page.evaluate(()=>window.PLEGADOX_STATE().piece.die),'v32');
  assert.equal(await page.locator('#die').inputValue(),'v32');
  await page.locator('#vComparisonRows tr[data-die-id="v16"] button').click();
  assert.equal(await page.evaluate(()=>window.PLEGADOX_STATE().piece.die),'v16');
  assert.equal(await page.locator('#flatBendRows tr').count(),4,
    'La tabla muestra centros de cuatro pliegues');
  const labelRows=await page.locator('#flatBendRows tr td:first-child').allTextContents();
  assert.deepEqual(labelRows,['G1','G2','G3','G4']);
  assert.match(await page.locator('#flatBendRows tr').nth(2).textContent(),/P4/);
  assert.equal(await page.locator('#dxfIncludeBends').isChecked(),true);
  const [profileDXF]=await Promise.all([
    page.waitForEvent('download'),page.locator('#exportDxfProfile').click()
  ]);
  assert.match(profileDXF.suggestedFilename(),/perfil-2D-aproximado\.dxf$/);
  const [flatDXF]=await Promise.all([
    page.waitForEvent('download'),page.locator('#exportDxfFlat').click()
  ]);
  assert.match(flatDXF.suggestedFilename(),/desarrollo-ORIENTATIVO\.dxf$/);
  const withMarks=readFileSync(await flatDXF.path(),'utf8');
  assert.match(withMarks,/\r\n8\r\nPLEGADOS_NO_CORTE\r\n/,
    'El DXF descargado contiene marcas en capa NO CORTE');
  assert.match(withMarks,/G3 P4 \+90deg/,
    'La etiqueta en DXF conserva el orden del golpe sobre el pliegue P4');
  await page.locator('#dxfIncludeBends').uncheck();
  const [onlyContour]=await Promise.all([
    page.waitForEvent('download'),page.locator('#exportDxfFlat').click()
  ]);
  const cleanText=readFileSync(await onlyContour.path(),'utf8');
  assert.equal(cleanText.split('\r\n0\r\nLINE\r\n').length-1,4,
    'Sin marcas deben quedar exactamente cuatro líneas de contorno');
  assert.ok(!cleanText.includes('\r\n8\r\nPLEGADOS_NO_CORTE\r\n'),
    'No exportar ninguna línea de plegado al desactivar la casilla');
  assert.match(await page.locator('#dxfStatus').textContent(),/No es un plano validado/);
  await page.locator('[data-tab="simulacion"]').click();
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

  const incidentButtons=page.locator('#incidentNavigator .cp-incident-item');
  assert.equal(await incidentButtons.count(),4,'Cuatro golpes en el orden físico');
  const thumbnails=await page.locator('#simSequence .op-preview path').evaluateAll(
    elements=>elements.filter((_,i)=>i%2===0).map(el=>el.getAttribute('d')));
  assert.equal(thumbnails.length,4);
  assert.notEqual(thumbnails[0],thumbnails[1],'Miniaturas +90°/-90° diferentes');
  assert.equal(thumbnails[0],thumbnails[2],'El mismo ángulo muestra igual contorno');
  const labels=await incidentButtons.locator('strong').allTextContents();
  assert.match(labels[0],/G1 · P1 · \+90°/);
  assert.match(labels[1],/G2 · P2 · -90°/);
  assert.match(labels[2],/G3 · P4 · \+90°/);
  assert.match(labels[3],/G4 · P3 · -90°/);
  const jumpTo=Number(await incidentButtons.nth(1).getAttribute('data-time'));
  await incidentButtons.nth(1).click();
  const navState=await page.evaluate(()=>window.PLEGADOX_STATE());
  assert.equal(navState.sim.playing,false,'Navegar a una incidencia debe pausar');
  assert.ok(Math.abs(navState.sim.time-jumpTo)<1e-8,'Debe saltar a la muestra correspondiente');
  assert.match(await page.locator('#phaseText').textContent(),/pliegue 2 \(-90°\)/);
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
  await page.locator('#cockpitTools .cp-tool-card').filter({hasText:'831'}).first().click();
  assert.equal(await page.evaluate(()=>window.PLEGADOX_STATE().piece.punch),'amada-831');
  assert.match(await page.locator('#cockpitCompatibility').textContent(),/revisar montaje de varios segmentos/,
   'Un punzón de 415 mm en pieza de 500 mm exige revisar segmentos adicionales');
  assert.match(await page.locator('#collisionDetails').textContent(),/un único segmento de punzón/i,
   'El panel de avisos no debe esconder la limitación de longitud del punzón');



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
