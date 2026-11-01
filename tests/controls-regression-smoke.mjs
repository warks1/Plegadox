import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {chromium} from 'playwright';

const server=spawn('python3',['-m','http.server','4297','--bind','127.0.0.1'],{stdio:'ignore'});
let browser;
try{
 browser=await chromium.launch({headless:true,args:['--no-sandbox']});
 const page=await browser.newPage({viewport:{width:1365,height:950}}),errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 await page.goto('http://127.0.0.1:4297/',{waitUntil:'networkidle',timeout:30000});
 const zoom=()=>page.evaluate(()=>window.PLEGADOX_MACHINE_VIEW.zoom);
 const machine=page.locator('#machineCanvas');
 await machine.dispatchEvent('wheel',{deltaY:-9999});
 assert.equal(await zoom(),5,'La rueda alcanza el máximo 5×');
 await page.locator('#machineZoomIn').click();
 assert.equal(await zoom(),5,'Acercar no puede reducir zoom 5×');
 await machine.dispatchEvent('wheel',{deltaY:9999});
 assert.equal(await zoom(),.4,'La rueda alcanza el mínimo 0,4×');
 await page.locator('#machineZoomOut').click();
 assert.equal(await zoom(),.4,'Alejar no puede aumentar zoom 0,4×');
 await page.evaluate(()=>window.PLEGADOX_MACHINE_VIEW.zoom=4.5);
 await page.locator('#machineZoomIn').click();
 assert.equal(await zoom(),5,'El botón comparte el máximo de la rueda');
 await page.evaluate(()=>window.PLEGADOX_MACHINE_VIEW.zoom=.45);
 await page.locator('#machineZoomOut').click();
 assert.equal(await zoom(),.4,'El botón comparte el mínimo de la rueda');

 // El desarrollo permite hasta 20 alas y el panel no puede ocultar las restantes.
 const twenty={name:'20 alas',flanges:Array.from({length:20},(_,i)=>30+i),
  angles:Array(19).fill(90),order:Array.from({length:19},(_,i)=>i),
  thickness:2,width:500,material:'s235',die:'v16',punch:'straight88'};
 await page.locator('#fileInput').setInputFiles({name:'20-alas.json',
  mimeType:'application/json',buffer:Buffer.from(JSON.stringify(twenty))});
 await page.waitForFunction(()=>window.PLEGADOX_STATE().piece.flanges.length===20);
 await page.locator('[data-tab="simulacion"]').click();
 await page.waitForFunction(()=>document.querySelectorAll('#cpDimensions .cp-dimension-row').length===20);
 const rows=page.locator('#cpDimensions .cp-dimension-row');
 assert.equal(await rows.count(),20);
 assert.match(await rows.last().textContent(),/L20/);
 assert.match(await page.locator('#cpDimensionsCount').textContent(),/20 alas.*desplaza/);
 const scroll=await page.locator('#cpDimensions').evaluate(el=>{
  el.scrollTop=el.scrollHeight;return {top:el.scrollTop,height:el.clientHeight,total:el.scrollHeight};
 });
 assert.ok(scroll.total>scroll.height&&scroll.top>0,'Las 20 cotas se consultan desplazando');

 // Una pieza nueva, un ala añadida o una eliminada invalidan los toques previos.
 await page.locator('[data-tab="programacion"]').click();
 const selectFirst=async()=>{
  await page.locator('#touchOrderMode').click();
  const at=await page.evaluate(async()=>{
   const {profile}=await import('/engine.js');
   const p=window.PLEGADOX_STATE().piece;
   const c=document.querySelector('#finalCanvas'),r=c.getBoundingClientRect();
   const all=profile(p,p.angles.map(()=>1)).points;
   const xs=all.map(v=>v.x),ys=all.map(v=>v.y);
   const minX=Math.min(...xs),maxX=Math.max(...xs),minY=Math.min(...ys),maxY=Math.max(...ys);
   const scale=Math.min((r.width-86)/Math.max(maxX-minX,25),(r.height-86)/Math.max(maxY-minY,25),5);
   const vertex=all[1];
   return {x:r.width/2+(vertex.x-(minX+maxX)/2)*scale,
    y:r.height/2-(vertex.y-(minY+maxY)/2)*scale};
  });
  await page.locator('#finalCanvas').click({position:at});
  assert.match(await page.locator('#touchOrderHint').textContent(),/Seleccionados: 1\//);
 };
 const checkReset=async()=>{
  assert.equal(await page.locator('#touchOrderMode').getAttribute('aria-pressed'),'false');
  assert.match(await page.locator('#touchOrderHint').textContent(),/selección táctil reiniciada/i);
  assert.doesNotMatch(await page.locator('#touchOrderHint').textContent(),/Seleccionados:/);
 };
 await page.locator('#sampleBtn').click();
 await selectFirst();
 await page.locator('#addFlange').click();
 await checkReset();
 await selectFirst();
 await page.locator('#flangeRows button[title="Eliminar ala"]').first().click();
 await checkReset();
 await selectFirst();
 await page.locator('#newBtn').click();
 await checkReset();
 assert.equal(await page.evaluate(()=>window.PLEGADOX_STATE().piece.angles.length),1);
 assert.deepEqual(errors,[],'Sin errores JS en zoom, dimensiones ni selección de orden');
 console.log('CONTROLS_REGRESSION_OK');
}finally{await browser?.close();server.kill();}
