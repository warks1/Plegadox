import test from 'node:test';
import assert from 'node:assert/strict';
import {parseToolDxf} from '../tool-dxf.js';
import {machineCadFromDXF,normalizeMachineCad,positionMachineCad} from '../machine-cad.js';

const wrap=(entities,header=[])=>[
 '0','SECTION','2','HEADER',...header,'0','ENDSEC',
 '0','SECTION','2','ENTITIES',...entities,'0','ENDSEC','0','EOF'
].join('\n')+'\n';
const polygon=[
 '0','LWPOLYLINE','90','4','70','1',
 '10','-20','20','0','10','20','20','0',
 '10','20','20','100','10','-20','20','100'
];
const config={kind:'ram',offsetX:0,offsetY:125,zMin:-60,zMax:60,
 source:'V85: plano de ensayo con unidades mm explícitas'};
const millimeters=['9','$INSUNITS','70','4'];

test('R37: el CAD de máquina exige $INSUNITS=4 para evitar falsas escalas',()=>{
 assert.throws(()=>machineCadFromDXF(wrap(polygon),config),
  /debe declarar milímetros/);
 assert.throws(()=>machineCadFromDXF(
  wrap(polygon,['9','$INSUNITS','70','1']),config),/no milimétricas/);
 const imported=machineCadFromDXF(wrap(polygon,millimeters),config);
 assert.equal(imported.unitsAssumed,false);
 assert.equal(imported.dimensionHeight,100);
});
test('R37: un DXF unitless antiguo se conserva, pero no se aplica a colisiones',()=>{
 const legacy=normalizeMachineCad({...config,
  sourceFormat:'DXF_ASCII_MM',unitsAssumed:true,
  points:[[-20,0],[20,0],[20,100],[-20,100]]});
 assert.equal(legacy.unitsAssumed,true);
 assert.throws(()=>positionMachineCad(legacy,{x:0,y:0}),
  /excluido de colisiones/);
});
test('R37: LINE no acepta extrusión, OCS ni Z fuera de plano',()=>{
 const line=(a,b,c,d,extra=[])=>[
  '0','LINE','10',String(a),'20',String(b),
  '11',String(c),'21',String(d),...extra];
 const base=[
  ...line(-20,0,20,0),
  ...line(20,0,20,100),
  ...line(20,100,-20,100),
  ...line(-20,100,-20,0)
 ];
 assert.equal(parseToolDxf(wrap(base,millimeters)).points.length,4);
 const badThickness=[...line(-20,0,20,0,['39','1']),...base.slice(10)];
 assert.throws(()=>parseToolDxf(wrap(badThickness,millimeters)),
  /grosor|extrusion OCS/);
 const badNormal=[...line(-20,0,20,0,['210','1']),...base.slice(10)];
 assert.throws(()=>parseToolDxf(wrap(badNormal,millimeters)),
  /fuera del plano XY|extrusion OCS/);
});
