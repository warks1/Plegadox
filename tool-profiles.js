/**
 * PLEGADOX — perfiles paramétricos en milímetros para visualización.
 * No son planos de fabricante. No deben utilizarse para fabricar herramientas
 * ni para validar colisiones. Ángulo = ángulo INCLUIDO de la punta y de la V.
 */
export function sectionPunch(tool={}){
 const height=Math.max(50,Number(tool.height)||120);
 const angle=Math.min(120,Math.max(15,Number(tool.angle)||88));
 const radius=Math.max(.25,Number(tool.tip)||.8);
 // El ancho superior se ajusta si un punzón bajo y muy agudo no admite
 // una sección de 44 mm; se conserva el ángulo incluido de la punta.
 const halfTip=Math.min(4,radius*.5);
 const halfTop=Math.min(22,halfTip+(height-4)*Math.tan(angle*Math.PI/360));
 const taperHeight=(halfTop-halfTip)/Math.tan(angle*Math.PI/360);
 const bodyBottom=taperHeight;
 let points;
 if(tool.profileStyle==='user-photo'){
  // Contorno trazado proporcionalmente del ejemplo gráfico enviado al chat.
  // La zona cuadriculada de la imagen es espacio libre, NO material de útil.
  // El valor "8" de la zona inclinada no se convierte sin interpretación
  // en una cota certificada del punzón.
  const w=Number(tool.topWidth)||50,scaleX=w/50,scaleY=height/100;
  points=[
   [-10,100],[8,100],[8,60],[-16,52],[-16,31],
   [0,0],[-42,31],[-42,72],[-10,72]
  ].map(([x,y])=>[x*scaleX,y*scaleY]);
 }else if(tool.type==='cabra'){
  // Pata de cabra: el hueco lateral forma una concavidad REAL en el polígono.
  // CONIC GN9/GN6 publican el desplazamiento k=9/6 mm, H=90/120 y
  // ángulo/R de punta. Otros empalmes permanecen parametrizados.
  const neckOffset=Math.max(4,Math.min(18,Number(tool.neckOffset)||9));
  const shoulderY=Math.max(bodyBottom+19,height*.48);
  const recessY=Math.max(shoulderY+9,height*.72);
  const outerW=Math.max(18,halfTop+3);
  const rearW=outerW+7;
  points=[
   [-rearW,height],[13,height],
   [13,height-20],[-neckOffset,height-20],
   [-neckOffset,recessY],[outerW,recessY],
   [outerW,shoulderY],[halfTop,shoulderY],
   [halfTop,bodyBottom],[halfTip,0],[-halfTip,0],
   [-halfTop,bodyBottom],[-halfTop,shoulderY-9],
   [-rearW,shoulderY-9],[-rearW,height]
  ];
 }else{
  points=[
   [-halfTop,height],[halfTop,height],
   [halfTop,bodyBottom],[halfTip,0],[-halfTip,0],[-halfTop,bodyBottom]
  ];
 }
 return {points,angle,height,tipRadius:radius/2,provisional:tool.profileAccuracy!=='verified'};
}
export function sectionDie(tool={}){
 const opening=Math.max(4,Number(tool.opening)||16);
 const angle=Math.min(120,Math.max(20,Number(tool.angle)||88));
 const height=Math.max(25,Number(tool.height)||80);
 const halfOpen=opening/2;
 const depth=halfOpen/Math.tan(angle*Math.PI/360);
 const halfBody=Number(tool.outerWidth)>opening ? Number(tool.outerWidth)/2 : Math.max(opening*.98,halfOpen+9);
 const h=Math.max(height,depth+7);
 return {
  points:[
   [-halfBody,h],[-halfOpen,h],[0,h-depth],
   [halfOpen,h],[halfBody,h],[halfBody,0],[-halfBody,0]
  ],
  opening,angle,height:h,depth,provisional:tool.profileAccuracy!=='verified'
 };
}
export function sectionBounds(points){
 return {
  minX:Math.min(...points.map(x=>x[0])),
  maxX:Math.max(...points.map(x=>x[0])),
  minY:Math.min(...points.map(x=>x[1])),
  maxY:Math.max(...points.map(x=>x[1]))
 };
}
