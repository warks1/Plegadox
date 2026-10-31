import test from 'node:test';
import assert from 'node:assert/strict';
import {roundedRectPath} from '../canvas-path.js';

const drawingContext=()=>({
 commands:[],moveTo(...a){this.commands.push(['moveTo',...a]);},
 lineTo(...a){this.commands.push(['lineTo',...a]);},
 quadraticCurveTo(...a){this.commands.push(['quadraticCurveTo',...a]);},
 closePath(){this.commands.push(['closePath']);}
});

test('si hay roundRect nativo se usa la API sin duplicar el camino',()=>{
 const ctx=drawingContext();ctx.roundRect=(...args)=>ctx.commands.push(['native',...args]);
 roundedRectPath(ctx,3,4,25,30,6);
 assert.deepEqual(ctx.commands,[['native',3,4,25,30,6]]);
});
test('Safari/Firefox antiguos dibujan el contorno sin roundRect',()=>{
 const ctx=drawingContext();
 roundedRectPath(ctx,10,20,100,40,8);
 assert.equal(ctx.commands[0][0],'moveTo');
 assert.deepEqual(ctx.commands[0],['moveTo',18,20]);
 assert.equal(ctx.commands.filter(x=>x[0]==='quadraticCurveTo').length,4);
 assert.equal(ctx.commands.at(-1)[0],'closePath');
 assert.ok(ctx.commands.flat().filter(x=>typeof x==='number').every(Number.isFinite));
});
test('radios excesivos y tamaños negativos se normalizan',()=>{
 const ctx=drawingContext();
 roundedRectPath(ctx,110,60,-100,-40,999);
 assert.deepEqual(ctx.commands[0],['moveTo',30,20]);
 assert.equal(ctx.commands.at(-1)[0],'closePath');
});
