import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');

test('R141: recursos de carga premium usan caché de revisión antes de red',()=>{
 const sw=read('sw.js');
 const loc=sw.indexOf('if(SPLASH_ASSETS.has('),net=sw.indexOf('// Estrategia network-first');
 const block=sw.slice(loc,net);
 assert.ok(loc>0&&net>loc);
 assert.match(sw,/new URL\('\.\/plegadox-premium-selected\.png',self\.registration\.scope\)\.pathname/);
 assert.match(sw,/new URL\('\.\/splash-foto-premium\.html',self\.registration\.scope\)\.pathname/);
 assert.ok(block.indexOf('const cached=await cache.match(request)')<block.indexOf('const response=await fetch(request)'));
 assert.match(block,/if\(cached\)return cached/);
 assert.match(block,/const cache=await caches\.open\(CACHE\)/);
 assert.match(block,/if\(response\.ok\)await cache\.put\(request,response\.clone\(\)\)/);
 assert.match(sw,/if\(request\.mode==='navigate'\)/);
 assert.match(sw,/const response=await fetch\(request\);/);
 for(const item of ['index.html','app.js','plegadox-premium-selected.png','splash-foto-premium.html'])
  assert.ok(sw.includes('"./'+item+'"'),item+' debe funcionar offline');
});
test('R141: versiones coherentes y datos de plegado preservados',()=>{
 const b=JSON.parse(read('build-info.json')),pkg=JSON.parse(read('package.json'));
 const h=read('index.html'),about=read('software-about.js'),sw=read('sw.js');
 assert.equal(b.version,'0.9.115');
 assert.equal(b.build,'PLEGADOX-20261117-R141');
 assert.equal(pkg.version,b.version);
 assert.ok(h.includes('const BUILD="'+b.build+'"'));
 assert.ok(about.includes("const BUILD='"+b.build+"'"));
 assert.ok(about.includes("const VERSION='"+b.version+"'"));
 assert.ok(sw.includes("const CACHE='"+b.cache+"'"));
 assert.ok(!h.includes('localStorage.clear('));
 assert.ok(!h.includes('indexedDB.deleteDatabase('));
});
