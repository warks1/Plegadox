import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=file=>readFileSync(new URL('../'+file,import.meta.url),'utf8');
const svg=read('splash-machine-assembly.svg'),splash=read('splash-foto-premium.html');
test('el punzón está FÍSICAMENTE unido en el dibujo al conjunto superior WILA',()=>{
 const movable=svg.indexOf('<g id="upperMachine"'),lower=svg.indexOf('ADAPTADOR PROMECAM');
 assert.ok(movable>lower,'La bancada y matriz inferior deben ser estáticas, fuera del conjunto superior');
 const pos=svg.indexOf('<animateTransform',movable);
 assert.ok(pos>movable,'Toda la trancha/punzón se desplaza como conjunto');
 const punch=svg.indexOf('Gooseneck-like punch',movable);
 assert.ok(punch>pos,'La geometría del punzón forma parte del grupo de movimiento de la trancha');
 assert.ok(svg.includes('WILA'), 'Amarre superior documentado');
 assert.ok(svg.includes('ADAPTADOR PROMECAM'), 'Adaptador inferior documentado');
});
test('eje del punzón y vértice de la V son comunes y no intercambian funciones',()=>{
 assert.match(svg,/L459 449/,'La punta del punzón debe estar en el eje X459');
 assert.match(svg,/L459 483/,'El fondo de la matriz debe centrarse en X459');
 assert.match(svg,/L407 427L459 483L511 427/,'La V está abierta hacia arriba');
 assert.ok(svg.indexOf('V16')<svg.indexOf('<g id="upperMachine"'),'V16 es parte de la bancada');
});
test('la chapa se anima entre los útiles, pero no mueve la matriz',()=>{
 assert.ok(svg.includes('id="workpiece"'));
 assert.ok(svg.includes('attributeName="d"'));
 assert.ok(svg.includes('values="0,-64;0,-64;0,24;0,24;0,-64"'));
 assert.ok(svg.includes('repeatCount="indefinite"'));
});
test('la carga no usa una imagen con 78 % fijo ni dos barras',()=>{
 assert.ok(splash.includes('src="./splash-machine-assembly.svg"'));
 assert.ok(!splash.includes('src="./plegadox-premium-selected.png"'));
 assert.equal((splash.match(/role="progressbar"/g)||[]).length,1);
 assert.equal((splash.match(/id="progress"/g)||[]).length,1);
 assert.ok(splash.includes('setProgress(v)'));
 assert.ok(splash.includes('setStatus(v)'));
 assert.ok(splash.includes('@media(orientation:portrait)'));
 assert.ok(splash.includes('@media(orientation:landscape)'));
});
