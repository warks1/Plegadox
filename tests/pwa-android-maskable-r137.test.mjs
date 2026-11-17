import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';

const read=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');
const manifest=JSON.parse(read('manifest.webmanifest'));
const maskable=read('icon-android-maskable.svg');

test('R137: icono Android adaptable separado de iconos normales',()=>{
 assert.equal(manifest.name,'PlegadoX');
 assert.equal(manifest.short_name,'PlegadoX');
 assert.equal(manifest.background_color,'#060c16');
 assert.equal(manifest.theme_color,'#060c16');
 assert.equal(manifest.display,'standalone');
 assert.equal(manifest.start_url,'./index.html');
 assert.equal(manifest.scope,'./');
 assert.equal(manifest.icons.filter(i=>i.purpose==='maskable').length,1);
 assert.ok(manifest.icons.some(i=>i.src==='./icon-premium-192.png'&&i.purpose==='any'));
 assert.ok(manifest.icons.some(i=>i.src==='./icon-premium-512.png'&&i.purpose==='any'));
 assert.ok(manifest.icons.some(i=>i.src==='./icon-android-maskable.svg'&&
  i.purpose==='maskable'&&i.type==='image/svg+xml'&&i.sizes==='any'));
 assert.ok(!manifest.icons.some(i=>i.purpose==='any maskable'),
  'El PNG con esquinas transparentes nunca debe marcarse como maskable');
 assert.ok(manifest.icons.every(i=>existsSync(new URL('../'+i.src,import.meta.url))));
});
test('R137: símbolo premium verdadero sobre fondo oscuro opaco de borde a borde',()=>{
 const old=read('favicon.svg');
 assert.match(maskable,/viewBox="0 0 512 512"/);
 assert.match(maskable,/<rect width="512" height="512" fill="#060c16"\s*\/>/);
 assert.match(maskable,/<g transform="translate\(35\.84 35\.84\) scale\(0\.86\)">/);
 for(const signature of [
  'M124 123H292Q390 123',
  'M73 223Q154 78 300 88',
  'M143 391H205L259 438',
  'M75 334L166 320'
 ]){
  assert.ok(old.includes(signature),'Falta símbolo original '+signature);
  assert.ok(maskable.includes(signature),'Icono Android alteró el símbolo '+signature);
 }
 assert.ok(!maskable.includes('Molded industrial enclosure'),
  'El marco original no debe recortarse y dibujar un cuadrado blanco');
 assert.match(maskable,/<\/svg>\s*$/);
});
test('R137: Android usa el icono del sistema antes de la pantalla premium HTML, sin sustituirla',()=>{
 const html=read('index.html'),splash=read('splash-foto-premium.html');
 const sw=read('sw.js'),build=JSON.parse(read('build-info.json'));
 assert.match(html,/<link rel="manifest" href="\.\/manifest\.webmanifest">/);
 assert.match(html,/<meta name="theme-color" content="#060c16">/);
 assert.match(html,/id="pxTitaniumSplash"/);
 assert.match(html,/id="pxSplashReference"[^>]*src="\.\/splash-foto-premium\.html"/);
 assert.ok(splash.includes('./plegadox-premium-selected.png'),
  'No se puede sustituir el boceto premium elegido');
 assert.ok(html.includes('icon-premium-180.png'),
  'No cambiar el icono de iPhone');
 assert.match(sw,/"\.\/icon-android-maskable\.svg"/);
 assert.match(build.version,/^0\.9\.\d+$/);
 assert.match(build.build,/^PLEGADOX-\d{8}-R\d+$/);
 assert.ok(build.cache.startsWith('plegadox-static-'));
 assert.ok(build.cache.includes(build.version));
});
