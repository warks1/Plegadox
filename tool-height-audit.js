/**
 * Auditoría dimensional del perfil REALMENTE DIBUJADO.
 * Diferencia altura TOTAL de catálogo y H ÚTIL desde hombro de la foto.
 * Que un contorno mida H nominal NO demuestra que el escote sea el CAD.
 */
import {sectionPunch,sectionDie,sectionBounds} from './tool-profiles.js';
const round=x=>Math.round(x*1000)/1000;
export function toolHeightAudit(tool,kind=tool?.opening!=null?'die':'punch'){
 if(!tool||typeof tool!=='object')throw Error('Herramienta no válida');
 if(!['punch','die'].includes(kind))throw Error('Tipo de herramienta no válido');
 const profile=kind==='punch'?sectionPunch(tool):sectionDie(tool);
 const bounds=sectionBounds(profile.points);
 const drawnHeight=bounds.maxY-bounds.minY;
 const declaredHeight=Number(tool.height);
 const photographic=kind==='punch'&&tool.profileStyle==='user-photo';
 const nominalType=photographic?'working':'total';
 const measuredNominal=photographic?
  Number(profile.nominalReferenceY):drawnHeight;
 const heightMatches=Math.abs(measuredNominal-declaredHeight)<1e-6;
 const overallHeight=drawnHeight;
 const workingHeight=photographic?Number(profile.workingHeight):
  Number.isFinite(Number(tool.workingHeight))?Number(tool.workingHeight):null;
 const documentedHeight=tool.verifiedSpecs===true;
 const geometryVerified=tool.profileAccuracy==='verified'&&
  tool.importedDxf!==true&&profile.sourceContourVerified===true;
 const issues=[];
 if(!heightMatches)issues.push('La altura dibujada NO coincide con la cota de la ficha.');
 if(!Number.isFinite(overallHeight)||overallHeight<=0)
  issues.push('Altura geométrica inválida');
 if(photographic)
  issues.push('El vástago superior no está acotado; la altura total ilustrada no es una medida fiable.');
 if(!geometryVerified)
  issues.push('Falta un contorno CAD acotado del fabricante que permita validar escote, amarre y colisiones.');
 return {id:tool.id,kind,nominalType,declaredHeight,drawnHeight:round(drawnHeight),
  measuredNominal:round(measuredNominal),overallHeight:round(overallHeight),
  workingHeight:Number.isFinite(workingHeight)?workingHeight:null,
  estimatedUpperHeight:photographic?round(Number(profile.headProjection)):null,
  documentedHeight,geometryVerified,heightMatches,
  accurateForManufacture:false,issues};
}
export function auditToolLibraryHeights(punches,dies){
 const records=[...punches.map(t=>toolHeightAudit(t,'punch')),
  ...dies.map(t=>toolHeightAudit(t,'die'))];
 return {records,mismatches:records.filter(r=>!r.heightMatches),
  nominallyMatched:records.filter(r=>r.heightMatches).length,
  geometryCertified:records.filter(r=>r.geometryVerified).length,
  verifiedForManufacture:false};
}
