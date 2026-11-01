import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {chromium} from 'playwright';
const server=spawn('python3',['-m','http.server','4293','--bind','127.0.0.1'],{stdio:'ignore'});
let browser;
try{
 browser=await chromium.launch({headless:true,args:['--no-sandbox']});
 for(const mobile of [false,true]){
  const context=await browser.newContext({viewport:mobile?{width:390,height:844}:{width:1536,height:900},
   hasTouch:mobile,isMobile:mobile});
  const page=await context.newPage(),errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  await page.goto('http://127.0.0.1:4293/',{waitUntil:'networkidle',timeout:30000});
  await page.locator('[data-tab="simulacion"]').click();
  const values=await page.evaluate(async()=>{
   const {technicalScene}=await import('/technical-section.js');
   const {machineSheetProjection}=await import('/machine-visual.js');
   const {gaugePlacement}=await import('/backgauge-placement.js');
   const {gaugeOutline,getV85}=await import('/machine-config.js');
   const {piece}=window.PLEGADOX_STATE();
   const pts=[4.9999,5,9.9999,10,14.9999,15].map(t=>{
    const s=technicalScene(piece,t);
    return {same:JSON.stringify(machineSheetProjection(s,100,100,1,true))===
                   JSON.stringify(machineSheetProjection(s,100,100,1,false)),
            time:t,position:gaugePlacement(s,1).point,order:piece.order,angles:piece.angles};
   });
   return {pts,stop:gaugeOutline(getV85().stop,1),support:gaugeOutline(getV85().support,2)};
  });
  const checked=values.pts;
  assert.ok(values.stop[2].x===0&&values.stop[3].x===70,
   'Tope completo invertido: parte alta delante a izquierda');
  assert.ok(values.support[2].x===0&&values.support[3].x===70,
   'Support usa mismo sentido de escalón que Stop');
  for(let i=0;i<3;i++){
   const a=checked[2*i].position,b=checked[2*i+1].position;
   assert.ok(Math.hypot(a.x-b.x,a.y-b.y)<.2,
    'Tope teletransportado al pasar de golpe '+(i+1));
  }
  assert.ok(checked.every(x=>x.same),'Cabina distinta de la sección');
  assert.deepEqual(checked[0].order,[0,1,3,2]);
  assert.deepEqual(checked[0].angles,[90,-90,-90,90]);
  assert.deepEqual(errors,[],'Errores en '+(mobile?'móvil':'escritorio'));
  await context.close();
 }
}finally{await browser?.close();server.kill();}
