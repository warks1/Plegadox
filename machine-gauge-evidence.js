/** R126 · semáforo 2D separado de evidencia volumétrica Z del tope. */
import {gaugeRiskStatus} from './gauge-risk-status.js';
export function describeGaugeVisualEvidence(placement,gauge){
 const risk=gaugeRiskStatus(placement);
 const color=risk.level==='red'?'ROJO':risk.level==='green'?'VERDE':'NARANJA';
 const statement=color+' · '+risk.message+
  (risk.code?' · motivo: '+risk.code:'')+' · diagnóstico de sección 2D.';
 const knownZ=typeof gauge?.provenance==='string'&&
  gauge.provenance.startsWith('perfil CAD importado ');
 const depth=knownZ?
  'Existe Z declarada por DXF, pero el CAD y su montaje siguen sin verificar físicamente.':
  'Z real del dedo no documentada: el visor usa una envolvente provisional de toda la anchura; el solape aparente no demuestra colisión 3D.';
 return {level:risk.level,code:risk.code||'sin-incidencia-2d',knownZ,
  message:statement+' '+depth,verified:false};
}
