import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {MACHINE_PROFILES} from '../machine-selection.js';
import {reviewNominalToolMount} from '../machine-mount-compatibility-r133.js';
import {cadSourceFor} from '../cad-evidence.js';

const bystronic=MACHINE_PROFILES['bystronic-2006-100-3100'];
const v85=MACHINE_PROFILES['trumpf-v85'];

test('R133: WILA superior y punzón Promecam necesitan adaptador documentado',()=>{
 const report=reviewNominalToolMount({kind:'punch',
  mount:'Amada/Promecam'},bystronic);
 assert.equal(report.status,'ADAPTADOR_SUPERIOR_NECESARIO_PENDIENTE');
 assert.match(report.description,/adaptador específico/);
 assert.equal(report.canApproveForMachine,false);
 assert.equal(report.compatibleForMachine,false);
});
test('R133: matrices insertables V16/V25 Eurostamp requieren regleta y ceros medidos',()=>{
 for(const ref of ['3163','3165']){
  const source=cadSourceFor('die','EUROSTAMP',ref)[0];
  const result=reviewNominalToolMount(source,bystronic);
  assert.equal(result.status,'REGLETA_PROMECAM_DECLARADA_PENDIENTE_CAD');
  assert.equal(result.canApproveForMachine,false);
  assert.match(result.description,/alojamiento/);
 }
});
test('R133: elegir máquina Trumpf V85 sin ficha de amarre no concede compatibilidad',()=>{
 const result=reviewNominalToolMount({kind:'punch',mount:'Amada/Promecam'},v85);
 assert.equal(result.status,'AMARRE_MAQUINA_NO_IDENTIFICADO');
 assert.equal(result.fitPhysicallyVerified,false);
});
test('R133: familia nominal WILA coincidente tampoco acredita zanco físico',()=>{
 const same=reviewNominalToolMount({kind:'punch',mount:'WILA'},bystronic);
 assert.equal(same.status,'FAMILIA_WILA_COINCIDENTE_SIN_MEDICION');
 assert.equal(same.compatibleForMachine,false);
 const mismatch=reviewNominalToolMount({kind:'die',mount:'WILA'},bystronic);
 assert.equal(mismatch.status,'SISTEMAS_DISTINTOS_INFERIOR');
 assert.equal(mismatch.canApproveForMachine,false);
});
test('R133: no inferir montajes en fabricante genérico o tipo de útil desconocido',()=>{
 const ambiguous=reviewNominalToolMount({kind:'punch',
  mount:'TRUMPF/WILA/BYSTRONIC'},bystronic);
 assert.equal(ambiguous.status,'MONTAJE_NO_RESUELTO');
 assert.equal(ambiguous.canApproveForMachine,false);
 assert.equal(reviewNominalToolMount({kind:'ram'},bystronic).status,
  'TIPO_DESCONOCIDO');
 const ui=readFileSync(new URL('../cad-evidence-ui.js',import.meta.url),'utf8');
 assert.match(ui,/reviewNominalToolMount/);
 assert.match(ui,/mountNotice/);
 const sw=readFileSync(new URL('../sw.js',import.meta.url),'utf8');
 assert.match(sw,/"\.\/machine-mount-compatibility-r133\.js"/);
});
