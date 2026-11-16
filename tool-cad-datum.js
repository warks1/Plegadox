/**
 * PlegadoX R111 · ejes de TRABAJO de perfiles CAD reales.
 * NO confundir el centro de la caja exterior del DXF con el eje
 * de la punta de un punzón de pata de cabra ni con el eje de una V.
 *
 * El origen es un dato geométrico 2D estimado. Sin un amarre OEM
 * contrastado NO hay certificación de montaje o colisión CNC.
 */
const finite=x=>typeof x==='number'&&Number.isFinite(x);
const mm=(points)=>{
 if(!Array.isArray(points)||points.length<3||
  points.some(p=>!Array.isArray(p)||p.length!==2||
   !finite(p[0])||!finite(p[1])))throw Error('Contorno CAD XY inválido');
 const xs=points.map(p=>p[0]),ys=points.map(p=>p[1]);
 return {xMin:Math.min(...xs),xMax:Math.max(...xs),
  yMin:Math.min(...ys),yMax:Math.max(...ys)};
};
const span=(a,b)=>Math.abs(a-b);
/** Inferir punta para geometría sin base plana/hem.
 * Un punzón asimétrico suele tener X_tip!=X_centro_caja.
 */
export function inspectPunchWorkingAxis(points){
 const b=mm(points),width=b.xMax-b.xMin,height=b.yMax-b.yMin;
 const tips=points.filter(p=>p[1]<=b.yMin+Math.max(.025,height*.0001));
 const xs=tips.map(p=>p[0]);
 const x0=(Math.min(...xs)+Math.max(...xs))/2;
 const tipWidth=span(Math.max(...xs),Math.min(...xs));
 const unambiguous=tipWidth<=Math.max(.15,width*.02);
 return {kind:'punch',axisX:x0,datumY:b.yMin,
  boundingBoxCenterX:(b.xMin+b.xMax)/2,
  offCenterMm:x0-(b.xMin+b.xMax)/2,
  tipWidthMm:tipWidth,workingHeightMm:height,
  status:unambiguous?'PUNTA_LOCALIZADA_2D':'PUNTA_PLANA_O_AMBIGUA',
  datumEstablished:unambiguous,verified:false};
}
/** Detectar las depresiones de V sobre el lado SUPERIOR del perfil.
 * Una matriz reversible/doble V puede tener varias. Nunca escoger
 * automáticamente la garganta incorrecta.
 */
export function inspectDieWorkingAxis(points){
 const b=mm(points),height=b.yMax-b.yMin,width=b.xMax-b.xMin;
 const lows=[];
 for(let i=0;i<points.length;i++){
  const a=points[(i-1+points.length)%points.length],p=points[i],
   c=points[(i+1)%points.length];
  if(p[1]<b.yMin+height*.23||p[1]>b.yMax-height*.025)continue;
  if(p[1]<=a[1]+.002&&p[1]<=c[1]+.002&&
   (a[1]>p[1]+.015||c[1]>p[1]+.015))
   lows.push({x:p[0],y:p[1]});
 }
 // Una garganta de V redondeada puede estar discretizada en varios
 // vértices consecutivos de altura casi idéntica: agrupar en una V.
 const groups=[];
 for(const q of lows.sort((a,b)=>a.x-b.x)){
  const g=groups.at(-1);
  if(g&&Math.abs(g.y-q.y)<.06&&Math.abs(g.items.at(-1).x-q.x)<Math.max(.1,width*.01))
   g.items.push(q);
  else groups.push({y:q.y,items:[q]});
 }
 const centers=groups.map(g=>({
  x:(g.items[0].x+g.items.at(-1).x)/2,
  y:Math.min(...g.items.map(p=>p.y))
 }));
 return {kind:'die',axisX:centers.length===1?centers[0].x:null,
  datumY:b.yMin,workingHeightMm:height,
  vCenters:centers,vCount:centers.length,
  status:centers.length===1?'V_UNICA_LOCALIZADA_2D':
   centers.length>1?'MATRIZ_MULTIPLE_V_REQUIERE_SELECCION':
   'V_NO_LOCALIZADA_REQUIERE_SELECCION',
  datumEstablished:centers.length===1,verified:false};
}
/**
 * Corrección controlada de la REFERENCIA LOCAL. El usuario puede aportar
 * un axisX explícito, pero sigue siendo una DECLARACIÓN no validada OEM.
 * Nunca se modifican las coordenadas almacenadas previamente.
 */
export function alignToolSectionToWorkingAxis(points,kind,{axisX=null}={}){
 const b=mm(points);
 if(!['punch','die'].includes(kind))throw Error('Útil sin tipo para datum');
 const observed=kind==='punch'?
  inspectPunchWorkingAxis(points):inspectDieWorkingAxis(points);
 const manual=axisX!==null&&axisX!==undefined&&String(axisX).trim()!=='';
 if(manual&&(!Number.isFinite(Number(axisX))||
  Number(axisX)<b.xMin-.01||Number(axisX)>b.xMax+.01))
  throw Error('Eje X del útil fuera de su contorno CAD');
 if(!manual&&!observed.datumEstablished)
  throw Error(observed.status+
   ': indica X exacta de la punta/V o selecciona la V de trabajo');
 const selected=manual?Number(axisX):observed.axisX;
 const normalized=points.map(p=>[
  Number((p[0]-selected).toFixed(6)),
  Number((p[1]-b.yMin).toFixed(6))
 ]);
 return {points:normalized,offsetX:selected,originalDatumY:b.yMin,
  inferred:!manual,datumStatus:observed.status,
  workingAxisKnown:true,manufacturerDatumVerified:false,
  profileGeometryVerified:false,diagnostic:observed};
}
