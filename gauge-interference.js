/**
 * PlegadoX — comprobación geométrica local de tope/chapa en sección 2D.
 *
 * Detecta penetración del eje de chapa y pérdida de holgura por espesor.
 * Es un cribado orientativo y NO una validación CNC de dedos, X/R/Z o 3D.
 * No debe declarar "apoyo correcto" si el dedo se solapa con la chapa.
 */
const EPS=1e-8;
const cross=(a,b,c)=>(b.x-a.x)*(c.y-a.y)-(b.y-a.y)*(c.x-a.x);
const dist=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
function nearest(p,a,b){
 const dx=b.x-a.x,dy=b.y-a.y,s=dx*dx+dy*dy;
 const t=s<EPS?0:Math.max(0,Math.min(1,((p.x-a.x)*dx+(p.y-a.y)*dy)/s));
 return {x:a.x+t*dx,y:a.y+t*dy};
}
function pointDistance(p,a,b){return dist(p,nearest(p,a,b));}
function strictInside(p,polygon){
 let inside=false;
 for(let i=0,j=polygon.length-1;i<polygon.length;j=i++){
  const a=polygon[j],b=polygon[i];
  if(pointDistance(p,a,b)<1e-7)return false;
  if((a.y>p.y)!==(b.y>p.y)&&
    p.x<(b.x-a.x)*(p.y-a.y)/(b.y-a.y)+a.x)inside=!inside;
 }
 return inside;
}
function crossings(a,b,c,d){
 const rx=b.x-a.x,ry=b.y-a.y,sx=d.x-c.x,sy=d.y-c.y;
 const den=rx*sy-ry*sx;
 if(Math.abs(den)<EPS)return null;
 const px=c.x-a.x,py=c.y-a.y,t=(px*sy-py*sx)/den,u=(px*ry-py*rx)/den;
 return t>=-EPS&&t<=1+EPS&&u>=-EPS&&u<=1+EPS?
  Math.max(0,Math.min(1,t)):null;
}
function nearestSegment(a,b,c,d){
 if(cross(a,b,c)*cross(a,b,d)<-EPS&&cross(c,d,a)*cross(c,d,b)<-EPS)
  return {distance:0,point:nearest(a,c,d)};
 const options=[
  {p:a,q:nearest(a,c,d)},
  {p:b,q:nearest(b,c,d)},
  {p:nearest(c,a,b),q:c},
  {p:nearest(d,a,b),q:d}
 ];
 let best=null;
 for(const o of options){
  const m={distance:dist(o.p,o.q),point:o.p,fingerPoint:o.q};
  if(!best||m.distance<best.distance)best=m;
 }
 return best;
}
export function inspectGaugeProfile(sheet,polygon,thickness=2,contact=null,{
 supportShelf=null
}={}){
 if(!Array.isArray(sheet)||sheet.length<2||
    !Array.isArray(polygon)||polygon.length<3||
    !sheet.every(p=>Number.isFinite(p.x)&&Number.isFinite(p.y))||
    !polygon.every(p=>Number.isFinite(p.x)&&Number.isFinite(p.y)))
  return {warning:false,kind:'sin-geometria',point:null};
 const allowance=Math.max(0,Number(thickness)||0)/2;
 // El extremo de la chapa tocando la CARA designada es contacto normal.
 // No exime el resto de un ala que penetra más allá de ese extremo.
 const allowedNearContact=Math.max(0.6,allowance+.15);
 const exempt=p=>contact&&dist(p,contact)<=allowedNearContact;
 // La cara INFERIOR de una chapa horizontal puede reposar sobre la
 // repisa BAJA del Support. Eso NO es una colisión: la distancia del
 // eje de chapa al plano de repisa es exactamente espesor/2.
 // Exención estricta por superficie, sólo si hay asiento y el perfil
 // coincide físicamente. No exime la pared ascendente ni penetraciones.
 const isPermittedShelf=(a,b,c,d,nearestPoint)=>{
  if(!supportShelf?.seated||!supportShelf.from||!supportShelf.to||
     ![a,b,c,d,supportShelf.from,supportShelf.to].every(
       p=>Number.isFinite(p?.x)&&Number.isFinite(p?.y)))return false;
  const u=supportShelf.from,v=supportShelf.to;
  const sameEdge=(dist(c,u)<1e-5&&dist(d,v)<1e-5)||
                 (dist(c,v)<1e-5&&dist(d,u)<1e-5);
  if(!sameEdge)return false;
  const tolerance=Math.max(.10,Math.min(.35,thickness*.10));
  const targetY=u.y+allowance;
  return Math.abs(a.y-targetY)<=tolerance&&
    Math.abs(b.y-targetY)<=tolerance&&
    nearestPoint.x>=Math.min(u.x,v.x)-1e-5&&
    nearestPoint.x<=Math.max(u.x,v.x)+1e-5;
 };
 // Informar el hueco mínimo realmente medido entre eje de chapa y
 // contorno del dedo, SIN usar la distancia al anclaje de referencia
 // (esa distancia no mide la holgura contra el cuerpo).
 // Nunca permitir que la holgura oculte una penetración posterior.
 let closestClearance=null;
 for(let i=0;i<sheet.length-1;i++){
  const a=sheet[i],b=sheet[i+1],cuts=[0,1];
  for(let j=0;j<polygon.length;j++){
   const t=crossings(a,b,polygon[j],polygon[(j+1)%polygon.length]);
   if(t!==null)cuts.push(t);
  }
  cuts.sort((x,y)=>x-y);
  const unique=cuts.filter((t,k)=>k===0||t-cuts[k-1]>1e-8);
  for(let j=0;j<unique.length-1;j++){
   const t=(unique[j]+unique[j+1])/2;
   const p={x:a.x+(b.x-a.x)*t,y:a.y+(b.y-a.y)*t};
   // Un contacto nominal permite tocar la cara elegida, NO atravesarla:
   // la excepción de proximidad se reserva para la holgura por espesor.
   // Incluso una penetración corta (< e/2) debe detectarse.
   if(strictInside(p,polygon))
    return {warning:true,kind:'penetracion',point:p,segment:i};
  }
  // Envolvente de espesor nominal: un contacto lejos de la cara elegida
  // no es el apoyo programado, aunque no haya cruce de la fibra media.
  if(allowance>.18)for(let j=0;j<polygon.length;j++){
   const near=nearestSegment(a,b,polygon[j],polygon[(j+1)%polygon.length]);
   if(near.distance<allowance-.18&&!exempt(near.point)&&
      !isPermittedShelf(a,b,polygon[j],polygon[(j+1)%polygon.length],near.point)){
     // R107: comparar TODAS las aristas. El primer roce no siempre es
     // el más próximo. Mantener la distancia exacta, en mm, para que
     // pueda auditarse el naranja sin esconder riesgos reales.
     if(!closestClearance||near.distance<closestClearance.distanceMm){
      closestClearance={warning:true,kind:'holgura',point:near.point,
       closestFingerPoint:near.fingerPoint,segment:i,fingerEdge:j,
       distanceMm:near.distance,requiredMm:allowance,
       deficitMm:Math.max(0,allowance-near.distance),verified:false};
     }
    }
  }
 }
 return closestClearance||{warning:false,kind:'sin-interferencia-detectada',point:null};
}
