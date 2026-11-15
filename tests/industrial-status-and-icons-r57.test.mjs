import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {normalizeV85,V85_FACTORY} from '../machine-config.js';

test('un esquema Cybelec V85 no puede presentar una geometría de dedo certificada',()=>{
 const config=normalizeV85(V85_FACTORY);
 assert.equal(config.gaugeGeometryDocumented,false);
 assert.equal(config.holderGeometryDocumented,false);
 assert.equal(config.verified,false);
 assert.match(config.geometrySource,/esquemático|esquem/i);
 assert.deepEqual(config.stop,V85_FACTORY.stop);
 assert.deepEqual(config.support,V85_FACTORY.support);
});

test('cada icono premium publicado conserva tamaño PNG correcto',()=>{
 for(const size of [180,192,512]){
  const file=readFileSync(new URL('../icon-premium-'+size+'.png',import.meta.url));
  assert.deepEqual([...file.subarray(0,8)],[137,80,78,71,13,10,26,10]);
  assert.equal(file.readUInt32BE(16),size,'ancho del icono '+size);
  assert.equal(file.readUInt32BE(20),size,'alto del icono '+size);
 }
});

test('manifest y acceso iPhone apuntan al mismo diseño premium, no al icono antiguo',()=>{
 const manifest=JSON.parse(readFileSync(new URL('../manifest.webmanifest',import.meta.url),'utf8'));
 const index=readFileSync(new URL('../index.html',import.meta.url),'utf8');
 const icons=manifest.icons.map(icon=>icon.src);
 assert.ok(icons.includes('./icon-premium-192.png'));
 assert.ok(icons.includes('./icon-premium-512.png'));
 assert.ok(index.includes('href="./icon-premium-180.png"'));
 assert.ok(!icons.includes('./icon-192.png'));
});
