/**
 * PlegadoX R125 · visor orbital de sólidos PRISMÁTICOS en 3 coordenadas.
 * Mantiene las caras y Z de cada prisma de volume-engine; no equivale a STEP
 * ni verifica amarres, ceros CNC, giro/deformación, ni operación segura.
 * El cálculo de colisión permanece exclusivamente en los motores existentes.
 */
import {buildVolumeScene,triangulateSimplePolygon} from './volume-engine.js';
import {technicalScene} from './technical-section.js';
import {getActiveMachineConfig} from './machine-config.js';
import {loadAxisMotion,motionPieceKey} from './machine-axis-motion.js';
import {loadAxisMapping} from './machine-axis-geometry.js';
import {machineConfigurationKey} from './machine-cad.js';
import {getActiveMachineProfile} from './machine-selection.js';
import {createSolidFrameCache} from './machine-solid-frame-cache.js';
import {assessTrailEvidence} from './machine-axis-trail-evidence.js';
import {describeGaugeVisualEvidence} from './machine-gauge-evidence.js';
import {gaugeSolidStyle} from './machine-solid-gauge-style.js';
import {visibleVolumeFaces} from './machine-volume-layers.js';
import {browserRenderBudget,readQuality,saveQuality} from './adaptive-render-budget.js';
import {canvasRenderSize} from './machine-canvas-memory-r131.js';

const palette=Object.freeze({
 sheet:[73,169,210],punch:[174,197,218],die:[100,137,169],
 ram:[58,99,140],bed:[66,84,105],gauge:[231,160,75],
 upperClamp:[115,145,166],lowerClamp:[100,122,140],
 upperAdapter:[146,156,167],lowerAdapter:[112,133,151],
 frontSupport:[95,162,155]
});
const clamp=(n,min,max)=>Math.min(max,Math.max(min,n));
const midpoint=polygon=>({x:polygon.reduce((a,p)=>a+p.x,0)/polygon.length,
 y:polygon.reduce((a,p)=>a+p.y,0)/polygon.length});
const corner=(p,z)=>({x:p.x,y:p.y,z});

export function prismMesh(prism,kind='sheet'){
 if(!prism?.valid||!Array.isArray(prism.polygon)||prism.polygon.length>1000)
  return [];
 const points=prism.polygon;
 const caps=triangulateSimplePolygon(points);
 if(!caps.length)return [];
 const faces=[];
 for(const tri of caps){
  faces.push({kind,points:tri.map(p=>corner(p,prism.zMin)),surface:'rear'});
  faces.push({kind,points:[...tri].reverse().map(p=>corner(p,prism.zMax)),surface:'front'});
 }
 for(let i=0;i<points.length;i++){
  const a=points[i],b=points[(i+1)%points.length];
  faces.push({kind,points:[corner(a,prism.zMin),corner(b,prism.zMin),
   corner(b,prism.zMax),corner(a,prism.zMax)],surface:'side'});
 }
 return faces;
}
export function machineVolumeMesh(model,maxFaces=2500){
 const faces=[],omitted=[];
 const solids=[...model.sheet.map(s=>[s,'sheet']),
  ...Object.entries(model.objects)
   .filter(([kind])=>!(model.gaugeReferenceOnly&&kind==='gauge'))
   .map(([kind,s])=>[s,kind])];
 for(const [solid,kind] of solids){
  const part=prismMesh(solid,kind);
  if(!part.length){omitted.push(kind+' (geometría no dibujable)');continue;}
  if(faces.length+part.length>maxFaces){omitted.push(kind+' (límite de caras)');continue;}
  faces.push(...part);
 }
 return {faces,omitted,hasOEM:model.cadProfilesUsed.length>0,
  importedKinds:model.cadProfilesUsed,verified:false};
}
export function rotate3D(pt,yaw=-.65,pitch=.38){
 const cy=Math.cos(yaw),sy=Math.sin(yaw),cp=Math.cos(pitch),sp=Math.sin(pitch);
 const x=pt.x*cy-pt.z*sy,z=pt.x*sy+pt.z*cy;
 return {x,y:pt.y*cp-z*sp,depth:pt.y*sp+z*cp};
}
export function axisRelativeTrails(motion,mapping,model){
 if(!motion||!mapping?.signs||!motion.poses?.length||!model?.objects?.ram?.valid
   ||!model.objects.gauge?.valid)return [];
 const poses=motion.poses,stride=Math.max(1,Math.ceil(poses.length/100));
 const first=poses[0].axes,signs=mapping.signs;
 if(!['Y','X','R','Z1','Z2'].every(k=>signs[k]===1||signs[k]===-1))
  return [];
 const ram=model.objects.ram,gauge=model.objects.gauge;
 const rm=midpoint(ram.polygon),gm=midpoint(gauge.polygon);
 const origins=[{name:'Y1',z:ram.zMin},{name:'Y2',z:ram.zMax}];
 const result=[];
 for(const side of origins){
  const trail=poses.filter((_,i)=>i%stride===0||i===poses.length-1)
   .map(p=>({x:rm.x,y:rm.y+(p.axes[side.name]-first[side.name])*signs.Y,
    z:side.z}));
  result.push({name:side.name,points:trail});
 }
 for(const key of ['Z1','Z2']){
  const finger=model.gaugeReferenceOnly?model.objects['gauge'+key]:gauge;
  const center=finger?.valid?midpoint(finger.polygon):gm;
  const zCenter=finger?.valid?(finger.zMin+finger.zMax)/2:
   (gauge.zMin+gauge.zMax)/2;
  const trail=poses.filter((_,i)=>i%stride===0||i===poses.length-1)
   .map(p=>({x:center.x+(p.axes.X-first.X)*signs.X,
    y:center.y+(p.axes.R-first.R)*signs.R,
    z:zCenter+(p.axes[key]-first[key])*signs[key]}));
  result.push({name:'X/R/'+key,points:trail});
 }
 return result;
}
function paint(ctx,w,h,faces,trails,camera,maxFaces,gaugeEvidence){
 ctx.fillStyle='#091726';ctx.fillRect(0,0,w,h);
 if(!faces.length){
  ctx.fillStyle='#f0b46d';ctx.font='14px system-ui';
  ctx.fillText('No hay sólidos válidos para esta vista.',15,28);return;
 }
 const prepared=faces.map(face=>{
  const rotated=face.points.map(p=>rotate3D(p,camera.yaw,camera.pitch));
  return {kind:face.kind,surface:face.surface,
   vertices:rotated,depth:rotated.reduce((n,p)=>n+p.depth,0)/rotated.length};
 });
 const trailCoords=trails.flatMap(t=>t.points.map(p=>rotate3D(p,camera.yaw,camera.pitch)));
 const coords=prepared.flatMap(f=>f.vertices).concat(trailCoords);
 let xMin=Infinity,xMax=-Infinity,yMin=Infinity,yMax=-Infinity;
 for(const p of coords){
  xMin=Math.min(xMin,p.x);xMax=Math.max(xMax,p.x);
  yMin=Math.min(yMin,p.y);yMax=Math.max(yMax,p.y);
 }
 const extentX=Math.max(1,xMax-xMin),extentY=Math.max(1,yMax-yMin);
 const sc=clamp(Math.min((w-38)/extentX,(h-70)/extentY)*camera.zoom,.004,20);
 const centerX=(xMin+xMax)/2,centerY=(yMin+yMax)/2;
 const project=p=>({x:w/2+(p.x-centerX)*sc+camera.panX,
  y:h/2-(p.y-centerY)*sc+camera.panY});
 prepared.sort((a,b)=>a.depth-b.depth);
 const gaugeStyle=gaugeSolidStyle(gaugeEvidence);
 for(const face of prepared){
  const special=face.kind==='gauge'||face.kind==='gaugeZ1'||face.kind==='gaugeZ2';
  const base=special?gaugeStyle.color:(palette[face.kind]||[120,145,155]);
  const span=face.vertices;
  const dx=span[1].x-span[0].x,dy=span[1].y-span[0].y;
  const light=face.surface==='side'?.86:face.surface==='front'?1.08:.68;
  const shade=clamp(light+(dx-dy)/Math.max(500,extentX+extentY)*.3,.52,1.18);
  ctx.beginPath();
  span.forEach((p,i)=>{const v=project(p);if(i===0)ctx.moveTo(v.x,v.y);else ctx.lineTo(v.x,v.y);});
  ctx.closePath();
  const rgb=base.map(v=>Math.round(clamp(v*shade,0,255))).join(',');
  const provisional=special&&gaugeStyle.provisional;
  ctx.fillStyle=provisional?'rgba('+rgb+','+gaugeStyle.fillAlpha+')':
   'rgb('+rgb+')';
  ctx.fill();
  ctx.save();
  ctx.strokeStyle=provisional?'rgba(255,231,171,.8)':'rgba(223,243,255,.21)';
  ctx.lineWidth=provisional?1.1:.65;
  if(provisional)ctx.setLineDash([4,3]);
  ctx.stroke();
  ctx.restore();
 }
 ctx.save();ctx.strokeStyle='#edc58a';ctx.lineWidth=1.5;
 ctx.setLineDash([5,4]);
 for(const trail of trails){
  if(trail.points.length<2)continue;
  ctx.beginPath();
  trail.points.forEach((p,i)=>{
   const q=project(rotate3D(p,camera.yaw,camera.pitch));
   if(i===0)ctx.moveTo(q.x,q.y);else ctx.lineTo(q.x,q.y);
  });
  ctx.stroke();
 }
 ctx.restore();
 ctx.fillStyle='#eef6fd';ctx.font='700 12px system-ui';
 ctx.fillText('MALLA VOLUMÉTRICA 3D · SIN CERTIFICACIÓN OEM/CNC',12,21);
 ctx.font='700 11px system-ui';
 ctx.fillStyle='#d5efe1';
 const color=gaugeStyle.level==='red'?'ROJO':
  gaugeStyle.level==='green'?'VERDE':'NARANJA';
 ctx.fillText('TOPE: '+color+
  (gaugeStyle.provisional?' · Z provisional (línea discontinua)':
   ' · Z de DXF declarada sin certificar'),12,39);
 ctx.font='11px system-ui';ctx.fillStyle='#bed3e1';
 ctx.fillText('Orbitar: arrastrar · Zoom: pellizcar o rueda · Ocultar capas NO desactiva avisos',12,h-13);
}
function install(){
 const canvas=document.getElementById('machineSolidCanvas');
 const button=document.getElementById('machineSolidToggle');
 const status=document.getElementById('machineSolidStatus');
 const gaugeStatus=document.getElementById('machineGaugeEvidence');
 const chooser=document.getElementById('machineRenderQuality');
 if(!canvas||!button)return;
 let enabled=false;
 let mode=readQuality(window.localStorage);
 let camera={yaw:-.65,pitch:.38,zoom:1,panX:0,panY:0};
 const pointers=new Map();
 let previousPinch=0,lastRender=0;
 let budget=browserRenderBudget(window,mode);
 // La cámara, zoom y pan no cambian los vértices. Reutilizar los
 // mismos sólidos y triangulación hasta que cambie la pieza o fase.
 const frameCache=createSolidFrameCache((piece,time,maxFaces)=>{
  const machine=getActiveMachineConfig();
  const scene=technicalScene(piece,time);
  const model=buildVolumeScene(scene,{machine});
  const mesh=machineVolumeMesh(model,maxFaces);
  let motion=null,mapping=null,trailEvidence=null,trails=[];
  try{
   motion=loadAxisMotion(localStorage);
   mapping=loadAxisMapping(localStorage);
   trailEvidence=assessTrailEvidence({
    motion,mapping,pieceKey:motionPieceKey(piece),
    machineConfigKey:machineConfigurationKey(machine),
    machineId:getActiveMachineProfile().id
   });
   if(trailEvidence.drawable)trails=axisRelativeTrails(motion,mapping,model);
  }catch(error){
   trailEvidence={drawable:false,code:'lectura-invalida',
    reason:'Error de validación de ejes: '+String(error?.message||error)};
  }
  return {model,mesh,trails,trailEvidence,
   gauge:describeGaugeVisualEvidence(model.gaugePlacement,model.objects.gauge,model.sheet,
    model.gaugeReferenceOnly?[model.objects.gaugeZ1,model.objects.gaugeZ2]:null)};
 },{capacity:budget.maxCachedFrames});
 window.PLEGADOX_SOLID_RENDER_STATS=()=>frameCache.stats;
 window.PLEGADOX_SOLID_CACHE_DETAILS=()=>frameCache.details;
 window.PLEGADOX_GRAPHICS_BUDGET=()=>budget;
 window.PLEGADOX_SOLID_ACTIVE=()=>enabled;
 const setStatus=message=>{if(status)status.textContent=message;};
 const render=(force=false)=>{
  if(!enabled||document.hidden)return;
  const now=performance.now();
  if(!force&&now-lastRender<budget.machineIntervalMs)return;
  lastRender=now;
  const state=window.PLEGADOX_STATE?.();
  if(!state)return;
  const rect=canvas.getBoundingClientRect();
  if(rect.width<2||rect.height<2)return;
  const w=rect.width,h=rect.height;
  const bitmap=canvasRenderSize(w,h,budget.dpr,budget.maxCanvasPixels);
  const {dpr}=bitmap;
  if(canvas.width!==bitmap.width||canvas.height!==bitmap.height){
   canvas.width=bitmap.width;canvas.height=bitmap.height;
  }
  const ctx=canvas.getContext('2d',{alpha:false});
  ctx.setTransform(dpr,0,0,dpr,0,0);
  try{
   const frame=frameCache.get(state.piece,state.sim.time,budget.maxFaces);
   const {model,mesh,trails,trailEvidence,gauge}=frame;
   const visibleFaces=visibleVolumeFaces(mesh.faces,window.PLEGADOX_MACHINE_VIEW);
   paint(ctx,w,h,visibleFaces,trails,camera,budget.maxFaces,gauge);
   const missing=model.missingCadComponents.join(', ');
   const message='Sólidos dibujados: '+visibleFaces.length+' de '+mesh.faces.length+' caras · Galaxy: '+bitmap.pixelCount.toLocaleString()+
    ' píxeles'+(bitmap.capped?' (protección memoria)':'')+
    ' · escenas en RAM: '+frameCache.details.entries+
    ' · Dedos Z1/Z2: '+model.gaugeFingerReview.status+' · CAD de máquina importado: '+
    (mesh.importedKinds.join(', ')||'ninguno')+'. Faltan: '+(missing||'ninguno')+
    (mesh.omitted.length?'. Omitidos: '+mesh.omitted.join(', '):'')+
    '. Recorridos: '+trailEvidence.reason+
    '. No habilita aprobación de colisiones.';
   if(status&&status.textContent!==message)setStatus(message);
   if(gaugeStatus&&gaugeStatus.textContent!==gauge.message)
    gaugeStatus.textContent=gauge.message;
  }catch(error){
   setStatus('No se pudo dibujar el sólido: '+String(error?.message||error));
  }
 };
 const refreshBudget=()=>{
  budget=browserRenderBudget(window,mode);
  frameCache.setCapacity(budget.maxCachedFrames);
  if(chooser)chooser.value=mode;
  document.documentElement.dataset.renderTier=budget.tier;
  if(enabled)render(true);
 };
 button.addEventListener('click',()=>{
  enabled=!enabled;canvas.hidden=!enabled;
  canvas.closest('.cp-machine-frame')?.classList.toggle('px-solid-active',enabled);
  button.setAttribute('aria-pressed',String(enabled));
  button.textContent=enabled?'◈ Volver 2,5D':'◈ Sólidos 3D';
  setStatus(enabled?'Vista volumétrica activa; geometría sin certificar':
   'Vista normal 2,5D. Activa los sólidos para orbitar la máquina.');
  if(enabled)render(true);else window.PLEGADOX_REDRAW_MACHINE?.();
 });
 chooser?.addEventListener('change',()=>{
  mode=saveQuality(window.localStorage,chooser.value);
  frameCache.invalidate();refreshBudget();
  window.PLEGADOX_REDRAW?.();
 });
 document.getElementById('machineSolidReset')?.addEventListener('click',()=>{
  camera={yaw:-.65,pitch:.38,zoom:1,panX:0,panY:0};
  render(true);
 });
 canvas.addEventListener('pointerdown',event=>{
  canvas.setPointerCapture?.(event.pointerId);
  pointers.set(event.pointerId,{x:event.clientX,y:event.clientY});
 });
 canvas.addEventListener('pointermove',event=>{
  if(!pointers.has(event.pointerId))return;
  const prev=pointers.get(event.pointerId);
  pointers.set(event.pointerId,{x:event.clientX,y:event.clientY});
  if(pointers.size===1){
   camera.yaw+=(event.clientX-prev.x)*.009;
   camera.pitch=clamp(camera.pitch+(event.clientY-prev.y)*.009,-1.4,1.4);
  }else if(pointers.size===2){
   const p=[...pointers.values()];
   const d=Math.hypot(p[0].x-p[1].x,p[0].y-p[1].y);
   if(previousPinch>0)camera.zoom=clamp(camera.zoom*d/previousPinch,.35,6);
   previousPinch=d;
  }
  // Coalescer el giro táctil: en Galaxy el pointermove puede superar 100 Hz.
  // Acumular la cámara pero no triangulamos/renderizamos por cada evento.
  render(false);
 });
 const end=event=>{pointers.delete(event.pointerId);previousPinch=0;render(true);};
 canvas.addEventListener('pointerup',end);
 canvas.addEventListener('pointercancel',end);
 canvas.addEventListener('wheel',event=>{
  if(!enabled)return;event.preventDefault();
  camera.zoom=clamp(camera.zoom*(event.deltaY<0?1.09:.91),.35,6);
  render(true);
 },{passive:false});
 window.addEventListener('resize',refreshBudget,{passive:true});
 window.addEventListener('plegadox:viewportChanged',refreshBudget);
 window.addEventListener('plegadox:machineChanged',()=>{frameCache.invalidate();render(true);});
 window.addEventListener('plegadox:pieceChanged',()=>{frameCache.invalidate();render(true);});
 window.PLEGADOX_SOLID_RENDER=()=>render(false);
 window.PLEGADOX_SOLID_RENDER_FORCE=()=>render(true);
 window.addEventListener('plegadox:visualChanged',()=>render(true));
 window.addEventListener('plegadox:simulationSeek',()=>render(true));
 refreshBudget();
}
if(typeof document!=='undefined')install();
