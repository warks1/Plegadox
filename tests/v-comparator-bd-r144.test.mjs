import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');

test('R144: cache del comparador V reacciona a BD medida del taller',()=>{
 const js=read('app.js');
 const section=js.slice(js.indexOf('function renderVComparison(){'),js.indexOf('function renderFlatBendRows(){'));
 assert.match(section,/piece\.bendDeductionByBend\]\)/);
 assert.match(section,/currentDev\.flatPatternFeasible/);
 assert.match(section,/dev\.flatPatternFeasible/);
 assert.match(section,/No factible/);
 assert.match(section,/button\.disabled=d\.id===piece\.die/);
});
test('R144: instalador Windows y PWA tienen la misma versión',()=>{
 const b=JSON.parse(read('build-info.json')),pkg=JSON.parse(read('package.json'));
 assert.equal(b.build,'PLEGADOX-20261117-R144');
 assert.equal(b.version,'0.9.118');
 assert.equal(pkg.version,b.version);
 assert.ok(read('index.html').includes('const BUILD="'+b.build+'"'));
 assert.ok(read('sw.js').includes(b.cache));
 assert.ok(read('software-about.js').includes("const VERSION='"+b.version+"'"));
 assert.match(read('.github/workflows/usb-portable-windows.yml'),/PLEGADOX_INSTALLER_WINDOWS_OK/);
});
