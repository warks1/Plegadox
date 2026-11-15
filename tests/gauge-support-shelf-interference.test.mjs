import test from 'node:test';
import assert from 'node:assert/strict';
import {gaugeContactFeature,gaugeOutline,V85_FACTORY} from '../machine-config.js';
import {inspectGaugeProfile} from '../gauge-interference.js';

const poly=gaugeOutline(V85_FACTORY.support,2);
const feature=gaugeContactFeature(V85_FACTORY.support,2);
const supportShelf={seated:true,from:feature.from,to:feature.to};
const contact={x:feature.point.x,y:feature.point.y+1};

test('Support 2: apoyo nominal sobre repisa baja y canto en pared ascendente no es penetración',()=>{
 const sheet=[{x:-30,y:contact.y},{x:contact.x,y:contact.y}];
 const result=inspectGaugeProfile(sheet,poly,2,contact,{supportShelf});
 assert.equal(feature.surface,'horizontal-top');
 assert.equal(result.warning,false);
 assert.equal(result.kind,'sin-interferencia-detectada');
});
test('si la chapa atraviesa la pared trasera la exención de la repisa NO oculta la colisión',()=>{
 const sheet=[{x:-30,y:contact.y},{x:feature.to.x+12,y:contact.y}];
 const result=inspectGaugeProfile(sheet,poly,2,contact,{supportShelf});
 assert.equal(result.warning,true);
 assert.equal(result.kind,'penetracion');
});
test('el contacto de shelf no puede reutilizarse para otra cara o pared',()=>{
 const shifted={seated:true,from:{x:5,y:feature.to.y-3},
  to:{x:35,y:feature.to.y-3}};
 const sheet=[{x:-20,y:contact.y},{x:contact.x,y:contact.y}];
 const a=inspectGaugeProfile(sheet,poly,2,contact,{supportShelf:shifted});
 const b=inspectGaugeProfile(sheet,poly,2,contact);
 assert.deepEqual(a,b);
});
