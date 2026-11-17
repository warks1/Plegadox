import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {mkdirSync} from 'node:fs';
import {chromium} from 'playwright';
mkdirSync('test-results',{recursive:true});
const server=spawn('python3',['-m','http.server','4450','--bind','127.0.0.1'],{stdio:'ignore'});
let browser;
try{
 browser=await chromium.launch({headless:true,args:['--no-sandbox']});
 const context=await browser.newContext({viewport:{width:1280,height:800},
  isMobile:true,hasTouch:true,deviceScaleFactor:2.5,
  userAgent:'Mozilla/5.0 (Linux; Android 14; SM-X700) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36'});
 const page=await context.newPage(),errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 await page.goto('http://127.0.0.1:4450/',{waitUntil:'networkidle',timeout:40000});
 await page.waitForFunction(()=>typeof window.PLEGADOX_SOLID_RENDER_STATS==='function',
  null,{timeout:30000});
 await page.locator('#machineSolidToggle').click();
 await page.waitForFunction(()=>window.PLEGADOX_SOLID_RENDER_STATS().misses>=1,
  null,{timeout:20000});
 const before=await page.evaluate(()=>window.PLEGADOX_SOLID_RENDER_STATS());
 assert.ok(before.misses>=1);
 const frame=page.locator('#machineSolidCanvas');
 const rect=await frame.boundingBox();
 const x=rect.x+rect.width/2,y=rect.y+rect.height/2;
 await page.mouse.move(x,y);
 await page.mouse.down();
 await page.mouse.move(x+120,y+80,{steps:12});
 await page.mouse.up();
 const after=await page.evaluate(()=>window.PLEGADOX_SOLID_RENDER_STATS());
 assert.equal(after.misses,before.misses,
  'Orbitar no debe volver a calcular geometría de la misma pose');
 assert.ok(after.hits>before.hits,
  'La cámara debe reutilizar triangulación anterior');
 const gauge=await page.locator('#machineGaugeEvidence').textContent();
 assert.ok(gauge.includes('diagnóstico de sección 2D'));
 assert.ok(gauge.includes('no demuestra colisión 3D'));
 await frame.screenshot({path:'test-results/r126-galaxy-cache-gauge.png'});
 await page.evaluate(()=>window.PLEGADOX_SEEK_PREVIEW({operation:1,fraction:0.2}));
 const changed=await page.evaluate(()=>window.PLEGADOX_SOLID_RENDER_STATS());
 assert.ok(changed.misses>after.misses,
  'Otro golpe debe invalidar geométricamente la escena');
 await page.evaluate(()=>window.dispatchEvent(new CustomEvent('plegadox:machineChanged')));
 const altered=await page.evaluate(()=>window.PLEGADOX_SOLID_RENDER_STATS());
 assert.ok(altered.misses>changed.misses,
  'Cambiar máquina o CAD invalida mallas');
 assert.deepEqual(errors,[]);
 console.log('R126_GALAXY_CACHE_AND_GAUGE_OK');
 await context.close();
}finally{
 await browser?.close();server.kill();
}
