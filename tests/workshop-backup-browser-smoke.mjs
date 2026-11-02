import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {readFileSync,mkdirSync} from 'node:fs';
import {chromium} from 'playwright';
mkdirSync('test-results',{recursive:true});
const server=spawn('python3',['-m','http.server','4331','--bind','127.0.0.1'],{stdio:'ignore'});
let browser;
try{
 browser=await chromium.launch({headless:true,args:['--no-sandbox']});
 for(const dev of [{name:'pc',w:1440,h:900,mobile:false},
  {name:'iphone',w:390,h:844,mobile:true}]){
  const context=await browser.newContext({
   viewport:{width:dev.w,height:dev.h},isMobile:dev.mobile,
   hasTouch:dev.mobile,acceptDownloads:true});
  const page=await context.newPage(),errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  await page.goto('http://127.0.0.1:4331/',{waitUntil:'networkidle',timeout:30000});
  await page.locator('[data-tab="programacion"]').click();
  const status=page.locator('#workshopAuditStatus');
  assert.ok(await status.isVisible());
  assert.match(await status.textContent(),/NO VALIDADO PARA FABRICAR/);
  assert.ok(await page.locator('#workshopAuditBreakdown details').count()>=1,
   'La omega debe tener al menos la categoría de acreditaciones pendientes');
  const auditEvent=page.waitForEvent('download');
  await page.locator('#exportAuditBtn').click();
  const auditDownload=await auditEvent;
  const audit=JSON.parse(readFileSync(await auditDownload.path(),'utf8'));
  assert.equal(audit.canApproveForMachine,false);
  assert.ok(audit.issues.some(x=>x.code==='machine-3d'));
  const downEvent=page.waitForEvent('download');
  await page.locator('#exportCompleteProject').click();
  const backupDownload=await downEvent;
  const backup=JSON.parse(readFileSync(await backupDownload.path(),'utf8'));
  assert.equal(backup.format,'plegadox-complete-project-v1');
  assert.equal(backup.piece.order.join(','),'0,1,3,2');
  assert.ok(backup.machine.stop);
  assert.ok(Array.isArray(backup.importedTools));
  await page.locator('#pieceName').fill('MODIFICADA');
  await page.locator('#pieceName').dispatchEvent('change');
  assert.equal(await page.locator('#pieceName').inputValue(),'MODIFICADA');
  await page.locator('#completeProjectInput').setInputFiles({
   name:'backup.json',mimeType:'application/json',
   buffer:Buffer.from(JSON.stringify(backup))});
  await page.waitForFunction(()=>window.PLEGADOX_STATE().piece.name===
   'Omega · ejemplo geométrico');
  assert.match(await page.locator('#completeProjectStatus').textContent(),/Recuperado/);
  // Una importación corrupta no puede borrar el proyecto.
  await page.locator('#completeProjectInput').setInputFiles({
   name:'corrupto.json',mimeType:'application/json',
   buffer:Buffer.from(JSON.stringify({...backup,format:'OTRA'}))});
  assert.match(await page.locator('#completeProjectStatus').textContent(),/Restauración rechazada/);
  assert.equal(await page.locator('#pieceName').inputValue(),'Omega · ejemplo geométrico');
  await page.screenshot({path:'test-results/backup-auditoria-'+dev.name+'.png',fullPage:false});
  assert.deepEqual(errors,[],'Errores en '+dev.name);
  await context.close();
  console.log('WORKSHOP_BACKUP_UI_OK '+dev.name);
 }
}finally{await browser?.close();server.kill();}
