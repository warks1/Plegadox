/**
 * PlegadoX R48 · constructor paramétrico 2D de útiles por cotas en mm.
 * SOLO dibujo de la sección: no es un plano CAD OEM, no acredita amarre,
 * radios de fabricación, cargas admisibles ni ausencia de colisiones.
 */
import {validateContour} from './tool-dxf.js';
const range=(x,lo,hi,name)=>{const n=Number(x);
 if(x==null||String(x).trim()===''||!Number.isFinite(n)||n<lo||n>hi)
  throw Error(name+' debe estar entre '+lo+' y '+hi+' mm');
 return n;
};
const selected=(x,list,label)=>{if(!list.includes(x))throw Error(label+' inválido');return x;};
const round=v=>Math.round(v*100000)/100000;
const p=(x,y)=>[round(x),round(y)];
function arcNose(radius,angle,offsetX=0){
 const beta=angle*Math.PI/360;
 const arc=Array.from({length:21},(_,i)=>{
  const phi=-beta-(Math.PI-2*beta)*i/20;
  return p(offsetX+radius*Math.cos(phi),radius*(1+Math.sin(phi)));
 });
 return {arc,tangentX:radius*Math.cos(beta),tangentY:radius*(1-Math.sin(beta))};
}
/** No presentar el CAD como DXF original si el perfil fue calculado. */
export function buildCustomTool(raw={}){
 const kind=selected(String(raw.kind||''),['punch','die'],'Tipo');
 const name=String(raw.name||'').trim().slice(0,65);
 if(!name)throw Error('Indica un nombre para el útil');
 const length=range(raw.length,10,6000,'Longitud de segmento');
 const angle=range(raw.angle,20,120,'Ángulo');
 const height=range(raw.height,20,500,'Altura total');
 const width=range(raw.width,12,350,'Anchura del cuerpo');
 const mount=selected(String(raw.mount||''),['WILA','Amada/Promecam',
  'TRUMPF','Bystronic/Beyeler R','Desconocido'],'Amarre');
 let points,extra={},shape;
 if(kind==='die'){
  shape='v';
  const opening=range(raw.opening,3,Math.min(200,width-6),'Apertura V');
  const shoulderRadius=range(raw.shoulderRadius??0,0,Math.min(12,opening/3),'Radio hombros');
  const offset=range(raw.offset??0,-width/4,width/4,'Descentrado de V');
  if(width/2-Math.abs(offset)-opening/2<3)
   throw Error('La V necesita al menos 3 mm de material a ambos lados');
  const depth=(opening/2)/Math.tan(angle*Math.PI/360);
  if(height-depth<5)throw Error('La V atraviesa la base: aumenta H o reduce V');
  const L=offset-opening/2,R=offset+opening/2;
  // La referencia V es nominal. Los radios de hombro se REPRESENTAN
  // por tres segmentos de transición pero no convierten esto en CAD OEM.
  const approx=Math.min(shoulderRadius,opening/4,(height-depth-4)/2);
  if(approx>0){
   points=[
    p(-width/2,0),p(width/2,0),p(width/2,height),
    p(R+approx,height),p(R+approx*.3,height-approx*.28),
    p(R,height-approx),
    p(offset,height-depth),p(L,height-approx),
    p(L-approx*.3,height-approx*.28),p(L-approx,height),
    p(-width/2,height)
   ];
  }else{
   points=[p(-width/2,0),p(width/2,0),p(width/2,height),
    p(R,height),p(offset,height-depth),p(L,height),p(-width/2,height)];
  }
  extra={opening,shoulderRadius,outerWidth:width,activeV:opening,
   vOffset:offset,vDepth:round(depth)};
 }else{
  shape=selected(String(raw.shape||'straight'),['straight','gooseneck'],'Forma punzón');
  const shankWidth=range(raw.shankWidth,6,Math.min(110,width),'Ancho del vástago');
  const shankHeight=range(raw.shankHeight,5,height-15,'Altura vástago');
  const tipRadius=range(raw.tipRadius,.1,Math.min(10,width/8),'Radio punta');
  const noseOffset=shape==='gooseneck'?
   -Math.min(width*.24,(width-shankWidth)*.28):0;
  const {arc,tangentX,tangentY}=arcNose(tipRadius,angle,noseOffset);
  const halfAngle=angle*Math.PI/360;
  const bodyHalf=width/2;
  const flankY=tangentY+(bodyHalf-tangentX)/Math.tan(halfAngle);
  if(flankY>=height-shankHeight-4)
   throw Error('La punta y el cuerpo no caben: reduce ancho, aumenta altura o cambia ángulo');
  if(shape==='straight'){
   points=[
    p(-shankWidth/2,height),p(shankWidth/2,height),
    p(shankWidth/2,height-shankHeight),p(bodyHalf,height-shankHeight),
    p(bodyHalf,flankY),
    ...arc,
    p(-bodyHalf,flankY),p(-bodyHalf,height-shankHeight)
   ];
  }else{
   const neckDepth=range(raw.neckDepth,3,Math.max(4,width*.65),'Profundidad de cuello');
   const reliefX=bodyHalf-neckDepth;
   if(reliefX<=noseOffset+tangentX+2)
    throw Error('Cuello sin pared útil: reduce profundidad de escote');
   const shoulderY=height-shankHeight,neckY=flankY+Math.max(8,(shoulderY-flankY)*.38);
   if(neckY>=shoulderY-2)throw Error('No queda altura para el cuello');
   points=[
    p(-shankWidth/2,height),p(shankWidth/2,height),
    p(shankWidth/2,shoulderY),p(bodyHalf,shoulderY),
    p(bodyHalf,neckY+4),p(reliefX,neckY),
    p(reliefX,Math.max(flankY+4,neckY-12)),
    p(noseOffset+tangentX+6,flankY+7),
    ...arc,
    p(-bodyHalf,flankY+Math.max(2,width*.06)),
    p(-bodyHalf,shoulderY)
   ];
   extra.neckDepth=neckDepth;
  }
  extra={...extra,tip:tipRadius*2,shankWidth,shankHeight,
   referenceSpan:width,type:shape==='gooseneck'?'cabra':'recto'};
 }
 const contour=validateContour(points,{maxWidth:4000,maxHeight:4000});
 // Los datos se trazan a escala; geometría PARAMÉTRICA, no DXF fabricante.
 return {kind,shape,name,angle,height,length,width,mount,
  points:contour.points,dimensions:extra,
  source:'Dibujo paramétrico creado por usuario a partir de cotas introducidas',
  industrialVerified:false};
}
export function customToolRecord(geometry){
 const g=geometry;
 const prefix='user-custom-'+g.kind+'-';
 const id=prefix+Date.now().toString(36)+'-'+Math.random().toString(36).slice(2,9);
 return {id,name:g.name,reference:g.name,manufacturer:'Personalizado',
  mount:g.mount==='Desconocido'?'':g.mount,
  angle:g.angle,height:g.height,length:g.length,
  profilePoints:g.points.map(pt=>[...pt]),customProfile:true,importedDxf:false,
  customDimensions:{kind:g.kind,shape:g.shape,width:g.width,...g.dimensions},
  verifiedSpecs:false,profileAccuracy:'provisional',
  sourceDescription:g.source,
  ...(g.kind==='die'?{
   opening:g.dimensions.opening,shoulderRadius:g.dimensions.shoulderRadius,
   outerWidth:g.width
  }:{
   tip:g.dimensions.tip,type:g.dimensions.type,referenceSpan:g.width
  })};
}
