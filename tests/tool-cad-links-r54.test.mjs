import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {CATALOG_PUNCHES,CATALOG_DIES,CATALOG_SOURCES} from '../catalog.js';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');

test('fuentes de WILA y Promecam vinculadas a fichas reales, sin anunciar perfiles OEM importados',()=>{
 const byId=id=>[...CATALOG_PUNCHES,...CATALOG_DIES].find(t=>t.id===id);
 for(const id of ['wila-biu-021','wila-ozu-012']){
  const tool=byId(id);
  assert.ok(tool?.cadSourceUrl?.startsWith('https://www.wilatooling.com/'));
  assert.equal(tool.profileAccuracy,'provisional');
  assert.equal(tool.cadStatus,'pendiente-de-importar-DXF-fabricante');
  assert.notEqual(tool.importedDxf,true);
  assert.ok(tool.source in CATALOG_SOURCES);
 }
 const biu=byId('wila-biu-021'),ozu=byId('wila-ozu-012');
 assert.equal(biu.height,163);
 assert.equal(biu.angle,28);
 assert.equal(ozu.opening,16);
 assert.equal(ozu.angle,86);
});
test('los enlaces DXF están fuera de botones de herramienta y no cambian el montaje por sí solos',()=>{
 const app=read('app.js'),html=read('index.html');
 assert.match(html,/id="toolCadSourceLinks"/);
 assert.match(app,/function renderToolCards\(\)/);
 assert.match(app,/sources.replaceChildren\(\.\.\.nodes\)/);
 assert.match(app,/a\.href=tool\.cadSourceUrl/);
 assert.match(app,/noopener noreferrer/);
 assert.match(app,/Perfil 2D importado de DXF local/);
 assert.match(html,/para sustituir el contorno provisional/);
});
