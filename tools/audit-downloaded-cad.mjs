import {readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {inflateRawSync} from 'node:zlib';
import {listDxfZipEntries,extractDxfFromZip} from '../cad-zip-reader.js';
import {parseToolDxf,inspectToolDxfLayers} from '../tool-dxf.js';
const manifest=JSON.parse(await readFile('cad-downloads/manifest.json','utf8')),report=[];
for(const item of manifest){
 if(item.status!=='downloaded')continue;
 const bytes=await readFile(item.path),hash=createHash('sha256').update(bytes).digest('hex');
 if(hash!==item.sha256)throw Error('Hash no coincide: '+item.id);
 const zipped=item.path.endsWith('.zip');
 const entries=zipped?await listDxfZipEntries(bytes):[{name:item.path.split('/').at(-1)}];
 const record={id:item.id,sha256:hash,physicalVerified:false,files:[]};
 for(const entry of entries){
  const file={name:entry.name};
  try{
   const text=zipped?(await extractDxfFromZip(bytes,{selectName:entry.name,inflate:raw=>new Uint8Array(inflateRawSync(raw))})).content:bytes.toString('utf8');
   try{const p=parseToolDxf(text);Object.assign(file,{status:'CONTOUR_PARSED',width:p.width,height:p.height,points:p.points.length});}
   catch(error){file.status='REQUIRES_CONTOUR_SELECTION';file.reason=error.message;
    file.layers=inspectToolDxfLayers(text).layers.map(x=>({name:x.name,entities:x.total}));}
  }catch(error){file.status='IMPORT_ERROR';file.reason=error.message;}
  record.files.push(file);
 }
 report.push(record);
}
await writeFile('cad-downloads/audit.json',JSON.stringify(report,null,2));
const files=report.flatMap(x=>x.files);console.log(JSON.stringify({archives:report.length,dxfFiles:files.length,statuses:files.reduce((r,x)=>(r[x.status]=(r[x.status]||0)+1,r),{})},null,2));
