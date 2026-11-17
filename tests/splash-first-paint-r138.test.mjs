import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');

test('R138: boceto elegido se pinta antes del iframe y de los modulos',()=>{
 const html=read('index.html'),css=read('styles.css');
 assert.ok(html.indexOf('<style>')<html.indexOf('<link rel="stylesheet"'),
  'El CSS critico precede al CSS externo');
 assert.match(html,/<link rel="preload" href="\.\/plegadox-premium-selected\.png" as="image" fetchpriority="high">/);
 assert.match(html,/<img id="pxSplashImmediate" src="\.\/plegadox-premium-selected\.png"/);
 assert.match(html,/#pxSplashImmediate\{position:absolute;inset:0;display:block;width:100%;height:100%;object-fit:contain\}/);
 assert.match(html,/<iframe id="pxSplashReference"[^>]+src="\.\/splash-foto-premium\.html"/);
 assert.match(css,/\.px-titanium-original #pxSplashReference\{[^}]*opacity:0/s);
 assert.match(css,/\.px-titanium-original #pxSplashReference\.is-ready\{opacity:1(?:;pointer-events:auto)?\}/);
 assert.ok(html.includes("SPLASH_IFRAME?.addEventListener('load',revealOriginalSplash)"));
 assert.ok(html.includes('if(!original)return'));
 assert.ok(html.includes('splashStep(splashProgress,splashMessage)'));
 assert.ok(html.includes("SPLASH_IFRAME.classList.add('is-ready')"));
 assert.ok(html.includes("contentDocument?.readyState==='complete'"));
 assert.ok(!html.includes('localStorage.clear('));
 assert.ok(!html.includes('indexedDB.deleteDatabase('));
});
test('R138: imagen, cache y versiones sincronizadas',()=>{
 const manifest=JSON.parse(read('manifest.webmanifest'));
 const build=JSON.parse(read('build-info.json'));
 const pkg=JSON.parse(read('package.json'));
 const sw=read('sw.js'),html=read('index.html');
 assert.match(build.build,/^PLEGADOX-\d{8}-R\d+$/);
 assert.ok(Number(build.build.match(/R(\d+)$/)[1])>=138,'Mantener R138 o posterior');
 assert.equal(pkg.version,build.version);
 assert.ok(sw.includes(build.cache));
 assert.ok(html.includes('const BUILD="'+build.build+'"'));
 assert.ok(html.includes('PLEGADOX v'+pkg.version));
 assert.equal(manifest.background_color,'#060c16');
 assert.ok(read('splash-foto-premium.html').includes('./plegadox-premium-selected.png'));
 assert.ok(sw.includes('"./plegadox-premium-selected.png"'));
});
