import test from 'node:test';
import assert from 'node:assert/strict';
import {extractDxfFromZip} from '../cad-zip-reader.js';
import {parseToolDxf} from '../tool-dxf.js';

const utf8=new TextEncoder();
const rawDxf=['0','SECTION','2','HEADER','9','$INSUNITS','70','4',
 '0','ENDSEC','0','SECTION','2','ENTITIES',
 '0','LWPOLYLINE','90','4','70','1',
 '10','-20','20','90','10','20','20','90',
 '10','20','20','0','10','-20','20','0',
 '0','ENDSEC','0','EOF',''].join('\n');
const crc32=b=>{
 let x=0xffffffff;
 for(const byte of b){x^=byte;
  for(let i=0;i<8;i++)x=(x>>>1)^((x&1)?0xedb88320:0);}
 return (x^0xffffffff)>>>0;
};
const zip=({name='25500.DXF',data=rawDxf,method=0,
 damaged=false,centralSize=null}={})=>{
 const bytes=typeof data==='string'?utf8.encode(data):data;
 const filename=utf8.encode(name);
 const out=[];
 const w16=n=>out.push(n&255,n>>>8&255);
 const w32=n=>{w16(n);w16(n>>>16);}
 const write=a=>out.push(...a);
 const checksum=(crc32(bytes)+(damaged?1:0))>>>0;
 w32(0x04034b50);w16(20);w16(0);w16(method);w16(0);w16(0);
 w32(checksum);w32(bytes.length);w32(bytes.length);
 w16(filename.length);w16(0);write(filename);write(bytes);
 const at=out.length;
 w32(0x02014b50);w16(20);w16(20);w16(0);w16(method);w16(0);w16(0);
 w32(checksum);w32(bytes.length);w32(centralSize??bytes.length);
 w16(filename.length);w16(0);w16(0);w16(0);w16(0);w32(0);w32(0);
 write(filename);
 const dirLen=out.length-at;
 w32(0x06054b50);w16(0);w16(0);w16(1);w16(1);
 w32(dirLen);w32(at);w16(0);
 return new Uint8Array(out);
};
test('R112 ZIP: DXF original se extrae con CRC y pasa el importador',async()=>{
 const archive=zip();
 const out=await extractDxfFromZip(archive);
 assert.equal(out.name,'25500.DXF');
 assert.equal(out.content,rawDxf);
 assert.equal(out.verifiedCRC,true);
 assert.equal(out.manufacturerVerified,false);
 assert.equal(parseToolDxf(out.content).width,40);
});
test('R112 ZIP: se detecta corrupción CRC del fabricante',async()=>{
 await assert.rejects(extractDxfFromZip(zip({damaged:true})),/CRC ZIP/);
});
test('R112 ZIP: bloquea rutas de directorio y paquetes engañosos',async()=>{
 await assert.rejects(extractDxfFromZip(zip({name:'../fake.dxf'})),/Ruta peligrosa/);
 await assert.rejects(extractDxfFromZip(zip({name:'evil.exe'})),/No existe un único DXF/);
});
test('R112 ZIP: un tamaño anunciado superior al límite se rechaza antes de extraer',async()=>{
 await assert.rejects(extractDxfFromZip(zip({centralSize:2*1024*1024})),/1 MB/);
});
test('R112 ZIP: rechaza métodos que no son STORE/Deflate',async()=>{
 await assert.rejects(extractDxfFromZip(zip({method:12})),/Compresión ZIP/);
});
test('R112 ZIP: método Deflate requiere descompresor y valida sus bytes por CRC',async()=>{
 const archive=zip({method:8});
 const out=await extractDxfFromZip(archive,{inflate:async()=>{
  return utf8.encode(rawDxf);
 }});
 assert.equal(out.content,rawDxf);
 await assert.rejects(extractDxfFromZip(archive,{inflate:async()=>{
  return utf8.encode(rawDxf+' ');
 }}),/Tamaño de DXF/);
});
test('R112 ZIP: descarta cabecera ZIP truncada o paquetes de más de 8 MB',async()=>{
 await assert.rejects(extractDxfFromZip(new Uint8Array(10)),/ZIP inválido/);
 await assert.rejects(extractDxfFromZip(new Uint8Array(8*1024*1024+1)),/8 MB/);
});

test('R112 ZIP: nombre de la cabecera local distinto de directorio se rechaza',async()=>{
 const bytes=zip(),tampered=bytes.slice();
 tampered[30]='X'.charCodeAt(0);
 await assert.rejects(extractDxfFromZip(tampered),/Nombre DXF local no coincide/);
});
