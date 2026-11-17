import test from 'node:test';
import assert from 'node:assert/strict';
import {normalizePreferences,parsePreferences} from '../preferences-model.js';
test('rechaza archivos ajenos y versiones desconocidas',()=>{
 for(const text of ['{}','null','{"format":"plegadox-preferences","version":2,"preferences":{}}','x'.repeat(65537)])assert.throws(()=>parsePreferences(text));
});
test('normaliza valores no admitidos sin heredar claves externas',()=>{
 const p=normalizePreferences({speed:'99',startup:'javascript:alert(1)',shortcuts:'on',piece:{}});
 assert.equal(p.speed,'1');assert.equal(p.startup,'simulacion');assert.equal(p.shortcuts,'on');assert.equal(p.piece,undefined);
});
test('exportación e importación conservan preferencias válidas',()=>{
 const p=normalizePreferences({textSize:'extra',density:'touch',speed:'.5'});
 assert.deepEqual(parsePreferences(JSON.stringify({format:'plegadox-preferences',version:1,preferences:p})).preferences,p);
});
