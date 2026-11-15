import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
test('R85: botón USB sólo se descubre en el ejecutable local, no en web',()=>{
 const html=read('index.html'),app=read('app.js');
 assert.match(html,/id="saveUsbBackupBtn" hidden/);
 assert.match(html,/id="usbBackupHint" hidden/);
 assert.match(app,/location\.hostname==='127\.0\.0\.1'/);
 assert.match(app,/fetch\('\.\/__plegadox_usb__\/status'/);
 assert.match(app,/makeCompleteBackup/);
 assert.match(app,/X-PlegadoX-USB-Token/);
});
test('R85: endpoint local protege token, origen, formato y límite',()=>{
 const py=read('portable/launcher.py');
 assert.match(py,/secrets\.compare_digest/);
 assert.match(py,/Origin/);
 assert.match(py,/MAX_BACKUP_BYTES = 4 \* 1024 \* 1024/);
 assert.match(py,/plegadox-complete-project-v1/);
 assert.match(py,/NamedTemporaryFile/);
 assert.match(py,/os\.replace/);
 assert.match(py,/MIS_PROYECTOS/);
});
test('R85: PWA jamás guarda en caché el token de sesión del USB',()=>{
 const sw=read('sw.js');
 assert.match(sw,/pathname\.startsWith\('\/__plegadox_usb__\/'\)\)return/);
});
test('R85: restaura las copias USB hasta el mismo límite del exportador',()=>{
 const app=read('app.js');
 assert.match(app,/if\(file\.size>4\*1024\*1024\)/);
});
