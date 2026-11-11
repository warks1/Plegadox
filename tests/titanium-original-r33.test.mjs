import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');

test('R33 se conserva como respaldo, pero la pantalla elegida R34 usa la foto exacta',()=>{
 const html=read('index.html'),reference=read('titanium-loading-original.html');
 assert.match(html,/id="pxTitaniumSplash"/);
 assert.match(html,/id="pxSplashReference"[^>]*src="\.\/splash-foto-premium\.html"/);
 for(const element of ['class="top"','class="hero"','class="machineFrame"',
  'class="gauge"','class="btm"','id="punchGroup"','id="sheetFront"',
  'id="progressArea"','id="replay"'])
  assert.ok(reference.includes(element),'No borrar respaldo R33: '+element);
 assert.ok(reference.includes('02 · TITANIUM'));
 assert.ok(reference.includes('LA PRECISIÓN TOMA FORMA'));
 assert.ok(reference.includes('A.M.S TECNOLIGICS'));
 assert.ok(reference.includes('© 2026 A.M.S Tecnoligics'));
 assert.doesNotMatch(html,/id="pxSplashSheet"/,'No reinstalar boceto 2D antiguo');
});
test('R34 la barra refleja el arranque real; R33 sigue disponible como respaldo',()=>{
 const html=read('index.html'),photo=read('splash-foto-premium.html');
 assert.ok(html.includes('getOriginalLoading()?.finish()'));
 assert.ok(html.includes('original?.setProgress(splashProgress)'));
 assert.ok(html.includes('original?.setStatus(splashMessage)'));
 assert.ok(html.includes('await loadModules();'));
 assert.ok(photo.includes('setProgress(value)'));
 assert.ok(photo.includes('setStatus(value)'));
 assert.ok(photo.includes("location.replace('./titanium-loading-original.html')"));
 assert.doesNotMatch(html,/1450-\(Date\.now\(\)/,'Arranque sin demora artificial');
});
test('R34 incluye fotografía original y fallback R33 en PWA y no borra piezas',()=>{
 const sw=read('sw.js'),html=read('index.html'),css=read('styles.css');
 const info=JSON.parse(read('build-info.json'));
 for(const p of ['./titanium-loading-original.html','./splash-foto-premium.html',
  './plegadox-premium-selected.png'])assert.ok(sw.includes('"'+p+'"'));
 assert.equal(info.version,'0.9.10');
 assert.match(info.build,/R34$/);
 assert.ok(html.includes('const BUILD="'+info.build+'"'));
 assert.ok(sw.includes("const CACHE='"+info.cache+"'"));
 assert.match(css,/\.px-titanium-original #pxSplashReference/);
 assert.ok(!html.includes('localStorage.clear('));
 assert.ok(!html.includes('indexedDB.deleteDatabase('));
});
