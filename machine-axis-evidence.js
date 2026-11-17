/**
 * R130 · fiabilidad de los avisos en barridos CAD/CNC.
 * Un solape de prismas es una incidencia del MODELO, no un choque
 * demostrado en la plegadora. Separar las incidencias entre dos DXF
 * declarados, DXF contra cuerpo paramétrico y dos cuerpos provisionales.
 */
const imported=source=>typeof source==='string'&&
 source.startsWith('perfil CAD importado ');
export function classifyAxisContact(sourceMoving,sourceAgainst,options={}){
 const cadMoving=imported(sourceMoving);
 const cadAgainst=imported(sourceAgainst);
 // La media de Y1/Y2 NO reproduce el sólido inclinado; ni siquiera
 // dos DXF aportados permiten afirmar penetración precisa en esa pose.
 if(options.upperAssemblyYApproximationMm>1e-7)return {
  code:'GEOMETRIA_PROVISIONAL',
  label:'Solape ORIENTATIVO: trancha/útil superior usa media Y1/Y2, incertidumbre de inclinación '+
   options.upperAssemblyYApproximationMm.toFixed(3)+' mm',
  cadMoving,cadAgainst,upperAssemblyTiltUnmodeled:true,
  verified:false,physicalCollisionCertified:false
 };
 const code=cadMoving&&cadAgainst?'DOS_PERFILES_CAD':
  cadMoving||cadAgainst?'CAD_Y_MODELO':'GEOMETRIA_PROVISIONAL';
 const label=code==='DOS_PERFILES_CAD'?
  'Interferencia entre dos perfiles CAD declarados':
  code==='CAD_Y_MODELO'?
  'Solape de CAD declarado con geometría calculada no OEM':
  'Posible solape entre dos geometrías provisionales';
 return {code,label,cadMoving,cadAgainst,verified:false,
  physicalCollisionCertified:false};
}
export function summarizeAxisContacts(events){
 const counts={DOS_PERFILES_CAD:0,CAD_Y_MODELO:0,GEOMETRIA_PROVISIONAL:0};
 for(const ev of events||[]){
  const kind=ev?.evidenceCode;
  if(Object.hasOwn(counts,kind))counts[kind]++;
 }
 return {cadPairCount:counts.DOS_PERFILES_CAD,
  mixedCount:counts.CAD_Y_MODELO,
  provisionalCount:counts.GEOMETRIA_PROVISIONAL,
  modeledCount:counts.DOS_PERFILES_CAD+counts.CAD_Y_MODELO+
   counts.GEOMETRIA_PROVISIONAL,
  status:counts.DOS_PERFILES_CAD>0?'SOLAPE_ENTRE_DXF_DECLARADOS':
   counts.CAD_Y_MODELO>0?'SOLAPE_CAD_CON_ENVOLVENTE':
   counts.GEOMETRIA_PROVISIONAL>0?'SOLAPE_PROVISIONAL':'SIN_SOLAPES_MODELADOS',
  verified:false,physicalCollisionCertified:false};
}
