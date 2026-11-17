import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {VIEW_PRESETS,VIEW_DEFAULTS,normalizeMachineView,applyViewPreset,
 perspectiveOffset,displayOptions} from '../machine-view-options.js';
import {gaugePerspectiveContours,drawMachineMetricGuides} from '../machine-visual.js';

test('R124: perfiles, 2.5D, suave, profunda, elevada y sección técnica son configuraciones distintas',()=>{
 assert.deepEqual(Object.keys(VIEW_PRESETS),['profile','nominal','shallow',
  'deep','elevated','wide','low','steep','compact','section']);
 const settings={...VIEW_DEFAULTS};
 for(const name of Object.keys(VIEW_PRESETS)){
  const selected=applyViewPreset(settings,name);
  assert.equal(selected,settings);
  assert.equal(settings.preset,name);
  assert.equal(settings.perspective,VIEW_PRESETS[name].perspective);
  assert.equal(settings.section,VIEW_PRESETS[name].section);
 }
 assert.throws(()=>applyViewPreset(settings,'3d-cnc'),/desconocida/);
});
test('R124: la profundidad y la inclinación no cambian el plano frontal del tope',()=>{
 const poly=[[10,30],[15,30],[15,5],[10,5]];
 const p0=gaugePerspectiveContours(poly,2,true);
 assert.deepEqual(p0.near,poly);
 assert.deepEqual(p0.far[0],[10+46,30-26]);
 for(const name of ['shallow','nominal','deep','elevated']){
  const v=applyViewPreset({...VIEW_DEFAULTS},name);
  const p=gaugePerspectiveContours(poly,2,true,v);
  assert.deepEqual(p.near,poly);
  assert.ok(p.depthX>0&&p.depthY<0);
  assert.ok(p.far.every((xy,i)=>xy[0]>poly[i][0]));
  assert.equal(p.depthX,perspectiveOffset(v,2,'gauge').dx);
  assert.equal(p.depthY,perspectiveOffset(v,2,'gauge').dy);
 }
 const flat=gaugePerspectiveContours(poly,2,false,{...VIEW_DEFAULTS,depth:2});
 assert.deepEqual(flat.far,poly);
 assert.equal(flat.depthX,0);
});
test('R124: extrusion de chapa, punzón, matriz y tope usa el mismo ajuste sin mover la geometría original',()=>{
 const v={...VIEW_DEFAULTS,depth:1.6,tilt:1.2};
 for(const kind of ['sheet','die','ram','gauge']){
  const o=perspectiveOffset(v,2,kind);
  assert.ok(o.dx>0&&o.dy<0,kind);
  assert.deepEqual(perspectiveOffset({...v,perspective:false},2,kind),{dx:0,dy:0});
 }
 const copy=JSON.stringify(v);
 perspectiveOffset(v,2,'ram');
 assert.equal(JSON.stringify(v),copy);
});
test('R124: preferencias corruptas no introducen zoom infinito ni capas indeterminadas',()=>{
 const opts=normalizeMachineView({
  depth:Infinity,tilt:-8,zoom:900,panX:Infinity,panY:-10000,
  theme:'otro',showPunch:'false',showGauge:false,preset:'inexistente',
  section:false,perspective:true
 });
 assert.equal(opts.depth,1);
 assert.equal(opts.tilt,.45);
 assert.equal(opts.zoom,5);
 assert.equal(opts.panX,0);
 assert.equal(opts.panY,-1500);
 assert.equal(opts.theme,'industrial');
 assert.equal(opts.showPunch,true);
 assert.equal(opts.showGauge,false);
 assert.equal(opts.preset,'nominal');
 assert.equal(displayOptions(opts).safetyWarningsVisible,true);
 assert.equal(displayOptions(opts).collisionEngineUntouched,true);
 assert.equal(displayOptions(opts).actual3D,false);
});
test('R124: las guías métricas son visuales, sin datos CNC y requieren escala válida',()=>{
 const strokes=[],ctx={
  save:()=>strokes.push('save'),restore:()=>strokes.push('restore'),
  beginPath:()=>strokes.push('begin'),moveTo:()=>{},lineTo:()=>{},
  stroke:()=>strokes.push('stroke'),setLineDash:()=>{},
  fillText:(...args)=>strokes.push(args[0])
 };
 assert.equal(drawMachineMetricGuides(ctx,500,400,200,250,2,
  {...VIEW_DEFAULTS,showGrid:true,showAxes:true}),undefined);
 assert.ok(strokes.includes('0 V · datum ilustrativo'));
 assert.ok(strokes.includes('stroke'));
 assert.throws(()=>drawMachineMetricGuides(ctx,500,400,200,250,0,
  VIEW_DEFAULTS),/inválida/);
});
test('R124: panel de opciones, control de seguridad y captura deben estar presentes',()=>{
 const html=readFileSync(new URL('../index.html',import.meta.url),'utf8');
 const studio=readFileSync(new URL('../studio.js',import.meta.url),'utf8');
 const visual=readFileSync(new URL('../machine-visual.js',import.meta.url),'utf8');
 const sw=readFileSync(new URL('../sw.js',import.meta.url),'utf8');
 for(const id of ['machineViewPreset','machineDepth','machineTilt','machineZoomRange',
  'machineShowSheet','machineShowPunch','machineShowDie','machineShowRam',
  'machineShowGauge','machineShowContact','machineShowGrid','machineShowAxes',
  'machineShowLabels','machineTheme','machinePhaseJump',
  'machinePrevFold','machineNextFold','machineCapture','machineResetOptions',
  'machineOptionsButton','machineFullscreen']){
  assert.ok(html.includes('id="'+id+'"'),'Falta el control '+id);
  assert.ok(studio.includes("'"+id+"'")||studio.includes(id+':'),
   'El control debe estar cableado '+id);
 }
 assert.match(visual,/drawGaugeStatusCard\(ctx,layout,level,GAUGE_COLORS\[level\]\)/);
 assert.match(visual,/drawWarningHud\(ctx,w,h,piece,sim,machineView\)/);
 assert.ok(sw.includes('"./machine-view-options.js"'),
  'El módulo gráfico debe funcionar en modo PWA offline');
});
