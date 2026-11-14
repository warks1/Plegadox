/**
 * Inventario honesto CAD por referencia para PlegadoX.
 * Publicar una cota o dibujar una pata de cabra paramétrica NO equivale a
 * haber cargado su DXF. Tampoco implica compatibilidad del amarre V85.
 */
import {CATALOG_PUNCHES,CATALOG_DIES,CATALOG_SOURCES} from './catalog.js';
import {DIES,PUNCHES} from './engine.js';
import {MECOS_ED22_REFERENCES,MECOS_ED22_CATALOG_URL} from './catalog-mecos-ed22-index.js';
const hasOriginalCAD=t=>t?.importedDxf===true&&Array.isArray(t.profilePoints)&&t.profilePoints.length>=3;
export function auditToolCAD({punches=PUNCHES,dies=DIES}={}){
 const inspect=(catalog,loaded,kind)=>{
  const items=catalog.map(item=>{
   const local=loaded.find(x=>x.id===item.id);
   const originalCAD=hasOriginalCAD(local);
   return {kind,id:item.id,manufacturer:item.manufacturer||'Fabricante no indicado',
    reference:item.reference||item.name,angle:item.angle,
    ...(kind==='die'?{opening:item.opening}:{tip:item.tip}),
    catalogueDimensions:item.verifiedSpecs===true,
    geometry:originalCAD?'DXF_2D_IMPORTADO':'CONTORNO_CAD_FALTANTE',
    source:item.source||null,
    verifiedCollision:false};
  });
  return {kind,total:items.length,withContour:items.filter(i=>i.geometry==='DXF_2D_IMPORTADO').length,
   withoutContour:items.filter(i=>i.geometry==='CONTORNO_CAD_FALTANTE').length,items};
 };
 const p=inspect(CATALOG_PUNCHES,punches,'punch'),
  d=inspect(CATALOG_DIES,dies,'die');
 const imported=punches.filter(hasOriginalCAD).length+dies.filter(hasOriginalCAD).length;
 return {punches:p,dies:d,visibleDxfProfiles:imported,
  catalogTotal:p.total+d.total,
  catalogCADAvailable:p.withContour+d.withContour,
  catalogCADMissing:p.withoutContour+d.withoutContour,
  mecosIndex:{count:MECOS_ED22_REFERENCES.length,
   punches:MECOS_ED22_REFERENCES.filter(i=>i.kind==='punch').length,
   dies:MECOS_ED22_REFERENCES.filter(i=>i.kind==='die').length,
   items:MECOS_ED22_REFERENCES,url:MECOS_ED22_CATALOG_URL},
  sources:CATALOG_SOURCES,
  safety:'Las dimensiones catalogadas no acreditan perfiles CAD de fabricante ni montaje de útiles en la V85.',
  verified:false};
}
export function setupToolCADAudit(){
 if(typeof document==='undefined')return;
 const status=document.getElementById('toolCADAuditStatus');
 const details=document.getElementById('toolCADAuditItems');
 if(!status||!details)return;
 const refresh=()=>{
  const a=auditToolCAD();
  status.textContent=a.catalogTotal+' referencias de punzones/matrices en el catálogo actual; '+
   a.catalogCADMissing+' SIN contorno CAD original asociado y '+
   a.catalogCADAvailable+' con DXF 2D asociado. '+
   a.visibleDxfProfiles+' DXF de usuario registrados aparte. '+
   'Además: '+a.mecosIndex.count+' referencias adicionales del índice MECOS/TECNOSTAMP ED22 '+
   'con ángulo y página, SOLO DOCUMENTALES, todavía sin geometría CAD. '+
   'Las siluetas paramétricas NO se cuentan como CAD real.';
  details.replaceChildren();
  for(const group of [a.punches,a.dies]){
   const heading=document.createElement('h3');
   heading.textContent=group.kind==='punch'?'Punzones':'Matrices';
   details.append(heading);
   const list=document.createElement('ul');
   for(const item of group.items){
    const li=document.createElement('li');
    li.textContent=item.manufacturer+' · '+item.reference+' · '+
     (item.catalogueDimensions?'cotas publicadas':'cotas sin acreditar')+
     ' · '+(item.geometry==='CONTORNO_CAD_FALTANTE'?
      'CAD pendiente':'DXF de contorno asociado · montaje por verificar');
    list.append(li);
   }
   details.append(list);
  }
  const h=document.createElement('h3');
  h.textContent='MECOS / TECNOSTAMP ED22 · referencias documentales adicionales';
  details.append(h);
  const info=document.createElement('p');
  info.textContent=a.mecosIndex.punches+' referencias de punzón y '+
   a.mecosIndex.dies+' referencias de matriz. Ángulo/página proceden del índice ED22; '+
   'NO son útiles seleccionables ni CAD de fabricante.';
  details.append(info);
  const link=document.createElement('a');
  link.href=a.mecosIndex.url;link.target='_blank';link.rel='noopener noreferrer';
  link.textContent='Consultar catálogo técnico MECOS ED22 original (PDF)';
  details.append(link);
  const listings=document.createElement('ul');
  for(const item of a.mecosIndex.items){
   const li=document.createElement('li');
   li.textContent=(item.kind==='punch'?'Punzón':'Matriz')+' '+item.style+
    ' · código '+item.reference+' · '+item.angle+'° · página '+item.page+
    ' · SIN CONTORNO CAD ORIGINAL · no seleccionable';
   listings.append(li);
  }
  details.append(listings);
 };
 refresh();
 window.addEventListener('plegadox:pieceChanged',refresh);
 window.addEventListener('plegadox:toolCADChanged',refresh);
 return refresh;
}
