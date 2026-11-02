/**
 * Copia portátil de proyecto: pieza, ajustes V85 y biblioteca DXF.
 * Validar TODO antes de escribir; una importación inválida no toca datos.
 * Es un backup LOCAL descargable por el operario, no nube automática.
 */
import {DIES,PUNCHES,MATERIALS} from './engine.js';
import {normalizeV85,V85_STORAGE_KEY} from './machine-config.js';
import {TOOL_DXF_STORAGE_KEY,validateContour} from './tool-dxf.js';
import {PROJECT_LIBRARY_KEY,ACTIVE_LIBRARY_ID,readProjectLibrary} from './project-library.js';
export const PROJECT_FORMAT='plegadox-complete-project-v1';
export const PIECE_KEY='plegadox:piece:v1';
const MAX_TOOLS=30;
const check=(ok,msg)=>{if(!ok)throw Error(msg);};
const finite=(n,min,max)=>typeof n==='number'&&Number.isFinite(n)&&n>=min&&n<=max;
const idRule=/^user-dxf-(punch|die)-[a-z0-9-]+$/;
function checkedPiece(p){
 check(p&&typeof p==='object'&&!Array.isArray(p),'La pieza del backup no es válida');
 check(Array.isArray(p.flanges)&&p.flanges.length>=2&&p.flanges.length<=20,
  'Número de alas del backup fuera de rango (2-20)');
 check(p.flanges.every(n=>finite(n,1,10000)),'Longitudes de alas inválidas');
 check(Array.isArray(p.angles)&&p.angles.length===p.flanges.length-1,
  'Los pliegues no coinciden con las alas');
 check(p.angles.every(n=>finite(n,-179,179)),'Ángulos fuera de rango');
 check(Array.isArray(p.order)&&p.order.length===p.angles.length&&
  new Set(p.order).size===p.order.length&&p.order.every(x=>Number.isInteger(x)&&x>=0&&x<p.angles.length),
  'Secuencia de plegado inválida');
 check(finite(p.thickness,.2,30)&&finite(p.width,1,10000),'Espesor o ancho inválidos');
 check(typeof p.name==='string'&&p.name.length<=80,'Nombre de pieza inválido');
 check(typeof p.punch==='string'&&typeof p.die==='string','No hay referencias de herramienta');
 check(MATERIALS.some(m=>m.id===p.material),'Material de proyecto desconocido');
 if(p.kFactor!=null)check(finite(p.kFactor,.15,.6),'Factor K fuera de rango');
 if(p.radius!=null)check(finite(p.radius,.1,100),'Radio fuera de rango');
 if(p.rmMPa!=null)check(finite(p.rmMPa,50,1800),'Resistencia Rm fuera de rango');
 if(p.datum!=null)check(['outside','neutral'].includes(p.datum),'Criterio de desarrollo inválido');
 if(p.stopByBend!=null)
  check(Array.isArray(p.stopByBend)&&p.stopByBend.length===p.angles.length&&
   p.stopByBend.every(x=>x===1||x===2),'Selección de tope incoherente');
 if(p.gaugeSideByBend!=null)
  check(Array.isArray(p.gaugeSideByBend)&&p.gaugeSideByBend.length===p.angles.length&&
   p.gaugeSideByBend.every(x=>['before','after','auto'].includes(x)),'Referencia de apoyo incoherente');
 return {...p,flanges:[...p.flanges],angles:[...p.angles],order:[...p.order]};
}
function checkedTool(t){
 check(t&&t.importedDxf===true&&typeof t.id==='string'&&idRule.test(t.id),
  'ID de útil importado no válido');
 check(typeof t.name==='string'&&t.name.trim().length>0&&t.name.length<=65,
  'Nombre de útil DXF inválido');
 const contour=validateContour(t.profilePoints);
 const die=t.id.startsWith('user-dxf-die-');
 check(die===Boolean(t.opening!=null),'Tipo de herramienta DXF incoherente');
 check(finite(t.angle,15,120)&&finite(t.length,10,6000),
  'Ángulo o longitud de herramienta fuera de rango');
 check(Math.abs(t.height-contour.height)<.01,'La altura del útil DXF no coincide con su contorno');
 check(die?finite(t.opening,2,200):finite(t.tip,.1,30),
  'Apertura V o radio de punta inválidos');
 // Regenerar metadatos sin aceptar un falso indicador "CAD verificado".
 return {id:t.id,name:t.name,reference:t.name,manufacturer:'Importado DXF',
  mount:'',angle:t.angle,height:t.height,length:t.length,
  profilePoints:contour.points,importedDxf:true,
  verifiedSpecs:false,profileAccuracy:'provisional',
  sourceDescription:'Perfil DXF 2D local: amarre y colisiones reales no verificados',
  ...(die?{opening:t.opening}:{tip:t.tip,type:'importado'})};
}
function checkedTools(list){
 check(Array.isArray(list)&&list.length<=MAX_TOOLS,'Máximo 30 herramientas DXF en un proyecto');
 const data=list.map(checkedTool);
 check(new Set(data.map(t=>t.id)).size===data.length,'IDs de herramientas repetidos');
 return data;
}
/**
 * No reutilizar loadImportedTools() para un backup: ese lector tolerante
 * descarta entradas corruptas y podría hacerlas desaparecer al reescribir.
 */
export function readStoredToolsForBackup(storage){
 check(storage&&typeof storage.getItem==='function',
  'Almacenamiento local no disponible');
 const raw=storage.getItem(TOOL_DXF_STORAGE_KEY);
 if(raw===null)return [];
 let source;
 try{source=JSON.parse(raw);}
 catch{throw Error('La biblioteca DXF local está dañada; conserva el archivo antes de recuperar una copia');}
 return checkedTools(source);
}
function validateToolReferences(piece,tools){
 const knownPunch=PUNCHES.some(x=>x.id===piece.punch&&!x.importedDxf)||
  tools.some(x=>x.id===piece.punch&&x.opening==null);
 const knownDie=DIES.some(x=>x.id===piece.die&&!x.importedDxf)||
  tools.some(x=>x.id===piece.die&&x.opening!=null);
 check(knownPunch,'El backup no contiene una referencia válida de punzón: '+piece.punch);
 check(knownDie,'El backup no contiene una referencia válida de matriz: '+piece.die);
}
/**
 * Se conserva el formato v1: los backups anteriores no tenían biblioteca.
 * Cuando existe, se valida cada pieza y cada revisión ANTES de escribir.
 */
function checkedLibrary(source,tools){
 check(Array.isArray(source)&&source.length<=60,
  'Biblioteca inválida: máximo 60 piezas');
 const ids=new Set();
 return source.map(entry=>{
  check(entry&&typeof entry==='object'&&!Array.isArray(entry)&&
   typeof entry.id==='string'&&/^px-[a-z0-9-]{4,55}$/.test(entry.id),
   'Identificador de biblioteca inválido');
  check(!ids.has(entry.id),'ID de biblioteca duplicado: '+entry.id);
  ids.add(entry.id);
  check(typeof entry.client==='string'&&entry.client.length<=80,
   'Cliente de biblioteca inválido');
  check(Number.isSafeInteger(entry.revision)&&entry.revision>=1,
   'Revisión de biblioteca inválida');
  const validDate=s=>typeof s==='string'&&s.length<=40&&
   Number.isFinite(Date.parse(s));
  check(validDate(entry.createdAt)&&validDate(entry.updatedAt),
   'Fecha de proyecto inválida');
  const piece=checkedPiece(entry.piece);
  validateToolReferences(piece,tools);
  check(Array.isArray(entry.history)&&entry.history.length<=8,
   'Historial de revisiones inválido');
  const seen=new Set();
  const history=entry.history.map(item=>{
   check(item&&typeof item==='object'&&!Array.isArray(item)&&
    Number.isSafeInteger(item.revision)&&item.revision>=1&&
    item.revision<entry.revision&&!seen.has(item.revision)&&
    validDate(item.savedAt),'Revisión histórica inválida');
   seen.add(item.revision);
   const historicalPiece=checkedPiece(item.piece);
   validateToolReferences(historicalPiece,tools);
   return {revision:item.revision,savedAt:item.savedAt,piece:historicalPiece};
  });
  return {id:entry.id,client:entry.client,piece,
   revision:entry.revision,history,
   createdAt:entry.createdAt,updatedAt:entry.updatedAt};
 });
}
function checkedActiveId(id,library){
 check(id===null||(typeof id==='string'&&library.some(p=>p.id===id)),
  'La pieza activa no figura en la biblioteca del backup');
 return id;
}
export function buildProjectBackup({piece,machine,tools,library=[],activeLibraryId=null,
 exportedAt=new Date().toISOString()}){
 const p=checkedPiece(piece),t=checkedTools(tools);
 validateToolReferences(p,t);
 check(machine&&Array.isArray(machine.ram)&&Array.isArray(machine.bed)&&
  Array.isArray(machine.stop)&&Array.isArray(machine.support),
  'Configuración de máquina incompleta');
 check(t.some(x=>x.id===p.punch)||!p.punch.startsWith('user-dxf-'),
  'Falta el DXF del punzón asociado a la pieza');
 check(t.some(x=>x.id===p.die)||!p.die.startsWith('user-dxf-'),
  'Falta el DXF de la matriz asociada a la pieza');
 const checked=checkedLibrary(library,t);
 checkedActiveId(activeLibraryId,checked);
 return {format:PROJECT_FORMAT,schemaVersion:1,exportedAt,
  piece:p,machine:normalizeV85(machine),importedTools:t,
  library:checked,activeLibraryId,
  notes:'Copia local de pieza, V85, DXF y biblioteca con revisiones. No certifica geometría industrial ni autoriza fabricar.'};
}
/** Puro; nunca modifica el navegador si el formato o contenido son inválidos. */
export function parseProjectBackup(source){
 const raw=typeof source==='string'?JSON.parse(source):source;
 check(raw&&typeof raw==='object'&&raw.format===PROJECT_FORMAT&&
  raw.schemaVersion===1,'Formato de proyecto no compatible');
 const p=checkedPiece(raw.piece),tools=checkedTools(raw.importedTools);
 validateToolReferences(p,tools);
 check(raw.machine&&Array.isArray(raw.machine.ram)&&Array.isArray(raw.machine.bed)&&
  Array.isArray(raw.machine.stop)&&Array.isArray(raw.machine.support),
  'Configuración de máquina incompleta');
 check(tools.some(x=>x.id===p.punch)||!p.punch.startsWith('user-dxf-'),
  'El proyecto no incluye su punzón DXF');
 check(tools.some(x=>x.id===p.die)||!p.die.startsWith('user-dxf-'),
  'El proyecto no incluye su matriz DXF');
 // Ausencia de ambos campos identifica una copia R17 sin biblioteca.
 // Nunca interpretar esa ausencia como orden de borrar piezas locales.
 const hasLibrary=Object.prototype.hasOwnProperty.call(raw,'library');
 check(hasLibrary||raw.activeLibraryId===undefined,
  'El archivo declara una pieza activa sin biblioteca');
 const library=hasLibrary?checkedLibrary(raw.library,tools):null;
 const activeLibraryId=hasLibrary?
  checkedActiveId(raw.activeLibraryId===undefined?null:raw.activeLibraryId,library):null;
 return {piece:p,machine:normalizeV85(raw.machine),importedTools:tools,
  library,activeLibraryId};
}
/**
 * Se fusionan piezas por ID sin pisar proyectos locales: un conflicto
 * produce un error antes de cualquier escritura. También se conservan
 * los útiles locales adicionales, con recuperación ante fallos de cuota.
 */
export function restoreProjectBackup(storage,source){
 check(storage&&typeof storage.getItem==='function'&&
  typeof storage.setItem==='function'&&typeof storage.removeItem==='function',
  'Almacenamiento local no disponible');
 const data=parseProjectBackup(source);
 const previous=readStoredToolsForBackup(storage);
 const merged=[...previous];
 for(const tool of data.importedTools){
  const before=merged.find(x=>x.id===tool.id);
  if(before){
   const a=JSON.stringify(checkedTool(before)),b=JSON.stringify(tool);
   check(a===b,'ID DXF ya existente con otro perfil: '+tool.id);
  }else merged.push(tool);
 }
 check(merged.length<=MAX_TOOLS,'La unión supera 30 útiles DXF. Exporta tu biblioteca antes de importar.');
 let finalLibrary=null;
 if(data.library!==null){
  const locals=checkedLibrary(readProjectLibrary(storage),merged);
  finalLibrary=[...locals];
  for(const entry of data.library){
   const before=finalLibrary.find(item=>item.id===entry.id);
   if(before){
    check(JSON.stringify(before)===JSON.stringify(entry),
     'Conflicto de revisiones para '+entry.id+
     ': exporta una copia de ambos dispositivos antes de resolverlo');
   }else finalLibrary.push(entry);
  }
  check(finalLibrary.length<=60,
   'La biblioteca combinada supera 60 piezas: exporta copias separadas');
 }
 const entries=[[TOOL_DXF_STORAGE_KEY,JSON.stringify(merged)],
  [V85_STORAGE_KEY,JSON.stringify(data.machine)],
  [PIECE_KEY,JSON.stringify(data.piece)]];
 if(finalLibrary!==null){
  entries.push([PROJECT_LIBRARY_KEY,JSON.stringify(finalLibrary)]);
  entries.push([ACTIVE_LIBRARY_ID,data.activeLibraryId]);
 }
 const old=entries.map(([key])=>[key,storage.getItem(key)]);
 let attempted=0;
 try{
  for(const [key,value] of entries){
   attempted++;
   if(value===null)storage.removeItem(key);
   else storage.setItem(key,value);
  }
 }catch(error){
  for(let i=attempted-1;i>=0;i--){
   try{
    if(old[i][1]===null)storage.removeItem(old[i][0]);
    else storage.setItem(old[i][0],old[i][1]);
   }catch{}
  }
  throw Error('No se pudo restaurar el proyecto completo: '+error.message);
 }
 return {...data,importedTools:merged,library:finalLibrary};
}
