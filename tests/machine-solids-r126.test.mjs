import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createSolidFrameCache} from '../machine-solid-frame-cache.js';
import {assessTrailEvidence} from '../machine-axis-trail-evidence.js';
import {describeGaugeVisualEvidence} from '../machine-gauge-evidence.js';

test('R126: orbitar malla reutiliza geometría hasta nuevo tiempo, pieza, límite o invalidez',()=>{
 let builds=0;
 const cache=createSolidFrameCache((piece,t,limit)=>{
  builds++;return {piece,t,limit,builds};
 });
 const piece={name:'omega'},next={name:'omega'};
 const a=cache.get(piece,0,2500);
 assert.strictEqual(a,cache.get(piece,0,2500));
 assert.strictEqual(a,cache.get(piece,0,2500));
 assert.equal(builds,1);
 assert.equal(cache.stats.hits,2);
 assert.notStrictEqual(a,cache.get(piece,0.1,2500));
 cache.get(piece,0.1,1200);
 cache.get(next,0.1,1200);
 cache.invalidate();
 cache.get(next,0.1,1200);
 assert.equal(builds,5);
 assert.deepEqual(cache.stats,{hits:2,misses:5});
 assert.throws(()=>cache.get(null,0,100),/Estado/);
});
test('R126: las excepciones de geometría no quedan memorizadas',()=>{
 let failures=0;
 const c=createSolidFrameCache(()=>{
  if(!failures++){throw Error('CAD corrupto');}
  return {ready:true};
 });
 assert.throws(()=>c.get({},0,100),/CAD corrupto/);
 assert.equal(c.get({},0,100).ready,true);
 assert.equal(c.stats.misses,1);
});
test('R126: jamás pintar trazas físicas de otra pieza, máquina o datum',()=>{
 const motion={pieceKey:'pieza-123',machineId:'trumpf-v85',
  poses:[{axes:{}},{axes:{}}]};
 const mapping={machineConfigKey:'v85-abcdef12',
  signs:{Y:1,X:1,R:1,Z1:1,Z2:-1}};
 const params={motion,mapping,pieceKey:'pieza-123',
  machineConfigKey:'v85-abcdef12',machineId:'trumpf-v85'};
 assert.equal(assessTrailEvidence(params).drawable,true);
 assert.equal(assessTrailEvidence({...params,pieceKey:'pieza-999'}).code,'otra-pieza');
 assert.equal(assessTrailEvidence({...params,machineConfigKey:'v85-00000000'}).code,'otra-configuracion');
 assert.equal(assessTrailEvidence({...params,machineId:'bystronic-pr100-3100'}).code,'otra-maquina');
 assert.equal(assessTrailEvidence({...params,motion:null}).code,'sin-registro-ejes');
 assert.equal(assessTrailEvidence({...params,mapping:null}).code,'sin-calibracion');
 assert.equal(assessTrailEvidence({...params,mapping:{...mapping,signs:{Y:1}}}).code,'signos-incompletos');
 assert.equal(assessTrailEvidence({...params,motion:{...motion,poses:[]}}).code,'poses-incompletas');
});
test('R126: semáforo naranja nunca se interpreta automáticamente como penetración 3D',()=>{
 const noHit={gaugeInterference:{kind:'sin-interferencia-detectada',warning:false},
  gaugeDecision:{known:true}};
 const provisional={provenance:'Z-del-dedo-desconocida-envolvente-conservadora'};
 const green=describeGaugeVisualEvidence(noHit,provisional);
 assert.equal(green.level,'green');
 assert.match(green.message,/Z real del dedo no documentada/);
 assert.match(green.message,/no demuestra colisión 3D/);
 const amber=describeGaugeVisualEvidence({...noHit,setupValid:false},provisional);
 assert.equal(amber.level,'amber');
 assert.match(amber.message,/NARANJA/);
 assert.match(amber.message,/apoyo-invalido/);
 const red=describeGaugeVisualEvidence({
  gaugeInterference:{kind:'penetracion',warning:true}},provisional);
 assert.equal(red.level,'red');assert.match(red.message,/ROJO/);
 const imported=describeGaugeVisualEvidence(noHit,
  {provenance:'perfil CAD importado DXF · montaje y ejes sin certificar'});
 assert.equal(imported.knownZ,true);
 assert.match(imported.message,/sin verificar físicamente/);
 for(const state of [green,amber,red,imported])assert.equal(state.verified,false);
});
test('R126: diagnostico y caché forman parte del build y de la caché offline',()=>{
 const html=readFileSync(new URL('../index.html',import.meta.url),'utf8');
 const view=readFileSync(new URL('../machine-volume-viewer.js',import.meta.url),'utf8');
 const sw=readFileSync(new URL('../sw.js',import.meta.url),'utf8');
 assert.ok(html.includes('id="machineGaugeEvidence"'));
 assert.match(view,/frameCache\.get\(state\.piece,state\.sim\.time,budget\.maxFaces\)/);
 assert.match(view,/frameCache\.invalidate\(\)/);
 assert.match(view,/assessTrailEvidence\(/);
 assert.match(view,/PLEGADOX_SOLID_RENDER_STATS/);
 for(const name of ['machine-solid-frame-cache.js','machine-axis-trail-evidence.js',
  'machine-gauge-evidence.js'])
  assert.ok(sw.includes('"./'+name+'"'),name+' no integrado offline');
});
