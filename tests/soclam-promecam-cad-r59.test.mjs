import test from 'node:test';
import assert from 'node:assert/strict';
import {CATALOG_DIES,CATALOG_SOURCES} from '../catalog.js';
import {checkMachineToolMounting} from '../machine-mounting.js';
const die=id=>CATALOG_DIES.find(d=>d.id===id);

test('14 matrices SOCLAM Promecam T invertida documentadas por fabricante V6..V25 H80/H120',()=>{
 const mapping={6:'2041',8:'2042',10:'2043',12:'2044',16:'2045',20:'2046',25:'2047'};
 for(const [width,code] of Object.entries(mapping)){
  for(const h of [80,120]){
   const ref=code+'_88H'+h;
   const tool=die('promecam-soclam-'+ref.toLowerCase());
   assert.ok(tool,'Falta '+ref);
   assert.equal(tool.opening,Number(width));
   assert.equal(tool.height,h);
   assert.equal(tool.angle,88);
   assert.equal(tool.mount,'Amada/Promecam');
   assert.equal(tool.verifiedSpecs,true);
   assert.equal(tool.profileAccuracy,'provisional');
   assert.match(tool.cadStatus,/importacion-pendiente/);
   assert.equal(tool.cadDownloadUrl,
    'https://www.soclam.com/wp-content/uploads/2026/05/'+ref+'.dxf');
   assert.ok(tool.cadSourceUrl.includes('soclam.com/produit/'));
  }
 }
});

test('V8/V12 y V12/V20 reversibles mantienen su portamatriz sin dibujar CAD inventado',()=>{
 for(const [code,v1,v2] of [['2013',8,12],['2014',12,20]]){
  const t=die('promecam-soclam-'+code+'-88-v'+v1);
  assert.ok(t);
  assert.deepEqual(t.reversibleV,[v1,v2]);
  assert.match(t.requiresDieHolder,/40\.06/);
  assert.equal(t.profileAccuracy,'provisional');
  assert.ok(t.cadDownloadUrl.endsWith('/'+code+'_88.dxf'));
 }
});

test('la Bystronic WILA arriba, Promecam abajo admite familias nominales, no certifica amarre',()=>{
 const machine={profileId:'bystronic-2006-100-3100'};
 const punch={mount:'WILA'};
 const promecam=die('promecam-soclam-2045_88h80');
 const compatible=checkMachineToolMounting(machine,punch,promecam);
 assert.equal(compatible.compatible,true);
 assert.equal(compatible.verified,false);
 const wrong=checkMachineToolMounting(machine,punch,{mount:'WILA'});
 assert.equal(wrong.compatible,false,'matriz WILA no se monta en regleta Promecam sin adaptador distinto');
});

test('V85 no se confunde con V88 estándar sin selección física específica',()=>{
 const all=CATALOG_DIES.filter(t=>/^promecam-soclam-204[1-7]_88h/.test(t.id));
 assert.equal(all.length,14);
 assert.ok(all.every(t=>t.angle===88));
 assert.ok(CATALOG_SOURCES.soclamPromecam204X88?.url);
});
