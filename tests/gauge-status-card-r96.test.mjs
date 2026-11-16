import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {gaugeStatusCardLayout} from '../machine-visual.js';

test('R96: las advertencias Stop 1 no se cortan ni pisan el labio en PC/iPhone',()=>{
 for(const v of [
  {w:618,h:430,x:314,y:282,scale:.84},
  {w:390,h:245,x:193,y:161,scale:.45},
  {w:1440,h:900,x:730,y:590,scale:1.5}
 ]){
  for(const level of ['green','amber','red']){
   const g=gaugeStatusCardLayout(v.w,v.h,v.x,v.y,1,level,v.scale);
   assert.ok(g.x>=g.reservedLeft-1e-8,JSON.stringify(g));
   assert.ok(g.x+g.width<=v.w-g.reservedRight+1e-8,JSON.stringify(g));
   assert.ok(g.y>=0&&g.y+g.height<=v.h,JSON.stringify(g));
   assert.ok(g.y>=v.y+8||g.y+g.height<=v.y-8,
    'El aviso debe aparecer sobre o bajo el contacto, nunca taparlo');
   assert.ok(g.headline.includes('TOPE 1'));
   assert.ok(!g.subline.includes('CAD CERTIFICADO'));
  }
 }
});

test('R96: el aviso distingue retirada preventiva de simple cambio X/R',()=>{
 const args=[390,245,190,160,1,'amber',.4];
 const withdrawing=gaugeStatusCardLayout(...args,'retroceso-antes-plegado');
 const parked=gaugeStatusCardLayout(...args,'retirado-durante-plegado');
 const next=gaugeStatusCardLayout(...args,'reubicacion-siguiente-golpe');
 assert.match(withdrawing.subline,/RETROCEDIENDO/);
 assert.match(parked.subline,/RETIRADO DURANTE/);
 assert.match(next.subline,/NO RETROCESO/);
 assert.deepEqual([withdrawing.x,withdrawing.y,withdrawing.width],
  [next.x,next.y,next.width]);
 const red=gaugeStatusCardLayout(618,430,314,280,1,'red',.8,
  'retirado-durante-plegado');
 assert.match(red.subline,/PENETRACIÓN 2D/,
  'Una colisión actual tiene preferencia sobre el estado de movimiento');
});

test('R96: nivel de riesgo visible, sin cambiar geometría ni instrucciones de retirada',()=>{
 const green=gaugeStatusCardLayout(390,245,190,160,2,'green',.4);
 const amber=gaugeStatusCardLayout(390,245,190,160,2,'amber',.4);
 const red=gaugeStatusCardLayout(390,245,190,160,2,'red',.4);
 assert.match(green.headline,/SIN CHOQUE 2D/);
 assert.match(amber.headline,/ATENCIÓN/);
 assert.match(red.subline,/PENETRACIÓN 2D/);
 assert.deepEqual([green.x,green.y,green.width,green.height],
  [amber.x,amber.y,amber.width,amber.height],
  'El cambio de estado no puede desplazar el indicador');
 const file=readFileSync(new URL('../machine-visual.js',import.meta.url),'utf8');
 assert.match(file,/drawGaugeStatusCard\(ctx,layout,level,GAUGE_COLORS\[level\]\)/,
  '2D y perspectiva deben conservar el semáforo en la banda superior');
 assert.doesNotMatch(file,/ctx\.fillText\(label,Math\.min\(Math\.max\(8,ox/,
  'El texto del tope NO puede seguir al dedo sobre la matriz');
});
