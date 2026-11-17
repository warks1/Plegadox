import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');

test('R140: la app no se destapa antes de que aparezca la fotografía de carga',()=>{
 const h=read('index.html');
 const gate=h.slice(h.indexOf('const waitForSplashVisual=async()=>'),h.indexOf('const serverBuildId=async()=>'));
 assert.match(gate,/if\(!SPLASH_IMAGE\.complete\)/);
 assert.match(gate,/SPLASH_IMAGE\.addEventListener\('load',done\)/);
 assert.match(gate,/SPLASH_IMAGE\.addEventListener\('error',done\)/);
 assert.match(gate,/setTimeout\(done,6000\)/);
 assert.match(gate,/await revealImmediateSplash\(\)/);
 assert.ok(gate.indexOf('await waitForSplashVisual()')<gate.indexOf('splashStep(100'));
 assert.ok(gate.indexOf('await waitForSplashVisual()')<gate.indexOf("SPLASH?.classList.add('is-complete')"));
});
test('R140: versión y caché correctas sin borrar datos',()=>{
 const b=JSON.parse(read('build-info.json')),pkg=JSON.parse(read('package.json'));
 const h=read('index.html'),sw=read('sw.js'),about=read('software-about.js');
 assert.equal(b.build,'PLEGADOX-20261117-R140');
 assert.equal(b.version,'0.9.114');
 assert.equal(pkg.version,b.version);
 assert.ok(h.includes('const BUILD="'+b.build+'"'));
 assert.ok(sw.includes(b.cache));
 assert.ok(about.includes("const BUILD='"+b.build+"'"));
 assert.ok(about.includes("const VERSION='"+b.version+"'"));
 assert.ok(read('splash-foto-premium.html').includes('./plegadox-premium-selected.png'));
 assert.ok(!h.includes('localStorage.clear('));
 assert.ok(!h.includes('indexedDB.deleteDatabase('));
});
