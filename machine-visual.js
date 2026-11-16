// Plegadox · Render de taller en vista lateral con materiales pulidos.
// Geometría ilustrativa, no modelo CAD certificado ni calculador de colisiones.
import {stage,presentedAtStage,getTooling} from './engine.js';
import {roundedRectPath} from './canvas-path.js';
import {sectionPunch,sectionDie} from './tool-profiles.js';
import {machineRamEnvelope} from './machine-ram-envelope.js';
import {drawTechnicalSection,technicalScene,technicalCameraBounds} from './technical-section.js';
import {currentToolContact} from './tool-collision.js';
import {getActiveMachineConfig} from './machine-config.js';
import {gaugePlacement,gaugeContourAtContact} from './backgauge-placement.js';
import {sceneAtmosphere,dieDepth,ramDepth,sheetDepth,surfaceDetail,sectionOverlay} from './render-enhancements.js';
import {gaugeRiskStatus,GAUGE_COLORS} from './gauge-risk-status.js';

const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
// Etiqueta verificable: no denominar RETROCESO a un cambio de cota X/R.
// Dos movimientos diferentes: apartar por penetración prevista y
// colocar la referencia del golpe siguiente.
export function gaugeMovementLabel(placement){
 const n=placement?.stopNumber===2?2:1;
 const phase=placement?.gaugeTransition?.phase;
 if(phase==='retroceso-antes-plegado')
  return 'TOPE '+n+' · RETROCESO POR PENETRACIÓN 2D PREVISTA';
 if(phase==='retirado-durante-plegado')
  return 'TOPE '+n+' · APARCADO POR PENETRACIÓN 2D PREVISTA';
 const axis=placement?.gaugeTransition?.axisPhase;
 const suffix=axis==='R'?' · AJUSTANDO EJE R':
  axis==='X'?' · MOVIENDO EJE X':'';
 if(phase==='regreso-a-siguiente-referencia')
  return 'TOPE '+n+' · VUELTA DESDE RETIRADA PREVENTIVA'+suffix;
 if(phase==='reubicacion-siguiente-golpe')
  return 'TOPE '+n+' · CAMBIO DE COTA PARA EL SIGUIENTE GOLPE'+suffix;
 return '';
}
/**
 * Cabina y sección técnica usan exactamente las mismas poligonales en mm.
 * Solo cambia la transformación de coordenadas (y de mm hacia arriba a
 * píxeles hacia abajo). No alterar el perfil de la matriz por estética.
 */
export function machineToolProjection(scene,cx,datumY,scale){
 if(!Number.isFinite(scale)||scale<=0||![cx,datumY].every(Number.isFinite))
  throw Error('Transformación de máquina inválida');
 const transform=points=>points.map(({x,y})=>[cx+x*scale,datumY-y*scale]);
 return {die:transform(scene.diePolygon),punch:transform(scene.punchPolygon)};
}
/**
 * Mismo perfil de chapa para el detector, la sección métrica y la cabina.
 * El modo perspectiva añade relieve decorativo sin introducir otra
 * trayectoria de pieza que la comprobación 2D desconoce.
 */
export function machineSheetProjection(scene,cx,datumY,scale,perspective=false){
 if(!Number.isFinite(scale)||scale<=0||![cx,datumY].every(Number.isFinite))
  throw Error('Transformación de chapa inválida');
 const positions=scene.sheetDisplay;
 if(!Array.isArray(positions)||positions.length<2||
    positions.some(p=>!Number.isFinite(p.x)||!Number.isFinite(p.y)))
  throw Error('Perfil de chapa inválido para la vista de máquina');
 return positions.map(p=>[cx+p.x*scale,datumY-p.y*scale]);
}
function gradient(ctx,x1,y1,x2,y2,colors){
 const g=ctx.createLinearGradient(x1,y1,x2,y2);
 for(const [at,color] of colors)g.addColorStop(at,color);
 return g;
}
function poly(ctx,pts,fill,stroke='#6c8596',line=1){
 ctx.beginPath();
 pts.forEach((p,i)=>i?ctx.lineTo(p[0],p[1]):ctx.moveTo(p[0],p[1]));
 ctx.closePath();
 if(fill){ctx.fillStyle=fill;ctx.fill();}
 if(stroke){ctx.strokeStyle=stroke;ctx.lineWidth=line;ctx.stroke();}
}
function shape(ctx,x,y,w,h,fill,stroke='#283a49',r=0){
 ctx.beginPath();
 if(r)roundedRectPath(ctx,x,y,w,h,r);else ctx.rect(x,y,w,h);
 ctx.fillStyle=fill;ctx.fill();
 if(stroke){ctx.strokeStyle=stroke;ctx.lineWidth=1;ctx.stroke();}
}
function radial(ctx,x,y,r,colors){
 const g=ctx.createRadialGradient(x,y,0,x,y,r);
 for(const [at,color]of colors)g.addColorStop(at,color);
 return g;
}
function bolt(ctx,x,y,r=3){
 ctx.save();ctx.shadowBlur=4;ctx.shadowColor='#000';ctx.beginPath();ctx.arc(x,y,r,0,Math.PI*2);ctx.fillStyle='#233341';ctx.fill();ctx.strokeStyle='#9fb1bb';ctx.lineWidth=.9;ctx.stroke();
 ctx.beginPath();ctx.moveTo(x-r*.5,y+r*.4);ctx.lineTo(x+r*.5,y-r*.4);ctx.strokeStyle='#c3cdd6';ctx.stroke();ctx.restore();
}
function steelRect(ctx,x,y,w,h,bright=true,vertical=false){
 const colors=bright?[[0,'#d1dce5'],[.13,'#8d9da9'],[.26,'#becad3'],[.45,'#6d7c86'],[.52,'#b7c7d0'],[.76,'#4c5e6b'],[1,'#9baebd']]:
 [[0,'#84929e'],[.22,'#475663'],[.46,'#778a96'],[.65,'#293a47'],[.9,'#667c8d'],[1,'#243849']];
 shape(ctx,x,y,w,h,vertical?gradient(ctx,x,y,x,y+h,colors):gradient(ctx,x,y,x+w,y,colors),'#213647',1);
 ctx.save();ctx.beginPath();ctx.rect(x,y,w,h);ctx.clip();ctx.globalAlpha=.16;
 for(let i=0;i<Math.ceil(h);i+=3){ctx.fillStyle=i%6===0?'#e2f2fc':'#152e40';ctx.fillRect(x,y+i,w,.36);}
 ctx.restore();
 ctx.strokeStyle='#d8e8f1aa';ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(x+1,y+1);ctx.lineTo(x+w-1,y+1);ctx.stroke();
}
function backdrop(ctx,w,h){
 const b=gradient(ctx,0,0,w,h,[[0,'#020b14'],[.25,'#0a1a2a'],[.65,'#061726'],[1,'#091f33']]);
 shape(ctx,0,0,w,h,b,null);
 // Industrial interior out of focus
 ctx.save();ctx.globalAlpha=.64;ctx.filter='blur(10px)';
 for(let k=0;k<12;k++){
   const x=(k/11)*w*1.2-w*.1,barw=10+(k%4)*14;
   shape(ctx,x,-20,barw,h*.95,gradient(ctx,x,0,x+barw,0,[[0,'#02070c'],[.38,k%2?'#45607b':'#142638'],[1,'#010710']]),null);
 }
 for(let k=0;k<7;k++){
   shape(ctx,w*.5+k*37,h*.46+k*6,w*.65,5,'#667f963b',null);
 }
 ctx.restore();
 ctx.save();ctx.globalAlpha=.5;
 shape(ctx,0,h*.78,w,h*.22,gradient(ctx,0,h*.78,0,h,[[0,'#0d243a'],[1,'#020b15']]),null);
 for(let k=0;k<8;k++){
  const x=(k/7)*w;
  ctx.beginPath();ctx.moveTo(w*.56,h*.75);ctx.lineTo(x,h);ctx.strokeStyle='#22476766';ctx.lineWidth=1;ctx.stroke();
 }
 ctx.restore();
 // Ambient cyan illumination around tool
 shape(ctx,0,0,w,h,radial(ctx,w*.53,h*.48,w*.6,[[0,'#0b4b7c48'],[.45,'#0e285b24'],[1,'#02081400']]),null);
}
/**
 * La chapa en perspectiva tiene profundidad ilustrativa de 23 x -13 px
 * por unidad de escala. El dedo antes se dibujaba plano y parecía
 * SEPARADO del canto de la chapa aunque ambas referencias X coincidieran.
 * Proyectar SOLO el dibujo del dedo al mismo plano frontal visible;
 * ningún valor X/R, el contorno 2D ni la retirada de la máquina cambian.
 */
export function gaugePerspectiveContours(polygon,scale,perspective=false){
 if(!Array.isArray(polygon)||polygon.some(p=>!Array.isArray(p)||p.length!==2||
  !p.every(Number.isFinite))||!Number.isFinite(scale)||scale<=0)
  throw Error('Contorno del tope inválido para perspectiva');
 // La chapa se dibuja sobre su sección métrica y el volumen se
 // proyecta HACIA ATRÁS (+X/-Y). La cara frontal del dedo debe
 // compartir EXACTAMENTE ese plano, sin desplazar su contacto.
 const near=polygon.map(p=>[...p]);
 const far=perspective?polygon.map(([x,y])=>[x+23*scale,y-13*scale]):
  polygon.map(p=>[...p]);
 return {near,far,depthX:perspective?23*scale:0,
  depthY:perspective?-13*scale:0};
}
/**
 * R106 · Proyección única del dedo trasero, su cara de apoyo y el canto
 * nominal. La vista lateral y perspectiva 2,5D comparten el mismo
 * plano frontal; solo se extruye decorativamente el cuerpo del dedo.
 * El motor geométrico sigue trabajando en milímetros.
 */
export function machineGaugeProjection(placement,cx,datumY,scale,dimensions=null){
 if(!Number.isFinite(scale)||scale<=0||![cx,datumY].every(Number.isFinite))
  throw Error('Transformación de tope inválida');
 const stopNumber=placement?.stopNumber===2?2:1;
 const values=dimensions||(stopNumber===2?
  getActiveMachineConfig().support:getActiveMachineConfig().stop);
 const contour=gaugeContourAtContact(placement,values);
 if(contour.length<3||contour.some(q=>
   !Number.isFinite(q?.x)||!Number.isFinite(q?.y)))
  throw Error('Contorno de dedo trasero inválido');
 const screen=p=>[cx+p.x*scale,datumY-p.y*scale];
 const point=placement?.point;
 if(!Number.isFinite(point?.x)||!Number.isFinite(point?.y))
  throw Error('Punto de contacto del tope inválido');
 const contact=placement?.contact;
 const projectLine=line=>line?.from&&line?.to?
  {from:screen(line.from),to:screen(line.to)}:null;
 return {point:screen(point),outline:contour.map(screen),
  face:projectLine(contact),frontFace:projectLine(contact?.frontFace),
  contactPoint:contact?.point?screen(contact.point):null,
  dimensions:values,verified:false};
}
/** Perfil físico del labio frontal del Stop, sin desplazar la chapa.
 * Se conserva como referencia geométrica; no duplica capas en pantalla.
 */
export function gaugeFrontNosePolygon(placement,dimensions){
 const contour=gaugeContourAtContact(placement,dimensions);
 if(contour.length!==6)return null;
 // Perfil real del labio frontal del croquis editable: 0-4-5.
 return [contour[0],
  {x:contour[4].x,y:contour[0].y},
  contour[4],contour[5]].map(p=>({...p}));
}
/**
 * Tarjeta compacta fuera del sólido del tope. Antes la advertencia
 * se dibujaba sobre el propio dedo y quedaba cortada por los controles
 * laterales de la perspectiva. El texto detallado permanece en el panel
 * de estado; aquí solo mostramos el nivel y la acción requerida.
 * Es geometría de interfaz, NO movimiento de máquina.
 */
export function gaugeStatusCardLayout(width,height,faceX,faceY,stopNumber,level,scale=1,movementPhase=null,forecast=null,reasonCode=null,clearanceMm=null,requiredMm=null,axisPhase=null){
 if(![width,height,faceX,faceY,scale].every(Number.isFinite)||
  width<=0||height<=0||scale<=0||![1,2].includes(stopNumber)||
  !['green','amber','red'].includes(level))
  throw Error('Datos inválidos para aviso visual del tope');
 const compact=width<520;
 const left=compact?84:105,right=compact?100:118;
 const boxW=Math.min(compact?174:204,Math.max(112,width*.44));
 const boxH=compact?33:35;
 const maxX=Math.max(0,width-right-boxW);
 const x=Math.max(Math.min(left,maxX),Math.min(maxX,Math.max(left,faceX-boxW*.22)));
 const below=faceY+Math.max(17,20*scale)+boxH<=height-(compact?10:16);
 const y=Math.max(4,Math.min(height-boxH-4,below?
  faceY+Math.max(17,20*scale):faceY-boxH-Math.max(17,20*scale)));
 const headline=level==='red'?`⛔ TOPE ${stopNumber} · COLISIÓN`:
  level==='amber'?`⚠ TOPE ${stopNumber} · ATENCIÓN`:
  `TOPE ${stopNumber} · SIN CHOQUE 2D`;
 // No perder los avisos de MOVIMIENTO que ya existían antes de R96.
 // Cambiar de cota no se debe anunciar como retroceso anticolisión.
 const motionText={
  'retroceso-antes-plegado':'RETROCEDIENDO ANTES DEL GOLPE',
  'retirado-durante-plegado':'RETIRADO DURANTE EL PLEGADO',
  'regreso-a-siguiente-referencia':'VOLVIENDO DESDE RETIRADA',
  'reubicacion-siguiente-golpe':'CAMBIO DE COTA · NO RETROCESO'
 }[movementPhase]??null;
 const axisLabel=axisPhase==='R'?' · EJE R':
  axisPhase==='X'?' · EJE X':'';
 const movementText=motionText?motionText+axisLabel:null;
 const issueText={
  'referencia-interior':'REFERENCIA INTERIOR · REVISAR',
  'sin-borde-libre':'SIN BORDE LIBRE DE APOYO',
  'cara-tope-invalida':'SIN CARA FRONTAL DE TOPE',
  'chapa-detras':'CHAPA DETRÁS DEL TOPE',
  'sin-asiento':'NO ASIENTA SOBRE EL TOPE',
  'sin-contacto-actual':'SIN CONTACTO FRONTAL ACTUAL',
  'ruta-ejes-no-segura-2d':'RUTA X/R CON PENETRACIÓN 2D',
  'ruta-ejes-incompleta':'RUTA X/R NO COMPROBABLE',
  'apoyo-invalido':'APOYO NO VÁLIDO · REVISAR',
  'comprobacion-incompleta':'DATOS 2D INSUFICIENTES',
  'holgura-actual':'HOLGURA ACTUAL · REVISAR',
  'interferencia-actual':'INTERFERENCIA ACTUAL',
  'retirada-no-fiable':'RETIRADA NO FIABLE · REVISAR'
 }[reasonCode]??null;
 // R107: mostrar solo la holgura medida cuando está disponible;
 // no inventar distancias y no llamar colisión a una mera proximidad.
 const measuredLine=level==='amber'&&reasonCode==='holgura-actual'&&
  Number.isFinite(clearanceMm)&&Number.isFinite(requiredMm)?
  'HOLGURA '+clearanceMm.toFixed(2)+' / MÍN '+requiredMm.toFixed(2)+' mm':null;
 // Priorizar la incidencia real sobre el movimiento del dedo.
 const subline=level==='red'?'PENETRACIÓN 2D · REVISAR':
  measuredLine||(level==='amber'&&issueText) ? (measuredLine||issueText) :
  movementText||(level==='amber'?'REVISAR APOYO / HOLGURA':
   forecast==='retirada-prevista'?'RETIRADA PREVISTA · 2D':
   forecast==='holgura-futura'?'HOLGURA FUTURA · REVISAR':
   'COMPROBACIÓN 2D');
 return {x,y,width:boxW,height:boxH,headline,subline,below,
  reservedLeft:left,reservedRight:right};
}
function drawGaugeStatusCard(ctx,layout,level,colors){
 ctx.save();
 ctx.shadowColor='#000a';ctx.shadowBlur=7;
 ctx.fillStyle='#071d2fe8';
 ctx.strokeStyle=colors.edge;ctx.lineWidth=1.1;
 roundedRectPath(ctx,layout.x,layout.y,layout.width,layout.height,7);
 ctx.fill();ctx.stroke();
 ctx.shadowBlur=0;
 ctx.textAlign='left';ctx.textBaseline='alphabetic';
 ctx.fillStyle=colors.label;
 ctx.font='800 10px system-ui';
 ctx.fillText(layout.headline,layout.x+8,layout.y+14,layout.width-16);
 ctx.fillStyle='#bcd4e5';
 ctx.font='650 9px system-ui';
 ctx.fillText(layout.subline,layout.x+8,layout.y+27,layout.width-16);
 ctx.restore();
}
function rearMachineBackdrop(ctx,w,h,cx,cy,scale){
 ctx.save();
 // Horizontal steel rails across the background
 const y=cy+18*scale;
 steelRect(ctx,w*.02,y,w*.98,14*scale,false,true);
 steelRect(ctx,w*.02,y+13*scale,w*.98,17*scale,false);
 shape(ctx,w*.03,y+31*scale,w*.94,9*scale,'#0c253b',null);
 // Massive rear side bracket
 poly(ctx,[[w*.63,cy-8*scale],[w*.96,cy-12*scale],[w*.97,cy+43*scale],[w*.68,cy+57*scale]],gradient(ctx,w*.63,cy,w*.97,cy+55,[[0,'#a6b5c2'],[.3,'#546d7f'],[.75,'#1d3144'],[1,'#566e7c']]),'#0c2435',2);
 for(let i=0;i<5;i++){
  const x=w*.69+(w*.26*i/4);
  steelRect(ctx,x,cy+23*scale,4*scale,25*scale,false);
 }
 // Carriles y bancada, SIEMPRE detrás del volumen de la matriz.
 steelRect(ctx,0,cy+26*scale,w*.3,40*scale,false);
 for(let i=0;i<4;i++){
  shape(ctx,20+i*32*scale,cy+28*scale,8*scale,34*scale,'#20394e','#435b6b');
 }
 ctx.restore();
}
/**
 * El tope se dibuja después de la matriz en perspectiva 2.5D para
 * mantener visible su cara frontal en alas cortas; la chapa se dibuja
 * después del tope. Las posiciones métricas X/R no cambian.
 */
function rearMachine(ctx,w,h,cx,cy,scale,placement,perspective=false){
 ctx.save();
 // En el vídeo real el tope llega DESDE DETRÁS (derecha en perfil)
 // hacia el borde trasero de la chapa. Esta referencia se deriva del
 // borde presentado, no de una distancia fija inventada.
 const projected=machineGaugeProjection(placement,cx,cy,scale);
 const gauge=projected.dimensions;
 const origin=placement.contact?.origin||placement.point;
 const ox=cx+origin.x*scale,oy=cy-origin.y*scale;
 // Mismo perfil frontal del dedo para 2D y perspectiva 2,5D.
 const gg=projected.outline;
 const projection=gaugePerspectiveContours(gg,scale,perspective);
 const front=projection.near;
 const faceX=projected.point[0];
 // El brazo viene por DETRÁS del dedo: no debe atravesar el propio perfil
 // ni nacer en el punto de contacto chapa/dedo (fallo visible en vídeo).
 const bodyRear=Math.max(...gg.map(p=>p[0]));
 const rodStart=Math.max(faceX,bodyRear);
 const rodEnd=rodStart+Math.max(35,gauge[0]*.45)*scale;
 steelRect(ctx,rodStart,cy-placement.point.y*scale+4*scale,
  Math.max(8,rodEnd-rodStart),6*scale,false);
 const risk=gaugeRiskStatus(placement),colors=GAUGE_COLORS[risk.level];
  const cadPending=!!placement.geometryUnavailable;
  const gradients={
   green:[[0,'#a9ffd3'],[.28,'#50c987'],[.76,'#267250'],[1,'#17392e']],
   amber:[[0,'#ffe8ad'],[.28,'#d1a34b'],[.76,'#775826'],[1,'#302b23']],
   red:[[0,'#ffb8a4'],[.28,'#e56a58'],[.76,'#8c382c'],[1,'#4b2528']]
  };
  if(perspective){
   // Extrusión al fondo; el contorno delantero NO se mueve. Antes
   // se desplazaba la cara de apoyo respecto de la chapa.
   for(let i=0;i<front.length;i++){
    const j=(i+1)%front.length;
    poly(ctx,[front[i],front[j],projection.far[j],projection.far[i]],
     colors.fill,colors.edge,Math.max(.6,.75*scale));
   }
  }
  poly(ctx,front,gradient(ctx,ox,oy,rodEnd,oy,
   gradients[risk.level]),colors.edge,Math.max(1.2,1.9*scale));
 // Resaltar la cara real del dedo: STOP frontal o escalón SUPPORT.
 // Un vértice interior de la chapa no constituye un apoyo fiable.
 const contact=placement.contact;
 if(contact&&projected.face){
  const a=projected.face.from,b=projected.face.to;
  ctx.save();ctx.lineWidth=Math.max(3,3.6*scale);
  ctx.strokeStyle=colors.face;
  ctx.shadowBlur=11*scale;ctx.shadowColor=colors.glow;
  ctx.beginPath();ctx.moveTo(...a);ctx.lineTo(...b);ctx.stroke();
  // Support: cara INFERIOR de la chapa apoyada sobre la pestaña BAJA
  // frontal y canto detenido contra la contrahuella ALTA posterior.
  // Esta cara debe subir, no bajar tras el punto de contacto.
  if(contact.surface==='horizontal-top'&&projected.frontFace){
   const u=projected.frontFace.from,v=projected.frontFace.to;
   ctx.strokeStyle=colors.edge;
   ctx.beginPath();ctx.moveTo(...u);ctx.lineTo(...v);ctx.stroke();
  }
  if(projected.contactPoint){
   const cp=projected.contactPoint;
   ctx.beginPath();ctx.arc(...cp,Math.max(2.5,3*scale),0,Math.PI*2);
   ctx.fillStyle=colors.face;ctx.fill();
  }
  ctx.restore();
 }
 for(const frac of [.24,.58])bolt(ctx,rodStart+(rodEnd-rodStart)*frac,
  cy-placement.point.y*scale-10*scale,2.4*scale);
 // En sección 2D conservar íntegro el indicador anterior.
 // Sólo la PERSPECTIVA utiliza la nueva tarjeta fuera del tope.
 if(!perspective){
  ctx.font='800 '+Math.max(8,11*scale)+'px system-ui';
  ctx.fillStyle=colors.label;ctx.textAlign='left';
  const label=risk.level==='red'?
   '⛔ TOPE '+placement.stopNumber+' · PENETRACIÓN EN 2D':
   risk.level==='amber'?
    '⚠ TOPE '+placement.stopNumber+' · '+risk.message:
    placement.gaugeTransition?gaugeMovementLabel(placement):
    'TOPE '+placement.stopNumber+' · SIN INTERFERENCIA 2D'+
    (cadPending?' · CAD PENDIENTE':'');
  ctx.fillText(label,Math.min(Math.max(8,ox+3*scale),w-145*scale),
   Math.max(20,cy-placement.point.y*scale-24*scale));
 }
 ctx.restore();
}
function drawDie(ctx,scene,cx,cy,scale){
 // La geometría se comparte con technicalScene y cambia con V, ángulo y H.
 const {die}=scene,pts=machineToolProjection(scene,cx,cy,scale).die;
 const xs=pts.map(pt=>pt[0]),minX=Math.min(...xs),maxX=Math.max(...xs);
 ctx.save();ctx.shadowColor='#000d';ctx.shadowBlur=22*scale;ctx.shadowOffsetY=10*scale;
 poly(ctx,pts,gradient(ctx,minX,cy,maxX,cy,
  [[0,'#c1cad0'],[.2,'#8496a5'],[.48,'#6d7d8b'],
   [.65,'#a9b7c2'],[1,'#344c5d']]),'#152636',2*scale);
 ctx.restore();
 // Los reflejos decorativos no deben salirse del cuerpo acotado,
 // particularmente al pasar de una matriz H120 a otra H60.
 ctx.save();
 ctx.beginPath();pts.forEach((pt,i)=>i?ctx.lineTo(...pt):ctx.moveTo(...pt));
 ctx.closePath();ctx.clip();
 surfaceDetail(ctx,{cx,cy,s:scale},{opening:die.opening});
 ctx.restore();
 const half=die.opening/2*scale,depth=die.depth*scale;
 ctx.save();ctx.beginPath();
 ctx.moveTo(cx-half,cy);ctx.lineTo(cx,cy+depth);ctx.lineTo(cx+half,cy);
 ctx.strokeStyle='#091e2e';ctx.lineWidth=3*scale;ctx.lineJoin='round';ctx.stroke();
 ctx.strokeStyle='#cce8f4';ctx.lineWidth=1*scale;ctx.stroke();ctx.restore();
 const bottom=cy+die.height*scale;
 // Esta base es la mesa/soporte ilustrativo, no parte del cuerpo de la matriz.
 steelRect(ctx,minX-10*scale,bottom,maxX-minX+20*scale,13*scale,false,true);
 return {top:cy,depth,opening:die.opening*scale,angle:die.angle,contour:pts};
}
function drawRam(ctx,cx,cy,scale,tipY,punch,scene){
 // R108: la barra y el resalte lateral de la TRANCHA deben coincidir
 // con el mismo contorno 2,5D examinado por el motor de colisiones.
 // Se respeta la geometría OEM si existe en la revisión volumétrica.
 const ramShape=machineRamEnvelope(scene,getActiveMachineConfig());
 const top=cy-ramShape.toolTop*scale;
 const ramW=ramShape.width*scale;
 steelRect(ctx,cx-ramW*.48,top-65*scale,ramW,75*scale,false);
 poly(ctx,[[cx+ramW*.52,top-65*scale],[cx+ramW*.66,top-76*scale],
       [cx+ramW*.66,top+5*scale],[cx+ramW*.52,top+10*scale]],
       '#2a4250','#647e8d',1.5);
 steelRect(ctx,cx-38*scale,top-10*scale,76*scale,27*scale,true);
 const pts=machineToolProjection(scene,cx,cy,scale).punch;
 ctx.save();ctx.shadowColor='#000e';ctx.shadowBlur=20*scale;ctx.shadowOffsetX=7*scale;
 poly(ctx,pts,gradient(ctx,cx-45*scale,0,cx+45*scale,0,
   [[0,'#a0afba'],[.17,'#f0f7fa'],[.34,'#889cab'],[.52,'#d0dbe1'],
    [.7,'#536776'],[.95,'#c0d3e2'],[1,'#5c6c7b']]),'#1f3c51',1.6*scale);
 ctx.restore();
 ctx.save();ctx.beginPath();pts.forEach((pt,i)=>i?ctx.lineTo(...pt):ctx.moveTo(...pt));
 ctx.closePath();ctx.clip();ctx.globalAlpha=.16;
 for(let k=0;k<70;k++){
  const x=cx-42*scale+k*.7*scale;
  ctx.beginPath();ctx.moveTo(x,top);ctx.lineTo(x+2*scale,tipY);
  ctx.strokeStyle=k%3?'#e6f7ff':'#244763';ctx.lineWidth=.6*scale;ctx.stroke();
 }
 ctx.restore();
 // Ray on actual tool tip; located at the real contact point of the mesh.
 ctx.save();ctx.shadowColor='#00baff';ctx.shadowBlur=10*scale;
 ctx.beginPath();ctx.moveTo(cx-3*scale,tipY);ctx.lineTo(cx+3*scale,tipY);
 ctx.strokeStyle='#30c3ff';ctx.lineWidth=2*scale;ctx.stroke();ctx.restore();
}
/** Reforzar el volumen y el filo del punzón DESPUÉS de la chapa.
 * El gris oscuro anterior permitía confundirlo con la trancha trasera.
 * La silueta sigue siendo la misma del motor técnico, no un perfil CAD.
 */
export function drawPunchForeground(ctx,scene,cx,cy,scale,transparent=false){
 const pts=machineToolProjection(scene,cx,cy,scale).punch;
 if(pts.length<3)return;
 const xx=pts.map(p=>p[0]),min=Math.min(...xx),max=Math.max(...xx);
 const fill=gradient(ctx,min,0,max,0,[
  [0,'#f2faff'],[.19,'#acc4d5'],[.42,'#fffefe'],
  [.68,'#bed1df'],[.86,'#f5fbff'],[1,'#6a8aa2']]);
 ctx.save();ctx.lineJoin='round';ctx.lineCap='round';
 // Brillo exterior y borde oscuro interior: lectura clara sobre blanco,
 // azul, chapa oscura o texturas de bancada.
 ctx.shadowBlur=16*Math.max(.6,scale);ctx.shadowColor='#7be2ff';
 poly(ctx,pts,transparent?'#b4d6e246':fill,'#f4fcff',
  Math.max(2.4,2.9*scale));
 ctx.shadowBlur=0;
 ctx.strokeStyle='#194765';ctx.lineWidth=Math.max(.9,1.1*scale);
 ctx.beginPath();pts.forEach((p,i)=>i?ctx.lineTo(...p):ctx.moveTo(...p));
 ctx.closePath();ctx.stroke();
 const tip=pts.reduce((a,b)=>b[1]>a[1]?b:a,pts[0]);
 ctx.beginPath();ctx.arc(tip[0],tip[1],Math.max(2,2.6*scale),0,Math.PI*2);
 ctx.fillStyle='#eeffff';ctx.shadowColor='#55d8ff';ctx.shadowBlur=11*scale;ctx.fill();
 ctx.restore();
}
function drawSheet(ctx,pts,thickness,scale,active){
 if(pts.length<2)return;
 ctx.save();ctx.lineJoin='round';ctx.lineCap='round';
 ctx.shadowColor='#030e19';ctx.shadowBlur=10*scale;ctx.shadowOffsetY=6*scale;
 ctx.beginPath();pts.forEach(([x,y],i)=>i?ctx.lineTo(x,y):ctx.moveTo(x,y));
 ctx.strokeStyle='#091b27';ctx.lineWidth=Math.max(6,thickness*scale+5);ctx.stroke();
 ctx.shadowBlur=0;ctx.shadowOffsetY=0;
 const steel=gradient(ctx,0,pts[0][1]-15*scale,0,pts[0][1]+14*scale,[[0,'#ecf4f8'],[.3,'#9ebac8'],[.58,'#486979'],[1,'#b2c3cf']]);
 ctx.strokeStyle=steel;ctx.lineWidth=Math.max(4,thickness*scale+3.3);ctx.stroke();
 ctx.strokeStyle=active?'#23bdff':'#79c5f7';ctx.lineWidth=1.55*scale;ctx.shadowColor='#00a7ff';ctx.shadowBlur=9*scale;ctx.stroke();
 ctx.restore();
}
function stageScene(ctx,w,h,piece,sim,machineView){
 const st=stage(piece,sim.time),{punch,die}=getTooling(piece),t=piece.thickness;
 const scene=technicalScene(piece,st);
 const scale=Math.min(w/740,h/510)* (machineView?.zoom||1);
 const cx=w*.48+(machineView?.panX||0),baseY=h*.665+(machineView?.panY||0);
 const opening=die.opening||16;
 backdrop(ctx,w,h);
 sceneAtmosphere(ctx,w,h,{cx,cy:baseY,s:scale});
 const stopNumber=piece.stopByBend?.[st.activeBend]===2?2:1;
 const placement=gaugePlacement(scene,stopNumber);
 const perspective=Boolean(machineView?.perspective);
 rearMachineBackdrop(ctx,w,h,cx,baseY,scale);
 // En 2D conservar EXACTAMENTE el orden anterior que ya funcionaba.
 if(!perspective)rearMachine(ctx,w,h,cx,baseY,scale,placement,false);
 dieDepth(ctx,{cx,cy:baseY,s:scale},opening,perspective,scene.die);
 drawDie(ctx,scene,cx,baseY,scale);
 // Sólo en PERSPECTIVA el tope se pinta después de la matriz y antes
 // de la chapa; así el labio delantero no queda tapado por la V.
 if(perspective)rearMachine(ctx,w,h,cx,baseY,scale,placement,true);
 // Los reflejos de la matriz se recortan a su contorno real en drawDie.
 // Ram advances to the sheet and descends while deforming it.
 // La formación no comienza antes de que la punta alcance la chapa.
 // Durante el golpe, punta y fibra central descienden conjuntamente hacia V.
 const tipY=baseY-scene.kinematics.tipHeight*scale;
 // Preserve the real profile; perspective adds an illustrative side face.
 ramDepth(ctx,{cx,cy:baseY,s:scale},tipY,punch,Boolean(machineView?.perspective));
 ctx.save();
 if(machineView?.transparent)ctx.globalAlpha=.3;
 drawRam(ctx,cx,baseY,scale,tipY,punch,scene);
 ctx.restore();
 const presentation=scene.presentation;
 // Pieza, matriz y punzón comparten escala mm→px. La fibra de la chapa
 // sigue el contacto con los dos hombros de la V y el descenso del punzón.
 const sheetY=baseY-scene.kinematics.centerHeight*scale;
 const transformed=machineSheetProjection(scene,cx,baseY,scale,Boolean(machineView?.perspective));
 sheetDepth(ctx,transformed,{cx,cy:baseY,s:scale},t,Boolean(machineView?.perspective));
 drawSheet(ctx,transformed,t,scale,st.press>.4);
 // Punzón en primer plano: el cuerpo de la herramienta NUNCA debe
 // desaparecer detrás de la chapa o de la textura de la máquina.
 drawPunchForeground(ctx,scene,cx,baseY,scale,Boolean(machineView?.transparent));
 // Contacto de tope sólo indicado gráficamente cuando aparece un borde
 // trasero presentable en la sección; no se certifica el apoyo físico.
 if(placement.alignedToSheet){
  const [x,y]=machineGaugeProjection(placement,cx,baseY,scale).point;
  ctx.save();ctx.beginPath();ctx.arc(x,y,Math.max(3,3.5*scale),0,Math.PI*2);
  const color=GAUGE_COLORS[gaugeRiskStatus(placement).level];
   ctx.fillStyle=color.face;ctx.shadowColor=color.glow;ctx.shadowBlur=10*scale;
  ctx.fill();ctx.strokeStyle=color.edge;ctx.lineWidth=1.2;ctx.stroke();ctx.restore();
 }
 sectionOverlay(ctx,{cx,cy:baseY,s:scale},opening,punch.tip||0,Boolean(machineView?.section));
 if(perspective){
  // HUD dibujado al FINAL de los sólidos. La tarjeta no puede quedar
  // tapada por la matriz ni sobreescribir el canto frontal del dedo.
  const gaugeRisk=gaugeRiskStatus(placement),level=gaugeRisk.level;
  const [faceX,faceY]=machineGaugeProjection(placement,cx,baseY,scale).point;
  const layout=gaugeStatusCardLayout(w,h,faceX,
   faceY,placement.stopNumber,level,scale,
   placement.gaugeTransition?.phase??null,gaugeRisk.forecast??null,gaugeRisk.code??null,
   gaugeRisk.clearanceMm??null,gaugeRisk.requiredMm??null,
   placement.gaugeTransition?.axisPhase??null);
  drawGaugeStatusCard(ctx,layout,level,GAUGE_COLORS[level]);
 }
 // Workpiece shadow and hot contact glow along the working tool tip
 if(st.press>.36){
  ctx.save();ctx.globalAlpha=(st.press-.35)*.7;
  ctx.fillStyle=radial(ctx,cx,sheetY,33*scale,[[0,'#13c8ffdd'],[.12,'#16a7ff6d'],[1,'#00aaff00']]);
  ctx.beginPath();ctx.ellipse(cx,sheetY,33*scale,14*scale,0,0,Math.PI*2);ctx.fill();ctx.restore();
 }
 // El ángulo se presenta en el panel de control, sin dibujar una
 // circunferencia sobre el punto de contacto de la chapa con la matriz.
 const a=piece.angles[st.activeBend]||0;
 if(presentation.repositioning){
  ctx.save();ctx.fillStyle='#9dd8ff';
  ctx.font='700 '+Math.max(9,11*scale)+'px system-ui';ctx.textAlign='center';
  // La CHAPA se reorienta entre golpes; el DEDO sólo se retira si
  // gaugePlan.enabled. No dibujar "RETIRADA" cuando el dedo no se apartó.
  const gaugeWithdrawn=scene.gaugePlan?.enabled===true;
  ctx.fillText(gaugeWithdrawn?
    'CHAPA REORIENTÁNDOSE · TOPE RETIRADO POR PENETRACIÓN 2D':
    scene.gaugeTransition?.phase==='reubicacion-siguiente-golpe'?
     'CAMBIO DE COTA DEL TOPE · SIN RETROCESO PREVENTIVO':
     'REORIENTACIÓN DE CHAPA · TOPE SIN RETIRADA',
   w/2,h-48*scale);
  ctx.restore();
 }
 // El signo del plano no se cambia: sólo cambia la CARA de presentación
 // al trabajar con un punzón que desciende desde arriba.
 if(presentation.flipped){
  ctx.save();
  ctx.font='700 '+Math.max(10,11*scale)+'px system-ui';
  ctx.textAlign='left';ctx.fillStyle='#ffca78';
  ctx.shadowColor='#000';ctx.shadowBlur=4;
  const shownAngle=presentation.repositioning?piece.angles[presentation.nextBend]:a;
  ctx.fillText((shownAngle<0?'−':'+')+Math.abs(shownAngle)+'° · CHAPA VOLTEADA',Math.min(w-186*scale,14*scale),h-34*scale);
  ctx.restore();
 }
 // tiny badges in-frame visual signifiers
 // Los textos de contexto no deben tapar el punzón ni el estado cuando
 // la vista ocupa sólo ~300px en un smartphone.
 if(w>=900){
  ctx.font='700 10px system-ui';
  ctx.fillStyle='#87b6d6';ctx.textAlign='left';
  ctx.fillText('SIMULACIÓN · PERFIL',12,h-14);
  ctx.textAlign='right';ctx.fillStyle='#6f94ad';
  ctx.fillText(machineView?.perspective?'PERSPECTIVA ILUSTRATIVA · NO CAD':'MODELO PARAMÉTRICO · NO CONTROL CNC',w-12,h-14);
 }else if(w>=470){
  ctx.font='700 9px system-ui';ctx.fillStyle='#6f94ad';ctx.textAlign='left';
  ctx.fillText(machineView?.perspective?'PERSPECTIVA 2.5D · NO CAD':'VISTA LATERAL · MODELO PARAMÉTRICO',12,h-12);
 }
}
// Entrypoint used from app.js drawMachine without changing the core timing engine.
function drawWarningHud(ctx,w,h,piece,sim,view){
 const diagnostic=currentToolContact(piece,sim.time);
 if(!diagnostic.hasWarning)return;
 if(view?.section){
  const world=technicalCameraBounds(piece);
  const reserve=w<500?67:0,usable=h-reserve;
  const padW=Math.max(28,w*.07),padH=Math.max(30,usable*.095);
  const xrange=Math.max(60,world.maxX-world.minX),
        yrange=Math.max(100,world.maxY-world.minY);
  const scale=Math.max(.08,Math.min((w-padW*2)/xrange,(usable-padH*2)/yrange))*(view.zoom||1);
  const cx=(world.minX+world.maxX)/2,cy=(world.minY+world.maxY)/2;
  ctx.save();
  for(const issue of diagnostic.issues.slice(0,7)){
   const x=w*.5+(issue.point.x-cx)*scale+(view.panX||0);
   const y=usable*.5-(issue.point.y-cy)*scale+(view.panY||0);
   if(y<0||y>usable||x<0||x>w)continue;
   const penetration=issue.category==='penetration';
   ctx.fillStyle=penetration?'#ff663b4b':'#ffbb4545';
   ctx.strokeStyle=penetration?'#ff784f':'#ffcc70';ctx.lineWidth=2;
   ctx.beginPath();ctx.arc(x,y,8,0,Math.PI*2);ctx.fill();ctx.stroke();
   ctx.beginPath();
   if(penetration){
    ctx.moveTo(x-4,y-4);ctx.lineTo(x+4,y+4);
    ctx.moveTo(x+4,y-4);ctx.lineTo(x-4,y+4);
   }else{
    ctx.moveTo(x,y-4);ctx.lineTo(x,y+1);
    ctx.moveTo(x,y+4);ctx.lineTo(x+.1,y+4);
   }
   ctx.stroke();
  }
  ctx.restore();
 }
 const dominant=diagnostic.issues[0],tool=dominant.kind==='punch'?'PUNZÓN':'MATRIZ';
 const message=dominant.category==='penetration'?
  '⚠ PENETRACIÓN 2D · '+tool:'⚠ HOLGURA 2D · '+tool;
 ctx.save();
 const font=Math.max(9,Math.min(12,w/48));
 ctx.font='800 '+font+'px system-ui';const width=Math.min(w-16,ctx.measureText(message).width+19);
 const x=8,y=view?.section?(w<500?h-133:h-57):h-61;
 ctx.fillStyle='#632416e9';ctx.strokeStyle='#ffab50';ctx.lineWidth=1.2;
 ctx.beginPath();roundedRectPath(ctx,x,y,width,26,5);ctx.fill();ctx.stroke();
 ctx.fillStyle='#ffdda3';ctx.fillText(message,x+9,y+18);
 ctx.restore();
}
export function drawIndustrialMachine(ctx,w,h,piece,sim,machineView){
 if(machineView?.section)drawTechnicalSection(ctx,w,h,piece,sim,machineView);
 else stageScene(ctx,w,h,piece,sim,machineView);
 drawWarningHud(ctx,w,h,piece,sim,machineView);
}
