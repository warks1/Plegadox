/**
 * PlegadoX R113 · contraste de dimensiones CAD con ficha seleccionada.
 * Coincidencia nominal NO autentica archivo, amarre ni montaje OEM.
 * No se infieren ángulo o V de un contorno 2D sin datum del fabricante.
 */
const isNum=x=>typeof x==='number'&&Number.isFinite(x);
const round=n=>Math.round(n*1000)/1000;
const check=(field,actual,expected,tolerance,origin)=>({
 field,actual:round(actual),expected:round(expected),
 differenceMm:['heightMm','openingMm','tipDiameterMm'].includes(field)?
  round(Math.abs(actual-expected)):null,
 tolerance,origin,match:Math.abs(actual-expected)<=tolerance+1e-8
});
export function auditImportedCadDimensions(parsed,expected=null,declared={}){
 if(!parsed||!isNum(parsed.height)||parsed.height<=0)
  throw Error('El contorno DXF no tiene altura física medible');
 if(!expected)return {status:'SIN_FICHA_ASOCIADA',canRegister:true,
  checks:[],conflicts:[],missing:['referencia y cotas OEM'],
  reference:null,sourceUrl:null,verified:false,manufacturerVerified:false};
 if(!['punch','die'].includes(expected.kind)||declared.kind!==expected.kind)
  throw Error('La clase de herramienta importada no coincide con la ficha seleccionada');
 const checks=[],missing=[];
 const assess=(field,actual,nominal,tolerance,origin)=>{
  if(!isNum(nominal)){missing.push(field);return;}
  if(!isNum(actual)){checks.push({field,actual:null,expected:round(nominal),
   tolerance,origin,match:false,reason:'Dato declarado ausente o inválido'});return;}
  checks.push(check(field,actual,nominal,tolerance,origin));
 };
 // Algunas matrices llevan zanco de montaje por DEBAJO de la
 // altura nominal de trabajo. Solo reconocer H completa si hay un
 // plano acotado de la MISMA referencia que muestre H útil+zanco.
 // Nunca inferir 20/30 mm por una coincidencia casual de diferencias.
 const datum=expected.cadHeightEvidence;
 const documentedFull=expected.kind==='die'&&
  datum?.kind==='DIE_PROFILE_INCLUDING_MOUNTING_TANG'&&
  String(datum.reference)===String(expected.reference)&&
  isNum(datum.nominalHeightMm)&&
  isNum(datum.drawingOverallMm)&&
  isNum(datum.mountingTangMm)&&datum.mountingTangMm>0&&
  Math.abs(datum.drawingOverallMm-datum.nominalHeightMm-
   datum.mountingTangMm)<.001&&
  isNum(expected.heightMm)&&
  Math.abs(expected.heightMm-datum.nominalHeightMm)<.001&&
  /^https:\/\//.test(String(datum.sourceUrl||''));
 const expectedContourHeight=documentedFull?
  datum.drawingOverallMm:expected.heightMm;
 assess('heightMm',parsed.height,expectedContourHeight,.5,
  documentedFull?'TOTAL_CONTORNO_VS_PLANO_OEM_CON_ZANCO':'MEDIDO_EN_DXF_2D');
 assess('angleDeg',Number(declared.angleDeg),expected.angleDeg,.1,
  'SOLO_DECLARACION_OPERADOR_NO_MEDIDO_EN_DXF');
 if(expected.kind==='die')
  assess('openingMm',Number(declared.openingMm),expected.openingMm,.05,
   'SOLO_DECLARACION_OPERADOR_NO_MEDIDO_EN_DXF');
 else assess('tipDiameterMm',Number(declared.tipDiameterMm),expected.tipDiameterMm,.05,
  'SOLO_DECLARACION_OPERADOR_NO_MEDIDO_EN_DXF');
 const conflicts=checks.filter(c=>!c.match);
 return {status:conflicts.length?'DISCREPANCIA_BLOQUEANTE':
  documentedFull?'ALTURA_TOTAL_DXF_COTEJADA_DATUM_MONTAJE_PENDIENTE':
  missing.length?'COTAS_PARCIALES_NO_CERTIFICADAS':'COTAS_NOMINALES_COINCIDENTES_NO_CERTIFICADAS',
  canRegister:conflicts.length===0,checks,conflicts,missing,
  reference:String(expected.reference||''),sourceUrl:String(expected.sourceUrl||''),
  nominalHeightMm:documentedFull?datum.nominalHeightMm:null,
  totalContourHeightMm:documentedFull?datum.drawingOverallMm:null,
  mountingTangMm:documentedFull?datum.mountingTangMm:null,
  cadHeightDatumPending:documentedFull,
  heightEvidenceSource:documentedFull?datum.sourceUrl:null,
  verified:false,manufacturerVerified:false};
}
export function catalogCadAuditReference(tool,kind){
 if(!tool||!['punch','die'].includes(kind))return null;
 const evidence={kind,reference:String(tool.reference||tool.name||''),
  sourceUrl:String(tool.cadSourceUrl||''),
  heightMm:isNum(tool.height)?tool.height:null,
  cadHeightEvidence:tool.cadHeightEvidence||null,
  angleDeg:isNum(tool.angle)?tool.angle:null};
 if(kind==='die')evidence.openingMm=isNum(tool.opening)?tool.opening:null;
 else evidence.tipDiameterMm=isNum(tool.tip)?tool.tip:null;
 return evidence;
}
