import test from 'node:test';
import assert from 'node:assert/strict';
import {parseToolDxf,inspectToolDxfContours} from '../tool-dxf.js';
const xy=(x,y,u,v,layer='PERFIL')=>[
 '0','LINE','8',layer,'10',String(x),'20',String(y),
 '11',String(u),'21',String(v)];
const first=[
 xy(0,0,30,0),xy(30,0,30,80),xy(30,80,0,80),xy(0,80,0,0)];
const second=[
 xy(100,0,120,0),xy(120,0,120,45),
 xy(120,45,100,45),xy(100,45,100,0)];
const source=parts=>['0','SECTION','2','HEADER','9','$INSUNITS',
 '70','4','0','ENDSEC','0','SECTION','2','ENTITIES',
 ...parts.flat(),'0','ENDSEC','0','EOF',''].join('\n');
test('R120: ZIP OEM con varias cadenas no permite elegir una por tamaño sin permiso',()=>{
 const text=source([...first,xy(-12,75,-11,75,'COTAS')]);
 assert.throws(()=>parseToolDxf(text),/cadenas sobrantes|cerrado único|sobrantes/);
 const checked=inspectToolDxfContours(text);
 assert.equal(checked.candidates.length,1);
 assert.equal(checked.candidates[0].widthMm,30);
 assert.equal(checked.candidates[0].heightMm,80);
 assert.equal(checked.candidates[0].origin,'LINE_ARC');
 const selected=parseToolDxf(text,{contourIndex:0});
 assert.equal(selected.height,80);
 assert.equal(selected.width,30);
});
test('R120: extrae ciclo real incluso si una línea auxiliar toca el contorno',()=>{
 const text=source([...first,xy(30,80,45,80)]);
 const candidates=inspectToolDxfContours(text);
 assert.equal(candidates.candidates.length,1);
 assert.equal(candidates.candidates[0].segments,4);
 assert.equal(parseToolDxf(text,{contourIndex:0}).height,80);
 assert.throws(()=>parseToolDxf(text,{contourIndex:8}),/no existe/);
});
test('R120: dos cuerpos cerrados distintos se eligen por índice explícito, nunca se mezclan',()=>{
 const text=source([...first,...second]);
 const found=inspectToolDxfContours(text);
 assert.deepEqual(found.candidates.map(x=>x.heightMm).sort((a,b)=>a-b),
  [45,80]);
 const firstPick=parseToolDxf(text,{contourIndex:0});
 const secondPick=parseToolDxf(text,{contourIndex:1});
 assert.notEqual(firstPick.height,secondPick.height);
 assert.equal(firstPick.unitsAssumed,false);
 assert.equal(secondPick.unitsAssumed,false);
});
test('R120: cadena abierta no se transforma mágicamente en pieza cerrada',()=>{
 const text=source([xy(0,0,30,0),xy(30,0,30,40)]);
 assert.equal(inspectToolDxfContours(text).candidates.length,0);
 assert.throws(()=>parseToolDxf(text,{contourIndex:0}),/no existe/);
});
