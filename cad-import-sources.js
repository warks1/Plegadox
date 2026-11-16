/**
 * PlegadoX R114 · dar acceso desde la interfaz a las fichas CAD rastreadas.
 * Una ficha con URL OEM NO implica que el archivo se haya importado,
 * ni acredita el amarre o el segmento Z usado en el taller.
 */
import {CATALOG_PUNCHES,CATALOG_DIES} from './catalog.js';
import {CAD_EVIDENCE_SOURCES} from './cad-evidence.js';
const known=(n)=>typeof n==='number'&&Number.isFinite(n)?n:null;
const str=x=>String(x||'').trim();
export function suggestedMountFamily(mount){
 const source=str(mount).toUpperCase();
 // Los montajes "TRUMPF/WILA/BYSTRONIC" son familias comerciales,
 // NUNCA una mordaza verificada de la unidad concreta.
 const exact={
  'WILA':'WILA','AMADA/PROMECAM':'Amada/Promecam',
  'TRUMPF':'TRUMPF','BYSTRONIC/BEYELER R':'Bystronic/Beyeler R'
 };
 return exact[source]||'Desconocido';
}
export function listCadImportSources({
 punches=CATALOG_PUNCHES,dies=CATALOG_DIES,
 evidence=CAD_EVIDENCE_SOURCES
}={}){
 const records=[],urls=new Set(),ids=new Set();
 const add=(tool,kind,origin)=>{
  const url=str(tool.cadDownloadUrl).toLowerCase();
  const identity=[kind,str(tool.manufacturer).toLowerCase(),
   str(tool.reference).toLowerCase()].join('|');
  if((url&&urls.has(url))||ids.has(identity))return;
  if(url)urls.add(url);
  ids.add(identity);
  records.push({tool,kind,origin});
 };
 for(const item of punches)
  if(item.cadSourceUrl)add(item,'punch','catalogo');
 for(const item of dies)
  if(item.cadSourceUrl)add(item,'die','catalogo');
 for(const item of evidence){
  if(!['punch','die'].includes(item.kind)||!item.cadUrl||
   !/^https:\/\//.test(str(item.sourceUrl))||
   !/^https:\/\//.test(str(item.cadUrl)))continue;
  const d=item.dimensions||{};
  const tool={
   id:'cad-evidence-'+str(item.id),
   manufacturer:str(item.maker),
   reference:str(item.reference),
   name:str(item.title)||str(item.reference),
   mount:str(item.mount),
   angle:known(d.angleDeg),
   height:known(d.heightMm),
   opening:item.kind==='die'?known(d.vOpeningMm):null,
   tip:item.kind==='punch'&&known(d.tipRadiusMm)!==null?
    2*d.tipRadiusMm:null,
   // Sin cota longitudinal del SEGMENTO exacto no completar con 415 mm.
   length:null,
   cadSourceUrl:item.sourceUrl,cadDownloadUrl:item.cadUrl,
   cadStatus:'ENLACE_NO_IMPORTADO',profileAccuracy:'provisional',
   verifiedSpecs:false
  };
  add(tool,item.kind,'ficha-OEM-pendiente-archivo');
 }
 return records;
}
