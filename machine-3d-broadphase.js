/**
 * R31 · criba volumétrica CONSERVADORA mediante cajas envolventes 3D.
 * No sustituye CAD exacto ni un comprobador de triángulos/sólidos.
 *
 * Para cada intervalo se usa la unión de las cajas de los extremos:
 * detecta también un posible choque oculto entre dos poses. Con giros o
 * trayectorias no lineales, esa unión no cubre necesariamente el recorrido.
 * Jamás devuelve un certificado de ausencia de colisión.
 */
const REQUIRED=['sheet','punch','die','ram','bed','punchHolder',
 'dieHolder','backgauge'];
const PAIRS=[
 ['sheet','punch'],['sheet','die'],['sheet','ram'],['sheet','bed'],
 ['sheet','punchHolder'],['sheet','dieHolder'],['sheet','backgauge']
];
const axes=['x','y','z'];
export const REQUIRED_3D_COMPONENTS=Object.freeze([...REQUIRED]);

function readPoint(pt){
 const arr=Array.isArray(pt)?pt:axes.map(key=>pt?.[key]);
 if(!arr||arr.length!==3||!arr.every(n=>Number.isFinite(Number(n))))
  throw Error('Vértice de sólido 3D inválido');
 return arr.map(Number);
}
export function boundingBox3D(vertices){
 if(!Array.isArray(vertices)||vertices.length<4)
  throw Error('Sólido 3D: faltan vértices (mínimo cuatro)');
 const xyz=vertices.map(readPoint);
 return {min:axes.map((_,i)=>Math.min(...xyz.map(p=>p[i]))),
  max:axes.map((_,i)=>Math.max(...xyz.map(p=>p[i])))};
}
export function sweepBoundingBoxes(first,second){
 if(!first||!second||!first.min||!second.min)
  throw Error('Cajas envolventes 3D no disponibles');
 return {min:axes.map((_,i)=>Math.min(first.min[i],second.min[i])),
  max:axes.map((_,i)=>Math.max(first.max[i],second.max[i]))};
}
export function boxesOverlap3D(a,b,margin=0){
 if(!a||!b)return null;
 const m=Math.max(0,Number(margin)||0);
 return axes.every((_,i)=>a.min[i]<=b.max[i]+m&&
  b.min[i]<=a.max[i]+m);
}
export function reviewMachine3DSweep(frames=[],options={}){
 const required=options.required||REQUIRED;
 const pairs=options.pairs||PAIRS;
 const absent=new Set(),provisional=[];
 if(!Array.isArray(frames)||frames.length<2)
  return {status:'DATOS_3D_INSUFICIENTES',missing:['Dos o más poses 3D con geometría real'],
   possibleContacts:[],verified:false,canApproveForMachine:false};
 for(const name of required){
  if(frames.some(frame=>!Array.isArray(frame?.components?.[name]?.vertices)))
   absent.add(name);
 }
 if(absent.size)
  return {status:'DATOS_3D_INSUFICIENTES',missing:[...absent],
   possibleContacts:[],verified:false,canApproveForMachine:false};
 const bounding=frames.map((frame,index)=>{
  const boxes={};
  for(const name of required){
   const part=frame.components[name];
   boxes[name]=boundingBox3D(part.vertices);
   if(part.geometryVerified!==true)provisional.push(name);
  }
  return {time:Number(frame.time??index),boxes};
 });
 const hits=[];
 for(let i=1;i<bounding.length;i++){
  const before=bounding[i-1],after=bounding[i];
  const boxes=Object.fromEntries(required.map(name=>
   [name,sweepBoundingBoxes(before.boxes[name],after.boxes[name])]));
  for(const [a,b] of pairs){
   if(boxesOverlap3D(boxes[a],boxes[b],options.margin??0))
    hits.push({interval:[before.time,after.time],parts:[a,b],
     classification:'POSIBLE_SOLAPE_3D'});
  }
 }
 const incomplete=new Set(provisional);
 // La ausencia de una superposición de cajas sólo es concluyente para
 // la trayectoria modelada; el movimiento físico puede no estar cubierto.
 return {status:incomplete.size?'GEOMETRIA_NO_CERTIFICADA':
  hits.length?'POSIBLE_INTERFERENCIA_3D':'SIN_SOLAPE_DE_CAJA_EN_POSES',
  missing:[...incomplete].map(x=>'CAD/no verificado: '+x),
  possibleContacts:hits,intervalsChecked:bounding.length-1,
  verified:false,canApproveForMachine:false,
  limitations:'Cajas envolventes 3D; no trayectorias CNC verificadas ni prueba '+
   'continua de rotaciones, amarres, deformaciones o contacto real'};
}
