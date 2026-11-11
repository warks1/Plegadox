import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');

test('R33 reutiliza la pantalla 02 TITANIUM aprobada, sin redibujarla en index',()=>{
 const html=read('index.html'),reference=read('titanium-loading-original.html');
 assert.match(html,/id="pxTitaniumSplash"/);
 assert.match(html,/id="pxSplashReference"[^>]*src="\.\/titanium-loading-original\.html"/);
 for(const element of ['class="top"','class="hero"','class="machineFrame"',
  'class="gauge"','class="btm"','id="punchGroup"','id="sheetFront"',
  'id="progressArea"','id="replay"'])
  assert.ok(reference.includes(element),'Falta el diseño elegido: '+element);
 assert.ok(reference.includes('02 · TITANIUM'));
 assert.ok(reference.includes('LA PRECISIÓN TOMA FORMA'));
 assert.ok(reference.includes('A.M.S TECNOLIGICS'));
 assert.ok(reference.includes('© 2026 A.M.S Tecnoligics'));
 assert.match(reference,/window\.PlegadoXLoading=/);
 assert.match(reference,/let start=performance\.now\(\),hold=false,manual=0/);
 assert.doesNotMatch(html,/id="pxSplashSheet"/,'No restaurar el diseño esquemático equivocado');
});
test('R33 el porcentaje y el mensaje proceden del arranque real, no de un contador visual',()=>{
 const html=read('index.html'),reference=read('titanium-loading-original.html');
 assert.ok(html.includes('getOriginalLoading()?.finish()'));
 assert.ok(html.includes('original?.setProgress(splashProgress)'));
 assert.ok(html.includes('original?.setStatus(splashMessage)'));
 assert.ok(html.includes('await loadModules();'));
 assert.ok(reference.includes('setProgress(value)'));
 assert.ok(reference.includes('setStatus(value)'));
 assert.ok(reference.includes('render(reducedMotion?6000:now-start)'));
 assert.doesNotMatch(html,/1450-\(Date\.now\(\)/,'No imponer 1,45 s extra de espera');
});
test('R33 conserva el original también en la PWA sin conexión y no modifica piezas',()=>{
 const sw=read('sw.js'),html=read('index.html'),css=read('styles.css');
 const info=JSON.parse(read('build-info.json'));
 assert.ok(sw.includes('"./titanium-loading-original.html"'));
 assert.equal(info.version,'0.9.9');
 assert.match(info.build,/R33$/);
 assert.ok(html.includes('const BUILD="'+info.build+'"'));
 assert.ok(sw.includes("const CACHE='"+info.cache+"'"));
 assert.match(css,/\.px-titanium-original #pxSplashReference/);
 assert.ok(!html.includes('localStorage.clear('));
 assert.ok(!html.includes('indexedDB.deleteDatabase('));
});
