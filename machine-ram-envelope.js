/**
 * PlegadoX R108 · contorno 2,5D COMÚN de la trancha ilustrativa.
 * Representa la UNION de la barra frontal y el saliente lateral
 * dibujados en machine-visual, NO un perfil CAD certificado del fabricante.
 *
 * Datum: origen de sección en el centro de la V, Y positivo hacia arriba.
 * Un contorno verificado importado desde CAD conserva prioridad en
 * volume-engine; esta envolvente sólo se utiliza cuando no existe CAD.
 */
export function machineRamEnvelope(scene,machine={}){
 const tipHeight=Number(scene?.kinematics?.tipHeight);
 const punchHeight=Number(scene?.punch?.height);
 if(!Number.isFinite(tipHeight)||!Number.isFinite(punchHeight)||
  punchHeight<=0)throw Error('No se puede situar la trancha sin punzón montado');
 const measured=Number(machine?.ram?.[6]);
 const width=Number.isFinite(measured)&&measured>0?measured:125;
 const top=tipHeight+punchHeight;
 // Contorno EXACTO de la barra y el resalte 2D frontal actual.
 // No transformar L7 o cotas de fábrica en recorrido OEM certificado.
 const polygon=[
  {x:-.48*width,y:top+65},
  {x:.52*width,y:top+65},
  {x:.66*width,y:top+76},
  {x:.66*width,y:top-5},
  {x:.52*width,y:top-10},
  {x:-.48*width,y:top-10}
 ];
 return {polygon,width,toolTop:top,
  provenance:'envolvente-trancha-del-visor-sin-CAD',
  verified:false};
}
