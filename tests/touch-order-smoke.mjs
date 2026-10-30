import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {chromium} from 'playwright';

const server=spawn('python3',['-m','http.server','4183','--bind','127.0.0.1'],{stdio:'ignore'});
let browser;
try{
 browser=await chromium.launch({headless:true,args:['--no-sandbox']});
 const page=await browser.newPage({viewport:{width:1280,height:850}});
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('http://127.0.0.1:4183/',{waitUntil:'networkidle'});
 await page.locator('[data-tab="programacion"]').click();
 await page.locator('#sampleBtn').click();
 await page.locator('#touchOrderMode').click();
 assert.equal(await page.locator('#touchOrderMode').getAttribute('aria-pressed'),'true');
 const vertices=await page.evaluate(async()=>{
   const {profile}=await import('./engine.js');
   const piece=window.PLEGADOX_STATE().piece;
   const canvas=document.querySelector('#finalCanvas'),rect=canvas.getBoundingClientRect();
   const all=profile(piece,piece.angles.map(()=>1)).points;
   const xs=all.map(v=>v.x),ys=all.map(v=>v.y);
   const minX=Math.min(...xs),maxX=Math.max(...xs),minY=Math.min(...ys),maxY=Math.max(...ys);
   const rw=Math.max(maxX-minX,25),rh=Math.max(maxY-minY,25),padding=43;
   const scale=Math.min((rect.width-2*padding)/rw,(rect.height-2*padding)/rh,5);
   return piece.angles.map((_,i)=>{
     const pt=all[i+1];
     return {x:rect.width/2+(pt.x-(minX+maxX)/2)*scale,
             y:rect.height/2-(pt.y-(minY+maxY)/2)*scale};
   });
 });
 for(const bend of [3,2,1,0]){
  const pt=vertices[bend];
  await page.locator('#finalCanvas').click({position:{x:pt.x,y:pt.y}});
 }
 const order=await page.evaluate(()=>window.PLEGADOX_STATE().piece.order);
 assert.deepEqual(order,[3,2,1,0],'Tocar los pliegues permite establecer el orden real');
 assert.equal(await page.locator('#touchOrderMode').getAttribute('aria-pressed'),'false');
 assert.match(await page.locator('#touchOrderHint').textContent(),/Secuencia aplicada/);
 await page.locator('#fileInput').setInputFiles({
  name:'pieza-interferencias.json',
  mimeType:'application/json',
  buffer:Buffer.from(JSON.stringify({name:'Comprobación 2D',flanges:[30,40,40,40],
   angles:[120,120,120],order:[0,1,2],material:'s235',thickness:2,width:450,die:'v16',punch:'straight88'}))
 });
 await page.locator('[data-tab="simulacion"]').click();
 await page.waitForFunction(()=>document.querySelector('#collisionDetails')?.textContent?.includes('Cruce de tramos'));
 assert.match(await page.locator('#collisionDetails').textContent(),/Cruce de tramos/);
 await page.locator('[data-tab="programacion"]').click();
 assert.match(await page.locator('#validity').textContent(),/Revisar geometría 2D/);
 assert.deepEqual(errors,[],'El navegador no debe lanzar excepciones');
 console.log('DIRECT_BEND_INPUT_OK',JSON.stringify({order,warning:true}));
}finally{await browser?.close();server.kill();}
