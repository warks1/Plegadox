/**
 * PlegadoX R124 · opciones de vista únicamente gráficas.
 * Ninguna bandera ni vector cambia el perfil físico, el plan de
 * pliegues o los resultados del detector de colisiones.
 */
export const VIEW_PRESETS=Object.freeze({
 profile:Object.freeze({perspective:false,section:false,depth:1,tilt:1,label:'Perfil lateral 2D'}),
 nominal:Object.freeze({perspective:true,section:false,depth:1,tilt:1,label:'Perspectiva industrial'}),
 shallow:Object.freeze({perspective:true,section:false,depth:.6,tilt:.8,label:'Perspectiva suave'}),
 deep:Object.freeze({perspective:true,section:false,depth:1.6,tilt:1,label:'Perspectiva profunda'}),
 elevated:Object.freeze({perspective:true,section:false,depth:1.25,tilt:1.65,label:'Perspectiva elevada 2,5D'}),
 section:Object.freeze({perspective:false,section:true,depth:1,tilt:1,label:'Sección técnica mm'})
});
export const VIEW_DEFAULTS=Object.freeze({
 perspective:true,section:false,transparent:false,depth:1,tilt:1,
 preset:'nominal',theme:'industrial',showGauge:true,showRam:true,
 showPunch:true,showDie:true,showSheet:true,showContact:true,
 showGrid:false,showAxes:false,showLabels:true,
 panX:0,panY:0,zoom:1
});
const allowedThemes=new Set(['industrial','blueprint','contrast']);
const clamp=(v,min,max,fallback)=>{
 const n=Number(v);
 return Number.isFinite(n)?Math.max(min,Math.min(max,n)):fallback;
};
export function normalizeMachineView(view={}){
 const out={...VIEW_DEFAULTS};
 if(view&&typeof view==='object'){
  for(const key of ['perspective','section','transparent','showGauge','showRam',
   'showPunch','showDie','showSheet','showContact','showGrid','showAxes','showLabels'])
   if(typeof view[key]==='boolean')out[key]=view[key];
  for(const [key,min,max,defaultValue] of [
   ['depth',.4,2.1,1],['tilt',.45,1.9,1],['zoom',.4,5,1],
   ['panX',-1500,1500,0],['panY',-1500,1500,0]])
   out[key]=clamp(view[key],min,max,defaultValue);
  if(allowedThemes.has(view.theme))out.theme=view.theme;
  if(Object.hasOwn(VIEW_PRESETS,view.preset)||view.preset==='custom')
   out.preset=view.preset;
 }
 return out;
}
export function applyViewPreset(view,name){
 if(!view||typeof view!=='object')throw Error('Vista no disponible');
 if(!Object.hasOwn(VIEW_PRESETS,name))throw Error('Vista predefinida desconocida');
 Object.assign(view,VIEW_PRESETS[name],{preset:name});
 return view;
}
export function perspectiveOffset(view,scale=1,kind='sheet'){
 if(!Number.isFinite(scale)||scale<=0)throw Error('Escala gráfica inválida');
 const v=normalizeMachineView(view);
 if(!v.perspective||v.section)return {dx:0,dy:0};
 const base={sheet:[23,-13],gauge:[23,-13],die:[33,-20],ram:[25,-15]}[kind];
 if(!base)throw Error('Cuerpo gráfico no reconocido');
 return {dx:base[0]*v.depth*scale,dy:base[1]*v.depth*v.tilt*scale};
}
export function displayOptions(view){
 const v=normalizeMachineView(view);
 return {
  // Se muestran siempre los avisos de penetración y del tope.
  safetyWarningsVisible:true,collisionEngineUntouched:true,
  actual3D:false,projection:'2.5D',settings:v
 };
}
