/**
 * PlegadoX R112 · extraer un DXF ASCII contenido en ZIP de fabricante.
 * NO instala un perfil ni lo declara CAD OEM verificado.
 * Solo se admite un fichero DXF y un máximo de 1 MiB sin comprimir.
 * ZIP64, cifrado, múltiples DXF y rutas peligrosas se rechazan.
 */
const MAX_ZIP_BYTES=8*1024*1024,MAX_DXF_BYTES=1024*1024;
const decoder=new TextDecoder('utf-8',{fatal:true});
function crc32(bytes){
 let c=0xffffffff;
 for(let i=0;i<bytes.length;i++){
  c^=bytes[i];
  for(let j=0;j<8;j++)c=(c>>>1)^((c&1)?0xedb88320:0);
 }
 return (c^0xffffffff)>>>0;
}
function view(bytes){return new DataView(bytes.buffer,bytes.byteOffset,bytes.byteLength);}
function range(bytes,at,count){
 if(!Number.isSafeInteger(at)||!Number.isSafeInteger(count)||at<0||
  count<0||at+count>bytes.length)throw Error('Archivo ZIP truncado o manipulado');
 return bytes.subarray(at,at+count);
}
async function defaultInflate(compressed){
 if(typeof DecompressionStream!=='function'||typeof Blob!=='function')
  throw Error('El navegador no admite descompresión ZIP Deflate; extrae el .DXF manualmente');
 let stream;
 try{stream=new Blob([compressed]).stream().pipeThrough(
  new DecompressionStream('deflate-raw'));}
 catch{throw Error('Deflate ZIP no disponible en este navegador; extrae el DXF manualmente');}
 const reader=stream.getReader(),parts=[];let size=0;
 try{while(true){
  const {done,value}=await reader.read();if(done)break;
  size+=value.byteLength;
  if(size>MAX_DXF_BYTES)throw Error('DXF ZIP descomprimido supera 1 MB');
  parts.push(value);
 }}finally{reader.releaseLock();}
 const merged=new Uint8Array(size);let at=0;
 for(const part of parts){merged.set(part,at);at+=part.byteLength;}
 return merged;
}
export async function extractDxfFromZip(data,{
 inflate=defaultInflate,selectName=null,listOnly=false
}={}){
 const bytes=data instanceof Uint8Array?data:
  data instanceof ArrayBuffer?new Uint8Array(data):null;
 if(!bytes||bytes.length<22||bytes.length>MAX_ZIP_BYTES)
  throw Error('ZIP inválido o mayor de 8 MB');
 const v=view(bytes);
 // EOCD: buscar desde el final. Sólo archivos ZIP de un único disco.
 let end=-1;
 for(let i=bytes.length-22;i>=Math.max(0,bytes.length-65557);i--){
  if(v.getUint32(i,true)===0x06054b50&&i+22+v.getUint16(i+20,true)===bytes.length){
   end=i;break;
  }
 }
 if(end<0)throw Error('ZIP sin directorio central completo');
 if(v.getUint16(end+4,true)!==0||v.getUint16(end+6,true)!==0)
  throw Error('ZIP de varios discos no admitido');
 const count=v.getUint16(end+10,true),dirSize=v.getUint32(end+12,true),
  dirAt=v.getUint32(end+16,true);
 if(count!==v.getUint16(end+8,true)||count===0||count>100||
  dirAt===0xffffffff||dirSize===0xffffffff)
  throw Error('Directorio ZIP no admitido o ZIP64');
 range(bytes,dirAt,dirSize);
 if(selectName!==null&&(typeof selectName!=='string'||!selectName||
    selectName.length>240))
  throw Error('Nombre de DXF solicitado no válido');
 let pos=dirAt,selected=null;
 const candidates=[];
 for(let i=0;i<count;i++){
  range(bytes,pos,46);
  if(v.getUint32(pos,true)!==0x02014b50)
   throw Error('Entrada del directorio ZIP corrupta');
  const flags=v.getUint16(pos+8,true),method=v.getUint16(pos+10,true),
   expectedCrc=v.getUint32(pos+16,true),compressedLen=v.getUint32(pos+20,true),
   rawLen=v.getUint32(pos+24,true),nameLen=v.getUint16(pos+28,true),
   extraLen=v.getUint16(pos+30,true),commentLen=v.getUint16(pos+32,true),
   disk=v.getUint16(pos+34,true),localAt=v.getUint32(pos+42,true);
  if((flags&1)!==0||disk!==0||rawLen===0xffffffff||
   compressedLen===0xffffffff||localAt===0xffffffff)
   throw Error('ZIP cifrado, multidisco o ZIP64 no admitido');
  const nameBytes=range(bytes,pos+46,nameLen);
  let name;
  try{name=decoder.decode(nameBytes)}catch{throw Error('Nombre de fichero ZIP inválido');}
  const safe=!name.startsWith('/')&&!name.includes('\\')&&
   !name.split('/').some(x=>x==='..'||x==='.');
  if(!safe)throw Error('Ruta peligrosa en archivo ZIP');
  if(/\.dxf$/i.test(name)){
   if(rawLen>MAX_DXF_BYTES||rawLen<20)
    throw Error('DXF dentro del ZIP fuera de tamaño permitido (1 MB)');
   if(method!==0&&method!==8)
    throw Error('Compresión ZIP distinta de STORE/Deflate no admitida');
   candidates.push({name,uncompressedBytes:rawLen,
    compressedBytes:compressedLen,method});
   // Sin elección explícita seguimos rechazando varios perfiles.
   // Cuando el operario señala uno, no se mezcla con otras variantes.
   if(!listOnly&&(selectName===null||name===selectName)){
    if(selected)throw Error('ZIP contiene varios DXF: elige y extrae el perfil correcto manualmente');
    selected={name,flags,method,expectedCrc,compressedLen,rawLen,localAt};
   }
  }
  pos+=46+nameLen+extraLen+commentLen;
  if(pos>dirAt+dirSize)throw Error('Directorio ZIP con tamaños inconsistentes');
 }
 if(pos!==dirAt+dirSize)throw Error('Directorio ZIP con tamaños inconsistentes');
 if(listOnly){
  if(!candidates.length)throw Error('No existe un único DXF válido en el ZIP');
  return {entries:candidates,verifiedContents:false,
   note:'Listar nombres NO valida el CRC ni autentica el fabricante.'};
 }
 if(!selected)throw Error(selectName!==null?
  'El DXF seleccionado no existe en el ZIP':'No existe un único DXF válido en el ZIP');
 const item=selected;range(bytes,item.localAt,30);
 if(v.getUint32(item.localAt,true)!==0x04034b50)
  throw Error('Cabecera local ZIP inválida');
 const localMethod=v.getUint16(item.localAt+8,true),
  localName=v.getUint16(item.localAt+26,true),
  localExtra=v.getUint16(item.localAt+28,true);
 if(localMethod!==item.method)throw Error('Método ZIP local distinto del directorio');
 const actualName=decoder.decode(range(bytes,item.localAt+30,localName));
 if(actualName!==item.name)throw Error('Nombre DXF local no coincide con directorio ZIP');
 const start=item.localAt+30+localName+localExtra;
 if(start+item.compressedLen>dirAt)
  throw Error('Datos ZIP solapados con el directorio central');
 const compressed=range(bytes,start,item.compressedLen);
 const output=item.method===0?compressed:await inflate(compressed);
 const raw=output instanceof Uint8Array?output:new Uint8Array(output);
 if(raw.length!==item.rawLen||raw.length>MAX_DXF_BYTES)
  throw Error('Tamaño de DXF ZIP descomprimido no coincide');
 if(crc32(raw)!==item.expectedCrc)
  throw Error('CRC ZIP incorrecto: fichero dañado o modificado');
 let content;try{content=decoder.decode(raw);}catch{
  throw Error('DXF de ZIP no es texto UTF-8/ASCII válido');
 }
 if(content.includes('\0'))throw Error('DXF binario no admitido');
 return {name:item.name,content,bytes:raw.byteLength,
  verifiedCRC:true,manufacturerVerified:false};
}
/** Inventario sin descomprimir. Cada elección posterior valida su CRC
 * independientemente y no toma cotas de otro fichero ZIP.
 */
export async function listDxfZipEntries(data){
 const result=await extractDxfFromZip(data,{listOnly:true});
 return result.entries;
}
