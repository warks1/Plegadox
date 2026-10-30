/**
 * Plegadox: exportación 2D en DXF ASCII R12 con entidades LINE.
 * NO exporta CNC, utillajes ni planos CAD certificados.
 * Los perfiles incluyen líneas interpoladas para radios aproximados;
 * el desarrollo permite marcas separadas NO CORTE (sin agujeros).
 */
import {normalized,development} from './engine.js';
import {viewerProfile} from './viewer-profile.js';
import {flatBendLayout} from './flat-layout.js';

const num=n=>{
 if(!Number.isFinite(n))throw new RangeError('Coordenada DXF no finita');
 return String(Number(n.toFixed(5)));
};
const pair=(code,value)=>[String(code),String(value)];
const line=(a,b,layer='PERFIL_APROX')=>[
 ...pair(0,'LINE'),...pair(8,layer),
 ...pair(10,num(a.x)),...pair(20,num(a.y)),...pair(30,'0'),
 ...pair(11,num(b.x)),...pair(21,num(b.y)),...pair(31,'0')
];
const note=(text,x,y)=>[
 ...pair(0,'TEXT'),...pair(8,'NOTAS_NO_CORTE'),
 ...pair(10,num(x)),...pair(20,num(y)),...pair(30,'0'),
 ...pair(40,'5'),...pair(1,text),...pair(50,'0')
];
function dxf(lines,kind){
 const layerNames=['PERFIL_APROX','DESARROLLO_APROX','PLEGADOS_NO_CORTE','NOTAS_NO_CORTE'];
 const data=[
  ...pair(0,'SECTION'),...pair(2,'HEADER'),
  ...pair(9,'$ACADVER'),...pair(1,'AC1009'),
  ...pair(9,'$LUNITS'),...pair(70,'2'),
  ...pair(9,'$LUPREC'),...pair(70,'3'),
  ...pair(0,'ENDSEC'),
  ...pair(0,'SECTION'),...pair(2,'TABLES'),
  ...pair(0,'TABLE'),...pair(2,'LAYER'),...pair(70,String(layerNames.length)),
  ...layerNames.flatMap((name,i)=>[
   ...pair(0,'LAYER'),...pair(2,name),...pair(70,'0'),
   ...pair(62,String(i===2?4:i===3?2:7)),...pair(6,'CONTINUOUS')]),
  ...pair(0,'ENDTAB'),...pair(0,'ENDSEC'),
  ...pair(999,'PLEGADOX - '+kind+' - ESTIMACION NO VERIFICADA - mm'),
  ...pair(0,'SECTION'),...pair(2,'ENTITIES'),
  ...lines.flat(),...pair(0,'ENDSEC'),...pair(0,'EOF')];
 return data.join('\r\n')+'\r\n';
}
export function exportProfileDXF(raw){
 const piece=normalized(raw);
 const pts=viewerProfile(piece,piece.angles.map(()=>1)).points;
 if(pts.length<2)throw new RangeError('No hay perfil suficiente');
 const lines=[];
 for(let i=0;i<pts.length-1;i++){
  const a=pts[i],b=pts[i+1];
  if(Math.hypot(a.x-b.x,a.y-b.y)>1e-7)lines.push(line(a,b));
 }
 const low=Math.min(...pts.map(p=>p.y));
 lines.push(note('PERFIL 2D APROX - NO CAD CERTIFICADO',0,low-20));
 return dxf(lines,'PERFIL PLEGADO');
}
/** Marcadores con ángulo y orden, SIEMPRE en capa distinta NO CORTE. */
export function exportFlatDXF(raw,options={}){
 const layout=flatBendLayout(raw);
 const {length,width}=layout;
 const corners=[{x:0,y:0},{x:length,y:0},{x:length,y:width},
  {x:0,y:width}];
 const entities=corners.map((p,i)=>line(p,corners[(i+1)%4],'DESARROLLO_APROX'));
 if(options.includeBends!==false){
  for(const fold of layout.folds){
   if(Math.abs(fold.angle)<1e-7)continue;
   entities.push(line({x:fold.position,y:0},{x:fold.position,y:width},
    'PLEGADOS_NO_CORTE'));
   const signed=(fold.angle>0?'+':'')+fold.angle;
   entities.push(note('G'+fold.operation+' P'+(fold.bend+1)+' '+signed+
    'deg X='+num(fold.position)+'mm - NO CORTE',fold.position,
    width+10+(fold.operation-1)*8));
  }
 }
 entities.push(note('DESARROLLO ESTIMADO - NO CORTAR SIN VERIFICAR',0,-20));
 return dxf(entities,'RECTANGULO DESARROLLADO');
}
