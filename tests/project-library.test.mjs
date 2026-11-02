import test from 'node:test';
import assert from 'node:assert/strict';
import {EXAMPLE} from '../engine.js';
import {PROJECT_LIBRARY_KEY,ACTIVE_LIBRARY_ID,
 readProjectLibrary,saveLibraryPiece,getLibraryPiece,
 deleteLibraryPiece,setActiveLibraryId,getActiveLibraryId} from '../project-library.js';
function storage(){
 const data=new Map();
 return {getItem:k=>data.get(k)??null,setItem:(k,v)=>data.set(k,v),
  removeItem:k=>data.delete(k),map:data};
}
const fixed=(s)=>()=>s;
test('guardar varias piezas diferentes conserva cliente y ángulos firmados',()=>{
 const st=storage();
 const a=saveLibraryPiece(st,EXAMPLE,{client:'Cliente A',
  createId:fixed('px-project-a'),now:'2026-11-02T09:00:00Z'});
 const b=saveLibraryPiece(st,{...EXAMPLE,name:'Caja distinta',angles:[90,90,90,90]},
  {client:'Cliente B',createId:fixed('px-project-b'),now:'2026-11-02T10:00:00Z'});
 assert.equal(a.revision,1);assert.equal(b.revision,1);
 assert.equal(readProjectLibrary(st).length,2);
 assert.equal(getLibraryPiece(st,a.id).piece.angles[1],-90);
 assert.equal(getLibraryPiece(st,b.id).piece.name,'Caja distinta');
 assert.equal(getLibraryPiece(st,a.id).client,'Cliente A');
});
test('una revisión nueva conserva la anterior; abrirla no sobrescribe la actual',()=>{
 const st=storage();
 const a=saveLibraryPiece(st,EXAMPLE,{client:'Cliente A',createId:fixed('px-project-a')});
 const b=saveLibraryPiece(st,{...EXAMPLE,flanges:[60,50,50,50,50]},
  {id:a.id,client:'Cliente A'});
 assert.equal(b.revision,2);assert.equal(b.history.length,1);
 assert.equal(getLibraryPiece(st,a.id,{revision:1}).piece.flanges[0],50);
 assert.equal(getLibraryPiece(st,a.id).piece.flanges[0],60);
 assert.equal(readProjectLibrary(st)[0].revision,2);
});
test('IDs nuevos no pueden duplicar ni sobrescribir proyectos existentes',()=>{
 const st=storage();
 saveLibraryPiece(st,EXAMPLE,{createId:fixed('px-project-a')});
 assert.throws(()=>saveLibraryPiece(st,EXAMPLE,{createId:fixed('px-project-a')}),/identificador único/);
 assert.throws(()=>saveLibraryPiece(st,EXAMPLE,{id:'px-not-existing'}),/no existe/);
 assert.equal(readProjectLibrary(st).length,1);
});
test('eliminar pieza no borra las demás ni cambia la geometría activa del programa',()=>{
 const st=storage();
 const a=saveLibraryPiece(st,EXAMPLE,{createId:fixed('px-project-a')});
 const b=saveLibraryPiece(st,{...EXAMPLE,name:'Otra'}, {createId:fixed('px-project-b')});
 setActiveLibraryId(st,a.id);
 assert.equal(getActiveLibraryId(st),a.id);
 deleteLibraryPiece(st,a.id);
 assert.equal(getActiveLibraryId(st),null);
 assert.equal(readProjectLibrary(st).length,1);
 assert.equal(getLibraryPiece(st,b.id).piece.name,'Otra');
 assert.equal(st.getItem(ACTIVE_LIBRARY_ID),null);
});
test('datos de biblioteca corruptos NO se sobrescriben al guardar',()=>{
 const st=storage();
 st.setItem(PROJECT_LIBRARY_KEY,'INVALID JSON');
 assert.throws(()=>saveLibraryPiece(st,EXAMPLE),/dañada/);
 assert.equal(st.getItem(PROJECT_LIBRARY_KEY),'INVALID JSON');
});
test('biblioteca limita revisiones sin alterar la versión actual',()=>{
 const st=storage();
 const a=saveLibraryPiece(st,EXAMPLE,{createId:fixed('px-project-a')});
 for(let i=0;i<12;i++)
  saveLibraryPiece(st,{...EXAMPLE,name:'v'+i},{id:a.id});
 const final=readProjectLibrary(st)[0];
 assert.equal(final.revision,13);
 assert.equal(final.history.length,8);
 assert.equal(getLibraryPiece(st,a.id).piece.name,'v11');
 assert.equal(getLibraryPiece(st,a.id,{revision:12}).piece.name,'v10');
});
