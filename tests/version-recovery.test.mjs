import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const get=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
test('La compilación visible, el manifiesto de recuperación y el SW tienen la misma marca',()=>{
 const build=JSON.parse(get('build-info.json')).build;
 assert.match(build,/^TOPE-20261101-R/);
 const html=get('index.html');
 assert.ok(html.includes('id="buildMark"'));
 assert.ok(html.includes('id="forceUpdateBtn"'));
 assert.ok(html.includes('const BUILD="'+build+'"'));
 assert.ok(html.includes('await clearOldCode()'));
 assert.ok(html.indexOf('await clearOldCode()')<html.indexOf('await loadModules()'));
 assert.ok(html.includes("location.replace(url.href)"));
 assert.ok(!html.includes("localStorage.clear("));
 assert.ok(!html.includes("indexedDB.deleteDatabase("));
 assert.ok(get('sw.js').includes('"./build-info.json"'));
});
test('Arranque con recursos no versionados separado de la caché, sin perder modo offline',()=>{
 const html=get('index.html'),sw=get('sw.js');
 assert.match(html,/<script type="module">/);
 assert.equal((html.match(/src="\.\/app\.js"/g)||[]).length,0);
 assert.ok(html.includes("import('./'+path+'?build='"));
 assert.ok(sw.includes("const CACHE='plegadox-static-0.9.0-tool-advisor-13'"));
 assert.ok(sw.includes("await caches.match(request)"));
});
