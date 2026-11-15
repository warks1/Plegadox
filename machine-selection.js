/**
 * PlegadoX: catálogo de MÁQUINAS, independiente de los útiles.
 * Solo incluye las dimensiones documentadas. No deducir la geometría
 * de trancha, amarres, mesa y dedos a partir del tonelaje/longitud.
 */
export const MACHINE_SELECTION_KEY='plegadox:active-machine:v1';
export const MACHINE_PROFILES=Object.freeze({
 'trumpf-v85':Object.freeze({
  id:'trumpf-v85',manufacturer:'Trumpf',model:'TruBend V85',
  title:'Trumpf V85 · 85 t / 2040 mm',year:2006,
  tonnage:85,bendingLength:2040,betweenUprights:null,throat:null,
  openHeight:null,stroke:null,tableHeight:null,outer:null,
  provenience:'Fotografías Cybelec facilitadas por el propietario',
  source:null,dimensionsVerified:'fotografias-configuracion',
  clamping:'Datos de fijación CAD no aportados'
 }),
 'bystronic-2006-100-3100':Object.freeze({
  id:'bystronic-2006-100-3100',manufacturer:'Bystronic',
  model:'AFM EP 31-100 / EP100-31 · identificación fotográfica probable',
  title:'Bystronic AFM EP 31-100 · 2006 · identificación probable',
  year:2006,tonnage:100,bendingLength:3100,
  betweenUprights:null,throat:null,openHeight:null,stroke:200,
  tableHeight:null,outer:null,
  xRange:null,xTravel:null,rTravel:null,
  xSpeed:null,rSpeed:null,zSpeed:null,ramApproachSpeed:100,ramReturnSpeed:95,
  nominalMotorPower:null,nominalWeightTonnes:9,hydraulicOilLitres:null,
  frontSupportArmLength:null,hydraulicCrowning:true,
  crowningSystem:'Mesa con bombeo hidráulico · confirmado por propietario',
  upperClampingSystem:'WILA',upperClampingConfirmed:true,
  lowerDieSystem:'PROMECAM_CON_ADAPTADOR',
  lowerAdapter:'Regleta/base adaptadora de matrices tipo Promecam, sobre mesa con bombeo',
  lowerAdapterHeight:null,
  daylightMeasured:null,
  daylightReference:{min:400,max:515,
   context:'Rango orientativo citado por propietario para otras Bystronic PR/Xpert de 2006; NO medida ni especificación confirmada de esta AFM EP'},
  control:'Cybelec DNC 880/880S (otros ejemplares AFM EP; comprobar control instalado)',
  axis:'Y1/Y2/X/R (configuración común en AFM EP; verificar la unidad)',
  identificationConfidence:'probable-por-imagen-sin-placa',
  provenience:'Propietario: Bystronic de 2006, 100 t y 3100 mm. Su fotografía coincide en carcasa, tapas rojas y logotipo con unidades AFM EP 31-100/EP100-31. Referencias externas de 2006 y 2008: stroke 200 mm, peso aprox. 9000 kg. La placa y el control instalados NO son legibles en la fotografía. Las antiguas cotas de la PR100 son INAPLICABLES hasta verificar el modelo.',
  source:'https://www.sparxmachinetools.co.uk/products/bystronic-afm-ep-31-100-3m-x-100-ton-press-brake',
  additionalSource:'https://www.machinio.it/annunci/43398267-pressa-piegatrice-idraulica-bystronic-ep100-31-del-2006-in-bassano-del-grappa-italia',
  dimensionsVerified:'familia-afm-ep-referencia-no-validada-en-unidad',
  clamping:'Parte superior: cabezales WILA CONFIRMADOS; parte inferior: mesa con bombeo hidráulico y regleta adaptadora para matrices tipo PROMECAM CONFIRMADAS por propietario. Alturas de cabezal, proyección de punzón, base adaptadora y matrices sin medir; pendientes perfiles CAD/recorrido X/R.'
 }),
 'bystronic-pr100-3100':Object.freeze({
  id:'bystronic-pr100-3100',manufacturer:'Bystronic / Beyeler',
  model:'PR100/3100 · ficha histórica',
  title:'Bystronic Beyeler PR100 · 100 t / 3100 mm',
  year:null,tonnage:100,bendingLength:3100,betweenUprights:2750,
  throat:400,openHeight:500,stroke:215,tableHeight:null,
  outer:{length:4100,depth:2050,height:2600},
  xRange:1040,xTravel:590,rTravel:250,
  provenience:'Ficha técnica histórica Bystronic PR Beyeler; no acredita el número de serie de 2006',
  source:'https://www.politesi.polimi.it/bitstream/10589/7642/4/Data%20Sheet_Beyeler%20PR150_Bystronic.pdf',
  dimensionsVerified:'familia-modelo',
  clamping:'Geometría WILA/Beyeler y medidas de la fijación no identificadas en la máquina del propietario'
 }),
 'bystronic-ep2-31-100':Object.freeze({
  id:'bystronic-ep2-31-100',manufacturer:'Bystronic',
  model:'EP II 31-100 · anuncio de 2006',
  title:'Bystronic EP II 31-100 · 100 t / 3100 mm',
  year:2006,tonnage:100,bendingLength:3100,betweenUprights:2550,
  throat:400,openHeight:null,stroke:200,tableHeight:925,
  outer:{length:5200,depth:2100,height:2900},
  control:'Cybelec DNC 8805',axis:'X + R',
  provenience:'Ficha de una máquina usada anunciada como año 2006, sin verificación del número de serie',
  source:'https://www.kitmondo.com/es/bystronic-ep-ii-31-100-p250930038/',
  dimensionsVerified:'anuncio-tercero',
  clamping:'Tipos y cotas de los amarres montados: sin verificar'
 })
});
const allowed=Object.keys(MACHINE_PROFILES);
let current=null;
export function getActiveMachineId(){
 if(current)return current;
 let stored=null;
 try{if(typeof localStorage!=='undefined')stored=localStorage.getItem(MACHINE_SELECTION_KEY);}
 catch{}
 current=allowed.includes(stored)?stored:'trumpf-v85';
 return current;
}
export function getActiveMachineProfile(){return MACHINE_PROFILES[getActiveMachineId()];}
export function selectMachine(id){
 if(!allowed.includes(id))throw new Error('Modelo de máquina no conocido: '+String(id));
 current=id;
 try{if(typeof localStorage!=='undefined')localStorage.setItem(MACHINE_SELECTION_KEY,id);}catch{}
 if(typeof window!=='undefined')
  window.dispatchEvent(new CustomEvent('plegadox:machineChanged',{
   detail:{selectedMachine:id,profile:getActiveMachineProfile()}
  }));
 return getActiveMachineProfile();
}
export function machineOptions(){return Object.values(MACHINE_PROFILES);}
