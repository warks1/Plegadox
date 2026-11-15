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
  model:'100 T × 3100 mm · modelo sin identificar',
  title:'Bystronic 2006 · 100 t / 3100 mm · modelo pendiente',
  year:2006,tonnage:100,bendingLength:3100,
  betweenUprights:null,throat:null,openHeight:null,stroke:null,
  tableHeight:null,outer:null,
  provenience:'Año 2006, capacidad 100 t y longitud 3100 mm indicados por el propietario. No se ha confirmado la serie/modelo.',
  source:null,dimensionsVerified:'datos-del-propietario-sin-identificacion-de-modelo',
  clamping:'Fijaciones y agarres sin identificar; NO atribuirle las cotas PR100 ni EP II'
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
