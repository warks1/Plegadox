import test from 'node:test';
import assert from 'node:assert/strict';
import {EXAMPLE} from '../engine.js';
import {V85_FACTORY} from '../machine-config.js';
import {TOOL_DXF_STORAGE_KEY} from '../tool-dxf.js';
import {buildCustomTool,customToolRecord} from '../custom-tool-geometry.js';
import {PIECE_KEY,buildProjectBackup,parseProjectBackup,
 restoreProjectBackup,readStoredToolsForBackup} from '../project-backup.js';
const records=[
 {kind:'punch',name:'Pata de cabra WILA H150',
  shape:'gooseneck',angle:88,height:150,width:60,length:415,
  shankWidth:20,shankHeight:22,neckDepth:18,tipRadius:1,mount:'WILA'},
 {kind:'die',name:'Matriz Promecam V16 H60',
  angle:88,height:60,width:50,length:415,
  opening:16,shoulderRadius:1.5,offset:0,mount:'Amada/Promecam'}
];
const [punch,die]=records.map(r=>customToolRecord(buildCustomTool(r)));
const piece={...EXAMPLE,punch:punch.id,die:die.id};
function store(initial={}){
 const m=new Map(Object.entries(initial)),calls=[];
 return {calls,getItem:key=>m.get(key)??null,
  setItem:(k,v)=>{calls.push(k);m.set(k,String(v));},
  removeItem:k=>m.delete(k)};
}
test('backup conserva íntegra geometría paramétrica de matriz y pata de cabra',()=>{
 const backup=buildProjectBackup({piece,machine:V85_FACTORY,
  tools:[punch,die],exportedAt:'2026-11-15T08:00:00Z'});
 const decoded=parseProjectBackup(JSON.stringify(backup));
 assert.equal(decoded.importedTools.length,2);
 assert.equal(decoded.importedTools[0].customProfile,true);
 assert.equal(decoded.importedTools[0].importedDxf,false);
 assert.equal(decoded.importedTools[0].customDimensions.neckDepth,18);
 assert.deepEqual(decoded.importedTools[0].profilePoints,punch.profilePoints);
 assert.equal(decoded.importedTools[0].mount,'WILA');
 assert.equal(decoded.importedTools[1].opening,16);
 assert.equal(decoded.importedTools[1].mount,'Amada/Promecam');
 assert.equal(decoded.importedTools[1].customDimensions.shoulderRadius,1.5);
 assert.equal(decoded.importedTools[1].verifiedSpecs,false);
});
test('restaura al navegador nuevo sin perder perfil ni opciones editables',()=>{
 const backup=buildProjectBackup({piece,machine:V85_FACTORY,tools:[punch,die]});
 const storage=store();
 const result=restoreProjectBackup(storage,JSON.stringify(backup));
 assert.equal(result.piece.punch,punch.id);
 assert.equal(result.piece.die,die.id);
 assert.equal(readStoredToolsForBackup(storage).length,2);
 assert.equal(JSON.parse(storage.getItem(PIECE_KEY)).punch,punch.id);
 assert.equal(JSON.parse(storage.getItem(TOOL_DXF_STORAGE_KEY))[0].customProfile,true);
 const second=restoreProjectBackup(storage,JSON.stringify(backup));
 assert.equal(second.importedTools.length,2,'No duplicar al importar de nuevo');
});
test('si faltan las cotas de un útil personalizado, rechaza sin tocar el proyecto',()=>{
 const backup=buildProjectBackup({piece,machine:V85_FACTORY,tools:[punch,die]});
 const previous=store({[PIECE_KEY]:'NO BORRAR PIEZA'});
 const malformed={...backup,importedTools:[
  {...backup.importedTools[0],customDimensions:null},
  backup.importedTools[1]
 ]};
 assert.throws(()=>restoreProjectBackup(previous,malformed),/cotas originales/);
 assert.equal(previous.getItem(PIECE_KEY),'NO BORRAR PIEZA');
 assert.equal(previous.calls.length,0);
});
test('permite hasta cincuenta útiles guardados en una sola copia',()=>{
 const many=Array.from({length:50},(_,i)=>({
  ...punch,id:'user-custom-punch-h'+i,
  name:'Punzón '+i
 }));
 const backup=buildProjectBackup({piece:{...piece,punch:many[0].id},
  machine:V85_FACTORY,tools:many});
 assert.equal(backup.importedTools.length,50);
 assert.throws(()=>buildProjectBackup({piece:{...piece,punch:many[0].id},
  machine:V85_FACTORY,tools:[...many,{...die,id:'user-custom-die-exceso'}]}),/Máximo 50/);
});
