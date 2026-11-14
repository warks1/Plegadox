/**
 * PlegadoX · interferencia de sólidos de sección constante extruidos en Z.
 *
 * Los cuerpos se TRASLADAN linealmente en X/Y/Z entre dos poses, sin giros
 * ni deformaciones. Se calcula el intervalo temporal exacto en el que sus
 * rangos Z se solapan y, DENTRO DE ÉL, se comprueba el barrido continuo de
 * la sección XY mediante paralelogramos de aristas. Esto detecta colisiones
 * entre poses incluso con Z1/Z2 en movimiento. No resuelve radios OEM,
 * contacto tangencial de volumen cero ni trayectorias no lineales del CNC.
 */
import {prismOverlap,makePrism} from './volume-engine.js';
const EPS=1e-7;
const approx=(a,b)=>Number.isFinite(a)&&Number.isFinite(b)&&
 Math.abs(a-b)<=EPS*Math.max(1,Math.abs(a),Math.abs(b));
export function prismTranslation(from,to){
 if(!from?.valid||!to?.valid||from.polygon.length!==to.polygon.length)
  return {ok:false,reason:'geometría inválida o distinto número de vértices'};
 const a=from.polygon[0],b=to.polygon[0],dx=b.x-a.x,dy=b.y-a.y;
 const dz=to.zMin-from.zMin;
 if(!approx(from.zMax+dz,to.zMax))
  return {ok:false,reason:'variación de la longitud del segmento Z'};
 if(!from.polygon.every((p,i)=>approx(p.x+dx,to.polygon[i].x)&&
  approx(p.y+dy,to.polygon[i].y)))
  return {ok:false,reason:'la geometría cambió de forma o giró entre poses'};
 return {ok:true,dx,dy,dz};
}
export function translatePrism(prism,dx=0,dy=0,dz=0){
 if(!prism?.valid||![dx,dy,dz].every(Number.isFinite))
  throw Error('Prisma o traslación inválidos');
 return makePrism(prism.id,prism.polygon.map(p=>({
  x:p.x+dx,y:p.y+dy
 })),prism.zMin+dz,prism.zMax+dz,prism.provenance);
}
function overlapSurface(a,b){
 const result=prismOverlap(a,b);
 return {intersects:result.intersects,unknown:result.unknown,
  area:result.area||0,depth:result.depth||0};
}
/** Intervalo en [0,1] con solape volumétrico transversal Z.
 * Cada extremo es solución de una desigualdad LINEAL exacta.
 */
function zWindow(moving,staticBody,dz){
 const lo=staticBody.zMin-moving.zMax;
 const hi=staticBody.zMax-moving.zMin;
 if(Math.abs(dz)<=EPS){
  const depth=Math.min(moving.zMax,staticBody.zMax)-
   Math.max(moving.zMin,staticBody.zMin);
  return depth>EPS?{start:0,end:1}:depth>=-EPS?
   {uncertain:true,reason:'contacto transversal tangente sin volumen'}:
   {outside:true};
 }
 const t1=lo/dz,t2=hi/dz;
 const start=Math.max(0,Math.min(t1,t2));
 const end=Math.min(1,Math.max(t1,t2));
 if(end<start-EPS)return {outside:true};
 if(end-start<=EPS)return {uncertain:true,
  reason:'ventana de solape Z puntual o inferior a la resolución geométrica'};
 return {start,end};
}
/** Prisma móvil, prisma inmóvil y posiciones extremas reales en mm.
 * El barrido de XY se examina SÓLO dentro de la ventana de cruce Z.
 */
export function sweptPrismAgainstStatic(from,to,staticBody){
 const delta=prismTranslation(from,to);
 if(!delta.ok||!staticBody?.valid)
  return {intersects:false,unknown:true,reason:delta.ok?
   'sólido de referencia inválido':delta.reason,method:'linear-2.5d-xyz'};
 const {dx,dy,dz}=delta;
 const window=zWindow(from,staticBody,dz);
 if(window.outside)return {intersects:false,unknown:false,
  method:'linear-2.5d-xyz',
  reason:'ocupación Z separada durante todo el movimiento'};
 if(window.uncertain)return {intersects:false,unknown:true,
  method:'linear-2.5d-xyz',reason:window.reason};
 const zTime=(window.start+window.end)/2;
 // El solape Z es estrictamente positivo durante el intervalo interior.
 // Se fija al centro ÚNICAMENTE para evaluar el barrido XY de ese tramo.
 const zMid=dz*zTime;
 const fromXY=translatePrism(from,dx*window.start,dy*window.start,zMid);
 const toXY=translatePrism(from,dx*window.end,dy*window.end,zMid);
 const depth=Math.min(fromXY.zMax,staticBody.zMax)-
  Math.max(fromXY.zMin,staticBody.zMin);
 if(depth<=EPS)return {intersects:false,unknown:true,
  method:'linear-2.5d-xyz',reason:'solape Z inferior a tolerancia numérica'};
 let unknown=false;
 for(const prism of [fromXY,toXY]){
  const hit=overlapSurface(prism,staticBody);
  if(hit.unknown)unknown=true;
  if(hit.intersects)return {intersects:true,unknown:false,method:'linear-2.5d-xyz',
   reason:'penetración modelada en la ventana temporal de solape Z',
   areaMm2:hit.area,zOverlapMm:depth,zWindow:[window.start,window.end]};
 }
 const vx=dx*(window.end-window.start),vy=dy*(window.end-window.start);
 if(Math.hypot(vx,vy)<=EPS)return {intersects:false,unknown,
  method:'linear-2.5d-xyz',
  reason:'sin traslación XY y sin penetración Z/XY volumétrica'};
 const points=fromXY.polygon;
 for(let i=0;i<points.length;i++){
  const a=points[i],b=points[(i+1)%points.length];
  const area2=Math.abs((b.x-a.x)*vy-(b.y-a.y)*vx);
  if(area2<=EPS)continue;
  const swept=makePrism('barrido-arista-'+i,
   [a,b,{x:b.x+vx,y:b.y+vy},{x:a.x+vx,y:a.y+vy}],
   fromXY.zMin,fromXY.zMax,'barrido geométrico lineal X/Y/Z');
  if(!swept.valid){unknown=true;continue;}
  const hit=overlapSurface(swept,staticBody);
  if(hit.unknown){unknown=true;continue;}
  if(hit.intersects)return {intersects:true,unknown:false,
   method:'linear-2.5d-xyz',
   reason:'penetración modelada ENTRE poses en ventana de solape Z',
   crossingEdge:i,areaMm2:hit.area,zOverlapMm:depth,
   zWindow:[window.start,window.end]};
 }
 return {intersects:false,unknown,method:'linear-2.5d-xyz',
  reason:unknown?'sector de barrido no resuelto':
   'sin penetración de volumen en traslación lineal XYZ; contacto tangente no excluido'};
}
/** Ambos prismas se desplazan linealmente sin giro. Sustituir el movimiento
 * del segundo por su reposo y restar su traslación del primer sólido.
 */
export function sweptPrismPair(a0,a1,b0,b1){
 const da=prismTranslation(a0,a1),db=prismTranslation(b0,b1);
 if(!da.ok||!db.ok)return {intersects:false,unknown:true,
  method:'linear-2.5d-xyz',reason:'cuerpos no rígidos: '+
  (!da.ok?da.reason:db.reason)};
 const relative=translatePrism(a0,
  da.dx-db.dx,da.dy-db.dy,da.dz-db.dz);
 return sweptPrismAgainstStatic(a0,relative,b0);
}
