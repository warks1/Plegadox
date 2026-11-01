/**
 * PLEGADOX — perfiles paramétricos en milímetros para visualización.
 * No son planos de fabricante. No deben utilizarse para fabricar herramientas
 * ni para validar colisiones. Ángulo = ángulo INCLUIDO de la punta y de la V.
 */
/**
 * Un punzón de pata de cabra tiene un cuello de descarga LATERAL y cuerpo
 * asimétrico. Su sección NO es una cuña recta con una muesca decorativa.
 *
 * Coordenadas de trabajo: y=0 es la punta, y=H el plano nominal del
 * hombro/amarre. En la foto del operario H=100 desde ese hombro inferior,
 * NO la altura del cabezal de la plegadora. La imagen permite acotar 50 mm
 * de alcance horizontal y R1; los enlaces sin cota se interpolan.
 */
/**
 * Sección orientativa trazada del croquis 50 × 100 R1 del operario.
 *
 * La cota VERTICAL 100 NO llega al extremo superior del vástago:
 * termina en el escalón (aprox. y=100 desde la punta), mientras que
 * el vástago se prolonga por encima. La prolongación ≈37 mm y los
 * puntos intermedios proceden de proporciones de la fotografía;
 * NO son cotas de fabricante.
 *
 * El ancho de 50 mm va del plano del ala izquierda x=-40,5
 * al plano derecho del vástago x=+9,5. La altura de la figura es
 * H útil + prolongación. La punta sigue conservando un radio R1.
 */
export function photoGooseneckOutline(tool,{height,tipRadius,noseArc}){
 const workingHeight=height;
 const projectedExtension=Math.max(0,Number(tool.headProjection)||37);
 const overallHeight=workingHeight+projectedExtension;
 const span=Number(tool.referenceSpan)||Number(tool.topWidth)||50;
 const rightX=9.5,leftX=rightX-span;
 const stemLeft=-11,neckX=-21;
 const points=[
  [stemLeft,overallHeight],[rightX,overallHeight],
  [rightX,workingHeight*.84],[neckX,workingHeight*.745],
  [neckX,workingHeight*.54],[noseArc[0][0],noseArc[0][1]],
  ...noseArc.slice(1),
  [leftX,workingHeight*.42],[leftX,workingHeight*.97],
  [stemLeft,workingHeight*.97]
 ];
 return {points,height:overallHeight,workingHeight,
  headProjection:projectedExtension,headSpan:span,
  nominalReferenceY:workingHeight,neckOffset:Math.abs(neckX),
  model:'gooseneck',profileSource:'user-photo',
  dimensionsFromPhoto:true};
}
export function gooseneckOutline(tool,{height,tipRadius,angle,noseArc}){
 const photo=tool.profileStyle==='user-photo';
 if(photo)return photoGooseneckOutline(tool,{height,tipRadius,noseArc});
 const widthCode=/W(55|95|110)/i.exec(String(tool.reference||tool.id||''));
 const wCode=widthCode?Number(widthCode[1]):0;
 // La variante W del catálogo da formas distintas, pero sin CAD acotado
 // del fabricante sólo son ilustraciones, nunca holguras verificadas.
 const leftReach=photo?42:
  wCode?Math.min(56,26+wCode*.20):
  Math.min(44,Math.max(26,height*.27));
 const rightReach=photo?8:Math.max(9,Math.min(19,height*.11));
 const neck=photo?20:
  Number.isFinite(Number(tool.neckOffset))&&Number(tool.neckOffset)>0?
   Number(tool.neckOffset):Math.min(19,Math.max(11,height*.075));
 // No transformar la cota de cuello conocida: GN6=6 y GN9=9.
 const innerX=-neck;
 const shelfY=height*.84;
 const recessTopY=height*.74;
 const recessBottomY=height*.45;
 const leftShoulderY=height*.41;
 const beta=angle*Math.PI/360;
 const tangentX=tipRadius*Math.cos(beta);
 const tangentY=tipRadius*(1-Math.sin(beta));
 // Mantener una única cavidad abierta a la derecha del cuerpo y un
 // segmento macizo a la izquierda: la silueta nunca se autointerseca.
 const points=[
  [-leftReach,height],[rightReach,height],
  [rightReach,shelfY],[innerX,recessTopY],
  [innerX,recessBottomY],[tangentX,tangentY],
  ...noseArc.slice(1),[-leftReach,leftShoulderY]
 ];
 return {points,neckOffset:neck,headSpan:leftReach+rightReach,
  height,workingHeight:height,headProjection:0,model:'gooseneck',
  profileSource:'parametric'};
}
/** Todos los visores de herramienta usan ESTA misma poligonal (2D, 3D,
 * cabina, inspector y análisis de sección de colisiones).
 */
export function sectionPunch(tool={}){
 if(tool.importedDxf&&Array.isArray(tool.profilePoints)&&tool.profilePoints.length>=3){
  return {points:tool.profilePoints.map(p=>[...p]),
   angle:Number(tool.angle),height:Number(tool.height),
   tipRadius:Number(tool.tip)/2,roundedNose:false,
   provisional:true,importedDxf:true};
 }
 const declaredHeight=Number(tool.height);
 const height=Number.isFinite(declaredHeight)&&declaredHeight>0?declaredHeight:120;
 const angle=Math.min(120,Math.max(15,Number(tool.angle)||88));
 // En el catálogo tip es Ø, no radio: la foto R1 necesita tip=Ø2.
 const tipDiameter=Math.max(.25,Number(tool.tip)||.8);
 const tipRadius=tipDiameter/2;
 const beta=angle*Math.PI/360;
 const tangentX=tipRadius*Math.cos(beta);
 const tangentY=tipRadius*(1-Math.sin(beta));
 // Arco de la punta tangente a los DOS flancos nominales.
 const noseArc=Array.from({length:17},(_,i)=>{
  const theta=-beta-(Math.PI-2*beta)*i/16;
  return [tipRadius*Math.cos(theta),tipRadius*(1+Math.sin(theta))];
 });
 if(tool.type==='cabra'||tool.profileStyle==='user-photo'){
  const goose=gooseneckOutline(tool,{height,tipRadius,angle,noseArc});
  return {...goose,angle,tipRadius,roundedNose:true,
   provisional:true,profileAccuracy:'provisional'};
 }
 // Conservar la punta y los ángulos de los punzones rectos existentes.
 const halfTop=Math.min(22,tangentX+Math.max(0,height-4-tangentY)*Math.tan(beta));
 const bodyBottom=tangentY+(halfTop-tangentX)/Math.tan(beta);
 const points=[
  [-halfTop,height],[halfTop,height],
  [halfTop,bodyBottom],...noseArc,[-halfTop,bodyBottom]
 ];
 return {points,angle,height,tipRadius,roundedNose:true,
  provisional:tool.profileAccuracy!=='verified'};
}
export function sectionDie(tool={}){
 if(tool.importedDxf&&Array.isArray(tool.profilePoints)&&tool.profilePoints.length>=3){
  const opening=Number(tool.opening),angle=Number(tool.angle),height=Number(tool.height);
  // El DXF aporta el contorno. V/ángulo son metadatos declarados,
  // su profundidad geométrica sólo se estima; no se certifica contacto.
  return {points:tool.profilePoints.map(p=>[...p]),
   opening,angle,height,depth:opening/2/Math.tan(angle*Math.PI/360),
   shoulderRadius:0,roundedShoulders:false,
   provisional:true,importedDxf:true};
 }
 const opening=Math.max(4,Number(tool.opening)||16);
 const angle=Math.min(120,Math.max(20,Number(tool.angle)||88));
 const height=Math.max(25,Number(tool.height)||80);
 const halfOpen=opening/2;
 const depth=halfOpen/Math.tan(angle*Math.PI/360);
 const halfBody=Number(tool.outerWidth)>opening ? Number(tool.outerWidth)/2 : Math.max(opening*.98,halfOpen+9);
 const h=Math.max(height,depth+7);
 const specifiedRadius=Number(tool.shoulderRadius);
 const beta=angle*Math.PI/360;
 // Radios sólo cuando figuran en la ficha. El punto de intersección de
 // flancos sigue siendo V nominal; los redondeos recortan su hombro agudo.
 const rawRadius=Number.isFinite(specifiedRadius)&&specifiedRadius>0?specifiedRadius:0;
 const cornerAngle=Math.PI/2-beta;
 const geometricMax=Math.min((halfBody-halfOpen)*.8,depth*.8)/
     Math.tan(cornerAngle/2);
 const shoulderRadius=Math.min(rawRadius,Math.max(0,geometricMax));
 let points;
 if(shoulderRadius>0){
  const dist=shoulderRadius*Math.tan(cornerAngle/2);
  const cx=-halfOpen-dist,cy=h-shoulderRadius;
  const leftArc=Array.from({length:9},(_,i)=>{
   const theta=Math.PI/2-(Math.PI/2-beta)*i/8;
   return [cx+shoulderRadius*Math.cos(theta),
     cy+shoulderRadius*Math.sin(theta)];
  });
  const rightArc=leftArc.slice().reverse().map(([x,y])=>[-x,y]);
  points=[[-halfBody,h],...leftArc,[0,h-depth],...rightArc,
   [halfBody,h],[halfBody,0],[-halfBody,0]];
 }else{
  points=[[-halfBody,h],[-halfOpen,h],[0,h-depth],
   [halfOpen,h],[halfBody,h],[halfBody,0],[-halfBody,0]];
 }
 return {points,opening,angle,height:h,depth,shoulderRadius,
  roundedShoulders:shoulderRadius>0,
  provisional:tool.profileAccuracy!=='verified'};
}
export function sectionBounds(points){
 return {
  minX:Math.min(...points.map(x=>x[0])),
  maxX:Math.max(...points.map(x=>x[0])),
  minY:Math.min(...points.map(x=>x[1])),
  maxY:Math.max(...points.map(x=>x[1]))
 };
}
