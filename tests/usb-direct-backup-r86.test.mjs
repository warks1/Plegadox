import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
test('R86: la copia al USB se guarda compacta y no rebasa el tamaño de importación',()=>{
 const code=read('portable/launcher.py');
 assert.match(code,/separators=\(",", ":"\)/);
 assert.match(code,/temporary\.stat\(\)\.st_size > MAX_BACKUP_BYTES/);
 assert.doesNotMatch(code,/json\.dump\(payload, handle, ensure_ascii=False, indent=2\)/);
 const app=read('app.js');
 assert.match(app,/if\(file\.size>4\*1024\*1024\)/);
});
test('R86: la integración del botón se comprueba realmente en PC y iPhone',()=>{
 const wf=read('.github/workflows/check.yml');
 const smoke=read('tests/usb-direct-backup-browser-smoke.mjs');
 assert.match(wf,/tests\/usb-direct-backup-browser-smoke\.mjs/);
 assert.match(smoke,/serviceWorkers:'block'/);
 assert.match(smoke,/PlegadoX-PRUEBA-R86/);
 assert.match(smoke,/prueba-r86/);
 assert.match(smoke,/getAttribute\('data-state'\)/);
 assert.match(smoke,/isVisible\(\),false/);
});
