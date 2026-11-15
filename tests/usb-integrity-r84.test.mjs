import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read = p => readFileSync(new URL('../'+p,import.meta.url),'utf8');
test('R84: el ZIP se audita antes de distribuirse en Windows',()=>{
 const wf=read('.github/workflows/usb-portable-windows.yml');
 const audit=wf.indexOf('python portable/verify_bundle.py');
 const artifact=wf.indexOf('actions/upload-artifact@v4');
 assert.ok(audit>=0&&artifact>audit);
 assert.match(wf,/Probar el EXE compilado dentro del paquete USB real/);
});
test('R84: un recurso SW faltante o un gráfico de splash ausente abortan el paquete',()=>{
 const script=read('portable/verify_bundle.py');
 assert.match(script,/PLEGADOX_USB_ASSETS_OK/);
 assert.match(script,/SW_RE/);
 assert.match(script,/splash-foto-premium\.html/);
 assert.match(script,/plegadox-premium-selected\.png/);
 assert.match(script,/JS_IMPORT_RE/);
 assert.match(script,/LocalAssets/);
 assert.match(script,/raise FileNotFoundError/);
});
test('R84: el EXE verifica recursos HTTP en el USB, no solamente la portada',()=>{
 const script=read('portable/launcher.py');
 assert.match(script,/for path in paths:/);
 assert.match(script,/with urlopen\(base \+ path/);
 assert.match(script,/len\(paths\) < 65/);
});
