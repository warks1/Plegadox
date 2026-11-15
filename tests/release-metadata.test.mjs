import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';

const load=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');

test('R28: build, version y caché coherentes para actualización PWA',()=>{
 const info=JSON.parse(load('build-info.json'));
 const pkg=JSON.parse(load('package.json'));
 const html=load('index.html');
 const sw=load('sw.js');
 assert.match(info.build,/^PLEGADOX-\d{8}-R\d+$/);
 assert.equal(info.version,pkg.version);
 assert.ok(html.includes('name="plegadox-build" content="'+info.build+'"'));
 assert.ok(html.includes('const BUILD="'+info.build+'"'));
 assert.ok(html.includes('id="buildMark"')&&html.includes(info.build));
 assert.ok(html.includes('PLEGADOX v'+info.version));
 assert.ok(html.includes("import('./'+path+'?build='+encodeURIComponent(BUILD))"));
 assert.ok(sw.includes("const CACHE='"+info.cache+"'"));
 assert.ok(info.cache.includes(info.version));
 assert.ok(info.cache.includes(info.build.match(/R\d+$/)[0].toLowerCase()));
});

test('iconos PNG PWA/Apple válidos y presentes entre los archivos offline',()=>{
 const manifest=JSON.parse(load('manifest.webmanifest'));
 const html=load('index.html'),sw=load('sw.js');
 for(const size of [180,192,512]){
  const path='icon-'+size+'.png';
  assert.ok(existsSync(new URL('../'+path,import.meta.url)),path+' ausente');
  const png=readFileSync(new URL('../'+path,import.meta.url));
  assert.ok(png.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10])),path+' firma PNG inválida');
  assert.equal(png.readUInt32BE(16),size);
  assert.equal(png.readUInt32BE(20),size);
  assert.ok(sw.includes('"./'+path+'"'),path+' no se conserva offline');
 }
 // Los iconos históricos siguen disponibles para accesos antiguos;
 // el manifest y el acceso iOS usan el diseño premium actual.
 for(const size of [180,192,512]){
  const premium='icon-premium-'+size+'.png';
  assert.ok(existsSync(new URL('../'+premium,import.meta.url)),premium+' ausente');
  const png=readFileSync(new URL('../'+premium,import.meta.url));
  assert.ok(png.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10])),premium+' no es PNG válido');
  assert.equal(png.readUInt32BE(16),size);
  assert.equal(png.readUInt32BE(20),size);
  assert.ok(sw.includes('"./'+premium+'"'),premium+' no se guarda offline');
 }
 for(const size of [192,512]){
  assert.ok(manifest.icons.some(icon=>icon.src==='./icon-premium-'+size+'.png'&&
   icon.sizes===size+'x'+size&&icon.type==='image/png'));
 }
 assert.match(html,/rel="apple-touch-icon" sizes="180x180" href="\\.\\/icon-premium-180\\.png"/);
 assert.ok(manifest.icons.some(icon=>icon.src==='./favicon.svg'));
 assert.ok(sw.includes('"./storage-notice.js"'));
});
