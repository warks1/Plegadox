import test from 'node:test';
import assert from 'node:assert/strict';
import {EXAMPLE} from '../engine.js';
import {V85_FACTORY,V85_STORAGE_KEY} from '../machine-config.js';
import {TOOL_DXF_STORAGE_KEY} from '../tool-dxf.js';
import {PIECE_KEY,PROJECT_FORMAT,buildProjectBackup,parseProjectBackup,
 restoreProjectBackup} from '../project-backup.js';
const sample=(id,kind)=>({
 id:'user-dxf-'+kind+'-'+id,name:kind==='punch'?'Pata de cabra real':'Matriz real',
 reference:'DEMO',manufacturer:'Importado DXF',angle:88,height:100,length:500,
 profilePoints:[[0,0],[20,0],[20,100],[0,100]],importedDxf:true,
 verifiedSpecs:false,profileAccuracy:'provisional',
 ...(kind==='die'?{opening:16}:{tip:2,type:'importado'})
});
const p=sample('abc','punch'),d=sample('def','die');
const piece={...EXAMPLE,punch:p.id,die:d.id};
function store(initial={},errorOn=null){
 const map=new Map(Object.entries(initial)),calls=[];
 return {map,calls,getItem:key=>map.get(key)??null,
 setItem(key,value){calls.push(key);
  if(key===errorOn)throw Error('CUOTA');
  map.set(key,String(value));},
 removeItem(key){map.delete(key);}};
}
test('copia íntegra recoge pieza, V85, ambos DXF y sus referencias',()=>{
 const b=buildProjectBackup({piece,machine:V85_FACTORY,tools:[p,d],
  exportedAt:'2026-11-02T00:00:00.000Z'});
 assert.equal(b.format,PROJECT_FORMAT);
 assert.equal(b.piece.punch,p.id);
 assert.equal(b.piece.die,d.id);
 assert.equal(b.importedTools.length,2);
 assert.equal(b.machine.stop[0],70);
 assert.equal(b.importedTools[0].verifiedSpecs,false);
 assert.equal(parseProjectBackup(JSON.stringify(b)).piece.angles[1],-90);
});
test('restaurar tres claves sin borrar otros útiles: rollback al fallar una escritura',()=>{
 const prior=sample('prior','punch');
 const st=store({[PIECE_KEY]:JSON.stringify({...EXAMPLE,name:'MI PIEZA'}),
  [TOOL_DXF_STORAGE_KEY]:JSON.stringify([prior]),
  [V85_STORAGE_KEY]:JSON.stringify(V85_FACTORY)});
 const backup=buildProjectBackup({piece,machine:{...V85_FACTORY,ramWidth:1900},tools:[p,d]});
 const res=restoreProjectBackup(st,backup);
 assert.equal(res.importedTools.length,3);
 assert.equal(JSON.parse(st.getItem(PIECE_KEY)).punch,p.id);
 assert.equal(JSON.parse(st.getItem(V85_STORAGE_KEY)).ramWidth,1900);
 const restored=JSON.parse(st.getItem(TOOL_DXF_STORAGE_KEY));
 assert.ok(restored.some(x=>x.id===prior.id),'no perder otros útiles DXF');
 const old=store({[PIECE_KEY]:JSON.stringify({...EXAMPLE,name:'ANTERIOR'}),
 [TOOL_DXF_STORAGE_KEY]:JSON.stringify([prior]),
 [V85_STORAGE_KEY]:JSON.stringify(V85_FACTORY)},V85_STORAGE_KEY);
 const keys=[PIECE_KEY,TOOL_DXF_STORAGE_KEY,V85_STORAGE_KEY];
 const before=keys.map(k=>old.getItem(k));
 assert.throws(()=>restoreProjectBackup(old,backup),/No se pudo restaurar/);
 assert.deepEqual(keys.map(k=>old.getItem(k)),before,'sin restauración parcial');
});
test('corrupto o con múltiples IDs iguales: sin tocar almacenamiento',()=>{
 const backup=buildProjectBackup({piece,machine:V85_FACTORY,tools:[p,d]});
 const st=store({[PIECE_KEY]:'ORIGINAL'});
 for(const bad of [
  {...backup,format:'other'}, {...backup,importedTools:[p,p]},
  {...backup,importedTools:[]},
  {...backup,piece:{...backup.piece,angles:[90]}},
  {...backup,importedTools:[{...p,profilePoints:[[0,0],[1,1]]},d]}
 ]){
  assert.throws(()=>restoreProjectBackup(st,bad));
  assert.equal(st.getItem(PIECE_KEY),'ORIGINAL');
  assert.equal(st.calls.length,0,'validación no debe escribir nada');
 }
});
test('mismo ID distinto perfil nunca sobrescribe el DXF existente',()=>{
 const backup=buildProjectBackup({piece,machine:V85_FACTORY,tools:[p,d]});
 const modified={...p,name:'OTRA HERRAMIENTA'};
 const st=store({[TOOL_DXF_STORAGE_KEY]:JSON.stringify([modified]),
  [PIECE_KEY]:'PIEZA ANTERIOR'});
 assert.throws(()=>restoreProjectBackup(st,backup),/otro perfil/);
 assert.equal(st.getItem(PIECE_KEY),'PIEZA ANTERIOR');
});
test('el backup no inventa perfil CAD verificado aunque el JSON lo afirme',()=>{
 const backup=buildProjectBackup({piece,machine:V85_FACTORY,
  tools:[{...p,verifiedSpecs:true,profileAccuracy:'verified'},d]});
 assert.equal(backup.importedTools[0].profileAccuracy,'provisional');
 assert.equal(backup.importedTools[0].verifiedSpecs,false);
});
