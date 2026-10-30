// Plegadox · Mando visual del boceto aprobado.
// Todos los cambios conservan la pieza y los ángulos: sólo cambia cómo se dibuja.
const $=id=>document.getElementById(id);
const buttons=[
 ['machinePerspective','perspective'],
 ['machineSection','section'],
 ['machineTransparent','transparent']
];
function currentView(){return window.PLEGADOX_MACHINE_VIEW;}
function syncControls(){
 const view=currentView();if(!view)return;
 for(const [id,key]of buttons){
  const b=$(id);if(b)b.setAttribute('aria-pressed',String(Boolean(view[key])));
 }
 const label=view.perspective?'PERSPECTIVA 2.5D':'PERFIL 2D';
 if($('machineViewLabel'))$('machineViewLabel').textContent=view.perspective?'PERSPECTIVA':'VISTA LATERAL';
 if($('machineGraphicMode'))$('machineGraphicMode').textContent=label;
 if($('machineModeNote')){
  $('machineModeNote').textContent=view.perspective?
   'Vista ilustrativa con profundidad · geometría de pliegues calculada en perfil':
   'Punzón, chapa, matriz y topes · vista de perfil';
 }
}
function repaint(){
 window.PLEGADOX_REDRAW?.();
 syncControls();
}
function init(){
 const view=currentView();if(!view)return;
 if(view.perspective==null)view.perspective=true;
 if(view.section==null)view.section=false;
 if(view.transparent==null)view.transparent=false;
 for(const [id,key]of buttons){
  const b=$(id);if(!b)continue;
  b.addEventListener('click',()=>{
   view[key]=!view[key];
   repaint();
  });
 }
 const add=$('cpAddFold');
 if(add){
  add.addEventListener('click',()=>{
   const btn=$('addFlange');
   if(!btn)return;
   const old=window.PLEGADOX_STATE?.().piece?.flanges?.length||0;
   btn.click();
   const next=window.PLEGADOX_STATE?.().piece?.flanges?.length||0;
   add.textContent=next>old?'✓ Pliegue añadido':'Límite de pliegues';
   window.setTimeout(()=>add.textContent='＋ Añadir pliegue',1100);
  });
 }
 if('ResizeObserver' in window){
  new ResizeObserver(()=>syncControls()).observe(document.querySelector('.cp-simulation'));
 }
 syncControls();repaint();
}
init();
