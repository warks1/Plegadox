import test from 'node:test';
import assert from 'node:assert/strict';
import {EXAMPLE,normalized,gaugeReference,stopAtStage} from '../engine.js';
import {guardPunchAdvance} from '../collision-playback-guard.js';
import {inspectToolContact} from '../tool-collision.js';

test('Pausa antes de penetrar: intervalo de avance acotado y posición sin intrusión',()=>{
 const synthetic=(piece,t)=>({issues:t>=.23?[{kind:'punch',category:'penetration',segment:1}]:[]});
 const result=guardPunchAdvance({},.1,.4,{inspect:synthetic,maxStep:.02});
 assert.equal(result.blocked,true);
 assert.ok(result.time<.23&&result.time>.22);
 assert.equal(synthetic({},result.time).issues.length,0);
 assert.equal(result.issue.kind,'punch');
 assert.equal(result.verified,false);
});
test('Contacto legítimo y alertas de matriz no bloquean el avance del punzón',()=>{
 const diagnostic=(piece,t)=>({issues:t>.2?[{kind:'die',category:'penetration'},{kind:'punch',category:'clearance'}]:[]});
 const result=guardPunchAdvance({},.1,.35,{inspect:diagnostic});
 assert.equal(result.blocked,false);
 assert.equal(result.time,.35);
});
test('Plegado Omega: el primer choque con el punzón detiene la reproducción antes de atravesarlo',()=>{
 const p=normalized(EXAMPLE),original=structuredClone(p);
 let time=0,block=null;
 for(let i=0;i<1000&&time<20;i++){
  const next=guardPunchAdvance(p,time,Math.min(20,time+.075));
  if(next.blocked){block=next;time=next.time;break;}
  time=next.time;
 }
 assert.ok(block,'En la secuencia actual existe al menos un choque geométrico de alas previas contra punzón');
 assert.ok(time<20&&time>0);
 const now=inspectToolContact(p,time);
 assert.equal(now.issues.some(i=>i.kind==='punch'&&i.category==='penetration'),false,
  'El fotograma detenido debe estar antes de la penetración');
 const next=guardPunchAdvance(p,time,Math.min(20,time+.075));
 assert.ok(next.blocked);
 assert.ok(next.time>=time&&next.time<time+.075);
 assert.deepEqual(p,original);
 assert.deepEqual(p.order,[0,1,3,2]);
 assert.deepEqual(p.angles,[90,-90,-90,90]);
 assert.equal(gaugeReference(p,0).distance,50);
 assert.equal(stopAtStage(p,10.2).reference.distance,50);
 console.log('BLOQUEO_PUNZON_OMEGA',time.toFixed(4),'s · G'+(Math.floor(time/5)+1));
});
test('La precaución del motor rechaza saltos temporales negativos',()=>{
 assert.throws(()=>guardPunchAdvance({},1,.5),/Intervalo/);
 assert.throws(()=>guardPunchAdvance({},0,1,{maxStep:0}),/Paso/);
});
