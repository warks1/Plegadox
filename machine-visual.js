// Plegadox · Render de taller en vista lateral con materiales pulidos.
// Geometría ilustrativa, no modelo CAD certificado ni calculador de colisiones.
import {stage,presentedAtStage,getTooling} from './engine.js';
import {roundedRectPath} from './canvas-path.js';
import {sectionPunch,sectionDie} from './tool-profiles.js';
import {drawTechnicalSection,technicalScene} from './technical-section.js';
import {currentToolContact} from './tool-collision.js';
import {getV85} from './machine-config.js';
import {gaugePlacement,gaugeContourAtContact} from './backgauge-placement.js';
import {sceneAtmosphere,dieDepth,ramDepth,sheetDepth,surfaceDetail,sectionOverlay} from './render-enhancements.js';

const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
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
function rearMachine(ctx,w,h,cx,cy,scale,placement){
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
 // En el vídeo real el tope llega DESDE DETRÁS (derecha en perfil)
 // hacia el borde trasero de la chapa. Esta referencia se deriva del
 // borde presentado, no de una distancia fija inventada.
 const gauge=placement.profile==='support'?getV85().support:getV85().stop;
 const origin=placement.contact?.origin||placement.point;
 const ox=cx+origin.x*scale,oy=cy-origin.y*scale;
 // La geometría del dedo y el punto de contacto están en el mismo
 // sistema de mm que chapa, punzón y matriz.
 const gg=gaugeContourAtContact(placement,gauge).map(p=>[
  cx+p.x*scale,cy-p.y*scale]);
 const faceX=cx+placement.point.x*scale;
 // El brazo viene por DETRÁS del dedo: no debe atravesar el propio perfil
 // ni nacer en el punto de contacto chapa/dedo (fallo visible en vídeo).
 const bodyRear=Math.max(...gg.map(p=>p[0]));
 const rodStart=Math.max(faceX,bodyRear);
 const rodEnd=rodStart+Math.max(35,gauge[0]*.45)*scale;
 steelRect(ctx,rodStart,cy-placement.point.y*scale+4*scale,
  Math.max(8,rodEnd-rodStart),6*scale,false);
 const conflict=!!placement.gaugeInterference?.warning;
 const valid=placement.alignedToSheet;
 poly(ctx,gg,
  gradient(ctx,ox,oy,rodEnd,oy,valid?
   [[0,'#9ff6b7'],[.28,'#44b975'],[.76,'#235a48'],[1,'#112f31']]:
   [[0,'#c5d1dc'],[.28,'#7890a4'],[.76,'#475b6c'],[1,'#1e3447']]),
  conflict?'#ff906f':valid?'#c8ffe0':'#9ab5c8',Math.max(1.2,1.9*scale));
 // Resaltar la cara real del dedo: STOP frontal o escalón SUPPORT.
 // Un vértice interior de la chapa no constituye un apoyo fiable.
 const contact=placement.contact;
 const screen=pt=>[cx+pt.x*scale,cy-pt.y*scale];
 if(contact){
  const a=screen(contact.from),b=screen(contact.to);
  ctx.save();ctx.lineWidth=Math.max(3,3.6*scale);
  ctx.strokeStyle=conflict?'#ff856e':valid?'#c1ffe2':'#ffd18d';
  ctx.shadowBlur=11*scale;ctx.shadowColor=conflict?'#ff4b37':valid?'#4fffb6':'#ffad56';
  ctx.beginPath();ctx.moveTo(...a);ctx.lineTo(...b);ctx.stroke();
  const cp=screen(contact.point);
  ctx.beginPath();ctx.arc(...cp,Math.max(2.5,3*scale),0,Math.PI*2);
  ctx.fillStyle=conflict?'#ff7769':valid?'#e1fff1':'#ffd18d';ctx.fill();ctx.restore();
 }
 for(const frac of [.24,.58])bolt(ctx,rodStart+(rodEnd-rodStart)*frac,
  cy-placement.point.y*scale-10*scale,2.4*scale);
 ctx.font='800 '+Math.max(8,11*scale)+'px system-ui';
 ctx.fillStyle='#a5ffcc';ctx.textAlign='left';
 const label=conflict?'⚠ TOPE '+placement.stopNumber+' · REVISAR INTERFERENCIA':
  placement.stopNumber===2?'TOPE 2 · ESCALÓN':'TOPE 1 · CARA STOP';
 ctx.fillText(label,Math.min(Math.max(8,ox+3*scale),w-145*scale),
  Math.max(20,cy-placement.point.y*scale-24*scale));
 // Left support and machine rails
 steelRect(ctx,0,cy+26*scale,w*.3,40*scale,false);
 for(let i=0;i<4;i++){shape(ctx,20+i*32*scale,cy+28*scale,8*scale,34*scale,'#20394e','#435b6b');}
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
 // Silueta del punzón calculada con el ángulo incluido nominal:
 // 30° = transición larga y estrecha, 60° = intermedia, 88° = corta.
 const geometry=sectionPunch(punch);
 const factor=scale;
 const top=tipY-geometry.height*factor;
 const ramW=125*scale;
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
 rearMachine(ctx,w,h,cx,baseY,scale,placement);
 dieDepth(ctx,{cx,cy:baseY,s:scale},opening,Boolean(machineView?.perspective),scene.die);
 drawDie(ctx,scene,cx,baseY,scale);
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
  const x=cx+placement.point.x*scale,y=baseY-placement.point.y*scale;
  ctx.save();ctx.beginPath();ctx.arc(x,y,Math.max(3,3.5*scale),0,Math.PI*2);
  ctx.fillStyle='#b5ffe2';ctx.shadowColor='#4bffb0';ctx.shadowBlur=10*scale;
  ctx.fill();ctx.strokeStyle='#174e3b';ctx.lineWidth=1.2;ctx.stroke();ctx.restore();
 }
 sectionOverlay(ctx,{cx,cy:baseY,s:scale},opening,punch.tip||0,Boolean(machineView?.section));
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
  ctx.fillText(machineView?.perspective?
    'RETIRADA → RECOLOCACIÓN ORIENTATIVA · NO 3D REAL':
    'RETIRADA → RECOLOCACIÓN ESQUEMÁTICA',w/2,h-48*scale);
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
  ctx.fillText('VISTA LATERAL · MODELO PARAMÉTRICO',12,h-12);
 }
}
// Entrypoint used from app.js drawMachine without changing the core timing engine.
function drawWarningHud(ctx,w,h,piece,sim,view){
 const diagnostic=currentToolContact(piece,sim.time);
 if(!diagnostic.hasWarning)return;
 if(view?.section){
  const scene=technicalScene(piece,diagnostic.stage),world=scene.world;
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
