import test from 'node:test';
import assert from 'node:assert/strict';
import {gaugeMovementLabel} from '../machine-visual.js';

test('los cambios de cota entre golpes NO se muestran como retroceso de colisión',()=>{
 for(const n of [1,2]){
  const label=gaugeMovementLabel({stopNumber:n,gaugeTransition:{
   phase:'reubicacion-siguiente-golpe',moving:true}});
  assert.match(label,/CAMBIO DE COTA PARA EL SIGUIENTE GOLPE/);
  assert.doesNotMatch(label,/RETIRAD|RETROCESO|PENETRACI/);
 }
});
test('retroceso preventivo real sí se identifica con su causa',()=>{
 const retreat=gaugeMovementLabel({stopNumber:2,gaugeTransition:{
  phase:'retroceso-antes-plegado',moving:true}});
 assert.match(retreat,/RETROCESO POR PENETRACIÓN 2D PREVISTA/);
 const parked=gaugeMovementLabel({stopNumber:2,gaugeTransition:{
  phase:'retirado-durante-plegado',moving:false}});
 assert.match(parked,/APARCADO POR PENETRACIÓN 2D PREVISTA/);
 const returned=gaugeMovementLabel({stopNumber:2,gaugeTransition:{
  phase:'regreso-a-siguiente-referencia',moving:true}});
 assert.match(returned,/VUELTA DESDE RETIRADA PREVENTIVA/);
});
test('ninguna transición significa que no hay movimiento del dedo',()=>{
 assert.equal(gaugeMovementLabel({stopNumber:1,gaugeTransition:null}),'');
});
