/**
 * Biblioteca local de piezas con revisiones. Sin nube ni datos personales.
 * Guardar es explícito: la pieza activa puede editarse antes de confirmar.
 */
import {normalized} from './engine.js';
export const PROJECT_LIBRARY_KEY='plegadox:project-library:v1';
export const ACTIVE_LIBRARY_ID='plegadox:active-project:v1';
const MAX_ITEMS=60,MAX_HISTORY=8;
const finite=n=>typeof n==='number'&&Number.isFinite(n);
function validate(entry){
 if(!entry||typeof entry!=='object'||typeof entry.id!=='string'||
  !/^px-[a-z0-9-]{4,55}$/.test(entry.id))throw Error('Identificador de proyecto inválido');
 if(!entry.piece||!Array.isArray(entry.piece.flanges)||!Array.isArray(entry.piece.angles)||
   entry.piece.flanges.length<2||entry.piece.flanges.length>20||
   entry.piece.angles.length!==entry.piece.flanges.length-1)
   throw Error('Geometría de pieza inválida');
 if(!finite(entry.revision)||!Number.isInteger(entry.revision)||entry.revision<1)
  throw Error('Número de revisión inválido');
 if(typeof entry.client!=='string'||entry.client.length>80)
  throw Error('Cliente demasiado largo');
 if(!Array.isArray(entry.history)||entry.history.length>MAX_HISTORY)
  throw Error('Historial de revisiones inválido');
 return entry;
}
export function readProjectLibrary(storage){
 if(!storage)throw Error('No hay almacenamiento del navegador');
 const raw=storage.getItem(PROJECT_LIBRARY_KEY);
 if(raw==null)return [];
 let data;
 try{data=JSON.parse(raw);}catch{throw Error('Biblioteca local dañada: no se sobrescribe');}
 if(!Array.isArray(data)||data.length>MAX_ITEMS)throw Error('Biblioteca local inválida: no se sobrescribe');
 const ids=new Set();
 for(const e of data){validate(e);if(ids.has(e.id))throw Error('IDs duplicados: no se sobrescribe');ids.add(e.id);}
 return data.sort((a,b)=>String(b.updatedAt).localeCompare(String(a.updatedAt)));
}
const newId=()=>('px-'+Date.now().toString(36)+'-'+Math.random().toString(36).slice(2,10));
export function saveLibraryPiece(storage,piece,{id=null,client='',now=new Date().toISOString(),
 createId=newId}={}){
 const library=readProjectLibrary(storage);
 const p=normalized(piece),cleanClient=String(client??'').trim().slice(0,80);
 const index=id==null?-1:library.findIndex(e=>e.id===id);
 if(id!=null&&index<0)throw Error('El proyecto que intentas sobrescribir no existe');
 let entry;
 if(index>=0){
  const old=library[index],last={piece:old.piece,savedAt:old.updatedAt,
   revision:old.revision};
  const history=[...old.history,last].slice(-MAX_HISTORY);
  entry=validate({...old,client:cleanClient,piece:p,updatedAt:now,
   revision:old.revision+1,history});
  library.splice(index,1);
 }else{
  if(library.length>=MAX_ITEMS)throw Error('Biblioteca llena: máximo '+MAX_ITEMS+' piezas');
  const candidate=createId();
  if(typeof candidate!=='string'||library.some(e=>e.id===candidate))
   throw Error('No se pudo generar un identificador único');
  entry=validate({id:candidate,client:cleanClient,piece:p,
   revision:1,history:[],createdAt:now,updatedAt:now});
 }
 library.unshift(entry);
 storage.setItem(PROJECT_LIBRARY_KEY,JSON.stringify(library));
 return entry;
}
export function getLibraryPiece(storage,id,{revision='latest'}={}){
 const entry=readProjectLibrary(storage).find(x=>x.id===id);
 if(!entry)throw Error('Pieza no encontrada');
 if(revision==='latest')return {...entry,piece:normalized(entry.piece)};
 const match=entry.history.find(x=>x.revision===revision);
 if(!match)throw Error('La revisión solicitada no existe');
 return {...entry,piece:normalized(match.piece),revision:match.revision,
  restoredFromHistory:true};
}
export function deleteLibraryPiece(storage,id){
 const items=readProjectLibrary(storage),index=items.findIndex(e=>e.id===id);
 if(index<0)throw Error('Pieza no encontrada');
 const deleted=items.splice(index,1)[0];
 storage.setItem(PROJECT_LIBRARY_KEY,JSON.stringify(items));
 if(storage.getItem(ACTIVE_LIBRARY_ID)===id)storage.removeItem(ACTIVE_LIBRARY_ID);
 return deleted;
}
export function setActiveLibraryId(storage,id){
 if(id==null)storage.removeItem(ACTIVE_LIBRARY_ID);
 else storage.setItem(ACTIVE_LIBRARY_ID,id);
}
export function getActiveLibraryId(storage){
 const id=storage?.getItem(ACTIVE_LIBRARY_ID);
 if(!id)return null;
 return readProjectLibrary(storage).some(x=>x.id===id)?id:null;
}
