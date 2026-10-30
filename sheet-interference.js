/**
 * Análisis de auto-interferencias de CHAPA en el alzado 2D a cada instante.
 * Distancia entre fibras centrales de tramos NO consecutivos; si la
 * separación es inferior al espesor, hay posible contacto entre volúmenes.
 * NO modela radio real, geometría 3D, holgura de montaje ni deformación.
 */
import {normalized,profile,stage} from './engine.js';
import {inspectProfile} from './validation.js';
const severity=hit=>({cross:4,overlap:3,touch:2,close:1})[hit.kind]||0;
function compare(a,b){
 const sa=severity(a),sb=severity(b);
 if(sa!==sb)return sb-sa;
 if(a.kind==='close'&&b.kind==='close')return a.clearance-b.clearance;
 return a.segments[0]-b.segments[0]||a.segments[1]-b.segments[1];
}
/** Frame determinista que usa exactamente el mismo tiempo que la animación. */
export function inspectSheetFrame(piece,time=0){
 const p=normalized(piece),st=stage(p,time);
 const points=profile(p,st.fractions).points;
 const issues=inspectProfile(points,p.thickness).sort(compare);
 return {time:st.time,operation:st.activeOperation,bend:st.activeBend,
  phase:st.phase,issues,
  hasCross:issues.some(x=>x.kind==='cross'||x.kind==='overlap'),
  hasNear:issues.some(x=>x.kind==='touch'||x.kind==='close'),
  hasWarning:issues.length>0,verified:false};
}
/**
 * Busca avisos durante cada operación, incluido el extremo del golpe.
 * El peor caso por operación prevalece: cruce antes que proximidad y,
 * dentro de las proximidades, menor luz primero.
 */
export function scanSheetSequence(piece,samplesPerOperation=15){
 const p=normalized(piece),samples=Math.max(2,Math.min(50,Math.trunc(samplesPerOperation)||15));
 const operations=[];
 for(let op=0;op<p.order.length;op++){
  let selected=null;
  for(let i=0;i<=samples;i++){
   const time=5*op+(i/samples)*5;
   const frame=inspectSheetFrame(p,time);
   const hit=frame.issues[0];
   if(!hit)continue;
   if(!selected||compare(hit,selected.finding)<0)
    selected={time,phase:frame.phase,finding:hit,segments:hit.segments};
  }
  operations.push({operation:op,bend:p.order[op],
   samples:samples+1,possibleSheetInterference:!!selected,
   possibleCross:['cross','overlap'].includes(selected?.finding?.kind),
   example:selected,exampleTime:selected?.time??null,verified:false});
 }
 return {operations,warningCount:operations.filter(o=>o.possibleSheetInterference).length,
  verified:false,limitations:'Muestreo temporal 2D, sin validación de colisiones 3D ni de radios reales'};
}
export function describeSheetIssue(hit){
 if(!hit)return 'Sin auto-interferencia entre alas no consecutivas detectada en este instante; NO equivale a seguridad verificada.';
 const [a,b]=hit.segments.map(n=>n+1);
 const position=hit.point&&Number.isFinite(hit.point.x)&&Number.isFinite(hit.point.y)?
  ' · punto aproximado X '+Number(hit.point.x.toFixed(2))+
  ' mm, Y '+Number(hit.point.y.toFixed(2))+' mm (fibra media 2D)':'';
 if(hit.kind==='cross')return '⚠ Posible CRUCE entre las alas '+a+' y '+b+
  ' de la chapa en el perfil 2D. Revisar orden y geometría.'+position;
 if(hit.kind==='overlap')return '⚠ Posible SOLAPAMIENTO de alas '+a+' y '+b+
  ' sobre la misma línea en sección 2D. Revisar montaje y secuencia.'+position;
 if(hit.kind==='touch')return '⚠ CONTACTO PUNTUAL entre alas '+a+' y '+b+
  ' en la sección 2D. No se ha detectado que las fibras se atraviesen.'+position;
 return '⚠ Posible PROXIMIDAD entre alas '+a+' y '+b+
  ' de la chapa: luz entre fibras '+hit.clearance+
  ' mm, inferior al espesor nominal. Revisar en máquina.'+position;
}
