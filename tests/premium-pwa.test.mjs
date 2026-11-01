import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const get=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
test('un único tema Titanium, iconos SVG y PWA sin dependencias CDN',()=>{
 const html=get('index.html');
 assert.equal((html.match(/rel="stylesheet"/g)||[]).length,1);
 assert.match(html,/rel="stylesheet" href="\.\/styles\.css"/);
 for(const old of ['cockpit.css','boceto2.css','responsive.css','studio.css'])
  assert.ok(!html.includes(old),'No enlazar hoja antigua '+old);
 for(const id of ['dashboard','edit','tools','ruler','settings','save','upload'])
  assert.ok(get('icons.svg').includes('id="'+id+'"'));
 assert.match(html,/rel="manifest"/);
 assert.match(html,/px-data-grade/);
 assert.match(get('styles.css'),/--px-primary:/);
 assert.match(get('styles.css'),/--px-font-data:/);
});
test('manifest para instalación y caché local versionada',()=>{
 const manifest=JSON.parse(get('manifest.webmanifest'));
 assert.equal(manifest.display,'standalone');
 assert.equal(manifest.start_url,'./index.html');
 assert.ok(manifest.icons.length);
 assert.match(get('sw.js'),/cache.addAll\(APP_FILES\)/);
 assert.ok(get('sw.js').includes("./app.js"));
 assert.ok(get('sw.js').includes("./styles.css"));
});
