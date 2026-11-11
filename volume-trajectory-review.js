/**
 * PlegadoX R31: barrido temporal de cuerpos extruidos en anchura (2,5D).
 * Inspecciona todas las operaciones y los cambios de fase; los intervalos
 * entre muestras permanecen SIN VALIDAR. No ordena maniobras CNC.
 */
import {normalized} from './engine.js';
import {technicalScene} from './technical-section.js';
import {inspectVolumeFrame} from './volume-engine.js';
const kinds=['ram','bed','gauge','punch','die'];
const bounded=(n,lo,hi,fallback)=>Number.isFinite(Number(n))?
 Math.max(lo,Math.min(hi,Math.trunc(Number(n)))):fallback;
function bounds(prism){
 if(!prism?.valid)return null;
 const xs=prism.polygon.map(p=>p.x),ys=prism.polygon.map(p=>p.y);
 return {minX:Math.min(...xs),maxX:Math.max(...xs),
  minY:Math.min(...ys),maxY:Math.max(...ys),
  minZ:prism.zMin,maxZ:prism.zMax};
}
const union=(a,b)=>!a?b:!b?a:{
 minX:Math.min(a.minX,b.minX),maxX:Math.max(a.maxX,b.maxX),
 minY:Math.min(a.minY,b.minY),maxY:Math.max(a.maxY,b.maxY),
 minZ:Math.min(a.minZ,b.minZ),maxZ:Math.max(a.maxZ,b.maxZ)
};
const crosses=(a,b,margin=.02)=>a&&b&&
 Math.min(a.maxX,b.maxX)-Math.max(a.minX,b.minX)>margin&&
 Math.min(a.maxY,b.maxY)-Math.max(a.minY,b.minY)>margin&&
 Math.min(a.maxZ,b.maxZ)-Math.max(a.minZ,b.minZ)>margin;
const perOpTimes=(op,count)=>{
 const values=new Set([0,.16,.36,.68,.84,1-1e-7]);
 for(let i=0;i<=count;i++)values.add(Math.min(1-1e-7,i/count));
 return [...values].sort((a,b)=>a-b).map(t=>op*5+t*5);
};
export function scanVolumeTrajectory(input,options={}){
 const p=normalized(input);
 const perOperation=bounded(options.samplesPerOperation,4,50,8);
 const inspect=options.inspect||((part,time)=>inspectVolumeFrame(
  technicalScene(part,time),{machine:options.machine}));
 const ops=[],allEvents=[];
 let uncheckedSwept=0,framesChecked=0;
 for(let op=0;op<p.order.length;op++){
  const times=perOpTimes(op,perOperation),events=[];
  let previous=null;
  for(const time of times){
   const frame=inspect(p,time);
   framesChecked++;
   const kindsHit=new Set(frame.issues?.map(issue=>issue.kind)||[]);
   for(const issue of frame.issues||[]){
    // Cada choque se atribuye al golpe y al instante (no al perfil final).
    if(!kinds.includes(issue.kind))continue;
    const event={operation:op,bend:p.order[op],time,
     kind:issue.kind,severity:issue.severity,
     segment:issue.segment,volumeMm3:issue.volumeMm3,
     evidence:issue.evidence,verified:false};
    events.push(event);
    if(allEvents.length<200)allEvents.push(event);
   }
   // AABB barrido conservador: avisa si las posiciones extremas no
   // colisionan pero las envolventes del intervalo se superponen.
   // Esto NO prueba que haya contacto en un punto intermedio.
   const model=frame.model;
   if(previous?.model&&model){
    const sheetSweep=union(
     previous.model.sheet.reduce((b,s)=>union(b,bounds(s)),null),
     model.sheet.reduce((b,s)=>union(b,bounds(s)),null));
    for(const kind of ['ram','bed','gauge']){
     const moving=union(bounds(previous.model.objects[kind]),
      bounds(model.objects[kind]));
     if(!kindsHit.has(kind)&&!previous.kindsHit.has(kind)&&crosses(sheetSweep,moving)){
      const event={operation:op,bend:p.order[op],time,
       kind,severity:'intervalo-barrido-no-resuelto',segment:null,
       volumeMm3:null,evidence:'envolventes AABB temporales, sin trayectoria CNC',
       verified:false};
      events.push(event);
      if(allEvents.length<200)allEvents.push(event);
      uncheckedSwept++;
     }
    }
   }
   previous={model,kindsHit};
  }
  const occurrences=new Map();
  for(const ev of events)
   if(!occurrences.has(ev.kind)||occurrences.get(ev.kind).severity==='intervalo-barrido-no-resuelto')
    occurrences.set(ev.kind,ev);
  ops.push({operation:op,bend:p.order[op],samples:times.length,
   earliest:events[0]||null,findings:[...occurrences.values()],
   possibleInterference:events.length>0,
   modelPenetration:events.some(e=>
    ['ram','bed','gauge'].includes(e.kind)&&
    e.severity==='interferencia-envolvente'),
   checkedFrom:times[0],checkedTo:times.at(-1),verified:false});
 }
 const byKind={ram:0,bed:0,gauge:0,punch:0,die:0};
 for(const row of ops)for(const f of row.findings)byKind[f.kind]++;
 return {operations:ops,framesChecked,byKind,
  warningCount:ops.filter(o=>o.possibleInterference).length,
  modeledMachineWarnings:byKind.ram+byKind.bed+byKind.gauge,
  uncertainSweptIntervals:uncheckedSwept,
  status:'VOLUMENES_PARAMETRICOS_SIN_VALIDACION_CAD_CNC',
  source:'Cotas V85 Cybelec del usuario + perfiles esquemáticos extruidos en Z',
  verified:false,continuousCollisionVerified:false,canApproveForMachine:false,
  limitations:'El cálculo compara volúmenes 2,5D extruidos y posiciones muestreadas; no incorpora topología OEM de mesa/trancha/mordazas, ubicaciones Z de dedos, ejes CNC reales, sólidos STEP ni reorientación manual validada. No permite certificar que un programa sea seguro.'};
}
