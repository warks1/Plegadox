import test from 'node:test';
import assert from 'node:assert/strict';
import {CATALOG_PUNCHES,CATALOG_DIES} from '../catalog.js';
import {checkMachineToolMounting} from '../machine-mounting.js';
import {sectionPunch,sectionDie} from '../tool-profiles.js';
const punch=id=>CATALOG_PUNCHES.find(x=>x.id===id);
const die=id=>CATALOG_DIES.find(x=>x.id===id);
test('WILA BIU 021/033 y matrices OZU están identificados por fabricante',()=>{
 assert.equal(punch('wila-biu-021').angle,28);
 assert.equal(punch('wila-biu-021').height,163);
 assert.equal(punch('wila-biu-033').angle,86);
 assert.equal(punch('wila-biu-033').height,200);
 assert.equal(die('wila-ozu-012').opening,16);
 assert.equal(die('wila-ozu-012').angle,86);
 assert.equal(die('wila-ozu-045').angle,90);
});
test('contornos OEM pendientes de importar, no fingir que son CAD medido',()=>{
 for(const tool of [punch('wila-biu-021'),punch('wila-biu-033'),
  punch('promecam-eurostamp-1193'),die('wila-ozu-012'),
  die('promecam-soclam-2012-88-v6')]){
  assert.ok(tool.cadSourceUrl.startsWith('https://'));
  assert.notEqual(tool.profileAccuracy,'verified');
  assert.equal(tool.importedDxf,undefined);
  assert.equal(sectionPunch(tool).sourceContourVerified===true,false);
 }
});
test('regleta Promecam del usuario no admite matriz WILA sin adaptador adicional',()=>{
 const m={profileId:'bystronic-2006-100-3100'};
 assert.equal(checkMachineToolMounting(m,punch('wila-biu-033'),
   die('promecam-soclam-2012-88-v6')).compatible,true);
 assert.equal(checkMachineToolMounting(m,punch('wila-biu-033'),
   die('wila-ozu-012')).compatible,false);
 assert.equal(checkMachineToolMounting(m,punch('promecam-eurostamp-1193'),
   die('promecam-soclam-2012-88-v6')).compatible,false);
});
test('DXF de SOCLAM identificado para importar no insertado como contorno inventado',()=>{
 const d=die('promecam-soclam-2015-88-v16');
 assert.deepEqual(d.reversibleV,[16,25]);
 assert.equal(d.activeV,16);
 assert.ok(d.cadDownloadUrl.endsWith('2015_88.dxf'));
 assert.ok(!Array.isArray(d.profilePoints));
 assert.equal(sectionDie(d).provisional,true);
});
