import test from 'node:test';
import assert from 'node:assert/strict';
import {inspectPunchWorkingAxis,inspectDieWorkingAxis,
 alignToolSectionToWorkingAxis} from '../tool-cad-datum.js';
import {importedTool,parseToolDxf} from '../tool-dxf.js';
import {sectionPunch,sectionDie} from '../tool-profiles.js';
import {EXAMPLE,PUNCHES,DIES,normalized} from '../engine.js';
import {technicalScene} from '../technical-section.js';

// Útiles sintéticos con mm conocidos: NO son perfiles de ningún OEM.
const gooseneck=[
 [-30,110],[20,110],[20,95],[31,95],[31,60],[26,44],
 [25,12],[20,0],[0,38],[-12,57],[-5,84],[0,84],
 [0,95],[-30,95]
];
const singleV=[
 [-24,80],[-8,80],[0,63],[8,80],[24,80],
 [24,0],[-24,0]
];
const doubleV=[
 [-50,80],[-28,80],[-20,62],[-12,80],[12,80],
 [20,62],[28,80],[50,80],[50,0],[-50,0]
];
const createDXF=points=>[
 '0','SECTION','2','HEADER','9','$INSUNITS','70','4',
 '0','ENDSEC','0','SECTION','2','ENTITIES',
 '0','LWPOLYLINE','90',String(points.length),'70','1',
 ...points.flatMap(p=>['10',String(p[0]),'20',String(p[1])]),
 '0','ENDSEC','0','EOF',''
].join('\n');

test('R111: en pata de cabra el eje de la punta NO coincide con centro del cuerpo',()=>{
 const observed=inspectPunchWorkingAxis(gooseneck);
 assert.equal(observed.datumEstablished,true);
 assert.equal(observed.axisX,20);
 assert.equal(observed.boundingBoxCenterX,.5);
 assert.equal(observed.offCenterMm,19.5);
 const fixed=alignToolSectionToWorkingAxis(gooseneck,'punch');
 assert.equal(fixed.offsetX,20);
 assert.ok(fixed.points.some(p=>p[0]===0&&p[1]===0));
 assert.equal(fixed.inferred,true);
 assert.equal(fixed.manufacturerDatumVerified,false);
 assert.deepEqual(gooseneck[7],[20,0],'No mutar el CAD importado');
});

test('R111: DXF realista de pata de cabra se dibuja en el eje X=0 sin alterar la forma',()=>{
 const parsed=parseToolDxf(createDXF(gooseneck));
 const appearance=inspectPunchWorkingAxis(parsed.points);
 assert.ok(Math.abs(appearance.offCenterMm)>10);
 const tool=importedTool(parsed,{kind:'punch',name:'Catra CAD test',
  angle:88,length:415,tip:2,mount:'Amada/Promecam'});
 assert.equal(tool.workingAxisX,0);
 assert.equal(tool.datumVerified,false);
 const geometry=sectionPunch(tool);
 assert.deepEqual(geometry.points,tool.profilePoints);
 assert.ok(geometry.points.some(p=>p[0]===0&&p[1]===0));
 assert.equal(geometry.importedDxf,true);
 assert.equal(tool.profileAccuracy,'provisional');
});

test('R111: el vértice de una V única se alinea en X=0',()=>{
 const observed=inspectDieWorkingAxis(singleV);
 assert.equal(observed.vCount,1);
 assert.equal(observed.axisX,0);
 const shifted=singleV.map(([x,y])=>[x+12,y+20]);
 const out=alignToolSectionToWorkingAxis(shifted,'die');
 assert.equal(out.offsetX,12);
 assert.equal(out.originalDatumY,20);
 assert.ok(out.points.some(p=>p[0]===0&&p[1]===63));
});

test('R111: matriz reversible requiere elegir V y prohíbe usar otra garganta',()=>{
 const seen=inspectDieWorkingAxis(doubleV);
 assert.equal(seen.vCount,2);
 assert.equal(seen.datumEstablished,false);
 assert.throws(()=>alignToolSectionToWorkingAxis(doubleV,'die'),
  /MATRIZ_MULTIPLE_V_REQUIERE_SELECCION/);
 assert.throws(()=>alignToolSectionToWorkingAxis(doubleV,'die',{axisX:0}),
  /no coincide con ninguna garganta/);
 const left=alignToolSectionToWorkingAxis(doubleV,'die',{axisX:-20});
 const right=alignToolSectionToWorkingAxis(doubleV,'die',{axisX:20});
 assert.notDeepEqual(left.points,right.points);
 assert.ok(left.points.some(p=>p[0]===0&&p[1]===62));
 assert.ok(right.points.some(p=>p[0]===0&&p[1]===62));
 assert.equal(left.inferred,false);
});

test('R111: un rectángulo SIN V se rechaza como matriz convencional',()=>{
 const plain=[[-20,100],[20,100],[20,0],[-20,0]];
 assert.equal(inspectDieWorkingAxis(plain).vCount,0);
 assert.throws(()=>alignToolSectionToWorkingAxis(plain,'die',{axisX:0}),
  /SIN GARGANTA V/);
 const parsed=parseToolDxf(createDXF(plain));
 assert.throws(()=>importedTool(parsed,{kind:'die',name:'Falso V16',
  angle:88,length:415,opening:16,axisX:0}),/SIN GARGANTA V/);
});

test('R111: no puede asignarse un eje X distinto de la punta medida',()=>{
 assert.throws(()=>alignToolSectionToWorkingAxis(gooseneck,'punch',{axisX:0}),
  /no coincide con la punta/);
 assert.throws(()=>alignToolSectionToWorkingAxis(gooseneck,'punch',{axisX:1e9}),
  /fuera de su contorno/);
});

test('R111: forma del punzón y la matriz es idéntica en biblioteca y sección 2D',()=>{
 const pa=parseToolDxf(createDXF(gooseneck));
 const da=parseToolDxf(createDXF(singleV));
 const punch=importedTool(pa,{kind:'punch',name:'Pata test',
  angle:88,length:415,tip:2});
 const die=importedTool(da,{kind:'die',name:'V test',
  angle:88,length:415,opening:16});
 PUNCHES.push(punch);DIES.push(die);
 const piece=normalized({...EXAMPLE,punch:punch.id,die:die.id});
 const scene=technicalScene(piece,2.7);
 assert.equal(scene.punchPolygon.length,sectionPunch(punch).points.length);
 assert.equal(scene.diePolygon.length,sectionDie(die).points.length);
 const expected=sectionPunch(punch).points.map(([x,y])=>({
  x,y:y+scene.kinematics.tipHeight
 }));
 assert.deepEqual(scene.punchPolygon,expected);
 assert.equal(scene.verified,false);
});
