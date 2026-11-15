import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');
test('USB: launcher limita HTTP al PC y conserva origen estable para biblioteca local',()=>{
 const p=read('portable/launcher.py');
 assert.match(p,/HOST = "127\.0\.0\.1"/);
 assert.match(p,/PORT = 8765/);
 assert.match(p,/ThreadingHTTPServer/);
 assert.match(p,/index\.html/);
 assert.match(p,/build-info\.json/);
 assert.doesNotMatch(p,/0\.0\.0\.0/);
});
test('USB: el ZIP contiene los archivos web, el EXE y explica dónde guardar piezas',()=>{
 const p=read('portable/make_bundle.py');
 const wf=read('.github/workflows/usb-portable-windows.yml');
 assert.match(p,/PlegadoX\.exe/);
 assert.match(p,/MIS_PROYECTOS/);
 assert.match(p,/PlegadoX-USB-Windows\.zip/);
 assert.match(p,/no se copian automáticamente/i);
 assert.match(wf,/windows-latest/);
 assert.match(wf,/PyInstaller/);
 assert.match(wf,/upload-artifact/);
});
