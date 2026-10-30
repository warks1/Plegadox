/**
 * PLEGADOX: malla de chapa de sección constante, extruida en anchura real.
 * Los vértices provienen de una fibra media ya doblada y redondeada.
 * Genera dos pieles desplazadas, bordes en ambos extremos transversales,
 * y tapas longitudinales. Modelo ilustrativo; NO CAD de fabricación,
 * solver de deformación, garantías de rigidez ni colisión.
 */
const EPS=1e-9;
const normalize=(x,y)=>{
 const d=Math.hypot(x,y);
 return d<EPS?{x:0,y:1}:{x:x/d,y:y/d};
};
const pt=(p,z)=>({x:p.x,y:p.y,z});
const length=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
export function sheetSolidMesh(centerline,width,thickness){
 const input=Array.isArray(centerline)?centerline:[];
 const w=Number(width),t=Number(thickness);
 if(input.length<2||!Number.isFinite(w)||w<=0||!Number.isFinite(t)||t<=0||
  input.some(p=>!p||!Number.isFinite(p.x)||!Number.isFinite(p.y))){
  return {faces:[],outer:[],inner:[],width:w,thickness:t,closed:false,verified:false};
 }
 // Conservar el primer y último punto exactos; descartar repeticiones
 // consecutivas que producirían caras degeneradas en ángulos extremos.
 const pts=[input[0]];
 for(const p of input.slice(1))if(length(pts.at(-1),p)>EPS)pts.push(p);
 if(pts.length<2)return {faces:[],outer:[],inner:[],width:w,thickness:t,closed:false,verified:false};
 const half=t/2;
 const normals=[];
 for(let i=0;i<pts.length-1;i++){
  const dx=pts[i+1].x-pts[i].x,dy=pts[i+1].y-pts[i].y;
  normals.push(normalize(-dy,dx));
 }
 const outer=[],inner=[];
 for(let i=0;i<pts.length;i++){
  const prev=normals[Math.max(0,i-1)],next=normals[Math.min(normals.length-1,i)];
  // Intersección de las rectas paralelas a cada tramo (miter).
  // Se limita el pico en cambios de dirección extremos; no es un
  // cálculo de radio mínimo fabricable.
  const sum=normalize(prev.x+next.x,prev.y+next.y);
  const denom=Math.max(.15,sum.x*prev.x+sum.y*prev.y);
  const miter=Math.min(half/denom,half*4);
  const shift={x:sum.x*miter,y:sum.y*miter};
  outer.push({x:pts[i].x+shift.x,y:pts[i].y+shift.y});
  inner.push({x:pts[i].x-shift.x,y:pts[i].y-shift.y});
 }
 const faces=[];
 const add=(kind,points,segment)=>faces.push({kind,points,segment});
 const front=-w/2,back=w/2;
 for(let i=0;i<pts.length-1;i++){
  const a=i,b=i+1;
  // Banda larga superior e inferior.
  add('upper',[pt(outer[a],front),pt(outer[b],front),
   pt(outer[b],back),pt(outer[a],back)],i);
  add('lower',[pt(inner[b],front),pt(inner[a],front),
   pt(inner[a],back),pt(inner[b],back)],i);
  // Cantos de espesor visibles a lo largo de ambos extremos del ancho.
  add('front',[pt(inner[a],front),pt(inner[b],front),
   pt(outer[b],front),pt(outer[a],front)],i);
  add('back',[pt(outer[a],back),pt(outer[b],back),
   pt(inner[b],back),pt(inner[a],back)],i);
 }
 const end=pts.length-1;
 add('start',[pt(outer[0],front),pt(outer[0],back),
  pt(inner[0],back),pt(inner[0],front)],0);
 add('end',[pt(inner[end],front),pt(inner[end],back),
  pt(outer[end],back),pt(outer[end],front)],end-1);
 return {faces,outer,inner,width:w,thickness:t,closed:true,
  segments:pts.length-1,verified:false};
}
