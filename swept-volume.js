/**
 * PlegadoX · cruce de una trayectoria de traslación LINEAL con prismas 2,5D.
 *
 * Para sección poligonal sin deformación ni giro y Z CONSTANTE, la unión
 * barrida equivale a sección inicial + paralelogramos de cada arista.
 * La intersección de superficies identifica penetraciones modeladas entre
 * poses aun si los extremos no colisionan. Contactos de área CERO no quedan
 * acreditados. NO es un solver CNC continuo ni certificación de seguridad.
 */
import {intersectionArea2D,prismOverlap,makePrism} from './volume-engine.js';
const EPS=1e-7;
const approx=(a,b)=>Number.isFinite(a)&&Number.isFinite(b)&&
 Math.abs(a-b)<=EPS*Math.max(1,Math.abs(a),Math.abs(b));
export function prismTranslation(from,to){
 if(!from?.valid||!to?.valid||from.polygon.length!==to.polygon.length)
  return {ok:false,reason:'geometría inválida o distinto número de vértices'};
 if(!approx(from.zMin,to.zMin)||!approx(from.zMax,to.zMax))
  return {ok:false,reason:'desplazamiento Z: no soportado por barrido 2D'};
 const a=from.polygon[0],b=to.polygon[0],dx=b.x-a.x,dy=b.y-a.y;
 if(!from.polygon.every((p,i)=>approx(p.x+dx,to.polygon[i].x)&&
  approx(p.y+dy,to.polygon[i].y)))
  return {ok:false,reason:'la geometría cambió de forma o giró entre poses'};
 return {ok:true,dx,dy,dz:0};
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
 return {intersects:result.intersects,unknown:result.unknown,area:result.area||0};
}
/** Prisma móvil y prisma estático, con posiciones inicial y final en mm. */
export function sweptPrismAgainstStatic(from,to,staticBody){
 const delta=prismTranslation(from,to);
 if(!delta.ok||!staticBody?.valid)
  return {intersects:false,unknown:true,reason:delta.ok?
   'sólido de referencia inválido':delta.reason,method:'linear-2.5d'};
 const zOverlap=Math.min(from.zMax,staticBody.zMax)-
  Math.max(from.zMin,staticBody.zMin);
 if(zOverlap<=EPS)return {intersects:false,unknown:false,method:'linear-2.5d',
  reason:'ocupación Z separada en todo el intervalo'};
 let unknown=false;
 for(const prism of [from,to]){
  const hit=overlapSurface(prism,staticBody);
  if(hit.unknown)unknown=true;
  if(hit.intersects)return {intersects:true,unknown:false,method:'linear-2.5d',
   reason:'penetración modelada en el extremo del intervalo',
   areaMm2:hit.area,zOverlapMm:zOverlap};
 }
 const {dx,dy}=delta;
 if(Math.hypot(dx,dy)<=EPS)return {intersects:false,unknown,
  method:'linear-2.5d',reason:'sección inmóvil'};
 const vertices=from.polygon;
 for(let i=0;i<vertices.length;i++){
  const a=vertices[i],b=vertices[(i+1)%vertices.length];
  // Cada segmento del perímetro barre un paralelogramo. Cuando
  // el movimiento va paralelo a la arista su área es cero.
  const area2=Math.abs((b.x-a.x)*dy-(b.y-a.y)*dx);
  if(area2<=EPS)continue;
  const swept=makePrism('barrido-arista-'+i,
   [a,b,{x:b.x+dx,y:b.y+dy},{x:a.x+dx,y:a.y+dy}],
   from.zMin,from.zMax,'barrido geométrico de traslación lineal');
  if(!swept.valid){unknown=true;continue;}
  const hit=overlapSurface(swept,staticBody);
  if(hit.unknown){unknown=true;continue;}
  if(hit.intersects)return {intersects:true,unknown:false,method:'linear-2.5d',
   reason:'penetración modelada ENTRE posiciones del movimiento lineal',
   crossingEdge:i,areaMm2:hit.area,zOverlapMm:zOverlap};
 }
 return {intersects:false,unknown,
  method:'linear-2.5d',reason:unknown?'sector de barrido no resuelto':
   'sin penetración volumétrica en el barrido lineal 2,5D; contacto tangente no excluido'};
}
/** Ambos prismas se trasladan sin giro. La traslación relativa
 * permite estudiar su contacto en cualquier momento del intervalo.
 */
export function sweptPrismPair(a0,a1,b0,b1){
 const da=prismTranslation(a0,a1),db=prismTranslation(b0,b1);
 if(!da.ok||!db.ok)return {intersects:false,unknown:true,
  method:'linear-2.5d',reason:'cuerpos no rígidos: '+
  (!da.ok?da.reason:db.reason)};
 const relative=translatePrism(a0,da.dx-db.dx,da.dy-db.dy);
 return sweptPrismAgainstStatic(a0,relative,b0);
}
