/**
 * PLEGADOX / Trumpf V85 + Cybelec
 *
 * Parámetros transcritos de las tres fotografías del control Cybelec enviadas
 * por el usuario el 30-10-2026. Todas las dimensiones son milímetros.
 *
 * Los contornos 2D de este módulo son ESQUEMAS PARAMÉTRICOS. Las fotos
 * ofrecen valores L1... pero NO las coordenadas CAD completas de la mesa,
 * amarre ni topes; no usar estos perfiles para validar una colisión.
 */
import {MACHINE} from './engine.js';

export const V85_FACTORY=Object.freeze({
 name:'Trumpf V85 · Cybelec',tonnage:85,
 ramOrigin:0,holderOrigin:0,ramWidth:2040,holderWidth:2040,
 ram:[1340,28,2,25.4,20,30,125,20,39,28],
 bed:[820,80,25.25,25.25,50,20,20],
 toolWorkingDistance:30,
 stop:[70,100,18,25,12,0],
 support:[70,100,8,25,12,8],
 stopL6Max:0,stopL6Min:0,supportL6Max:0,supportL6Min:0,
 stopOx:0,stopOz:0,supportOx:0,supportOz:0,
 preferredDistance:80
});
export const V85_STORAGE_KEY='plegadox:trumpf-v85:v1';

const numeric=(v,otherwise,min,max)=>{
 const n=Number(v);
 return v==null||v===''||!Number.isFinite(n)?otherwise:Math.min(max,Math.max(min,n));
};
const arr=(input,def,max)=>{
 const source=Array.isArray(input)?input:[];
 return def.map((v,i)=>numeric(source[i],v,0,max));
};
export function normalizeV85(input={}){
 const d=V85_FACTORY;
 const result={
  name:d.name,tonnage:d.tonnage,
  ramOrigin:numeric(input.ramOrigin,d.ramOrigin,-2000,2000),
  holderOrigin:numeric(input.holderOrigin,d.holderOrigin,-2000,2000),
  ramWidth:numeric(input.ramWidth,d.ramWidth,100,10000),
  holderWidth:numeric(input.holderWidth,d.holderWidth,100,10000),
  ram:arr(input.ram,d.ram,3000),
  bed:arr(input.bed,d.bed,3000),
  toolWorkingDistance:numeric(input.toolWorkingDistance,d.toolWorkingDistance,0,500),
  stop:arr(input.stop,d.stop,1000),
  support:arr(input.support,d.support,1000),
  preferredDistance:numeric(input.preferredDistance,d.preferredDistance,0,100)
 };
 for(const key of ['stopL6Max','stopL6Min','supportL6Max','supportL6Min',
  'stopOx','stopOz','supportOx','supportOz'])
  result[key]=numeric(input[key],d[key],-1000,1000);
 return result;
}
let cached=null;
export function getV85(){
 if(cached)return cached;
 let stored;
 try{stored=JSON.parse(localStorage.getItem(V85_STORAGE_KEY)||'null');}catch{}
 cached=normalizeV85(stored||V85_FACTORY);
 return cached;
}
export function updateV85(input){
 cached=normalizeV85(input);
 try{localStorage.setItem(V85_STORAGE_KEY,JSON.stringify(cached));}catch{}
 if(typeof window!=='undefined')
  window.dispatchEvent(new CustomEvent('plegadox:machineChanged',{detail:cached}));
 return cached;
}
export function resetV85(){return updateV85(V85_FACTORY);}
/**
 * Coordinate contour for a schematic backgauge stop/support.
 * Top edge (Y=0) and L1/L2 lengths are measured along X. L3/L4 determine
 * two levels; L5 and L6 locate a small notch. This is NOT the exact factory
 * contour or a collision geometry.
 */
export function gaugeOutline(values){
 const [l1,l2,l3,l4,l5,l6]=values;
 const outer=Math.max(l1,l2,1),height=Math.max(l3,l4,1);
 const shoulder=Math.max(1,l1);
 const level=Math.max(1,Math.min(height,l3));
 const notch=Math.max(0,Math.min(level,l5));
 const tail=Math.max(0,Math.min(outer,l6));
 return [
  {x:0,y:0},{x:shoulder,y:0},
  {x:shoulder,y:-Math.max(1,height-level)},
  {x:outer,y:-Math.max(1,height-level)},
  {x:outer,y:-height},
  {x:tail,y:-height},
  {x:tail,y:-height+notch},
  {x:0,y:-height+notch}
 ];
}
/**
 * Identifica la CARA que debe detener el borde de la chapa en cada dedo.
 *
 * Perfil esquemático (no CAD):
 *   Stop 1: cara frontal de la primera altura.
 *   Support 2: cara del ESCALÓN INFERIOR de la segunda altura.
 * No confundir punto de apoyo con origen del dibujo; al cambiar dedo el
 * carro debe trasladar su silueta hasta poner esa cara en la cota nominal.
 */
export function gaugeContactFeature(values,stopNumber=1){
 const outline=gaugeOutline(values);
 const height=-Math.min(...outline.map(p=>p.y));
 const notch=Math.max(0,Math.min(height,Number(values?.[4])||0));
 const tail=Math.max(0,Number(values?.[5])||0);
 const support=Number(stopNumber)===2;
 const from=support?{x:tail,y:-height}:{x:0,y:0};
 const to=support?{x:tail,y:-height+notch}:{x:0,y:-height+notch};
 const point={x:from.x,y:(from.y+to.y)/2};
 const usable=(from.y!==to.y)&&(support?tail>0:true);
 return {kind:support?'support-step':'stop-face',
  label:support?'TOPE 2 · ESCALÓN SUPPORT':'TOPE 1 · CARA STOP',
  from,to,point,usable,verified:false};
}
/** Envolvente del perfil esquemático, sin interpretar una cota L como CAD. */
export function gaugeBounds(values){
 const outline=gaugeOutline(values);
 const xs=outline.map(p=>p.x),ys=outline.map(p=>p.y);
 const minX=Math.min(...xs),maxX=Math.max(...xs),minY=Math.min(...ys),maxY=Math.max(...ys);
 return {minX,maxX,minY,maxY,width:maxX-minX,height:maxY-minY};
}
/** Values are drawn as a bar chart by row, not an invented CAD profile. */
export function dimensionSeries(config){
 const p=normalizeV85(config);
 return [
  {name:'Trancha',values:p.ram.map((v,i)=>({label:'L'+(i+1),value:v}))},
  {name:'Mesa',values:p.bed.map((v,i)=>({label:'L'+(i+1),value:v}))},
  {name:'Tope Stop',values:p.stop.map((v,i)=>({label:'L'+(i+1),value:v}))},
  {name:'Tope Support',values:p.support.map((v,i)=>({label:'L'+(i+1),value:v}))}
 ];
}
