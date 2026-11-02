import test from 'node:test';
import assert from 'node:assert/strict';
import {parseToolDxf,validateContour} from '../tool-dxf.js';

// DXF ASCII mínimos para verificar que una geometría insegura no se
// instala como punzón ni matriz, aunque visualmente parezca cerrada.
const wrap=(entity)=>[
 '0','SECTION','2','HEADER','9','$INSUNITS','70','4','0','ENDSEC',
 '0','SECTION','2','ENTITIES','0','LWPOLYLINE',
 '90',String(entity.points.length),'70','1',
 ...(entity.extra||[]),
 ...entity.points.flatMap(([x,y])=>['10',String(x),'20',String(y)]),
 '0','ENDSEC','0','EOF'
].join('\n')+'\n';

test('rechazar autointersección en T: vértice sobre arista NO adyacente',()=>{
 const touching=[[0,0],[40,0],[40,60],[20,60],[20,0],[0,60]];
 assert.throws(()=>validateContour(touching),/autointersecado|contacto/);
 assert.throws(()=>parseToolDxf(wrap({points:touching})),/autointersecado|contacto/);
});

test('rechazar solape de dos aristas colineales NO adyacentes',()=>{
 const overlap=[[0,0],[40,0],[40,60],[0,60],[0,.5],
  [20,.5],[20,0],[10,0]];
 assert.throws(()=>validateContour(overlap),/autointersecado|solapadas/);
});

test('rechazar retorno sobre el mismo segmento en un vértice consecutivo',()=>{
 const backtrack=[[0,0],[40,0],[20,0],[40,60],[0,60]];
 assert.throws(()=>validateContour(backtrack),/retroceso|solapadas/);
});

test('admitir perfil de pata de cabra cóncavo SIN cruces ni solapes',()=>{
 const gooseneck=[[0,0],[50,0],[50,120],[30,120],
   [30,74],[39,74],[39,50],[20,50],[8,15],[0,15]];
 const ok=validateContour(gooseneck);
 assert.equal(ok.width,50);
 assert.equal(ok.height,120);
 assert.equal(parseToolDxf(wrap({points:gooseneck})).height,120);
});

test('rechazar LWPOLYLINE con extrusión OCS inclinada o elevación',()=>{
 const points=[[0,0],[40,0],[40,100],[0,100]];
 for(const extra of [
  ['38','10'], // elevación fuera del XY de la plegadora
  ['210','0','220','1','230','0'], // OCS girado
  ['210','0','220','0','230','-1'], // normal invertida
  ['39','2'], // extrusión sólida de entidad 2D
  ['43','2']  // ancho constante de línea
 ]){
  assert.throws(()=>parseToolDxf(wrap({points,extra})),/no plano|sin grosor/);
 }
});

test('rechazar lista de vértices DXF truncada o mal declarada',()=>{
 const good=wrap({points:[[0,0],[40,0],[40,100],[0,100]]});
 // Sustituir sólo el par 90/4, no el valor 70/4 de INSUNITS.
 assert.throws(()=>parseToolDxf(good.replace('\n90\n4\n','\n90\n3\n')),/vértices/);
});
