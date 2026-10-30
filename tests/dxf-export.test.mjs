import test from 'node:test';
import assert from 'node:assert/strict';
import {EXAMPLE,development} from '../engine.js';
import {exportProfileDXF,exportFlatDXF} from '../dxf-export.js';
const occurrences=(s,needle)=>s.split(needle).length-1;
test('DXF de pieza plegada incluye un LINE por tramo de radio aproximado',()=>{
 const text=exportProfileDXF(EXAMPLE);
 assert.match(text,/\r\n2\r\nHEADER/);
 assert.match(text,/\r\n1\r\nAC1009/);
 assert.match(text,/\r\n8\r\nPERFIL_APROX/);
 assert.match(text,/NOTAS_NO_CORTE/);
 assert.ok(occurrences(text,'\r\n0\r\nLINE\r\n')>40,
  'Cuatro pliegues deben generar líneas de radio discretizadas');
 assert.ok(text.endsWith('0\r\nEOF\r\n'));
 assert.doesNotMatch(text,/NaN|Infinity/);
});
test('DXF desarrollado usa cuatro aristas y longitud calculada, sin inventar pliegues',()=>{
 const text=exportFlatDXF(EXAMPLE);
 assert.equal(occurrences(text,'\r\n0\r\nLINE\r\n'),4);
 assert.match(text,/DESARROLLO_APROX/);
 assert.match(text,/NO CORTAR SIN VERIFICAR/);
 const len=Number(development(EXAMPLE).length.toFixed(5));
 assert.ok(text.includes('11\r\n'+len+'\r\n'),'L desarrollado debe coincidir con cálculo');
 assert.ok(text.includes('21\r\n500\r\n'),'Incluye ancho real de la chapa');
});
test('DXF formato ASCII R12 mantiene ángulos negativos y no genera número inválido',()=>{
 const dxf=exportProfileDXF({...EXAMPLE,angles:[-90,-90,-90,90]});
 assert.match(dxf,/\r\n0\r\nEOF/);
 assert.doesNotMatch(dxf,/NaN|Infinity/);
 const lines=dxf.split('\r\n');
 const y=[];
 for(let i=0;i<lines.length-1;i++)
  if(lines[i]==='20'||lines[i]==='21')y.push(Number(lines[i+1]));
 assert.ok(y.some(n=>n<0));
});
test('desarrollo inválido se rechaza en vez de entregar un fichero de corte falso',()=>{
 const part={...EXAMPLE,angles:[179,179,179,179],radius:100,thickness:20};
 assert.throws(()=>exportFlatDXF(part),/Longitud desarrollada/);
});
