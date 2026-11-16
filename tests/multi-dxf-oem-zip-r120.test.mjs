import test from 'node:test';
import assert from 'node:assert/strict';
import {extractDxfFromZip,listDxfZipEntries} from '../cad-zip-reader.js';
import {parseToolDxf} from '../tool-dxf.js';
const dxf=width=>['0','SECTION','2','HEADER','9','$INSUNITS',
 '70','4','0','ENDSEC','0','SECTION','2','ENTITIES',
 '0','LWPOLYLINE','90','4','70','1',
 '10',String(-width/2),'20','100',
 '10',String(width/2),'20','100',
 '10',String(width/2),'20','0',
 '10',String(-width/2),'20','0',
 '0','ENDSEC','0','EOF',''].join('\n');
const encoder=new TextEncoder();
function crc32(data){
 let c=0xffffffff;
 for(const byte of data){
  c^=byte;
  for(let i=0;i<8;i++)c=(c>>>1)^((c&1)?0xedb88320:0);
 }
 return (c^0xffffffff)>>>0;
}
function fixture(entries){
 const bytes=[],index=[];
 const put16=n=>bytes.push(n&255,(n>>>8)&255);
 const put32=n=>{put16(n);put16(n>>>16)};
 const write=a=>bytes.push(...a);
 for(const [name,text] of entries){
  const at=bytes.length,label=encoder.encode(name),body=encoder.encode(text);
  const crc=crc32(body);
  put32(0x04034b50);put16(20);put16(0);put16(0);
  put16(0);put16(0);put32(crc);put32(body.length);put32(body.length);
  put16(label.length);put16(0);write(label);write(body);
  index.push({at,label,crc,length:body.length});
 }
 const dirAt=bytes.length;
 for(const e of index){
  put32(0x02014b50);put16(20);put16(20);put16(0);
  put16(0);put16(0);put16(0);
  put32(e.crc);put32(e.length);put32(e.length);
  put16(e.label.length);put16(0);put16(0);
  put16(0);put16(0);put32(0);put32(e.at);write(e.label);
 }
 const dirSize=bytes.length-dirAt;
 put32(0x06054b50);put16(0);put16(0);
 put16(index.length);put16(index.length);
 put32(dirSize);put32(dirAt);put16(0);
 return new Uint8Array(bytes);
}
test('R120: un ZIP UKB con varios DXF se LISTA sin seleccionar geometría arbitraria',async()=>{
 const archive=fixture([['V8/25403-seccion.dxf',dxf(40)],
  ['V8/25403-segmento.dxf',dxf(60)]]);
 const entries=await listDxfZipEntries(archive);
 assert.equal(entries.length,2);
 assert.equal(entries[0].name,'V8/25403-seccion.dxf');
 assert.ok(entries.every(e=>e.uncompressedBytes>20));
 await assert.rejects(extractDxfFromZip(archive),/varios DXF/);
});
test('R120: el fichero elegido se extrae exactamente y valida CRC individual',async()=>{
 const archive=fixture([['A.DXF',dxf(40)],['B.DXF',dxf(60)]]);
 const pick=await extractDxfFromZip(archive,{selectName:'B.DXF'});
 assert.equal(pick.name,'B.DXF');
 assert.equal(pick.verifiedCRC,true);
 assert.equal(parseToolDxf(pick.content).width,60);
 assert.equal(pick.manufacturerVerified,false);
 await assert.rejects(extractDxfFromZip(archive,{selectName:'C.DXF'}),
  /no existe en el ZIP/);
});
test('R120: selección por nombre NO permite rutas peligrosas ni duplicados confusos',async()=>{
 await assert.rejects(listDxfZipEntries(fixture([['../malicioso.dxf',dxf(20)]])),
  /Ruta peligrosa/);
 await assert.rejects(extractDxfFromZip(fixture([
  ['repetido.DXF',dxf(20)],['repetido.DXF',dxf(40)]
 ]),{selectName:'repetido.DXF'}),/varios DXF/);
});

test('R120: AppleDouble __MACOSX/._*.DXF no es una segunda geometría OEM',async()=>{
 const real=dxf(40);
 const archive=fixture([
  ['11780.DXF',real],
  ['__MACOSX/._11780.DXF',dxf(60)]
 ]);
 const entries=await listDxfZipEntries(archive);
 assert.deepEqual(entries.map(x=>x.name),['11780.DXF']);
 const selected=await extractDxfFromZip(archive);
 assert.equal(selected.name,'11780.DXF');
 assert.equal(parseToolDxf(selected.content).width,40);
 await assert.rejects(extractDxfFromZip(archive,{
  selectName:'__MACOSX/._11780.DXF'}),/no existe en el ZIP/);
});
