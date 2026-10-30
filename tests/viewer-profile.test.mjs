import test from 'node:test';
import assert from 'node:assert/strict';
import {EXAMPLE,profile} from '../engine.js';
import {viewerProfile} from '../viewer-profile.js';
test('visor 3D empieza con chapa plana y termina con radios en cada doblez',()=>{
 const flat=viewerProfile(EXAMPLE,[0,0,0,0]);
 assert.deepEqual(flat.points,profile(EXAMPLE).points);
 assert.equal(flat.points.length,6);
 const folded=viewerProfile(EXAMPLE,[1,1,1,1]);
 assert.ok(folded.points.length>40,'Se discretizan arcos de varios pliegues');
 assert.deepEqual(folded.points[0],folded.straight[0]);
 assert.deepEqual(folded.points.at(-1),folded.straight.at(-1));
 assert.ok(folded.points.every(p=>Number.isFinite(p.x)&&Number.isFinite(p.y)));
 assert.equal(folded.verified,false);
});
test('el visor 3D cambia su redondeo si varía R interior, sin alterar la fibra original',()=>{
 const a=viewerProfile({...EXAMPLE,radius:3},[1,1,1,1]);
 const b=viewerProfile({...EXAMPLE,radius:8},[1,1,1,1]);
 assert.equal(a.neutralRadius,4);
 assert.equal(b.neutralRadius,9);
 assert.deepEqual(a.straight,b.straight);
 assert.notDeepEqual(a.points,b.points);
});
test('el signo -90 mantiene la orientación hacia abajo y se redondea',()=>{
 const p={flanges:[50,50],angles:[-90],thickness:2,die:'v16'};
 const v=viewerProfile(p,[1]);
 assert.ok(v.points.length>3);
 assert.ok(v.points.at(-1).y<0);
 assert.equal(v.neutralRadius>0,true);
});
