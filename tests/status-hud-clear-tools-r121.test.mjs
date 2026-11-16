import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {EXAMPLE,normalized} from '../engine.js';
import {technicalScene} from '../technical-section.js';
import {gaugeStatusCardLayout,toolWarningHudLayout,machineToolProjection}
 from '../machine-visual.js';

const rectsOverlap=(a,b)=>a.x<b.x+b.width&&a.x+a.width>b.x&&
 a.y<b.y+b.height&&a.y+a.height>b.y;
const bbox=pts=>{
 const xs=pts.map(p=>p[0]),ys=pts.map(p=>p[1]);
 const minX=Math.min(...xs),maxX=Math.max(...xs);
 const minY=Math.min(...ys),maxY=Math.max(...ys);
 return {x:minX,y:minY,width:maxX-minX,height:maxY-minY};
};
test('R121: etiquetas de tope y útiles en carril superior, lejos de la V en móvil y PC',()=>{
 const part=normalized(EXAMPLE);
 for(const {w,h,zoom} of [
  {w:390,h:245,zoom:1},{w:618,h:430,zoom:1},
  {w:941,h:540,zoom:1},{w:1440,h:900,zoom:1}]){
  const scene=technicalScene(part,17.5);
  const scale=Math.min(w/740,h/510)*zoom,cx=w*.48,cy=h*.665;
  const die=bbox(machineToolProjection(scene,cx,cy,scale).die);
  const stop=gaugeStatusCardLayout(w,h,w*.6,cy,1,'green',scale);
  const warning=toolWarningHudLayout(w,h);
  assert.equal(stop.y,5);
  assert.equal(warning.y,44);
  assert.ok(!rectsOverlap(stop,die),
   'El aviso del tope cubre la V en '+w+'×'+h);
  assert.ok(!rectsOverlap(warning,die),
   'Aviso de punzón/matriz cubre la V en '+w+'×'+h);
  assert.ok(!rectsOverlap(stop,warning),
   'Dos mensajes se superponen en '+w+'×'+h);
  for(const r of [stop,warning]){
   assert.ok(r.x>=r.reservedLeft-1e-8);
   assert.ok(r.x+r.width<=w-r.reservedRight+1e-8);
   assert.ok(r.y>=0&&r.y+r.height<=h);
  }
 }
});
test('R121: cambiar Stop/Support, fase y color no arrastra etiquetas hacia la matriz',()=>{
 for(const level of ['green','amber','red']){
  const a=gaugeStatusCardLayout(390,245,120,110,1,level,.43,
   'reubicacion-siguiente-golpe',null,null,null,null,'X');
  const b=gaugeStatusCardLayout(390,245,310,194,2,level,.43,
   'retirado-durante-plegado');
  assert.deepEqual([a.x,a.y,a.width,a.height],[b.x,b.y,b.width,b.height]);
  assert.match(a.subline,/CAMBIO DE COTA|PENETRACIÓN|REVISAR/);
 }
});
test('R121: el visor de matriz deja de pintar rótulos anclados al dedo y alerta naranja inferior',()=>{
 const src=readFileSync(new URL('../machine-visual.js',import.meta.url),'utf8');
 assert.match(src,/const layout=gaugeStatusCardLayout\(w,h,faceX,faceY/);
 assert.match(src,/drawGaugeStatusCard\(ctx,layout,level,GAUGE_COLORS\[level\]\)/);
 assert.doesNotMatch(src,/ctx\.fillText\(label,Math\.min\(Math\.max\(8,ox/);
 assert.doesNotMatch(src,/const x=8,y=view\?\.section\?/);
 assert.match(src,/const hud=toolWarningHudLayout\(w,h,view\?\.section===true\)/);
});
test('R121: código de riesgo y geometría del dedo conservados',()=>{
 const s=readFileSync(new URL('../machine-visual.js',import.meta.url),'utf8');
 assert.ok(s.includes("const risk=gaugeRiskStatus(placement)"));
 assert.ok(s.includes("const contact=placement.contact;"));
 assert.ok(s.includes("const placement=gaugePlacement(scene,stopNumber);"));
 assert.ok(s.includes("const diagnostic=currentToolContact(piece,sim.time);"));
});
