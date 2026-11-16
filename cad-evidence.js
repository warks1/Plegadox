/**
 * PlegadoX · auditoría de procedencia CAD R109.
 *
 * Un enlace del fabricante a DXF NO equivale al archivo descargado,
 * parseado, registrado en máquina o certificado. Los modelos de
 * fabricantes distintos sólo son EQUIVALENCIAS COMERCIALES y NO aportan
 * cotas que puedan soldarse a otra herramienta sin identidad exacta.
 *
 * Fecha de consulta de fuentes: 2026-11-16.
 */
export const CAD_REQUIREMENTS=Object.freeze({
 'trumpf-v85':[
  'ram','bed','stop','support','upperClamp','lowerClamp',
  'upperAdapter','lowerAdapter','frontSupport','punch','die',
  'axesXYZ','mountDatums'
 ],
 'bystronic-2006-100-3100':[
  'ram','bed','stop','support','upperClamp','lowerClamp',
  'upperAdapter','lowerAdapter','frontSupport','punch','die',
  'axesXYZ','mountDatums'
 ]
});
const freezeEntry=x=>Object.freeze({...x,
 dimensions:Object.freeze({...x.dimensions})});
export const CAD_EVIDENCE_SOURCES=Object.freeze([
 freezeEntry({
  id:'eurostamp-1015',kind:'punch',maker:'EUROSTAMP',reference:'1015',
  variant:'88deg',mount:'Amada/Promecam',datum:'OEM_REFERENCE_UNCONFIRMED',
  title:'Pata de cabra 1015 · 88°',
  sourceUrl:'https://eurostampsrl.it/en/10556/punches-88/1015-punch-88',
  cadUrl:'https://eurostampsrl.it/dxf/1015.dxf',format:'DXF',
  access:'PUBLIC_DIRECT_DXF',status:'ENLACE_CONFIRMADO_NO_IMPORTADO',
  dimensions:{heightMm:88.5,angleDeg:88,tipRadiusMm:3,maxTonnesPerMetre:60},
  note:'Altura nominal 88,5. Posición/contorno del amarre requiere cotejo.'
 }),
 freezeEntry({
  id:'eurostamp-1322',kind:'punch',maker:'EUROSTAMP',reference:'1322',
  variant:'85deg',mount:'MONTAJE_PENDIENTE',datum:'OEM_REFERENCE_UNCONFIRMED',
  title:'Pata de cabra 1322 · 85°',
  sourceUrl:'https://eurostampsrl.it/en/10651/punches-85/1322-punches-85',
  cadUrl:'https://eurostampsrl.it/dxf/1322.dxf',format:'DXF',
  access:'PUBLIC_DIRECT_DXF',status:'ENLACE_CONFIRMADO_NO_IMPORTADO',
  dimensions:{heightMm:120,angleDeg:85,tipRadiusMm:1.5,maxTonnesPerMetre:100},
  note:'No asumir que el amarre coincide con el 1015.'
 }),
 freezeEntry({
  id:'eurostamp-3041',kind:'die',maker:'EUROSTAMP',reference:'3041',
  variant:'30deg-V8',mount:'Amada/Promecam',datum:'OEM_REFERENCE_UNCONFIRMED',
  title:'Matriz de aplastado 3041 · V8/30°',
  sourceUrl:'https://eurostampsrl.it/en/13588/amadapromecam-dies/3041-flattening-hemming-tools-30',
  cadUrl:'https://eurostampsrl.it/dxf/3041.dxf',format:'DXF',
  access:'PUBLIC_DIRECT_DXF',status:'ENLACE_CONFIRMADO_NO_IMPORTADO',
  dimensions:{heightMm:105,angleDeg:30,vOpeningMm:8,maxTonnesPerMetre:80},
  note:'Matriz de aplastado; geometría/no 1-V convencional por defecto.'
 }),
 freezeEntry({
  id:'ukb-22316',kind:'die',maker:'UKB',reference:'22.316',
  variant:'30deg-V16-H60',mount:'Amada/Promecam',datum:'OEM_REFERENCE_UNCONFIRMED',
  title:'Matriz UKB 22.316 · V16/30° H60',
  sourceUrl:'https://www.ukb-gmbh.de/en/22316.html',
  cadUrl:'https://daten.ukb-gmbh.de/dxf/zip/22316.DXF.zip',format:'DXF_ZIP',
  access:'PUBLIC_DIRECT_ZIP',status:'ENLACE_CONFIRMADO_NO_IMPORTADO',
  dimensions:{heightMm:60,angleDeg:30,vOpeningMm:16,shoulderRadiusMm:2,maxLoadKNPerMetre:450},
  note:'Requiere portamatriz 22.010 de UKB o montaje equivalente acreditado.'
 }),
 freezeEntry({
  id:'ukb-26221',kind:'die',maker:'UKB',reference:'26.221',
  variant:'78deg-V60-H90',mount:'LVD',datum:'OEM_REFERENCE_UNCONFIRMED',
  title:'Matriz UKB 26.221 · V60/78° H90',
  sourceUrl:'https://www.ukb-gmbh.de/en/26221.html',
  cadUrl:'https://daten.ukb-gmbh.de/dxf/zip/26221.DXF.zip',format:'DXF_ZIP',
  access:'PUBLIC_DIRECT_ZIP',status:'ENLACE_CONFIRMADO_NO_IMPORTADO',
  dimensions:{heightMm:90,angleDeg:78,vOpeningMm:60,shoulderRadiusMm:5,maxLoadKNPerMetre:2000},
  note:'Amarre LVD, NO sustituir por una matriz Promecam.'
 }),
 freezeEntry({
  id:'mate-bts-010153',kind:'punch',maker:'MATE',reference:'010.153',
  variant:'BTS-88deg',mount:'BTS_SISTEMA_POR_VERIFICAR',
  datum:'OEM_REFERENCE_UNCONFIRMED',
  title:'Punzón Mate 010.153 · 88°',
  sourceUrl:'https://www.mate.com/technical-resources/press-brake-tooling/press-brake-files/bts-punches/',
  cadUrl:'https://www.mate.com/downloads/PBT_DXF/BTS/010.153FA.dxf',
  format:'DXF',access:'PUBLIC_DIRECT_DXF',
  status:'ENLACE_CONFIRMADO_NO_IMPORTADO',
  dimensions:{angleDeg:88,tipRadiusMm:.25,heightMm:66.5},
  note:'La tabla Mate lo cruza con Amada 60.402 (R0,20/H66,90): son referencias EQUIVALENTES, NO idénticas. Verificar contorno DXF y datum.'
 }),
 freezeEntry({
  id:'soclam-2012-88',kind:'die',maker:'SOCLAM',
  reference:'2012_88',variant:'88deg-DOBLE-V6-V10',
  mount:'Amada/Promecam',datum:'OEM_REFERENCE_UNCONFIRMED',
  title:'SOCLAM 20.12 · matriz reversible V6/V10/88°',
  sourceUrl:'https://www.soclam.com/produit/matrice-amada-a-2-ves-a-88/',
  cadUrl:'https://www.soclam.com/wp-content/uploads/2026/05/2012_88.dxf',
  format:'DXF',access:'OEM_PRODUCT_PAGE_WITH_DXF',
  status:'ENLACE_FABRICANTE_NO_IMPORTADO',
  dimensions:{heightMm:26,bodyWidthMm:55,angleDeg:88,vOpeningMm:6},
  note:'Matriz reversible V6/V10. Necesita soporte SOCLAM 40.06 o 40.07; el DXF del perfil no define el soporte ni el montaje real.'
 }),
 freezeEntry({
  id:'soclam-2015-88',kind:'die',maker:'SOCLAM',
  reference:'2015_88',variant:'88deg-DOBLE-V16-V25',
  mount:'Amada/Promecam',datum:'OEM_REFERENCE_UNCONFIRMED',
  title:'SOCLAM 20.15 · matriz reversible V16/V25/88°',
  sourceUrl:'https://www.soclam.com/produit/matrice-amada-a-2-ves-a-88/',
  cadUrl:'https://www.soclam.com/wp-content/uploads/2026/05/2015_88.dxf',
  format:'DXF',access:'OEM_PRODUCT_PAGE_WITH_DXF',
  status:'ENLACE_FABRICANTE_NO_IMPORTADO',
  dimensions:{heightMm:26,bodyWidthMm:55,angleDeg:88,vOpeningMm:16},
  note:'Se puede orientar para V16 o V25, no equivale a una monovía. Requiere soporte 40.06/40.07 y eje/amarre verificado.'
 }),

 freezeEntry({
  id:'ukb-22010',kind:'lowerAdapter',maker:'UKB',reference:'22.010',
  variant:'PORTAMATRIZ-1V-AMADA',mount:'Amada/Promecam',
  datum:'OEM_REFERENCE_UNCONFIRMED',
  title:'UKB 22.010 · portamatriz para una V',
  sourceUrl:'https://www.ukb-gmbh.de/en/22010.html',
  cadUrl:'https://daten.ukb-gmbh.de/dxf/zip/22010.DXF.zip',
  format:'DXF_ZIP',access:'PUBLIC_DIRECT_ZIP',
  status:'ENLACE_CONFIRMADO_NO_IMPORTADO',
  dimensions:{heightMm:51.5,bodyWidthMm:60,maxLoadKNPerMetre:1000},
  note:'Portamatriz que requiere montaje Amada. Incluye apriete; no sustituye al soporte SOCLAM 40.06/40.07.'
 }),
 freezeEntry({
  id:'ukb-50430',kind:'upperAdapter',maker:'UKB',reference:'50.430',
  variant:'AMADA-A-TRUMPF-WILA-LVD-1',mount:'ADAPTADOR_AMADA_A_TRUMPF_WILA_LVD_TIPO_I',
  datum:'OEM_REFERENCE_UNCONFIRMED',
  title:'UKB 50.430 · adaptador superior Amada a Trumpf/WILA/LVD I',
  sourceUrl:'https://www.ukb-gmbh.de/en/50430.html',
  cadUrl:'https://daten.ukb-gmbh.de/dxf/zip/50430.DXF.zip',
  format:'DXF_ZIP',access:'PUBLIC_DIRECT_ZIP',
  status:'ENLACE_CONFIRMADO_NO_IMPORTADO',
  dimensions:{heightMm:67,maxLoadKNPerMetre:1000},
  note:'La dirección de conversión del amarre importa. No asumir que encaja en la V85 ni en los cabezales WILA Bystronic.'
 }),
 freezeEntry({
  id:'ukb-22308',kind:'die',maker:'UKB',reference:'22.308',
  variant:'30deg-V8-H60',mount:'Amada/Promecam',
  datum:'OEM_REFERENCE_UNCONFIRMED',
  title:'UKB 22.308 · matriz V8/30° H60',
  sourceUrl:'https://www.ukb-gmbh.de/en/22308.html',
  cadUrl:'https://daten.ukb-gmbh.de/dxf/zip/22308.DXF.zip',
  format:'DXF_ZIP',access:'PUBLIC_DIRECT_ZIP',
  status:'ENLACE_CONFIRMADO_NO_IMPORTADO',
  dimensions:{heightMm:60,angleDeg:30,vOpeningMm:8,
   shoulderRadiusMm:.8,maxLoadKNPerMetre:350},
  note:'Necesita portamatriz 22.010 y orientación correcta; no equivale a las matrices V8/30 de otro sistema.'
 }),
 freezeEntry({
  id:'soclam-4006-34',kind:'lowerAdapter',maker:'SOCLAM',
  reference:'40.06/34',variant:'H34-PORTAMATRIZ-DOBLE-V',
  mount:'Amada/Promecam',datum:'OEM_REFERENCE_UNCONFIRMED',
  title:'SOCLAM 40.06/34 · soporte de matrices reversibles',
  sourceUrl:'https://www.soclam.com/produit/support-matrice-amada-ref-40-06/',
  cadUrl:null,format:'DXF_EN_FICHA',access:'OEM_PRODUCT_PAGE_WITH_DXF',
  status:'FICHA_DXF_REQUIERE_DESCARGA_MANUAL',
  dimensions:{heightMm:34,maxTonnesPerMetre:100},
  note:'Familia 40.06/40.07 con alturas 34, 39, 55, 75 mm. Esta entrada se limita a 40.06/34; no combinar alturas de otras variantes.'
 }),
 freezeEntry({
  id:'wila-tsu-024',kind:'upperAdapter',maker:'WILA',reference:'TSU-024',
  variant:'NEW-STANDARD-A-EUROPEAN-STYLE-I',
  mount:'WILA_NEW_STANDARD',datum:'OEM_REFERENCE_UNCONFIRMED',
  title:'WILA TSU-024 · adaptador New Standard a europeo I',
  sourceUrl:'https://www.wilatooling.com/products/press-brake-tooling/tooling-options/tool-extenders-and-adapters/tsu-024/',
  cadUrl:null,format:'DXF_CON_REGISTRO',access:'MYWILA_O_EMAIL',
  status:'DXF_DISPONIBLE_REQUIERE_SOLICITUD',
  dimensions:{heightMm:73,bodyWidthMm:49.5,maxTonnesPerMetre:100},
  note:'Plano DXF de WILA disponible mediante correo o MyWILA. Se suministra con TK-031; comprobar todas las fijaciones reales.'
 }),
 freezeEntry({
  id:'soclam-bystronic-m16-30',kind:'die',maker:'SOCLAM',
  reference:'M16/30°',variant:'BYSTRONIC_BEYELER',
  mount:'Bystronic/Beyeler R',datum:'CATALOGUE_UNSPECIFIED',
  title:'SOCLAM matriz tipo Bystronic/Beyeler V16/30°',
  sourceUrl:'https://soclaform.fr/wp-content/uploads/2017/12/2017-SOCLAM-BYSTRONIC-BEYELER.pdf',
  cadUrl:null,format:'PDF_ACOTADO',access:'PUBLIC_CATALOGUE',
  status:'COTAS_PARCIALES_SIN_DXF',
  dimensions:{angleDeg:30,vOpeningMm:16,shoulderRadiusMm:2,heightMm:55},
  note:'SOCLAM catálogo 2017, página impresa 42. No confundir perfil Beyeler con Promecam.'
 }),
 freezeEntry({
  id:'trumpf-v85-family',kind:'machine',maker:'TRUMPF',
  reference:'TrumaBend V85',variant:'V85_SERIE_HISTORICA',
  mount:'MONTAJE_PENDIENTE',datum:'FAMILY_ONLY',
  title:'TrumaBend V85 · dimensiones históricas de la familia',
  sourceUrl:'https://www.mteg-maschinen.de/fileadmin/mteg_Upload/03_TRUMPF_Prospekte_mteg/TrumaBend-V-Series_TRUMPF_Brochure.pdf',
  cadUrl:null,format:'CATALOGO_TECNICO',access:'PUBLIC_CATALOGUE',
  status:'FICHA_FAMILIA_SIN_CAD_DE_UNIDAD',
  dimensions:{nominalBendingLengthMm:2050,nominalTonnageKN:850,
   nominalBedWidthMm:120,nominalThroatMm:410,strokeStandardMm:215,
   strokeExtendedOptionalMm:365,openStandardMm:385,openExtendedOptionalMm:535,
   travelXMm:600,travelRMm:250},
  note:'V85 histórica con 2050 nominal; la unidad PlegadoX está declarada 2040. No sobreescribir datos del control ni deducir versión de carrera.'
 }),
 freezeEntry({
  id:'bystronic-bysoft-model-library',kind:'machine',maker:'BYSTRONIC',
  reference:'BySoft CAM System Data',variant:'VERSION_CON_LICENCIA',
  mount:'SIN_MONTAJE_VERIFICADO',datum:'NO_MACHINE_UNIT_DATUM',
  title:'Bystronic BySoft CAM · modelos internos de máquina, tope y utillaje',
  sourceUrl:'https://bystronic-mediacenter.picturepark.com/v/uSPrfoiG/',
  cadUrl:null,format:'MODELOS_3D_EN_SISTEMA',
  access:'DATOS_LOCALES_SOFTWARE_CON_LICENCIA',
  status:'MODELOS_NO_EXPORTADOS',
  dimensions:{},
  note:'La documentación enumera BackStopModels, BendingMachineConfigs, BendingMachines, UpperTools, LowerTools y VrModels 3D. No hay archivos de la unidad del propietario descargados aquí; solicitar exportación autorizada del software instalado.'
 }),
 freezeEntry({
  id:'bystronic-afm-ep31-100-family',kind:'machine',maker:'BYSTRONIC',
  reference:'AFM EP 31-100',variant:'AFM_EP_FAMILIA_2007',
  mount:'MONTAJE_PENDIENTE',datum:'FAMILY_ONLY',
  title:'Bystronic AFM EP 31-100 · ficha modelo de ocasión 2007',
  sourceUrl:'https://zebramachinery.com/product/bystronic-ep-31-100/',
  cadUrl:null,format:'FICHA_MODELO',access:'PUBLIC_PRODUCT_PAGE',
  status:'FICHA_FAMILIA_SIN_CAD_DE_UNIDAD',
  dimensions:{nominalBendingLengthMm:3100,nominalTonnageKN:1000,
   strokeStandardMm:200},
  note:'Vinculación a la máquina del usuario todavía provisional; no copiar cotas de Xpert 100.'
 })
]);

const ID=s=>String(s??'').normalize('NFKC').trim().toUpperCase().replace(/\s+/g,'');
const components=['kind','maker','reference','variant','mount'];
const numericKeys=new Set([
 'heightMm','bodyWidthMm','angleDeg','tipRadiusMm','shoulderRadiusMm','vOpeningMm',
 'maxTonnesPerMetre','maxLoadKNPerMetre','nominalBendingLengthMm',
 'nominalTonnageKN','nominalBedWidthMm','nominalThroatMm',
 'strokeStandardMm','strokeExtendedOptionalMm','openStandardMm',
 'openExtendedOptionalMm','travelXMm','travelRMm'
]);
const componentKeys=new Set(['heightMm','bodyWidthMm',
 'maxTonnesPerMetre','maxLoadKNPerMetre']);
const allowedByKind={
 lowerAdapter:componentKeys,upperAdapter:componentKeys,
 upperClamp:componentKeys,lowerClamp:componentKeys,
 frontSupport:componentKeys,
 punch:new Set(['heightMm','bodyWidthMm','angleDeg','tipRadiusMm',
  'maxTonnesPerMetre','maxLoadKNPerMetre']),
 die:new Set(['heightMm','bodyWidthMm','angleDeg','shoulderRadiusMm',
  'vOpeningMm','maxTonnesPerMetre','maxLoadKNPerMetre']),
 machine:new Set(['nominalBendingLengthMm','nominalTonnageKN',
  'nominalBedWidthMm','nominalThroatMm','strokeStandardMm',
  'strokeExtendedOptionalMm','openStandardMm','openExtendedOptionalMm',
  'travelXMm','travelRMm'])
};
/** Metadatos complementarios sin inventar un CONTORNO.
 * Sólo se unen cotas de EXACTAMENTE el mismo fabricante, referencia,
 * variante, sistema de amarre y clase de componente.
 * Valores incompatibles generan CONFLICTO, nunca se promedian.
 */
export function reconcileCadDimensions(entries,{toleranceMm=.05,required=[]}={}){
 if(!Array.isArray(entries)||!entries.length)
  throw Error('Hace falta una fuente CAD acotada');
 if(!Number.isFinite(toleranceMm)||toleranceMm<0||toleranceMm>1)
  throw Error('Tolerancia de comparación inválida');
 const first=entries[0],dims={},evidence={},conflicts=[];
 for(const source of entries){
  if(!source||typeof source!=='object'||!source.sourceUrl)
   throw Error('Falta procedencia del dato CAD');
  for(const key of components)
   if(ID(source[key])!==ID(first[key]))
    throw Error('No se pueden mezclar referencias, variantes o amarres distintos: '+key);
  for(const [key,val] of Object.entries(source.dimensions||{})){
   if(!numericKeys.has(key)||!allowedByKind[source.kind]?.has(key)||
    !Number.isFinite(val)||val<0)
    throw Error('Cota no válida o unidad desconocida: '+key);
   if(!(key in dims)){dims[key]=val;evidence[key]=[source.id||source.sourceUrl];}
   else if(Math.abs(dims[key]-val)>toleranceMm){
    if(!conflicts.some(x=>x.field===key))
     conflicts.push({field:key,a:dims[key],b:val,
      sources:[...evidence[key],source.id||source.sourceUrl]});
   }else evidence[key].push(source.id||source.sourceUrl);
  }
 }
 // Una contradicción no habilita una cota "promediada" peligrosa.
 for(const c of conflicts){delete dims[c.field];delete evidence[c.field];}
 const minimum=required.length?required:first.kind==='punch'?
  ['heightMm','angleDeg','tipRadiusMm']:
  first.kind==='die'?
   ['heightMm','angleDeg','vOpeningMm']:
   first.kind==='machine'?
    ['nominalBendingLengthMm','nominalTonnageKN','strokeStandardMm']:
   componentKeys===allowedByKind[first.kind]?['heightMm','bodyWidthMm']:[];
 const missing=minimum.filter(key=>!Object.prototype.hasOwnProperty.call(dims,key));
 const sameDatum=entries.every(x=>x.datum===first.datum&&
  x.datum&&x.datum!=='OEM_REFERENCE_UNCONFIRMED'&&
  x.datum!=='CATALOGUE_UNSPECIFIED'&&x.datum!=='FAMILY_ONLY');
 return {identity:Object.fromEntries(components.map(k=>[k,first[k]])),
  dimensions:dims,evidence,conflicts,missing,
  geometryMergeAllowed:sameDatum&&conflicts.length===0,
  status:conflicts.length?'COTAS_CONTRADICTORIAS':
   missing.length?'COTAS_PARCIALES':
   'COTAS_RECOPILADAS_NO_CERTIFICADAS',
  cadImported:false,verified:false,canApproveForMachine:false};
}
export function cadSourceFor(kind,maker,reference){
 return CAD_EVIDENCE_SOURCES.filter(item=>
  ID(item.kind)===ID(kind)&&ID(item.maker)===ID(maker)&&
  ID(item.reference)===ID(reference));
}
export function cadCoverage(machineId,imports={}){
 const required=CAD_REQUIREMENTS[machineId];
 if(!required)throw Error('Plegadora sin inventario CAD disponible');
 const local=imports&&typeof imports==='object'?imports:{};
 const statuses=required.map(kind=>({kind,
  imported:!!local[kind]?.points?.length,
  verified:false,status:local[kind]?.points?.length?
   'CONTORNO_IMPORTADO_MONTAJE_NO_VERIFICADO':'CAD_PENDIENTE'}));
 return {machineId,requiredCount:statuses.length,
  importedCount:statuses.filter(x=>x.imported).length,
  missing:statuses.filter(x=>!x.imported).map(x=>x.kind),
  statuses,verified:false,canApproveForMachine:false};
}
