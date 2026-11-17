/** R127 · semáforo de sección y profundidad real del dedo, sin certificar CNC. */
import {gaugeRiskStatus} from './gauge-risk-status.js';
import {assessGaugeDepth} from './machine-gauge-depth.js';
export function describeGaugeVisualEvidence(placement,gauge,sheet=null,fingers=null){
 const planar=gaugeRiskStatus(placement);
 const fingerDepths=Array.isArray(fingers)&&fingers.length===2?
  fingers.map(finger=>assessGaugeDepth(sheet,finger)):null;
 const oldDepth=assessGaugeDepth(sheet,gauge);
 const depth=fingerDepths?
  {...oldDepth,knownZ:true,
   contactAvailable:fingerDepths.some(d=>d.contactAvailable===true)?true:
    fingerDepths.every(d=>d.contactAvailable===false)?false:null,
   overlapMm:Math.max(...fingerDepths.map(d=>d.overlapMm||0)),
   fingers:fingerDepths}:oldDepth;
 const outside=depth.contactAvailable===false;
 // Un contorno que atraviesa la chapa en XY NO equivale a choque 3D
 // si ambos sólidos CAD se encuentran fuera de la misma banda Z.
 // Pero tampoco puede ofrecer apoyo en ese montaje: nunca verde.
 const level=outside?'amber':planar.level;
 const label=level==='red'?'ROJO':level==='green'?'VERDE':'NARANJA';
 const planarLabel=planar.level==='red'?'roja':
  planar.level==='green'?'verde':'naranja';
 const base=label+' · '+(outside?
  'DEDO FUERA DEL ANCHO DE CHAPA EN Z · NO PUEDE SERVIR DE TOPE EN ESTA POSE':
  planar.message)+
  (planar.code?' · motivo 2D: '+planar.code:'')+
  ' · diagnóstico de sección 2D'+
  (outside?' ('+planarLabel+', sin coincidencia transversal real)':'')+'.';
 const cross=outside?
  'Perfil CAD declarado en Z sin solape con la chapa: no hay penetración volumétrica de estos prismas en esta pose, pero tampoco contacto de apoyo.':
  depth.contactAvailable===true?
  'Perfil CAD con intervalos Z solapados '+depth.overlapMm.toFixed(2)+
   ' mm; geometría y montaje SIN validación CNC.':
  depth.knownZ?
  'Existe perfil CAD DXF importado con Z incompleta; el montaje sigue sin verificar físicamente y no puede comprobarse la coincidencia transversal.':
  'Z real del dedo no documentada: el visor usa una envolvente provisional de toda la anchura; el solape aparente no demuestra colisión 3D.';
 const pairNote=fingerDepths?' · Dos dedos independientes en pose de referencia: '+
  fingerDepths.map((d,i)=>'Z'+(i+1)+' '+
   (d.contactAvailable===true?d.overlapMm.toFixed(2)+' mm de banda Z común':
    d.contactAvailable===false?'fuera de anchura de chapa':'sin Z comprobable')
  ).join(' · ')+'. No equivale a trayectoria CNC durante el plegado.':'';
 return {level,code:outside?'tope-fuera-de-z':planar.code||'sin-incidencia-2d',
  knownZ:depth.knownZ,depth,planarLevel:planar.level,
  message:base+' '+cross+pairNote,verified:false};
}
