/**
 * Plegadox · Adaptación automática.
 * Detecta el espacio real de pantalla, su orientación, la entrada táctil,
 * los cambios de tamaño y la densidad de píxeles. No confía en el user-agent.
 * La disposición se implementa por CSS: este módulo solo publica el estado
 * y asegura que los gráficos repinten al cambiar espacio/orientación.
 */
const root=document.documentElement;
const main=document.querySelector('main');
const watched=['main','.cockpit-main','.cp-machine-frame','.cp-library','.cp-product-card','.cp-development-card'];
const previous={layout:'',orientation:'',input:'',dpr:'',viewport:''};
let scheduled=false,queuedPaint=false;
function deviceState(){
 const width=Math.max(1,window.innerWidth||root.clientWidth||360);
 const height=Math.max(1,window.innerHeight||root.clientHeight||640);
 const coarse=matchMedia('(pointer:coarse)').matches || matchMedia('(hover:none)').matches;
 const landscape=width>height;
 // Una ventana horizontal de poca altura también necesita modo móvil:
 // adaptamos según el espacio, aunque el navegador no declare pantalla táctil.
 const phoneLandscape=landscape&&height<=560&&width<1200;
 const layout=width<700||phoneLandscape?'mobile':width<1200?'tablet':'desktop';
 const orientation=matchMedia('(orientation:landscape)').matches?'landscape':'portrait';
 return {width,height,layout,orientation,input:coarse?'touch':'pointer',dpr:Math.min(window.devicePixelRatio||1,4)};
}
function schedulePaint(){
 if(queuedPaint)return;
 queuedPaint=true;
 requestAnimationFrame(()=>{
  queuedPaint=false;
  window.PLEGADOX_REDRAW?.();
  window.dispatchEvent(new CustomEvent('plegadox:viewportChanged',{detail:deviceState()}));
 });
}
function synchronize(){
 scheduled=false;
 const s=deviceState();
 root.dataset.layout=s.layout;
 root.dataset.orientation=s.orientation;
 root.dataset.input=s.input;
 root.style.setProperty('--app-vh',s.height+'px');
 root.style.setProperty('--app-vw',s.width+'px');
 root.style.setProperty('--app-dpr',String(s.dpr));
 // El modo y la orientación son datos de maquetación, nunca texto del footer.
 const changed=Object.keys(previous).some(k=>previous[k]!== (k==='viewport'?s.width+'×'+s.height:k==='dpr'?String(s.dpr):s[k]));
 if(changed){
  previous.layout=s.layout;previous.orientation=s.orientation;
  previous.input=s.input;previous.dpr=String(s.dpr);
  previous.viewport=s.width+'×'+s.height;
  schedulePaint();
 }
}
function refresh(){if(scheduled)return;scheduled=true;requestAnimationFrame(synchronize);}
refresh();
window.addEventListener('resize',refresh,{passive:true});
const afterRotation=()=>{
 // En iOS el primer evento puede llegar antes de que cambien las cotas
 // internas del viewport; un segundo RAF recalcula el lienzo actualizado.
 refresh();
 requestAnimationFrame(()=>requestAnimationFrame(()=>{refresh();schedulePaint();}));
};
window.addEventListener('orientationchange',afterRotation,{passive:true});
window.screen.orientation?.addEventListener?.('change',afterRotation);
window.addEventListener('pageshow',afterRotation,{passive:true});
document.addEventListener('visibilitychange',()=>{
 if(!document.hidden)afterRotation();
});
window.visualViewport?.addEventListener('resize',refresh,{passive:true});
for(const query of ['(pointer:coarse)','(hover:none)','(orientation:portrait)']){
 const m=matchMedia(query);
 m.addEventListener?.('change',refresh);
}
if('ResizeObserver' in window){
 // Chrome Android puede informar varios ResizeObserver idénticos por cuadro.
 // Evitar que cada notificación fuerce repintar el CAD y todos los canvases.
 const measured=new WeakMap();
 const ro=new ResizeObserver(entries=>{
  let changed=false;
  for(const entry of entries){
   const width=Math.round(entry.contentRect.width*2)/2;
   const height=Math.round(entry.contentRect.height*2)/2;
   const key=width+'×'+height;
   if(measured.get(entry.target)!==key){
    measured.set(entry.target,key);changed=true;
   }
  }
  if(changed){refresh();schedulePaint();}
 });
 for(const selector of watched){
  const el=document.querySelector(selector);
  if(el)ro.observe(el);
 }
}
document.fonts?.ready?.then(()=>{refresh();schedulePaint();});
