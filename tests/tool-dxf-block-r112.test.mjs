import test from 'node:test';
import assert from 'node:assert/strict';
import {parseToolDxf,validateContour} from '../tool-dxf.js';

const lines=a=>a.join('\n')+'\n';
const lw=coords=>['0','LWPOLYLINE','90',String(coords.length),
 '70','1',...coords.flatMap(([x,y])=>['10',String(x),'20',String(y)])];
const rect=[[-20,90],[20,90],[20,0],[-20,0]];
const base=(inside,place=['10','0','20','0'])=>lines([
 '0','SECTION','2','HEADER','9','$INSUNITS','70','4',
 '0','ENDSEC',
 '0','SECTION','2','BLOCKS',
 '0','BLOCK','2','OEM_PROFILE','10','0','20','0','30','0',
 ...inside,'0','ENDBLK','0','ENDSEC',
 '0','SECTION','2','ENTITIES',
 '0','INSERT','2','OEM_PROFILE',...place,
 '0','ENDSEC','0','EOF'
]);
const line=(a,b)=>['0','LINE','10',String(a[0]),'20',String(a[1]),
 '11',String(b[0]),'21',String(b[1])];

test('R112: BLOCK + INSERT conserva ancho/alto y contorno de origen OEM',()=>{
 const model=parseToolDxf(base(lw(rect)));
 assert.equal(model.width,40);
 assert.equal(model.height,90);
 assert.equal(model.points.length,4);
 assert.equal(model.unitsAssumed,false);
 assert.equal(model.coordinateSystem,'mm; X centrada; base del útil Y=0');
 assert.deepEqual(validateContour(model.points).points,model.points);
});

test('R112: respeta punto base BLOCK, traslado INSERT y rotación 90°',()=>{
 const shape=[...lw(rect)];
 const cad=lines([
 '0','SECTION','2','HEADER','9','$INSUNITS','70','4','0','ENDSEC',
 '0','SECTION','2','BLOCKS',
 '0','BLOCK','2','P','10','10','20','-20',...shape,
 '0','ENDBLK','0','ENDSEC',
 '0','SECTION','2','ENTITIES',
 '0','INSERT','2','P','10','200','20','300',
 '50','90','0','ENDSEC','0','EOF'
 ]);
 const res=parseToolDxf(cad);
 assert.ok(Math.abs(res.width-90)<1e-6);
 assert.ok(Math.abs(res.height-40)<1e-6);
 assert.equal(res.points.length,4);
});

test('R112: permite escala uniforme 2, pero nunca escalas distintas de X/R',()=>{
 const good=parseToolDxf(base(lw(rect),['10','0','20','0','41','2','42','2']));
 assert.equal(good.width,80);assert.equal(good.height,180);
 assert.throws(()=>parseToolDxf(base(lw(rect),
  ['10','0','20','0','41','2','42','1'])),/escalado no uniforme/);
 assert.throws(()=>parseToolDxf(base(lw(rect),
  ['10','0','20','0','41','-1','42','1'])),/escalado no uniforme/);
});

test('R112: DXF de máquina mayor que 1m usa límites del importador solicitante',()=>{
 const huge=[[-750,900],[750,900],[750,0],[-750,0]];
 assert.throws(()=>parseToolDxf(base(lw(huge))),/fuera de dimensiones/);
 const model=parseToolDxf(base(lw(huge),['10','0','20','0']),
  {maxWidth:2000,maxHeight:1500});
 assert.equal(model.width,1500);
 assert.equal(model.height,900);
});

test('R112: BLOCK con LINE reordenadas es contorno único y cerrado',()=>{
 const shape=[...line([-20,0],[-20,90]),...line([20,90],[20,0]),
  ...line([-20,90],[20,90]),...line([20,0],[-20,0])];
 const model=parseToolDxf(base(shape));
 assert.equal(model.width,40);assert.equal(model.height,90);
 assert.equal(model.points.length,4);
});

test('R112: un bloque inexistente no se sustituye por un perfil parecido',()=>{
 const s=base(lw(rect)).replace('2\nOEM_PROFILE\n10\n0\n20\n0\n0\nENDSEC',
  '2\nDIFFERENT\n10\n0\n20\n0\n0\nENDSEC');
 // Usar un documento sin sección BLOCKS para verificar el rechazo.
 const missing=lines(['0','SECTION','2','ENTITIES',
  '0','INSERT','2','MISSING','10','0','20','0',
  '0','ENDSEC','0','EOF']);
 assert.throws(()=>parseToolDxf(missing),/inexistente/);
 assert.ok(typeof s==='string');
});

test('R112: rechaza INSERT con ocupación fuera de XY o repetición matriz',()=>{
 assert.throws(()=>parseToolDxf(base(lw(rect),
  ['10','0','20','0','30','2'])),/INSERT 3D/);
 assert.throws(()=>parseToolDxf(base(lw(rect),
  ['10','0','20','0','70','2'])),/múltiple/);
 assert.throws(()=>parseToolDxf(base(lw(rect),
  ['10','0','20','0','210','1'])),/INSERT 3D/);
});

test('R112: no acepta perfiles secundarios ocultos al lado de un INSERT',()=>{
 const original=base(lw(rect));
 const withExtra=original.replace('0\nENDSEC\n0\nEOF',
  [...line([500,500],[600,600]),'0','ENDSEC','0','EOF'].join('\n'));
 assert.throws(()=>parseToolDxf(withExtra),/único INSERT/);
});

test('R112: evita referencia de bloques anidados y entidades desconocidas',()=>{
 const nested=base([...lw(rect),
  '0','INSERT','2','OTHER','10','0','20','0']);
 assert.throws(()=>parseToolDxf(nested),/INSERT no admitida/);
 const unknown=base(['0','SPLINE','8','0']);
 assert.throws(()=>parseToolDxf(unknown),/SPLINE no admitida/);
});

test('R112: sigue rechazando unidades distintas de milímetros',()=>{
 const wrong=base(lw(rect)).replace("9\n$INSUNITS\n70\n4",
  "9\n$INSUNITS\n70\n1");
 assert.throws(()=>parseToolDxf(wrong),/no milimétricas/);
});

test('R112: aristas WILA cerradas de DOS puntos reconstruyen una sola sección',()=>{
 const edge=(a,b)=>['0','LWPOLYLINE','90','2','70','1',
  '10',String(a[0]),'20',String(a[1]),
  '10',String(b[0]),'20',String(b[1])];
 const cad=base([
  ...edge([-20,90],[20,90]),
  ...edge([20,0],[-20,0]),
  ...edge([20,90],[20,0]),
  ...edge([-20,0],[-20,90])
 ]);
 const model=parseToolDxf(cad);
 assert.equal(model.width,40);
 assert.equal(model.height,90);
 assert.equal(model.points.length,4);
});

test('R112: una única arista WILA aislada nunca es un contorno de útil',()=>{
 const one=base(['0','LWPOLYLINE','90','2','70','1',
  '10','-20','20','0','10','20','20','0']);
 assert.throws(()=>parseToolDxf(one),/al menos dos segmentos/);
});

test('R112: dos vértices con bulge NO son un simple segmento recto',()=>{
 const malformed=base(['0','LWPOLYLINE','90','2','70','1',
  '10','-20','20','0','42','.5','10','20','20','0']);
 assert.throws(()=>parseToolDxf(malformed),/dos vértices con arco/);
});
