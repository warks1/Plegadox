import test from 'node:test';
import assert from 'node:assert/strict';
import {EXAMPLE} from '../engine.js';
import {V85_FACTORY,V85_STORAGE_KEY} from '../machine-config.js';
import {TOOL_DXF_STORAGE_KEY} from '../tool-dxf.js';
import {PROJECT_LIBRARY_KEY,ACTIVE_LIBRARY_ID,readProjectLibrary,
 saveLibraryPiece,setActiveLibraryId} from '../project-library.js';
import {PIECE_KEY,buildProjectBackup,parseProjectBackup,
 restoreProjectBackup,readStoredToolsForBackup} from '../project-backup.js';

function store(initial={},failOnceOn=null){
 const map=new Map(Object.entries(initial)),calls=[];
 let fail=failOnceOn;
 return {map,calls,getItem:k=>map.get(k)??null,
  setItem(k,v){calls.push(k);map.set(k,String(v));
   if(k===fail){fail=null;throw Error('CUOTA');}},
  removeItem(k){calls.push(k);map.delete(k);
   if(k===fail){fail=null;throw Error('CUOTA');}}};
}
const createId=id=>()=>id;
function sourceLibrary(){
 const st=store();
 const a=saveLibraryPiece(st,EXAMPLE,{client:'Cliente A',
  createId:createId('px-cliente-a'),now:'2026-11-02T09:00:00Z'});
 saveLibraryPiece(st,{...EXAMPLE,name:'Omega revisada',
  angles:[90,-90,-90,90]}, {id:a.id,client:'Cliente A',
  now:'2026-11-02T10:00:00Z'});
 const b=saveLibraryPiece(st,{...EXAMPLE,name:'Caja B'},{
  client:'Cliente B',createId:createId('px-cliente-b'),
  now:'2026-11-02T11:00:00Z'});
 setActiveLibraryId(st,b.id);
 return st;
}
function backup(st){
 return buildProjectBackup({piece:EXAMPLE,machine:V85_FACTORY,tools:[],
  library:readProjectLibrary(st),
  activeLibraryId:st.getItem(ACTIVE_LIBRARY_ID)});
}
test('la copia incluye 2 clientes, revisiones completas y selección activa',()=>{
 const source=sourceLibrary(),data=backup(source);
 assert.equal(data.library.length,2);
 const rev=data.library.find(x=>x.id==='px-cliente-a');
 assert.equal(rev.revision,2);
 assert.equal(rev.history.length,1);
 assert.equal(rev.history[0].piece.name,EXAMPLE.name);
 assert.equal(data.activeLibraryId,'px-cliente-b');
 const recovered=parseProjectBackup(JSON.stringify(data));
 assert.equal(recovered.library[0].client,'Cliente B');
 const dest=store();
 restoreProjectBackup(dest,JSON.stringify(data));
 assert.equal(dest.getItem(ACTIVE_LIBRARY_ID),'px-cliente-b');
 assert.equal(readProjectLibrary(dest).length,2);
 assert.equal(readProjectLibrary(dest).find(x=>x.id==='px-cliente-a').history[0].revision,1);
});
test('fusionar biblioteca nunca elimina ni pisa piezas locales',()=>{
 const local=store();
 saveLibraryPiece(local,{...EXAMPLE,name:'Taller local'},{
  createId:createId('px-local-piece'),now:'2026-11-02T08:00:00Z'});
 const original=readProjectLibrary(local)[0];
 const imported=backup(sourceLibrary());
 restoreProjectBackup(local,imported);
 const combined=readProjectLibrary(local);
 assert.equal(combined.length,3);
 assert.deepEqual(combined.find(x=>x.id===original.id),original);
 assert.ok(combined.some(x=>x.id==='px-cliente-a'));
 // Repetir el mismo archivo es idempotente.
 restoreProjectBackup(local,imported);
 assert.equal(readProjectLibrary(local).length,3);
});
test('conflictos del mismo ID se rechazan antes de escribir una sola clave',()=>{
 const local=store();
 saveLibraryPiece(local,{...EXAMPLE,name:'Trabajo local'},{
  createId:createId('px-cliente-a'),now:'2026-11-02T08:00:00Z'});
 const before=local.getItem(PROJECT_LIBRARY_KEY),data=backup(sourceLibrary());
 const calls=local.calls.length;
 assert.throws(()=>restoreProjectBackup(local,data),/Conflicto de revisiones/);
 assert.equal(local.getItem(PROJECT_LIBRARY_KEY),before);
 assert.equal(local.calls.length,calls);
});
test('la copia antigua sin biblioteca preserva todos los proyectos del navegador',()=>{
 const st=sourceLibrary(),original=st.getItem(PROJECT_LIBRARY_KEY);
 const v1=backup(st);
 delete v1.library;delete v1.activeLibraryId;
 assert.equal(parseProjectBackup(v1).library,null);
 restoreProjectBackup(st,v1);
 assert.equal(st.getItem(PROJECT_LIBRARY_KEY),original);
 assert.equal(st.getItem(ACTIVE_LIBRARY_ID),'px-cliente-b');
});
test('fallo tras escritura de biblioteca o ID activo revierte todos los campos',()=>{
 const original=sourceLibrary(),data=backup(original);
 for(const fail of [PROJECT_LIBRARY_KEY,ACTIVE_LIBRARY_ID]){
  const initial={
   [PIECE_KEY]:'PIEZA ORIGINAL',
   [V85_STORAGE_KEY]:'CONFIG ORIGINAL',
   [TOOL_DXF_STORAGE_KEY]:'[]',
   [PROJECT_LIBRARY_KEY]:'[]',
   [ACTIVE_LIBRARY_ID]:'px-otra-pieza'
  };
  const dest=store(initial,fail);
  assert.throws(()=>restoreProjectBackup(dest,data),/No se pudo restaurar/);
  for(const [key,value] of Object.entries(initial))
   assert.equal(dest.getItem(key),value,'rollback: '+key);
 }
});
test('biblioteca incompleta, referencias erróneas e ID activo inválido bloquean toda restauración',()=>{
 const data=backup(sourceLibrary());
 const dest=store({[PIECE_KEY]:'ORIGINAL'});
 const variants=[
  {...data,activeLibraryId:'px-no-existe'},
  {...data,library:[data.library[0],data.library[0]]},
  {...data,library:data.library.map((e,i)=>i===0?{...e,
   history:[{...e.history[0],revision:e.revision}]}:e)},
  {...data,library:data.library.map((e,i)=>i===0?{...e,
   piece:{...e.piece,punch:'user-dxf-punch-perdido'}}:e)},
  {...data,library:null}
 ];
 for(const corrupt of variants){
  const calls=dest.calls.length;
  assert.throws(()=>restoreProjectBackup(dest,corrupt));
  assert.equal(dest.calls.length,calls);
  assert.equal(dest.getItem(PIECE_KEY),'ORIGINAL');
 }
});

test('DXF locales dañados nunca se borran ni filtran durante importación o backup',()=>{
 const data=backup(sourceLibrary());
 for(const bad of ['{json-invalido',
  JSON.stringify([{id:'user-dxf-punch-roto',importedDxf:true}]),
  JSON.stringify(Array.from({length:31},()=>({id:'user-dxf-punch-a'})))]){
  const st=store({[TOOL_DXF_STORAGE_KEY]:bad,[PIECE_KEY]:'ORIGINAL'});
  const calls=st.calls.length;
  assert.throws(()=>readStoredToolsForBackup(st));
  assert.throws(()=>restoreProjectBackup(st,data));
  assert.equal(st.calls.length,calls);
  assert.equal(st.getItem(TOOL_DXF_STORAGE_KEY),bad);
  assert.equal(st.getItem(PIECE_KEY),'ORIGINAL');
 }
});
