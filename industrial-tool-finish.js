/**
 * PlegadoX R120 · acabado industrial de secciones en vista de taller.
 *
 * SOLO dibuja materiales, brillos, canto fresado y líneas de rectificado
 * SOBRE el polígono recibido. Nunca inventa una V, un cuello de punzón
 * o un taladro que no exista en el DXF importado. Sin implicaciones de
 * contacto o certificación CNC.
 */
const valid=points=>Array.isArray(points)&&points.length>=3&&
 points.every(p=>Array.isArray(p)&&p.length===2&&p.every(Number.isFinite));
export function industrialContourFeatures(points,kind='die'){
 if(!valid(points))throw Error('Perfil de útil 2D inválido');
 if(!['punch','die'].includes(kind))throw Error('Útil desconocido');
 const xs=points.map(p=>p[0]),ys=points.map(p=>p[1]);
 const minX=Math.min(...xs),maxX=Math.max(...xs);
 const minY=Math.min(...ys),maxY=Math.max(...ys);
 const w=Math.max(1e-6,maxX-minX),h=Math.max(1e-6,maxY-minY);
 const band=kind==='die'?minY+h*.63:maxY-h*.63;
 const workingEdges=[];
 for(let i=0;i<points.length;i++){
  const a=points[i],b=points[(i+1)%points.length];
  const dx=b[0]-a[0],dy=b[1]-a[1];
  // Resaltar ÚNICAMENTE aristas que YA existen. No añadir una V
  // imaginaria ni redibujar un perfil de matriz multivía.
  const nearWorkingFace=kind==='die'?
   (Math.min(a[1],b[1])<=band):
   (Math.max(a[1],b[1])>=band);
  if(nearWorkingFace&&Math.hypot(dx,dy)>Math.max(.65,Math.min(w,h)*.008))
   workingEdges.push([a,b]);
 }
 return {bounds:{minX,maxX,minY,maxY,width:w,height:h},
  workingEdges,kind,sourcePoints:points.length};
}
export function drawMachinedToolSection(ctx,points,{
 kind='die',scale=1,transparent=false
}={}){
 const {bounds,workingEdges}=industrialContourFeatures(points,kind);
 const {minX,maxX,minY,maxY,width,height}=bounds;
 const px=Math.max(.65,Math.min(2,Number(scale)||1));
 const poly=()=>{
  ctx.beginPath();
  for(let i=0;i<points.length;i++){
   const p=points[i];if(i)ctx.lineTo(p[0],p[1]);else ctx.moveTo(p[0],p[1]);
  }
  ctx.closePath();
 };
 ctx.save();
 const fill=ctx.createLinearGradient(minX,minY,maxX,minY);
 const stops=kind==='punch'?
  [[0,'#243d50'],[.14,'#6f8899'],[.3,'#e6f0f5'],
   [.44,'#97acba'],[.57,'#f5fafc'],[.72,'#607c8e'],
   [.9,'#c9d9e1'],[1,'#334d60']]:
  [[0,'#1e3344'],[.13,'#50697a'],[.28,'#bfd0dc'],
   [.4,'#8a9eac'],[.54,'#e6eff4'],[.7,'#536b7b'],
   [.88,'#a9becb'],[1,'#273f53']];
 for(const [t,color] of stops)fill.addColorStop(t,color);
 ctx.globalAlpha=transparent?.38:1;
 ctx.shadowColor='rgba(0,11,24,.75)';
 ctx.shadowBlur=14*px;ctx.shadowOffsetY=3*px;
 poly();ctx.fillStyle=fill;ctx.fill();
 ctx.shadowBlur=0;ctx.shadowOffsetY=0;
 poly();ctx.clip();
 // Rectificado longitudinal fino, contenido DENTRO del perfil real.
 // Nunca altera el contorno ni los puntos de contacto.
 ctx.save();ctx.globalAlpha=kind==='punch'?.16:.12;
 const step=Math.max(3.5,Math.min(8,height/22));
 for(let y=minY+2;y<maxY;y+=step){
  ctx.beginPath();ctx.moveTo(minX-2,y);ctx.lineTo(maxX+2,y);
  ctx.strokeStyle=y%2<'1'?'#eaf5ff':'#031b2a';
  ctx.lineWidth=.38*px;ctx.stroke();
 }
 ctx.restore();
 const flash=ctx.createLinearGradient(minX,minY,maxX,maxY);
 flash.addColorStop(0,'rgba(255,255,255,0)');
 flash.addColorStop(.35,'rgba(248,252,255,.06)');
 flash.addColorStop(.52,'rgba(247,252,255,.29)');
 flash.addColorStop(.60,'rgba(248,252,255,.025)');
 flash.addColorStop(1,'rgba(5,20,34,.22)');
 ctx.fillStyle=flash;ctx.fillRect(minX,minY,width,height);
 ctx.restore();
 // Aristas del perfil original: brillo técnico sobre el canto real.
 ctx.save();ctx.globalAlpha=transparent?.32:.8;
 ctx.lineJoin='round';ctx.lineCap='round';
 ctx.strokeStyle=kind==='punch'?'#e4f4fd':'#c5e0ec';
 ctx.lineWidth=.8*px;
 for(const [a,b] of workingEdges){
  ctx.beginPath();ctx.moveTo(a[0],a[1]);ctx.lineTo(b[0],b[1]);ctx.stroke();
 }
 ctx.restore();
 ctx.save();
 ctx.lineJoin='round';poly();
 ctx.strokeStyle=kind==='punch'?'#142b3c':'#122636';
 ctx.lineWidth=1.25*px;ctx.stroke();
 ctx.restore();
 return {bounds,workingEdgeCount:workingEdges.length};
}
