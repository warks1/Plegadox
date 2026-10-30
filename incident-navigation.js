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
  const sheet=geometry?.sheetScan?.operations?.[operation];
  const self=sheet?.example?.finding;
  const toolSeverity=op?.example?.category==='penetration'?3:
    op?.example?.category==='clearance'?1:0;
  const selfSeverity=({cross:5,overlap:4,touch:2,close:1.5})[self?.kind]||0;
  const useSheet=selfSeverity>toolSeverity;
  const category=useSheet?({
    cross:'sheet-cross',overlap:'sheet-overlap',touch:'sheet-touch',
    close:'sheet-close'
   })[self.kind]:
    op?.example?.category||(
     geometryOp?.toolAngleWarning||geometryOp?.vSupportWarning||
     geometryOp?.potentialInterference||geometricIssue?'geometry':'none');
  const tool=op?.example?.kind==='punch'?'punzón':
    op?.example?.kind==='die'?'matriz':null;
  const sheetPair=self?.segments?.map(x=>x+1).join(' y ')||'';
  const summary=category==='sheet-cross'?'Posible cruce 2D de alas '+sheetPair:
   category==='sheet-overlap'?'Posible solapamiento 2D de alas '+sheetPair:
   category==='sheet-touch'?'Contacto puntual 2D de alas '+sheetPair:
   category==='sheet-close'?'Posible proximidad entre alas '+sheetPair+
     ' (separación '+self.clearance+' mm)':
   category==='penetration'?'Posible penetración de chapa en '+tool:
   category==='clearance'?'Posible holgura insuficiente con '+tool:
    category==='geometry'?(geometricIssue?.message||'Revisar geometría y útiles'):
     'Sin aviso 2D en muestras; comprobación física pendiente';
  const exampleTime=op?.exampleTime;
  const hasToolSample=!!op?.example&&Number.isFinite(exampleTime);
  const selfTime=sheet?.exampleTime;
  const hasSheetSample=!!self&&Number.isFinite(selfTime);
  const time=useSheet&&hasSheetSample?selfTime:
   hasToolSample?exampleTime:operation*5+2.7;
  return {operation,bend,angle:signedAngle,category,
   time,hasToolSample:Boolean(hasToolSample&&!useSheet),
   hasSheetSample:Boolean(hasSheetSample&&useSheet),
   checkedSamples:(op?.samples??0)+(sheet?.samples??0),summary,verified:false};
 });
}
