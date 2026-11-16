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
import {extractDxfFromZip,listDxfZipEntries} from '../cad-zip-reader.js';
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
  const entries=zipped?await listDxfZipEntries(file):
   [{name:new URL(item.cadUrl).pathname.split('/').at(-1)}];
  record.archiveDxfEntries=entries.length;
  record.variants=[];
  // Ni siquiera en CI se mezclan distintas secciones o segmentos Z:
  // examinar individualmente cada fichero y NO escoger uno arbitrario.
  for(const entry of entries.slice(0,60)){
   const variant={name:entry.name,status:'SIN_ANALIZAR'};
   try{
    const content=zipped?
     (await extractDxfFromZip(file,{selectName:entry.name,
      inflate:raw=>new Uint8Array(inflateRawSync(raw))})).content:
     new TextDecoder('utf-8',{fatal:true}).decode(file);
    const parsed=parseToolDxf(content);
    const review=measured(item,parsed);
    variant.status=review.canRegister?
     'DXF_LEIDO_COTAS_NOMINALES_COINCIDENTES':
     'DXF_LEIDO_DISCREPANCIA_COTAS';
    variant.points=parsed.points.length;variant.widthMm=parsed.width;
    variant.heightMm=parsed.height;variant.unitsAssumed=parsed.unitsAssumed;
    variant.conflicts=review.conflicts;
    variant.missing=review.missing;
   }catch(error){
    variant.status='DXF_NO_PARSABLE';
    variant.problem=String(error?.message||error).slice(0,180);
   }
   record.variants.push(variant);
  }
  const good=record.variants.filter(x=>
   x.status==='DXF_LEIDO_COTAS_NOMINALES_COINCIDENTES');
  const differs=record.variants.filter(x=>
   x.status==='DXF_LEIDO_DISCREPANCIA_COTAS');
  record.status=entries.length>1?
   good.length?'ZIP_VARIANTES_LEIDAS_REQUIEREN_ELECCION':
    'ZIP_MULTIPLE_DXF_SIN_PERFIL_IDENTIFICADO':
   good.length?'PERFIL_DXF_LEIDO_COTAS_NOMINALES_NO_CERTIFICADO':
   differs.length?'DXF_LEIDO_DISCREPANCIA_COTAS':
   'SIN_PERFIL_VALIDADO';
  record.parsedVariants=good.length+differs.length;
  record.nominalCandidates=good.length;
  record.conflictingVariants=differs.length;
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
  const sample=(results[i].variants||[]).slice(0,3).map(v=>
   v.name+' '+v.status+
   (v.problem?' ('+v.problem+')':'')+
   (v.heightMm!=null?' H='+v.heightMm+'mm':'')+
   (v.conflicts?.length?' conflictos='+
    v.conflicts.map(x=>x.field+':'+x.actual+'/'+x.expected).join(','):'')
  ).join(' | ');
  process.stdout.write(results[i].id+' '+results[i].status+
   (results[i].problem?' ('+results[i].problem+')':'')+
   (sample?' :: '+sample:'')+'\n');
 }
}));
const metrics={
 total:results.length,
 read:results.filter(x=>x.status==='PERFIL_DXF_LEIDO_COTAS_NOMINALES_NO_CERTIFICADO').length,
 multiWithCandidates:results.filter(x=>x.status==='ZIP_VARIANTES_LEIDAS_REQUIEREN_ELECCION').length,
 nominalCandidates:results.reduce((n,x)=>n+(x.nominalCandidates||0),0),
 mismatched:results.filter(x=>x.status==='DXF_LEIDO_DISCREPANCIA_COTAS').length,
 unavailable:results.filter(x=>!x.nominalCandidates).length,
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
 '| Enlaces | ZIP con variantes evaluadas | Perfiles nominales candidatos | No verificados | Montados verificados |',
 '|---:|---:|---:|---:|---:|',
 `| ${metrics.total} | ${metrics.multiWithCandidates} | ${metrics.nominalCandidates} | ${metrics.unavailable} | 0 |`,
 '',
 'Los perfiles no se copian al repositorio ni se marcan como CAD industrial verificado.',
 'Un perfil DXF leído pero con geometría compleja puede requerir tratamiento CAD manual.',
 ''
].join('\n');
if(process.env.GITHUB_STEP_SUMMARY)
 await appendFile(process.env.GITHUB_STEP_SUMMARY,summary);
console.log(summary);
