/** R127 · ocultar objetos del visor NO altera ni los avisos ni el motor. */
export function visibleVolumeFaces(faces,view={}){
 if(!Array.isArray(faces))return [];
 const groups={
  sheet:'showSheet',punch:'showPunch',die:'showDie',
  ram:'showRam',upperClamp:'showRam',upperAdapter:'showRam',
  gauge:'showGauge',gaugeZ1:'showGauge',gaugeZ2:'showGauge',lowerClamp:'showDie',lowerAdapter:'showDie'
 };
 return faces.filter(face=>{
  const key=groups[face.kind];
  return !key||view[key]!==false;
 });
}
