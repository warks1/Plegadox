/**
 * PlegadoX · importación acotada de CONTORNOS DXF ASCII 2D.
 * Se importan LINE o una LWPOLYLINE cerrada (también admite bulge 42).
 * No se ejecutan datos del archivo ni se deduce automáticamente el amarre.
 * Contorno aportado ≠ verificación de compatibilidad o seguridad CNC.
 */
export const TOOL_DXF_STORAGE_KEY='plegadox:tool-dxf:v1';
const MAX_BYTES=1024*1024,MAX_POINTS=800,EPS=.015;
const near=(a,b)=>Math.hypot(a[0]-b[0],a[1]-b[1])<=EPS;
function numeric(v,label){
 const n=Number(v);
 if(!Number.isFinite(n)||Math.abs(n)>1000000)throw Error('Coordenada inválida: '+label);
 return n;
}
function parsePairs(text){
 if(typeof text!=='string'||text.length>MAX_BYTES)
  throw Error('El DXF debe ser ASCII y tener menos de 1 MB');
 if(text.includes('\0'))throw Error('DXF binario no admitido; exporta como DXF ASCII 2D');
 const lines=text.replace(/^\uFEFF/,'').replace(/\r/g,'').split('\n');
 while(lines.length&&lines.at(-1)==='')lines.pop();
 if(lines.length%2)throw Error('DXF ASCII incompleto (pares código/valor)');
 const pairs=[];
 for(let i=0;i<lines.length;i+=2){
  const code=Number(lines[i].trim());
  if(!Number.isInteger(code))throw Error('Código de grupo DXF no válido');
  pairs.push({code,value:lines[i+1].trim()});
 }
 return pairs;
}
function property(entity,code,defaultValue){
 return entity.find(p=>p.code===code)?.value??defaultValue;
}
function arcBulge(a,b,bulge){
 if(Math.abs(bulge)<1e-10)return [b];
 const dx=b[0]-a[0],dy=b[1]-a[1],chord=Math.hypot(dx,dy);
 if(chord<EPS)throw Error('Arco DXF de cuerda nula');
 const turn=4*Math.atan(bulge);
 const offset=chord*(1-bulge*bulge)/(4*bulge);
 const mx=(a[0]+b[0])/2,my=(a[1]+b[1])/2;
 const cx=mx-dy/chord*offset,cy=my+dx/chord*offset;
 const radius=Math.hypot(a[0]-cx,a[1]-cy);
 const start=Math.atan2(a[1]-cy,a[0]-cx);
 const count=Math.max(2,Math.ceil(Math.abs(turn)/(Math.PI/24)));
 return Array.from({length:count},(_,k)=>{
  if(k===count-1)return b;
  const angle=start+turn*(k+1)/count;
  return [cx+radius*Math.cos(angle),cy+radius*Math.sin(angle)];
 });
}
function polyline(entity){
 const flag=Number(property(entity,70,'0'));
 if(!(flag&1))throw Error('La LWPOLYLINE debe estar cerrada (flag 70)');
 const verts=[];
 for(const p of entity){
  if(p.code===10)verts.push({x:numeric(p.value,'X'),y:null,bulge:0});
  else if(p.code===20&&verts.length)verts.at(-1).y=numeric(p.value,'Y');
  else if(p.code===42&&verts.length)verts.at(-1).bulge=numeric(p.value,'bulge');
  else if((p.code===40||p.code===41)&&Number(p.value)>0)
   throw Error('Polilínea DXF con anchura de trazo; exporta sólo el contorno');
 }
 if(verts.length<3||verts.some(p=>p.y===null))
  throw Error('La polilínea no tiene al menos tres vértices XY');
 if(verts.length>MAX_POINTS)throw Error('Demasiados vértices DXF');
 const result=[[verts[0].x,verts[0].y]];
 for(let i=0;i<verts.length;i++){
  const a=verts[i],b=verts[(i+1)%verts.length];
  result.push(...arcBulge([a.x,a.y],[b.x,b.y],a.bulge));
  if(result.length>MAX_POINTS+1)throw Error('Perfil demasiado detallado (máx. 800 puntos)');
 }
 if(near(result[0],result.at(-1)))result.pop();
 return result;
}
function line(entity){
 const value=(code,label)=>numeric(property(entity,code,'NaN'),label);
 const z0=numeric(property(entity,30,'0'),'Z inicial'),
       z1=numeric(property(entity,31,'0'),'Z final');
 if(Math.abs(z0)>EPS||Math.abs(z1)>EPS)
  throw Error('DXF no plano: las líneas tienen Z distinto de cero');
 return [[value(10,'X1'),value(20,'Y1')],[value(11,'X2'),value(21,'Y2')]];
}
function assembleLines(edges){
 if(edges.length<3)throw Error('Se necesitan al menos tres líneas para cerrar el perfil');
 if(edges.length>MAX_POINTS)throw Error('Demasiadas líneas DXF');
 const used=new Set([0]),points=[edges[0][0],edges[0][1]];
 while(used.size<edges.length){
  const tip=points.at(-1);
  let next=-1,point=null;
  for(let i=0;i<edges.length;i++)if(!used.has(i)){
   const [a,b]=edges[i];
   if(near(tip,a)){next=i;point=b;break;}
   if(near(tip,b)){next=i;point=a;break;}
  }
  if(next<0)throw Error('Las líneas no forman un contorno cerrado único');
  if(near(point,points[0])&&used.size!==edges.length-1)
   throw Error('Hay varias cadenas o geometría sobrante en el DXF');
  used.add(next);points.push(point);
 }
 if(!near(points[0],points.at(-1)))
  throw Error('Falta cerrar el contorno DXF (LINE)');
 points.pop();
 return points;
}
function signedArea(points){
 let s=0;for(let i=0;i<points.length;i++){
  const a=points[i],b=points[(i+1)%points.length];
  s+=a[0]*b[1]-b[0]*a[1];
 }return s/2;
}
function intersects(a,b,c,d){
 const cross=(u,v,w)=>(v[0]-u[0])*(w[1]-u[1])-(v[1]-u[1])*(w[0]-u[0]);
 const aa=cross(a,b,c),ab=cross(a,b,d),ca=cross(c,d,a),cb=cross(c,d,b);
 if(aa*ab<-1e-8&&ca*cb<-1e-8)return true;
 return false;
}
export function validateContour(raw){
 if(!Array.isArray(raw)||raw.length<3||raw.length>MAX_POINTS)
  throw Error('El contorno necesita entre 3 y 800 vértices');
 const points=raw.map((p,i)=>{
  if(!Array.isArray(p)||p.length!==2)throw Error('Vértice DXF inválido '+i);
  return [numeric(p[0],'X'),numeric(p[1],'Y')];
 });
 for(let i=0;i<points.length;i++){
  if(near(points[i],points[(i+1)%points.length]))
   throw Error('Segmentos de longitud nula o duplicados en el contorno');
 }
 const xs=points.map(p=>p[0]),ys=points.map(p=>p[1]);
 const width=Math.max(...xs)-Math.min(...xs),height=Math.max(...ys)-Math.min(...ys);
 if(width<.5||height<2||width>1000||height>600)
  throw Error('Perfil fuera de dimensiones admitidas: ancho 0,5–1000 mm y alto 2–600 mm');
 if(Math.abs(signedArea(points))<.05)
  throw Error('Perfil sin área útil (contorno abierto o degenerado)');
 for(let i=0;i<points.length;i++)for(let j=i+2;j<points.length;j++){
  if(i===0&&j===points.length-1)continue;
  if(intersects(points[i],points[(i+1)%points.length],
   points[j],points[(j+1)%points.length]))
   throw Error('Contorno DXF autointersecado');
 }
 return {points,width,height};
}
export function parseToolDxf(text){
 const pairs=parsePairs(text);
 let units=null;
 for(let i=0;i<pairs.length;i++)if(pairs[i].code===9&&pairs[i].value==='$INSUNITS'){
  for(let j=i+1;j<pairs.length&&pairs[j].code!==9&&pairs[j].code!==0;j++)
   if(pairs[j].code===70){units=Number(pairs[j].value);break;}
 }
 if(units!==null&&units!==0&&units!==4)
  throw Error('DXF con unidades no milimétricas ($INSUNITS='+units+'). Convierte a mm antes de importar');
 let inside=false,found=false,entities=[];
 for(let i=0;i<pairs.length;i++){
  if(pairs[i].code===0&&pairs[i].value==='SECTION'&&pairs[i+1]?.code===2){
   inside=pairs[i+1].value==='ENTITIES';found ||=inside;i++;continue;
  }
  if(pairs[i].code===0&&pairs[i].value==='ENDSEC'){inside=false;continue;}
  if(inside&&pairs[i].code===0){
   const type=pairs[i].value,body=[];
   for(i++;i<pairs.length&&pairs[i].code!==0;i++)body.push(pairs[i]);
   i--;
   if(!['ENDSEC','EOF'].includes(type))entities.push({type,body});
  }
 }
 if(!found)throw Error('Falta la sección ENTITIES del DXF ASCII');
 let poly=null,edges=[];
 for(const {type,body} of entities){
  if(type==='LWPOLYLINE'){
   if(poly||edges.length)throw Error('Elige un único contorno DXF, sin geometría adicional');
   poly=polyline(body);
  }else if(type==='LINE'){
   if(poly)throw Error('Hay líneas adicionales fuera de la polilínea cerrada');
   edges.push(line(body));
  }else if(!['TEXT','MTEXT','POINT'].includes(type)){
   throw Error('Entidad DXF '+type+' no admitida. Usa LINE o LWPOLYLINE cerrada');
  }
 }
 const contour=validateContour(poly||assembleLines(edges));
 const x0=Math.min(...contour.points.map(p=>p[0])),
       y0=Math.min(...contour.points.map(p=>p[1]));
 const normalized=contour.points.map(([x,y])=>[
  Number((x-x0-contour.width/2).toFixed(6)),Number((y-y0).toFixed(6))
 ]);
 return {...validateContour(normalized),unitsAssumed:units===null||units===0,
  coordinateSystem:'mm; X centrada; base del útil Y=0'};
}
function getNumber(value,label,min,max){
 const n=Number(value);
 if(!Number.isFinite(n)||n<min||n>max)
  throw Error(label+' debe estar entre '+min+' y '+max);
 return n;
}
export function importedTool(parsed,options={}){
 const contour=validateContour(parsed.points);
 const kind=options.kind;
 if(!['punch','die'].includes(kind))throw Error('Tipo de útil no válido');
 const name=String(options.name||'').trim().slice(0,65);
 if(!name)throw Error('Indica un nombre de referencia');
 const angle=getNumber(options.angle,'Ángulo nominal',15,120);
 const length=getNumber(options.length,'Longitud de segmento',10,6000);
 const tool={id:'user-dxf-'+kind+'-'+Date.now().toString(36)+'-'+Math.random().toString(36).slice(2,9),
  name,reference:name,manufacturer:'Importado DXF',mount:'',
  angle,height:Number(contour.height.toFixed(5)),length,
  profilePoints:contour.points,importedDxf:true,
  verifiedSpecs:false,profileAccuracy:'provisional',
  sourceDescription:'Contorno 2D aportado por el usuario, orientación/amarre sin validar'};
 if(kind==='die'){
  tool.opening=getNumber(options.opening,'Apertura V nominal',2,200);
 }else{
  tool.tip=getNumber(options.tip,'Diámetro de punta nominal',.1,30);
  tool.type='importado';
 }
 return tool;
}
export function loadImportedTools(storage){
 try{
  const data=JSON.parse(storage?.getItem(TOOL_DXF_STORAGE_KEY)||'[]');
  if(!Array.isArray(data))return [];
  return data.slice(0,30).filter(t=>{
   try{
    if(!t||t.importedDxf!==true||!/^user-dxf-(punch|die)-[a-z0-9-]+$/.test(t.id))return false;
    validateContour(t.profilePoints);
    return Number.isFinite(t.angle)&&Number.isFinite(t.height)&&
      (t.opening!=null?Number.isFinite(t.opening):Number.isFinite(t.tip));
   }catch{return false;}
  });
 }catch{return [];}
}
export function registerImportedTools(dies,punches,tools){
 for(const item of tools){
  const collection=item.opening!=null?dies:punches;
  if(!collection.some(t=>t.id===item.id))collection.push(item);
 }
}
export function persistImportedTool(storage,tool){
 if(!storage)throw Error('Almacenamiento local no disponible');
 validateContour(tool.profilePoints);
 const items=loadImportedTools(storage);
 if(items.length>=30)throw Error('Máximo de 30 herramientas DXF guardadas');
 if(items.some(t=>t.id===tool.id))throw Error('La referencia ya está registrada');
 const next=[...items,tool];
 storage.setItem(TOOL_DXF_STORAGE_KEY,JSON.stringify(next));
 return next.length;
}
