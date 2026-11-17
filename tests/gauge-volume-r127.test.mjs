import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {assessGaugeDepth} from '../machine-gauge-depth.js';
import {describeGaugeVisualEvidence} from '../machine-gauge-evidence.js';
import {gaugeSolidStyle} from '../machine-solid-gauge-style.js';
import {visibleVolumeFaces} from '../machine-volume-layers.js';
import {makePrism} from '../volume-engine.js';

const poly=[{x:0,y:0},{x:10,y:0},{x:10,y:20},{x:0,y:20}];
const sheet=[makePrism('chapa',poly,-120,120,'chapa-medida')];
const gauge=(a,b)=>makePrism('tope',poly,a,b,'perfil CAD importado DXF · Z declarada');
const noCollision={gaugeInterference:{kind:'sin-interferencia-detectada',warning:false},
 gaugeDecision:{known:true}};
const planarCollision={gaugeInterference:{kind:'penetracion',warning:true},
 gaugeDecision:{known:true}};

test('R127: dedo fuera de anchura Z no puede hacer de tope aunque en perfil aparezca',()=>{
 const z=assessGaugeDepth(sheet,gauge(121,150));
 assert.equal(z.kind,'dedo-fuera-de-anchura-z');
 assert.equal(z.overlapMm,0);
 assert.equal(z.contactAvailable,false);
 const green=describeGaugeVisualEvidence(noCollision,gauge(121,150),sheet);
 assert.equal(green.level,'amber');
 assert.equal(green.code,'tope-fuera-de-z');
 assert.match(green.message,/NO PUEDE SERVIR DE TOPE/);
 const red=describeGaugeVisualEvidence(planarCollision,gauge(121,150),sheet);
 assert.equal(red.level,'amber');
 assert.equal(red.planarLevel,'red');
 assert.match(red.message,/sin coincidencia transversal real/);
 assert.match(red.message,/no hay penetración volumétrica/);
 assert.equal(red.verified,false);
});
test('R127: CAD con coincidencia Z conserva riesgo XY, nunca certifica CNC',()=>{
 const cad=gauge(100,140);
 const z=assessGaugeDepth(sheet,cad);
 assert.equal(z.contactAvailable,true);
 assert.equal(z.overlapMm,20);
 const green=describeGaugeVisualEvidence(noCollision,cad,sheet);
 const red=describeGaugeVisualEvidence(planarCollision,cad,sheet);
 assert.equal(green.level,'green');
 assert.equal(red.level,'red');
 assert.match(green.message,/20.00 mm/);
 assert.equal(green.verified,false);
 assert.equal(red.verified,false);
});
test('R127: Z desconocida conserva estado 2D pero no se vende como sólido CAD',()=>{
 const sketch=makePrism('tope',poly,-120,120,'Z-del-dedo-desconocida-envolvente-conservadora');
 const status=assessGaugeDepth(sheet,sketch);
 assert.equal(status.kind,'z-no-documentada');
 assert.equal(status.contactAvailable,null);
 const green=describeGaugeVisualEvidence(noCollision,sketch,sheet);
 assert.equal(green.level,'green');
 assert.equal(green.knownZ,false);
 assert.match(green.message,/no demuestra colisión 3D/);
 const style=gaugeSolidStyle(green);
 assert.equal(style.level,'green');
 assert.equal(style.dashed,true);
 assert.equal(style.provisional,true);
 assert.equal(style.fillAlpha,.22);
 assert.equal(gaugeSolidStyle(describeGaugeVisualEvidence(planarCollision,sketch,sheet)).level,'red');
 assert.equal(gaugeSolidStyle(describeGaugeVisualEvidence(noCollision,gauge(0,50),sheet)).provisional,false);
});
test('R127: sin volumen Z de chapa no inventar ausencia de contacto',()=>{
 const z=assessGaugeDepth([],gauge(-40,40));
 assert.equal(z.kind,'chapa-z-incompleta');
 assert.equal(z.contactAvailable,null);
 assert.equal(assessGaugeDepth(sheet,null).knownZ,false);
 const invalid=assessGaugeDepth(sheet,{valid:false,provenance:'perfil CAD importado dibujo'});
 assert.equal(invalid.kind,'cad-dedo-invalido');
 assert.equal(invalid.contactAvailable,null);
});
test('R127: cada capa opcional filtra pintura pero no elimina objetos de análisis',()=>{
 const faces=['sheet','gauge','punch','die','ram','bed',
  'upperClamp','lowerClamp','upperAdapter','lowerAdapter','frontSupport']
  .map(kind=>({kind}));
 const objects=[...faces];
 const filtered=visibleVolumeFaces(faces,{showGauge:false,showSheet:false,
  showPunch:false,showRam:false,showDie:false});
 assert.deepEqual(filtered.map(x=>x.kind),['bed','frontSupport']);
 assert.equal(faces.length,objects.length);
 assert.deepEqual(faces,objects);
 assert.equal(visibleVolumeFaces(faces,{}).length,faces.length);
 assert.equal(visibleVolumeFaces(null,{}).length,0);
});
test('R127: captura real 3D y controles visuales no cambian la verificación física',()=>{
 const viewer=readFileSync(new URL('../machine-volume-viewer.js',import.meta.url),'utf8');
 const studio=readFileSync(new URL('../studio.js',import.meta.url),'utf8');
 const sw=readFileSync(new URL('../sw.js',import.meta.url),'utf8');
 assert.match(viewer,/visibleVolumeFaces\(mesh\.faces,window\.PLEGADOX_MACHINE_VIEW\)/);
 assert.match(viewer,/gaugeSolidStyle\(gaugeEvidence\)/);
 assert.match(viewer,/TOPE: /);
 assert.match(studio,/PLEGADOX_SOLID_ACTIVE\?\.\(\)/);
 assert.match(studio,/solidos-3D/);
 assert.match(studio,/plegadox:visualChanged/);
 for(const path of ['machine-gauge-depth.js','machine-volume-layers.js',
  'machine-solid-gauge-style.js'])assert.ok(sw.includes('"./'+path+'"'),'Sin caché offline '+path);
});
