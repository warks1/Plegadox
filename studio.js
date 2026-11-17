// PlegadoX R124 · Perspectiva avanzada y estudio visual 2,5D.
// NUNCA cambia la geometría física, la secuencia ni los avisos de riesgo.
import {VIEW_PRESETS,VIEW_DEFAULTS,normalizeMachineView,
 applyViewPreset,displayOptions} from './machine-view-options.js';
const $=id=>document.getElementById(id);
const STORE='plegadox:visual-options:r124';
const toggles=[
 ['machinePerspective','perspective'],
 ['machineSection','section'],
 ['machineTransparent','transparent']
];
const layers={
 machineShowSheet:'showSheet',machineShowPunch:'showPunch',
 machineShowDie:'showDie',machineShowRam:'showRam',
 machineShowGauge:'showGauge',machineShowContact:'showContact',
 machineShowGrid:'showGrid',machineShowAxes:'showAxes',
 machineShowLabels:'showLabels'
};
const clamp=(value,min,max)=>Math.min(max,Math.max(min,value));
function currentView(){return window.PLEGADOX_MACHINE_VIEW;}
function save(view){
 try{
  const state=normalizeMachineView(view);
  // Sólo preferencias de PRESENTACIÓN; no guardar geometría privada.
  localStorage.setItem(STORE,JSON.stringify(state));
 }catch{/* La vista funciona aunque el navegador no permita guardar. */}
}
function restore(view){
 try{
  const raw=localStorage.getItem(STORE);
  if(raw){
   const incoming=JSON.parse(raw);
   if(incoming&&typeof incoming==='object')
    Object.assign(view,normalizeMachineView(incoming));
  }
 }catch{/* Preferencias inválidas: mantener la vista actual. */}
}
function visiblePercent(value){return Math.round(value*100)+' %';}
function syncControls(){
 const v=currentView();if(!v)return;
 const view=normalizeMachineView(v);
 document.querySelector('.cp-simulation')?.classList.toggle(
  'is-technical',Boolean(view.section));
 for(const [id,key] of toggles)
  $(id)?.setAttribute('aria-pressed',String(Boolean(view[key])));
 const desc=view.section?'SECCIÓN EN MM':
  view.perspective?'PERSPECTIVA 2.5D':'PERFIL 2D';
 const activePreset=VIEW_PRESETS[view.preset];
 const label=activePreset?.label||(view.perspective?'Perspectiva personalizada':'Perfil 2D');
 if($('machineViewLabel'))$('machineViewLabel').textContent=
  view.section?'SECCIÓN MM':view.perspective?'PERSPECTIVA':'VISTA LATERAL';
 if($('machineGraphicMode'))$('machineGraphicMode').textContent=desc;
 if($('machineModeNote'))$('machineModeNote').textContent=
  view.section?'Sección 2D métrica con escala común en mm. Los avisos se calculan independientemente de las capas.':
  view.perspective?'Perspectiva 2,5D ilustrativa · '+label+
   ' · NO es cámara CAD 3D ni trayectoria CNC.':
   'Perfil lateral 2D · Chapa, útiles y topes con geometría nominal.';
 const preset=$('machineViewPreset');if(preset)preset.value=
  view.preset in VIEW_PRESETS?view.preset:'custom';
 const theme=$('machineTheme');if(theme)theme.value=view.theme;
 for(const [id,key] of Object.entries(layers)){
  const b=$(id);if(b)b.checked=view[key];
 }
 for(const [id,out,key] of [
  ['machineDepth','machineDepthValue','depth'],
  ['machineTilt','machineTiltValue','tilt'],
  ['machineZoomRange','machineZoomValue','zoom']
 ]){
  const input=$(id);if(input)input.value=String(view[key]);
  const output=$(out);if(output)output.textContent=visiblePercent(view[key]);
 }
 const status=$('machineViewHint');
 if(status)status.textContent=
  label+' · profundidad '+visiblePercent(view.depth)+
  ' · zoom '+visiblePercent(view.zoom)+
  ' · ocultar una capa NO desactiva los avisos de penetración o apoyo. '+
  (view.section?'Las capas se configuran en perspectiva; la sección técnica conserva todas las entidades.':
   'La perspectiva 2,5D no acredita distancias longitudinales ni colisiones físicas.');
 const details=$('machineViewStudio');
 const open=$('machineOptionsButton');
 if(open&&details){
  open.setAttribute('aria-expanded',String(details.open));
  open.setAttribute('aria-pressed',String(details.open));
 }
}
function paint(){
 syncControls();const view=currentView();if(view)save(view);
 if(typeof window.PLEGADOX_REDRAW_MACHINE==='function')
  window.PLEGADOX_REDRAW_MACHINE();
 else window.PLEGADOX_REDRAW?.();
}
function choosePreset(name){
 const view=currentView();if(!view)return;
 if(name==='custom'){
  view.section=false;view.perspective=true;view.preset='custom';
 }else applyViewPreset(view,name);
 paint();
}
function bindButton(id,action){
 const node=$(id);if(node)node.addEventListener('click',action);
}
function bindSlider(id,key){
 const input=$(id);if(!input)return;
 input.addEventListener('input',()=>{
  const v=currentView();if(!v)return;
  const candidate=normalizeMachineView({...v,[key]:Number(input.value)});
  v[key]=candidate[key];
  if(key!=='zoom'){
   v.section=false;v.perspective=true;v.preset='custom';
  }
  paint();
 });
}
function seek(operation,fraction){
 const api=window.PLEGADOX_SEEK_PREVIEW;
 if(typeof api==='function')api({operation,fraction});
 else{
  const status=$('machineViewHint');
  if(status)status.textContent='No está disponible el salto de fase en esta compilación.';
 }
}
function fullscreenFrame(){return $('machineCanvas')?.closest('.cp-machine-frame');}
function syncFullscreen(){
 const frame=fullscreenFrame(),button=$('machineFullscreen');
 const active=Boolean(frame&&(document.fullscreenElement===frame||
  frame.classList.contains('px-view-immersive')));
 if(button){
  button.setAttribute('aria-pressed',String(active));
  button.title=active?'Cerrar pantalla completa':'Ampliar simulación a pantalla completa';
 }
}
async function toggleFullscreen(){
 const frame=fullscreenFrame();if(!frame)return;
 if(document.fullscreenElement===frame){
  try{await document.exitFullscreen();}catch{}
 }else if(frame.classList.contains('px-view-immersive')){
  frame.classList.remove('px-view-immersive');
  document.body.classList.remove('px-immersive-open');
 }else{
  try{
   if(typeof frame.requestFullscreen!=='function')
    throw Error('Fullscreen API no admitida');
   await frame.requestFullscreen();
  }catch{
   // iPhone Safari no ofrece Fullscreen API en elementos arbitrarios.
   frame.classList.add('px-view-immersive');
   document.body.classList.add('px-immersive-open');
  }
 }
 syncFullscreen();
 requestAnimationFrame(()=>window.PLEGADOX_REDRAW_MACHINE?.());
}
function capturePNG(){
 const canvas=$('machineCanvas');if(!canvas)return;
 try{
  // La captura respeta capas, zoom y perspectiva; NO adjunta una
  // certificación de colisión ni la transforma en modelo 3D.
  const name=(window.PLEGADOX_STATE?.().piece?.name||'pieza')
   .replace(/[^\p{L}\p{N}_-]+/gu,'-').slice(0,50);
  const stamp=new Date().toISOString().slice(0,19).replaceAll(':','-');
  const link=document.createElement('a');
  link.download='PlegadoX-'+name+'-'+stamp+'-vista-2p5D.png';
  link.href=canvas.toDataURL('image/png');
  document.body.append(link);link.click();link.remove();
  const status=$('machineViewHint');
  if(status)status.textContent='Captura PNG de la vista actual guardada. Es ilustrativa: no certifica colisiones.';
 }catch(error){
  const status=$('machineViewHint');
  if(status)status.textContent='No se pudo exportar PNG: '+error.message;
 }
}
function init(){
 const view=currentView();if(!view)return;
 Object.assign(view,normalizeMachineView(view));restore(view);
 // Restauración visual sin cambiar el proyecto ni la configuración CNC.
 for(const [id,key] of toggles){
  bindButton(id,()=>{
   const v=currentView();if(!v)return;
   if(key==='perspective'){
    // El atajo 2D/2,5D aplica un preset REAL, no conserva una
    // profundidad personalizada mientras la UI dice 'Industrial'.
    applyViewPreset(v,v.perspective?'profile':'nominal');
   }else if(key==='section'){
    applyViewPreset(v,v.section?'nominal':'section');
   }else v.transparent=!v.transparent;
   paint();
  });
 }
 const preset=$('machineViewPreset');
 preset?.addEventListener('change',()=>choosePreset(preset.value));
 const theme=$('machineTheme');
 theme?.addEventListener('change',()=>{
  const v=currentView();if(!v)return;
  v.theme=normalizeMachineView({...v,theme:theme.value}).theme;
  paint();
 });
 bindSlider('machineDepth','depth');
 bindSlider('machineTilt','tilt');
 bindSlider('machineZoomRange','zoom');
 for(const [id,key] of Object.entries(layers)){
  const input=$(id);if(!input)continue;
  input.addEventListener('change',()=>{
   const v=currentView();if(!v)return;
   v[key]=Boolean(input.checked);paint();
  });
 }
 for(const [id,dx,dy] of [
  ['machinePanLeft',-42,0],['machinePanRight',42,0],
  ['machinePanUp',0,-42],['machinePanDown',0,42]
 ]){
  bindButton(id,()=>{
   const v=currentView();if(!v)return;
   v.panX=clamp(v.panX+dx,-1500,1500);
   v.panY=clamp(v.panY+dy,-1500,1500);paint();
  });
 }
 bindButton('machineCenterView',()=>{
  const v=currentView();if(!v)return;
  v.panX=0;v.panY=0;paint();
 });
 bindButton('machineZoomIn',()=>{
  const v=currentView();if(!v)return;
  v.zoom=clamp(v.zoom*1.2,.4,5);paint();
 });
 bindButton('machineZoomOut',()=>{
  const v=currentView();if(!v)return;
  v.zoom=clamp(v.zoom/1.2,.4,5);paint();
 });
 bindButton('machineReset',()=>{
  const v=currentView();if(!v)return;
  v.panX=0;v.panY=0;v.zoom=1;paint();
 });
 bindButton('machineResetOptions',()=>{
  Object.assign(view,VIEW_DEFAULTS);paint();
 });
 bindButton('machineCapture',capturePNG);
 bindButton('machineFullscreen',toggleFullscreen);
 document.addEventListener('fullscreenchange',()=>{
  syncFullscreen();
  requestAnimationFrame(()=>window.PLEGADOX_REDRAW_MACHINE?.());
 });
 document.addEventListener('keydown',event=>{
  if(event.key==='Escape'&&fullscreenFrame()?.classList.contains('px-view-immersive')){
   fullscreenFrame().classList.remove('px-view-immersive');
   document.body.classList.remove('px-immersive-open');
   syncFullscreen();
   window.PLEGADOX_REDRAW_MACHINE?.();
  }
 });
 bindButton('machinePrevFold',()=>{
  const state=window.PLEGADOX_STATE?.();if(!state)return;
  const op=Math.floor(state.sim.time/5);
  seek(Math.max(0,op-1),0);
 });
 bindButton('machineNextFold',()=>{
  const state=window.PLEGADOX_STATE?.();if(!state)return;
  const op=Math.floor(state.sim.time/5);
  seek(Math.min(state.piece.order.length-1,op+1),0);
 });
 const phase=$('machinePhaseJump');
 phase?.addEventListener('change',()=>{
  if(phase.value==='')return;
  seek(null,Number(phase.value));phase.value='';
 });
 const details=$('machineViewStudio');
 details?.addEventListener('toggle',()=>syncControls());
 bindButton('machineOptionsButton',()=>{
  if(!details)return;
  details.open=!details.open;
  syncControls();
  if(details.open)details.scrollIntoView({behavior:'smooth',block:'nearest'});
 });
 const add=$('cpAddFold');
 if(add)add.addEventListener('click',()=>{
  const btn=$('addFlange');if(!btn)return;
  const old=window.PLEGADOX_STATE?.().piece?.flanges?.length||0;
  btn.click();
  const next=window.PLEGADOX_STATE?.().piece?.flanges?.length||0;
  add.textContent=next>old?'✓ Pliegue añadido':'Límite de pliegues';
  window.setTimeout(()=>add.textContent='＋ Añadir pliegue',1100);
 });
 if('ResizeObserver' in window){
  const root=document.querySelector('.cp-simulation');
  if(root)new ResizeObserver(()=>syncControls()).observe(root);
 }
 // Semáforo visible independientemente de las preferencias gráficas.
 if(!displayOptions(view).safetyWarningsVisible)throw Error('Avisos desactivados');
 syncControls();syncFullscreen();window.PLEGADOX_REDRAW_MACHINE?.();
}
init();
