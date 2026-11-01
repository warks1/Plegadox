import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=file=>readFileSync(new URL('../'+file,import.meta.url),'utf8');
test('UI y paquete muestran la misma versión semántica',()=>{
 const pkg=JSON.parse(read('package.json')),html=read('index.html');
 assert.ok(html.includes('PLEGADOX v'+pkg.version));
});
test('favicon y carpetas generadas quedan configurados',()=>{
 const html=read('index.html');
 assert.match(html,/href="\.\/favicon\.svg"/);
 assert.match(read('favicon.svg'),/<svg\b/);
 const ignore=read('.gitignore');
 assert.match(ignore,/node_modules\//);
 assert.match(ignore,/test-results\//);
});
