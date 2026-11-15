import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');

test('R33 permanece como respaldo y el splash R52 usa útiles realmente montados',()=>{
 const html=read('index.html'),reference=read('titanium-loading-original.html');
 assert.match(html,/id="pxTitaniumSplash"/);
 assert.match(html,/id="pxSplashReference"[^>]*src="\.\/splash-foto-premium\.html"/);
 for(const element of ['class="top"','class="hero"','class="machineFrame"',
  'class="gauge"','class="btm"','id="punchGroup"','id="sheetFront"',
  'id="progressArea"','id="replay"'])
  assert.ok(reference.includes(element),'No borrar respaldo R33: '+element);
 assert.ok(reference.includes('02 · TITANIUM'));
 assert.ok(reference.includes('LA PRECISIÓN TOMA FORMA'));
 assert.ok(reference.includes('AMS TECNOLOGICS SERVICES'));
 assert.ok(reference.includes('© 2026 AMS Tecnologics Services'));
 assert.doesNotMatch(html,/id="pxSplashSheet"/,'No reinstalar boceto 2D antiguo');
});
test('R52 muestra una sola barra real y SVG animado con matriz inferior montada',()=>{
 const html=read('index.html'),photo=read('splash-foto-premium.html');
 assert.ok(html.includes('getOriginalLoading()?.finish()'));
 assert.ok(html.includes('original?.setProgress(splashProgress)'));
 assert.ok(html.includes('original?.setStatus(splashMessage)'));
 assert.ok(html.includes('await loadModules();'));
 assert.ok(photo.includes('setProgress(v)'));
 assert.ok(photo.includes('setStatus(v)'));
 assert.ok(photo.includes('src="./splash-machine-assembly.svg"'));
 assert.ok(!photo.includes('id="photo"'),'No reincorporar fotografía con punzón desalineado');
 assert.equal((photo.match(/role="progressbar"/g)||[]).length,1);
 assert.doesNotMatch(html,/1450-\(Date\.now\(\)/,'Arranque sin demora artificial');
});
test('R52 incluye SVG industrial montado, archivo histórico y no borra piezas',()=>{
 const sw=read('sw.js'),html=read('index.html'),css=read('styles.css');
 const info=JSON.parse(read('build-info.json'));
 for(const p of ['./titanium-loading-original.html','./splash-foto-premium.html',
  './plegadox-premium-selected.png','./splash-machine-assembly.svg'])assert.ok(sw.includes('"'+p+'"'));
 assert.equal(info.version,JSON.parse(read('package.json')).version);
 assert.match(info.build,/^PLEGADOX-[0-9]{8}-R[0-9]+$/);
 assert.ok(html.includes('const BUILD="'+info.build+'"'));
 assert.ok(sw.includes("const CACHE='"+info.cache+"'"));
 assert.match(css,/\.px-titanium-original #pxSplashReference/);
 assert.ok(!html.includes('localStorage.clear('));
 assert.ok(!html.includes('indexedDB.deleteDatabase('));
});
