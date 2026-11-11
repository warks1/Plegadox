/**
 * Referencia fotográfica Cybelec, NO longitud plana medida en taller.
 * Dos controles muestran el mismo L DIN: 233,94 mm.
 * Los números CARA/N recorren la geometría, no prueban el orden de golpes.
 */
import {development,normalized,getTooling} from './engine.js';

export const CYBELEC_OMEGA=Object.freeze({
 flanges:Object.freeze([50,50,50,50,50]),
 angles:Object.freeze([90,-90,-90,90]),
 thickness:2,
 dieOpening:16,
 dieAngle:30,
 photographedRadius:2.63,
 referenceDIN:233.94,
 photographedToolIds:Object.freeze(['1-835','1238_28']),
 userBendOrder:Object.freeze([0,1,3,2])
});

/** K equivalente para la MISMA convención de cota exterior del motor. */
export function equivalentKForCybelec(){
 const c=CYBELEC_OMEGA,rad=Math.PI/2,t=c.thickness,r=c.photographedRadius;
 const nominal=c.flanges.reduce((a,b)=>a+b,0);
 const bd=(nominal-c.referenceDIN)/c.angles.length;
 return (2*(r+t)-bd-rad*r)/(rad*t);
}

export function cybelecReferencePreset(){
 return normalized({
  name:'Omega · referencia Cybelec (DIN nominal)',
  material:'s235', // Acero genérico: grado real SIN identificar en las fotografías
  thickness:CYBELEC_OMEGA.thickness,width:500,
  die:'v16-30', // Perfil parametrizado: NO confundir con V16_30_ física de la foto
  punch:'straight30', // Perfil de ejemplo, NO equivalente certificado a 1-835 / 1238_28
  flanges:[...CYBELEC_OMEGA.flanges],
  angles:[...CYBELEC_OMEGA.angles],
  order:[...CYBELEC_OMEGA.userBendOrder],
  radius:CYBELEC_OMEGA.photographedRadius,
  kFactor:equivalentKForCybelec(),
  datum:'outside',
  gaugeSideByBend:['before','before','before','after']
 });
}

export function compareCybelecOmega(piece){
 const p=normalized(piece),c=CYBELEC_OMEGA,{die}=getTooling(p);
 const sameGeometry=p.flanges.length===c.flanges.length&&
  p.flanges.every((x,i)=>Math.abs(x-c.flanges[i])<1e-6)&&
  p.angles.every((x,i)=>x===c.angles[i])&&
  Math.abs(p.thickness-c.thickness)<1e-6;
 const compatibleDie=die.opening===c.dieOpening&&die.angle===c.dieAngle;
 const result=development(p);
 return {
  sameGeometry,compatibleDie,
  comparable:sameGeometry&&compatibleDie&&p.datum==='outside',
  expected:c.referenceDIN,
  estimated:result.length,
  delta:result.length-c.referenceDIN,
  radius:result.radius,k:result.k,
  referenceRadius:c.photographedRadius,
  referenceKEquivalent:equivalentKForCybelec(),
  geometryOrder:p.angles.map((angle,i)=>({bend:i+1,angle})),
  executionOrder:p.order.map((bend,i)=>({operation:i+1,bend:bend+1,angle:p.angles[bend]}))
 };
}
