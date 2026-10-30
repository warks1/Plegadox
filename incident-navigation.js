/**
 * Navegación de incidencias 2D por operación REAL, no por índice de pliegue.
 * Usa el ejemplo seleccionado por inspectSequenceTools: el de mayor
 * gravedad de las muestras, NO necesariamente el primero cronológicamente.
 * Nunca presenta ausencia de avisos como certificación de seguridad.
 */
import {normalized} from './engine.js';
export function incidentReviewRows(piece,geometry,toolReview){
 const p=normalized(piece);
 return p.order.map((bend,operation)=>{
  const op=toolReview?.operations?.[operation]||null;
  const geometryOp=geometry?.perOperation?.[operation]||null;
  const signedAngle=p.angles[bend];
  const geometricIssue=geometry?.issues?.find(x=>x.bend===bend&&x.level==='warning');
  const category=op?.example?.category||(
   geometryOp?.toolAngleWarning||geometryOp?.vSupportWarning||geometryOp?.potentialInterference||geometricIssue?
    'geometry':'none');
  const tool=op?.example?.kind==='punch'?'punzón':
    op?.example?.kind==='die'?'matriz':null;
  const summary=category==='penetration'?'Posible penetración de chapa en '+tool:
   category==='clearance'?'Posible holgura insuficiente con '+tool:
    category==='geometry'?(geometricIssue?.message||'Revisar geometría y útiles'):
     'Sin aviso 2D en muestras; comprobación física pendiente';
  const exampleTime=Number(op?.exampleTime);
  const hasToolSample=op?.example&&Number.isFinite(exampleTime);
  const time=hasToolSample?exampleTime:operation*5+2.7;
  return {operation,bend,angle:signedAngle,category,
   time,hasToolSample:Boolean(hasToolSample),
   checkedSamples:op?.samples??0,summary,verified:false};
 });
}
