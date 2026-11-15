import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';

test('cambio de controlador PWA avisa sin interrumpir un plegado ni recargar',()=>{
 const code=readFileSync(new URL('../pwa.js',import.meta.url),'utf8');
 let controllerCallback=null,reloads=0,notifications=[];
 const first={id:'active-r62'};
 const worker={
  controller:first,
  addEventListener(name,callback){if(name==='controllerchange')controllerCallback=callback;},
  register(){throw Error('No debe registrar SW antes de load');}
 };
 const host={
  navigator:{serviceWorker:worker},
  location:{protocol:'https:',hostname:'localhost',
   reload(){reloads++;}},
  window:{addEventListener(){},dispatchEvent(event){notifications.push(event.type);}},
  document:{readyState:'loading'},
  CustomEvent:class{constructor(type){this.type=type;}},
  console
 };
 runInNewContext(code,host);
 assert.equal(typeof controllerCallback,'function');
 worker.controller={id:'new-r63'};
 controllerCallback();
 assert.equal(reloads,0,'No interrumpir trabajo en curso');
 assert.deepEqual(notifications,['plegadox:cacheControllerChanged']);
});
