#!/usr/bin/env node
/**
 * R120 · auditoría REMOTA de archivos OEM, con procedencia y SHA256.
 * No instala ni redistribuye geometría de terceros: conserva un INFORME
 * auditable de disponibilidad, dimensiones medidas y conflictos.
 * En un PC sin acceso externo no debe inventar ningún perfil.
 */
import {mkdir,writeFile,appendFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {inflateRawSync} from 'node:zlib';
import {CAD_EVIDENCE_SOURCES} from '../cad-evidence.js';
import {extractDxfFromZip} from '../cad-zip-reader.js';
import {parseToolDxf} from '../tool-dxf.js';
import {auditImportedCadDimensions} from '../tool-cad-oem-audit.js';
const MAX=8*1024*1024;
const now=new Date().toISOString();
const OUTPUT='test-results/oem-cad-remote-audit.json';
const supported=new Set(['www.ukb-gmbh.de','daten.ukb-gmbh.de',
 'www.soclam.com','eurostampsrl.it','www.mate.com']);
function allowed(url){
 const v=new URL(url);
 if(v.protocol!=='https:'||!supported.has(v.hostname)||
  !/\.(?:dxf|zip)$/i.test(v.pathname))
  throw Error('URL OEM no autorizada para descarga: '+v.hostname);
 return v;
}
async function bytesFrom(url){
 allowed(url);
 const response=await fetch(url,{redirect:'follow',
  signal:AbortSignal.timeout(18000),headers:{'User-Agent':'PlegadoX-CAD-Audit/1.0'}});
 if(!response.ok)throw Error('HTTP '+response.status);
 if(new URL(response.url).protocol!=='https:')
  throw Error('Descarga redirigida fuera de HTTPS');
 const advertised=Number(response.headers.get('content-length')||0);
 if(advertised>MAX)throw Error('Archivo OEM mayor de 8 MiB');
 const reader=response.body?.getReader();if(!reader)throw Error('Respuesta sin contenido');
 const parts=[];let size=0;
 try{
  while(true){
   const chunk=await reader.read();if(chunk.done)break;
   size+=chunk.value.byteLength;
   if(size>MAX)throw Error('Archivo OEM excede el máximo permitido');
   parts.push(chunk.value);
  }
 }finally{reader.releaseLock();}
 const all=Buffer.concat(parts.map(x=>Buffer.from(x)),size);
 if(all.length<20)throw Error('Respuesta OEM vacía');
 return all;
}
function expected(item){
 const d=item.dimensions||{};
 return {kind:item.kind,reference:item.reference,
  sourceUrl:item.sourceUrl,heightMm:d.heightMm??null,
  angleDeg:d.angleDeg??null,
  openingMm:d.vOpeningMm??null,
  tipDiameterMm:d.tipRadiusMm==null?null:2*d.tipRadiusMm};
}
function measured(item,parsed){
 const e=expected(item);
 return auditImportedCadDimensions(parsed,e,{
  kind:item.kind,angleDeg:e.angleDeg,openingMm:e.openingMm,
  tipDiameterMm:e.tipDiameterMm
 });
}
async function audit(item){
 const record={id:item.id,kind:item.kind,maker:item.maker,
  reference:item.reference,url:item.cadUrl,
  sourceUrl:item.sourceUrl,checkedAt:now,
  status:'PENDIENTE',verified:false,mounted:false};
 try{
  const file=await bytesFrom(item.cadUrl);
  record.bytes=file.length;
  record.sha256=createHash('sha256').update(file).digest('hex');
  const zipped=/\.zip$/i.test(new URL(item.cadUrl).pathname);
  const content=zipped?
   (await extractDxfFromZip(file,{inflate:raw=>
    new Uint8Array(inflateRawSync(raw))})).content:
   new TextDecoder('utf-8',{fatal:true}).decode(file);
  const parsed=parseToolDxf(content);
  const review=measured(item,parsed);
  record.status=review.canRegister?
   'PERFIL_DXF_LEIDO_COTAS_NOMINALES_NO_CERTIFICADO':
   'DXF_LEIDO_DISCREPANCIA_COTAS';
  record.points=parsed.points.length;record.widthMm=parsed.width;
  record.heightMm=parsed.height;
  record.unitsAssumed=parsed.unitsAssumed;
  record.conflicts=review.conflicts;
  record.missing=review.missing;
 }catch(error){
  record.status='SIN_PERFIL_VALIDADO';
  record.problem=String(error?.message||error).slice(0,260);
 }
 return record;
}
const eligible=CAD_EVIDENCE_SOURCES.filter(x=>
 ['punch','die'].includes(x.kind)&&x.cadUrl&&
 /^https:\/\//.test(x.cadUrl));
await mkdir('test-results',{recursive:true});
const results=new Array(eligible.length);
let index=0;
const workers=Math.min(4,eligible.length);
await Promise.all(Array.from({length:workers},async()=>{
 while(index<eligible.length){
  const i=index++;
  results[i]=await audit(eligible[i]);
  process.stdout.write(results[i].id+' '+results[i].status+
   (results[i].problem?' ('+results[i].problem+')':'')+'\n');
 }
}));
const metrics={
 total:results.length,
 read:results.filter(x=>x.status==='PERFIL_DXF_LEIDO_COTAS_NOMINALES_NO_CERTIFICADO').length,
 mismatched:results.filter(x=>x.status==='DXF_LEIDO_DISCREPANCIA_COTAS').length,
 unavailable:results.filter(x=>x.status==='SIN_PERFIL_VALIDADO').length,
 mounted:0,certified:0
};
await writeFile(OUTPUT,JSON.stringify({
 schema:'plegadox-remote-oem-audit-v1',generatedAt:now,
 notice:'Enlaces públicos de fabricante. SHA256 y cotas medidas del DXF. NO se incluye ni redistribuye CAD. Ni descarga ni coincidencia nominal certifican pieza o montaje.',
 metrics,records:results
},null,2)+'\n');
const summary=[
 '## PlegadoX · rastreo remoto CAD OEM',
 '',
 '| Enlaces | DXF leídos con cotas nominales sin certificar | Con discrepancias | No disponibles/no analizables | Montados verificados |',
 '|---:|---:|---:|---:|---:|',
 `| ${metrics.total} | ${metrics.read} | ${metrics.mismatched} | ${metrics.unavailable} | 0 |`,
 '',
 'Los perfiles no se copian al repositorio ni se marcan como CAD industrial verificado.',
 'Un perfil DXF leído pero con geometría compleja puede requerir tratamiento CAD manual.',
 ''
].join('\n');
if(process.env.GITHUB_STEP_SUMMARY)
 await appendFile(process.env.GITHUB_STEP_SUMMARY,summary);
console.log(summary);
