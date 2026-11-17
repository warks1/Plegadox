import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=file=>readFileSync(new URL('../'+file,import.meta.url),'utf8');

test('R139: el porcentaje inicial pertenece a la misma imagen de carga',()=>{
 const html=read('index.html');
 const start=html.indexOf('id="pxTitaniumSplash"'),img=html.indexOf('id="pxSplashImmediate" src=',start);
 const early=html.indexOf('id="pxSplashEarlyUI"',img),frame=html.indexOf('id="pxSplashReference"',early);
 assert.ok(start>0&&img>start&&early>img&&frame>early,
  'La foto, barra y pantalla definitiva son parte de un único splash');
 assert.match(html,/#pxSplashImmediate\{visibility:hidden\}/);
 assert.match(html,/#pxTitaniumSplash\.is-photo-ready #pxSplashImmediate,[\s\S]*?#pxTitaniumSplash\.is-photo-ready #pxSplashEarlyUI\{visibility:visible\}/);
 assert.match(html,/await SPLASH_IMAGE\.decode\(\)/);
 assert.match(html,/SPLASH\.classList\.add\('is-photo-ready'\)/);
 assert.match(html,/EARLY_FILL\.style\.width=splashProgress\+'%'/);
 assert.match(html,/EARLY_PROGRESS\)EARLY_PROGRESS\.setAttribute\('aria-valuenow'/);
 assert.match(html,/#pxTitaniumSplash\.has-original #pxSplashEarlyUI\{visibility:hidden\}/);
 assert.ok(!html.includes('localStorage.clear('));
 assert.ok(!html.includes('indexedDB.deleteDatabase('));
});

test('R139: no mostrar progreso del iframe antes de recibir y decodificar su fotografía',()=>{
 const html=read('index.html'),css=read('styles.css');
 const reveal=html.slice(html.indexOf('const revealOriginalSplash=async()=>'),html.indexOf("SPLASH_IFRAME?.addEventListener('load',revealOriginalSplash)"));
 assert.match(reveal,/if\(!photo\.complete\)/);
 assert.match(reveal,/photo\.addEventListener\('load',revealOriginalSplash/);
 assert.match(reveal,/if\(!photo\.naturalWidth\)/);
 assert.match(reveal,/await photo\.decode\(\)/);
 assert.ok(reveal.indexOf('await photo.decode()')<reveal.indexOf("SPLASH_IFRAME.classList.add('is-ready')"));
 assert.match(reveal,/SPLASH\.classList\.add\('has-original'\)/);
 assert.match(css,/#pxSplashReference\.is-ready\{opacity:1;pointer-events:auto\}/);
});

test('R139: build, versión, SW y boceto coherentes',()=>{
 const build=JSON.parse(read('build-info.json')),pkg=JSON.parse(read('package.json'));
 const html=read('index.html'),sw=read('sw.js'),about=read('software-about.js');
 assert.equal(build.build,'PLEGADOX-20261117-R139');
 assert.equal(build.version,'0.9.113');
 assert.equal(pkg.version,build.version);
 assert.ok(html.includes('const BUILD="'+build.build+'"'));
 assert.ok(html.includes('PLEGADOX v'+pkg.version));
 assert.ok(sw.includes(build.cache));
 assert.ok(about.includes("const BUILD='"+build.build+"'"));
 assert.ok(about.includes("const VERSION='"+build.version+"'"));
 assert.ok(html.includes('src="./plegadox-premium-selected.png"'));
 assert.ok(read('splash-foto-premium.html').includes('./plegadox-premium-selected.png'));
});
