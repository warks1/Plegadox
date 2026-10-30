/**
 * PLEGADOX — perfiles paramétricos en milímetros para visualización.
 * No son planos de fabricante. No deben utilizarse para fabricar herramientas
 * ni para validar colisiones. Ángulo = ángulo INCLUIDO de la punta y de la V.
 */
export function sectionPunch(tool={}){
 const height=Math.max(50,Number(tool.height)||120);
 const angle=Math.min(120,Math.max(15,Number(tool.angle)||88));
 const radius=Math.max(.25,Number(tool.tip)||.8);
 const halfTop=22,halfTip=Math.min(halfTop*.4,radius*.5);
 const taperHeight=(halfTop-halfTip)/Math.tan(angle*Math.PI/360);
 const bodyBottom=Math.min(height-4,taperHeight);
 let points;
 if(tool.type==='cabra'){
  const clearance=Math.min(height*.42,48);
  const neck=5;
  const shelfY=Math.max(25,bodyBottom+5);
  points=[
   [-24,height],[24,height],[24,height-17],[-9,height-17],
   [-9,height-17-clearance],[21,height-17-clearance],
   [21,shelfY],[halfTop,shelfY],[halfTop,bodyBottom],
   [halfTip,0],[-halfTip,0],[-halfTop,bodyBottom],
   [-halfTop,shelfY-12],[-31,shelfY-12],
   [-31,height-12],[-24,height-12]
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
 const halfBody=Math.max(opening*.98,halfOpen+9);
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
