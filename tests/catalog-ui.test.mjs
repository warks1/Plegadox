import test from 'node:test';
import assert from 'node:assert/strict';
import {DIES,PUNCHES,EXAMPLE,normalized,getTooling,profile,orientedForMachine} from '../engine.js';
import {CATALOG_PUNCHES,CATALOG_DIES,CATALOG_SOURCES,registerCatalogue,selectionCompatibility,toolMatchesBrand} from '../catalog.js';
import {readFileSync} from 'node:fs';
registerCatalogue(DIES,PUNCHES);
test('biblioteca documentada y diferenciada por fabricante',()=>{
 for(const brand of ['Trumpf','Amada','Bystronic']){
  assert.ok(CATALOG_PUNCHES.some(t=>t.manufacturer===brand));
  assert.ok(CATALOG_DIES.some(t=>t.manufacturer===brand));
 }
 assert.ok(CATALOG_PUNCHES.some(t=>t.id==='amada-831' && t.angle===30 && t.height===200));
 assert.ok(CATALOG_DIES.some(t=>t.id==='trumpf-ev001' && t.opening===6 && t.height===100));
});
test('las fichas provisionales NO se presentan como perfiles certificados',()=>{
 for(const tool of [...CATALOG_PUNCHES,...CATALOG_DIES]){
  assert.equal(tool.profileAccuracy,'provisional');
  assert.ok(tool.source in CATALOG_SOURCES);
  assert.ok(tool.mount);
  assert.ok(toolMatchesBrand(tool,tool.manufacturer));
 }
 assert.equal(CATALOG_PUNCHES.find(p=>p.id==='bystronic-rfa-demo').verifiedSpecs,false);
});
test('una selección publicada se conecta realmente al motor',()=>{
 const p=normalized({...EXAMPLE,die:'trumpf-ev001',punch:'trumpf-ow200-k'});
 const {punch,die}=getTooling(p);
 assert.equal(punch.reference,'OW200/K');
 assert.equal(die.reference,'EV001');
});
test('no se presume compatibilidad de montajes cruzados',()=>{
 const punch=CATALOG_PUNCHES.find(t=>t.id==='amada-831');
 const die=CATALOG_DIES.find(t=>t.id==='trumpf-ev001');
 assert.equal(selectionCompatibility(punch,die).compatible,false);
 assert.equal(selectionCompatibility(CATALOG_PUNCHES.find(p=>p.id==='conic-act-12-3006'),CATALOG_DIES.find(d=>d.id==='conic-v006-30-s')).compatible,null);
});
test('−90 conserva dirección negativa también en la vista de máquina',()=>{
 const piece=normalized({...EXAMPLE,flanges:[50,50],angles:[-90],order:[0]});
 const final=profile(piece,[1]).points;
 assert.ok(final[2].y<0);
 const machine=orientedForMachine(piece,[1],0);
 assert.ok(machine[2].y<0,'La vista de máquina no puede transformar −90° en +90°');
 const opposite=orientedForMachine({...piece,angles:[90]},[1],0);
 assert.ok(opposite[2].y>0,'+90° y −90° quedan en lados opuestos');
});
test('interfaz está conectada y presenta los módulos y mandos reales',()=>{
 const html=readFileSync(new URL('../index.html',import.meta.url),'utf8');
 for(const item of ['cockpit.css','cockpit.js','machineCanvas','progressCanvas','sceneCanvas','cockpitTools','cpBrandTabs','playBtn','pauseBtn','timeline']){
  assert.ok(html.includes(item),item+' falta en el HTML');
 }
 assert.match(html,/class="panel active cockpit-page"/);
 assert.match(html,/data-brand="Trumpf"/);
});
