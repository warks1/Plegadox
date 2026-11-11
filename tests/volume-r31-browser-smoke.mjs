import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {chromium} from 'playwright';

const server=spawn('python3',['-m','http.server','4361','--bind','127.0.0.1'],{stdio:'ignore'});
let browser;
try{
 browser=await chromium.launch({headless:true,args:['--no-sandbox']});
 const page=await browser.newPage({viewport:{width:1420,height:900}});
 const errors=[];
 page.on('pageerror',err=>errors.push(err.message));
 await page.goto('http://127.0.0.1:4361/',{waitUntil:'networkidle',timeout:40000});
 await page.locator('[data-tab="programacion"]').click();
 const review=page.locator('#workshopAuditBreakdown details').filter({hasText:'Revisión volumétrica por golpe'});
 assert.ok(await review.isVisible());
 await review.locator('summary').click();
 const buttons=review.locator('button.px-gauge-operation');
 assert.equal(await buttons.count(),4,'La muestra Omega debe revisar todos los golpes');
 assert.match(await page.locator('#workshopAuditStatus').textContent(),/envolvente 3D/);
 await page.waitForFunction(()=>document.querySelector('#integratedPlannerStatus')
  ?.textContent.includes('envolventes 3D'),{timeout:35000});
 assert.deepEqual(await page.evaluate(()=>window.PLEGADOX_STATE().piece.order),[0,1,3,2],
  'Comparar nunca reordena la muestra por sí solo');
 await buttons.first().click();
 assert.ok((await page.evaluate(()=>window.PLEGADOX_STATE().sim.time))>=0);
 await page.locator('[data-tab="programacion"]').click();
 await page.locator('#newBtn').click();
 const next=page.locator('#workshopAuditBreakdown details').filter({hasText:'Revisión volumétrica por golpe'});
 await next.locator('summary').click();
 assert.equal(await next.locator('button.px-gauge-operation').count(),1,
  'Una pieza nueva activa exactamente la misma comprobación');
 assert.deepEqual(errors,[]);
 console.log('VOLUME_R31_BROWSER_OK');
}finally{await browser?.close();server.kill();}
