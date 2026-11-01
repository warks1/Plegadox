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
  const m={distance:dist(o.p,o.q),point:o.p};
  if(!best||m.distance<best.distance)best=m;
 }
 return best;
}
export function inspectGaugeProfile(sheet,polygon,thickness=2,contact=null){
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
   if(strictInside(p,polygon)&&!exempt(p))
    return {warning:true,kind:'penetracion',point:p,segment:i};
  }
  // Envolvente de espesor nominal: un contacto lejos de la cara elegida
  // no es el apoyo programado, aunque no haya cruce de la fibra media.
  if(allowance>.18)for(let j=0;j<polygon.length;j++){
   const near=nearestSegment(a,b,polygon[j],polygon[(j+1)%polygon.length]);
   if(near.distance<allowance-.18&&!exempt(near.point))
    return {warning:true,kind:'holgura',point:near.point,segment:i};
  }
 }
 return {warning:false,kind:'sin-interferencia-detectada',point:null};
}
