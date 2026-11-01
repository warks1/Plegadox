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
   const transfer=[5,10,15].map(boundary=>{
    const t=raw=>boundary-.8+Math.max(raw,1e-5)*.8;
    const frames=[0,.3,.4,.5,.6,.7,.9].map(raw=>{
     const scene=technicalScene(piece,t(raw));
     const placement=gaugePlacement(scene,2);
     return {anchor:scene.gaugeAnchor, x:placement.point.x,
      moving:placement.moving,active:placement.contactEngaged,
      source:scene.gaugeTransition?.from?.x};
    });
    return frames;
   });
   return {pts,transfer,stop:gaugeOutline(getV85().stop,1),support:gaugeOutline(getV85().support,2)};
  });
  const checked=values.pts;
  assert.ok(values.stop[4].x===30&&values.stop[5].x===0&&values.stop[3].y>values.stop[4].y,
   'Tope completo: saliente bajo delante y pared ASCENDENTE detrás');
  assert.ok(values.support[4].x===30&&values.support[5].x===0&&values.support[3].y>values.support[4].y,
   'Support: la punta baja tiene una pared que detiene el canto');
  for(let i=0;i<3;i++){
   const a=checked[2*i].position,b=checked[2*i+1].position;
   assert.ok(Math.hypot(a.x-b.x,a.y-b.y)<.2,
    'Tope teletransportado al pasar de golpe '+(i+1));
  }
  for(const [i,transfer] of values.transfer.entries()){
   assert.ok(transfer.every(x=>x.moving&&!x.active),'Dedo en modo traslado '+i);
   assert.ok(transfer.every(x=>Math.abs(x.anchor.x-transfer[0].anchor.x)<1e-7),
    'El origen se desplaza al girar la chapa: salto '+i);
   assert.ok(transfer.every(x=>Math.abs(x.source-transfer[0].source)<1e-7),
    'La retirada del tope cambia su referencia X durante el golpe '+i);
   assert.ok(transfer.slice(1,6).every(x=>Math.abs(x.x-transfer[1].x)<1e-7),
    'El dedo no se mantiene retirado mientras gira la chapa '+i);
  }
  assert.ok(checked.every(x=>x.same),'Cabina distinta de la sección');
  assert.deepEqual(checked[0].order,[0,1,3,2]);
  assert.deepEqual(checked[0].angles,[90,-90,-90,90]);
  assert.deepEqual(errors,[],'Errores en '+(mobile?'móvil':'escritorio'));
  await context.close();
 }
}finally{await browser?.close();server.kill();}
