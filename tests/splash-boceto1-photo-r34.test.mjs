import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
import {createHash} from 'node:crypto';
const get=p=>readFileSync(new URL('../'+p,import.meta.url));
test('R34: la pantalla seleccionada usa exactamente los píxeles originales, nunca una recreación',()=>{
 const path='plegadox-premium-selected.png';
 assert.ok(existsSync(new URL('../'+path,import.meta.url)),
  'FALTA FOTO: subir el PNG original del Boceto 1 (incluido en PlegadoX_Boceto_1_Premium_Exacto.zip) antes de fusionar R34');
 const hash=createHash('sha256').update(get(path)).digest('hex');
 assert.equal(hash,'77fcfd39e1dc421adc6b2415e424b398ab35db96cc3c9f57db43fd28154b73b1');
 const html=get('splash-foto-premium.html').toString();
 assert.match(html,/src="\.\/plegadox-premium-selected\.png"/);
 assert.match(html,/PlegadoXLoading/);
 assert.match(html,/setProgress\(value\)/);
});
test('R34: la pantalla foto está conectada al cargador real; piezas conservadas',()=>{
 const html=get('index.html').toString();
 assert.match(html,/src="\.\/splash-foto-premium\.html"/);
 assert.match(html,/const SPLASH_IFRAME=/);
 assert.match(html,/splashProgress/);
 assert.match(html,/await loadModules\(\)/);
 const sw=get('sw.js').toString();
 assert.match(sw,/splash-foto-premium\.html/);
});
