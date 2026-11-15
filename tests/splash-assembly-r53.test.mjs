import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');

test('trancha WILA y punzón forman un mismo conjunto animado, separado de matriz fija en mesa',()=>{
 const svg=read('splash-machine-assembly.svg');
 const upper=svg.indexOf('<g id="upperMachine"');
 const die=svg.indexOf('<!-- V16 die clamps physically supported');
 const bed=svg.indexOf('<!-- fixed lower table');
 const sheet=svg.indexOf('<g id="workpiece">');
 assert.ok(bed>0&&die>bed,'el adaptador Promecam debe estar sobre la mesa');
 assert.ok(upper>die,'la matriz no debe moverse junto a la trancha');
 assert.ok(sheet>upper,'chapa es un tercer conjunto independiente');
 const upperContent=svg.slice(upper,sheet);
 assert.match(upperContent,/<animateTransform[^>]*attributeName="transform"[^>]*type="translate"/);
 assert.match(upperContent,/WILA/);
 assert.match(upperContent,/values="0,-64;0,-64;0,24;0,24;0,-64"/);
 assert.ok(!svg.slice(bed,upper).includes('<animateTransform'),
  'la matriz y la bancada deben permanecer inmóviles');
 assert.match(svg,/M345 427L407 427L459 483L511 427/);
 assert.match(svg,/M173 337L422 432Q459 477 496 432/);
 assert.match(svg,/viewBox="0 0 920 704"/);
});
test('punzón, chapa y matriz quedan centrados en el mismo eje de plegado',()=>{
 const svg=read('splash-machine-assembly.svg');
 const upperTipY=449+24;
 const sheetCentre=477;
 const dieBottomY=483;
 const sheetThickness=10;
 const punchX=Number(svg.match(/L(459) 449L436 394/)?.[1]);
 const sheetX=Number(svg.match(/Q(459) 477 496/)?.[1]);
 const dieX=Number(svg.match(/L(459) 483L511 427/)?.[1]);
 assert.ok([punchX,sheetX,dieX].every(Number.isFinite));
 assert.equal(punchX,sheetX);
 assert.equal(sheetX,dieX);
 assert.ok(Math.abs(upperTipY-(sheetCentre-sheetThickness/2))<=2);
 assert.ok(Math.abs((sheetCentre+sheetThickness/2)-dieBottomY)<=2);
 assert.match(svg,/EJE DEL PUNZÓN = EJE DE LA V/);
});
test('carga responsive usa una única barra REAL y no incrusta la vieja fotografía defectuosa',()=>{
 const html=read('splash-foto-premium.html'),sw=read('sw.js');
 assert.equal((html.match(/role="progressbar"/g)||[]).length,1);
 assert.ok(html.includes('src="./splash-machine-assembly.svg"'));
 assert.ok(html.includes('setProgress(v)'));
 assert.ok(html.includes('#machine{position:relative'));
 assert.ok(html.includes('grid-template-rows:minmax(0,1fr)'));
 assert.ok(html.includes('@media(orientation:portrait)'));
 assert.ok(html.includes('@media(orientation:landscape) and (max-height:530px)'));
 assert.ok(!html.includes('src="./plegadox-premium-selected.png"'));
 assert.ok(sw.includes('"./splash-machine-assembly.svg"'));
});
