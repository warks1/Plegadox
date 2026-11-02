/**
 * Programación HMI táctil: pieza en desarrollo o perfil final.
 * Las modificaciones reutilizan el esquema geométrico del motor, por lo
 * que no se pierden signos, orden, tipos de tope o ala de referencia.
 */
import {normalized,profile} from './engine.js';
import {flangeLengthFromMouseDrag} from './mouse-programmer.js';

const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
export function editTouchPiece(input,action){
 const p=normalized(input),index=Number(action?.index),value=Number(action?.value);
 const result={...p,flanges:[...p.flanges],angles:[...p.angles],
  order:[...p.order],stopByBend:[...p.stopByBend],
  gaugeSideByBend:[...p.gaugeSideByBend]};
 switch(action?.type){
  case 'length':
   if(!Number.isInteger(index)||index<0||index>=p.flanges.length||
    !Number.isFinite(value)||value<1||value>10000)throw Error('Longitud de ala fuera de rango (1–10000 mm)');
   result.flanges[index]=Math.round(value*10)/10;break;
  case 'angle':
   if(!Number.isInteger(index)||index<0||index>=p.angles.length||
    !Number.isFinite(value)||Math.abs(value)>179)throw Error('Ángulo fuera de rango (±179°)');
   result.angles[index]=Math.round(value*10)/10;break;
  case 'invert':
   if(!Number.isInteger(index)||index<0||index>=p.angles.length)throw Error('Pliegue inexistente');
   result.angles[index]=-p.angles[index];break;
  case 'append': {
   if(p.flanges.length>=20)throw Error('Máximo de 20 alas');
   const length=Number.isFinite(value)?value:50;
   if(length<1||length>10000)throw Error('Longitud nueva inválida');
   result.flanges.push(Math.round(length*10)/10);
   result.angles.push(90);
   result.order.push(p.angles.length);
   result.stopByBend.push(1);
   result.gaugeSideByBend.push('auto');
   break;
  }
  case 'remove': {
   // La primera ala siempre se conserva como referencia de la pieza;
   // elimina el ala elegida y su pliegue inmediatamente anterior.
   if(!Number.isInteger(index)||index<1||index>=p.flanges.length||
    p.flanges.length<=2)throw Error('No se puede eliminar esa ala');
   const bend=index-1;
   result.flanges.splice(index,1);
   result.angles.splice(bend,1);
   result.order=result.order.filter(i=>i!==bend).map(i=>i>bend?i-1:i);
   result.stopByBend.splice(bend,1);
   result.gaugeSideByBend.splice(bend,1);
   break;
  }
  case 'order': {
   const selection=action.indices;
   if(!Array.isArray(selection)||selection.length!==p.angles.length||
    new Set(selection).size!==selection.length||
    selection.some(i=>!Number.isInteger(i)||i<0||i>=p.angles.length))
    throw Error('Orden táctil incompleto o repetido');
   result.order=[...selection];break;
  }
  default:throw Error('Acción táctil no reconocida');
 }
 return normalized(result);
}
const svgNs='http://www.w3.org/2000/svg';
const V_WIDTH=820,V_HEIGHT=380;
const marker=(tag,attrs={},text='')=>{
 const element=document.createElementNS(svgNs,tag);
 for(const [name,value] of Object.entries(attrs))element.setAttribute(name,String(value));
 if(text)element.textContent=text;
 return element;
};
const format=n=>Number(n).toLocaleString('es-ES',{maximumFractionDigits:1});
export function installTouchProgrammer({root,getPiece,onChange}){
 if(!root)throw Error('Falta el editor táctil');
 const svg=root.querySelector('#touchProgramSvg');
 const input=root.querySelector('#touchValue');
 const screen=root.querySelector('#touchProgramScreen');
 const modeText=root.querySelector('#touchProgramSelection');
 const status=root.querySelector('#touchProgramStatus');
 const orderBtn=root.querySelector('#touchProgramOrderBtn');
 const pad=root.querySelector('#touchProgramPad');
 const apply=root.querySelector('#touchProgramApply');
 const inverse=root.querySelector('#touchProgramInvert');
 const remove=root.querySelector('#touchProgramRemove');
 const actionAdd=root.querySelector('#touchProgramAdd');
 const zoomIn=root.querySelector('#touchProgramZoomIn');
 const zoomOut=root.querySelector('#touchProgramZoomOut');
 const resetView=root.querySelector('#touchProgramResetView');
 const inputHint=root.querySelector('#touchInputHint');
 const state={type:'length',index:0,orderMode:false,selected:[],zoom:1,panX:0,panY:0,
  pointers:new Map(),drag:null,ignoreClick:false,spaceHeld:false,
  lastRender:null,pinchDistance:null};
 const finePointer=()=>window.matchMedia?.('(pointer: fine)')?.matches??false;
 const setInteractionMode=mode=>{
  root.dataset.inputMode=mode;
  if(inputHint)inputHint.textContent=mode==='mouse'?
   'PC: clic para seleccionar · doble clic para escribir · arrastra el tramo para cambiar su longitud · rueda para zoom · arrastra el fondo para mover · Intro para confirmar.':
   'Táctil: toca un ala o vértice, introduce la medida en el teclado; pellizca para zoom y desliza el fondo para mover.';
 };
 setInteractionMode(finePointer()?'mouse':'touch');
 const safeChange=(action)=>{
  try{onChange(editTouchPiece(getPiece(),action),true);
   const p=normalized(getPiece());
   state.index=clamp(state.index,0,(state.type==='length'?p.flanges.length:p.angles.length)-1);
   status.textContent='Pieza modificada. Comprueba el desarrollo y la simulación.';render();}
  catch(error){status.textContent=error.message;}
 };
 const pick=(type,index)=>{
  const p=normalized(getPiece());
  state.type=type;state.index=index;
  const n=type==='length'?p.flanges[index]:p.angles[index];
  input.value=String(n);
  screen.textContent=(type==='length'?'Ala '+(index+1)+' · mm':'Pliegue '+(index+1)+' · grados');
  input.setAttribute('aria-label',type==='length'?'Longitud de ala '+(index+1):'Ángulo firmado de pliegue '+(index+1));
  inverse.disabled=type!=='angle';remove.disabled=type!=='length'||index<1||p.flanges.length<=2;
  modeText.textContent=(type==='length'?'Ala '+(index+1):'Pliegue '+(index+1))+' seleccionado';
  render();
 };
 function render(){
  const p=normalized(getPiece());
  const shape=profile(p,p.angles.map(()=>1)).points;
  const xs=shape.map(s=>s.x),ys=shape.map(s=>s.y);
  const minX=Math.min(...xs),maxX=Math.max(...xs),minY=Math.min(...ys),maxY=Math.max(...ys);
  const scale=Math.min(690/Math.max(120,maxX-minX),260/Math.max(50,maxY-minY),5);
  const cx=(minX+maxX)/2,cy=(minY+maxY)/2;
  const mapped=shape.map(q=>({x:V_WIDTH/2+(q.x-cx)*scale,y:V_HEIGHT/2-(q.y-cy)*scale}));
  svg.replaceChildren();
  const transform='translate('+state.panX+' '+state.panY+') translate(410 190) scale('+state.zoom+') translate(-410 -190)';
  const g=marker('g',{transform});svg.append(g);
  // Líneas punteadas de referencia.
  for(let i=1;i<=4;i++)g.append(marker('line',{x1:0,x2:V_WIDTH,y1:i*76,y2:i*76,
   stroke:'#244863','stroke-width':.7,'stroke-dasharray':'5 9'}));
  const linePoints=mapped.map(q=>q.x+','+q.y).join(' ');
  g.append(marker('polyline',{points:linePoints,stroke:'#3bd4f2','stroke-width':7,
   fill:'none','stroke-linecap':'round','stroke-linejoin':'round'}));
  mapped.slice(0,-1).forEach((p0,i)=>{
   const p1=mapped[i+1],mx=(p0.x+p1.x)/2,my=(p0.y+p1.y)/2;
   const selected=state.type==='length'&&state.index===i&&!state.orderMode;
   // Una línea SVG horizontal tiene altura de bbox = 0 y ciertos
   // navegadores no la consideran pulsable. Zona RECTANGULAR de 34 px
   // con transformación rotada: funciona en iPhone incluso a 0°/90°.
   const dx=p1.x-p0.x,dy=p1.y-p0.y,segmentLength=Math.hypot(dx,dy);
   const target=marker('rect',{x:0,y:-17,width:Math.max(1,segmentLength),height:34,
    fill:selected?'rgba(74,245,178,.22)':'rgba(255,255,255,.015)',
    transform:'translate('+p0.x+' '+p0.y+') rotate('+(Math.atan2(dy,dx)*180/Math.PI)+')',
    class:'touch-program-segment',role:'button',
    tabindex:0,'aria-label':'Editar longitud ala '+(i+1)+': '+format(normalized(getPiece()).flanges[i])+' milímetros',
    'data-segment':i});
   if(selected)g.append(marker('line',{x1:p0.x,y1:p0.y,x2:p1.x,y2:p1.y,
    stroke:'#6bf5b2','stroke-width':7,'stroke-linecap':'round'}));
   g.append(target);
   target.addEventListener('click',()=>{if(!state.ignoreClick&&!state.orderMode)pick('length',i);});
   target.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();pick('length',i);}});
   g.append(marker('text',{x:mx,y:my-18,'text-anchor':'middle',fill:'#dff8ff',
    'font-size':16,'font-weight':750,'pointer-events':'none'},format(normalized(getPiece()).flanges[i])+' mm'));
  });
  for(let i=0;i<p.angles.length;i++){
   const q=mapped[i+1],selected=state.type==='angle'&&state.index===i&&!state.orderMode;
   const order=p.order.indexOf(i)+1,pending=state.selected.indexOf(i)+1;
   const dot=marker('circle',{cx:q.x,cy:q.y,r:state.orderMode?19:17,fill:selected?'#27ab87':
    state.orderMode&&pending?'#f5ae40':'#0c3656',
    stroke:state.orderMode?'#ffcd79':'#75daf9','stroke-width':3,
    class:'touch-program-bend',role:'button',tabindex:0,
    'data-bend':i,'aria-label':'Pliegue '+(i+1)+': '+p.angles[i]+' grados, orden '+order});
   g.append(dot);
   g.append(marker('text',{x:q.x,y:q.y+5,'font-size':14,'text-anchor':'middle',
    fill:'white','font-weight':800,'pointer-events':'none'},String(state.orderMode&&pending?pending:order)));
   g.append(marker('text',{x:q.x+20,y:q.y+26,'font-size':15,
    fill:p.angles[i]<0?'#ffbfa8':'#86edcb','font-weight':750,
    'pointer-events':'none'},(p.angles[i]>0?'+':'')+format(p.angles[i])+'°'));
   const bendClicked=()=>{
    if(state.ignoreClick)return;
    if(state.orderMode){
     if(state.selected.includes(i))return;
     state.selected.push(i);
     if(state.selected.length===p.angles.length){
      const selected=[...state.selected];state.orderMode=false;state.selected=[];
      orderBtn.setAttribute('aria-pressed','false');safeChange({type:'order',indices:selected});
     }else{
      status.textContent='Orden: '+state.selected.length+'/'+p.angles.length+'. Selecciona el siguiente pliegue.';
      render();
     }
    }else pick('angle',i);
   };
   dot.addEventListener('click',bendClicked);
   dot.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();bendClicked();}});
  }
  const last=mapped.at(-1);
  const end=marker('circle',{cx:last.x,cy:last.y,r:23,fill:'#15b882',
    stroke:'#a3ffda','stroke-width':3,class:'touch-program-add',role:'button',tabindex:0,
    'aria-label':'Añadir ala tocando el extremo','data-add':'true'});
  g.append(end);
  g.append(marker('text',{x:last.x,y:last.y+7,'text-anchor':'middle',fill:'#fff',
   'font-size':25,'font-weight':800,'pointer-events':'none'},'+'));
  end.addEventListener('click',()=>{if(!state.ignoreClick)safeChange({type:'append',value:50});});
  end.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();safeChange({type:'append',value:50});}});
  actionAdd.disabled=p.flanges.length>=20;
  modeText.textContent=state.orderMode?'Orden: toca los pliegues en secuencia ('+state.selected.length+'/'+p.angles.length+')':
   (state.type==='length'?'Ala '+Math.min(state.index+1,p.flanges.length):
    'Pliegue '+Math.min(state.index+1,p.angles.length))+' seleccionado';
  const n=state.type==='length'?p.flanges[state.index]:p.angles[state.index];
  // No pisar cifras que el usuario está escribiendo en el teclado.
  if(document.activeElement!==input)input.value=String(n??0);
  inverse.disabled=state.type!=='angle';
  remove.disabled=state.type!=='length'||state.index<1||p.flanges.length<=2;
  state.lastRender={scale,mapped,cx,cy};
  return state.lastRender;
 }
 apply.onclick=()=>{
  const value=Number(input.value.replace(',','.'));
  input.blur();
  safeChange({type:state.type,index:state.index,value});
 };
 input.addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();apply.click();}});
 inverse.onclick=()=>safeChange({type:'invert',index:state.index});
 remove.onclick=()=>safeChange({type:'remove',index:state.index});
 actionAdd.onclick=()=>{safeChange({type:'append',value:50});pick('length',normalized(getPiece()).flanges.length-1);};
 orderBtn.onclick=()=>{
  state.orderMode=!state.orderMode;state.selected=[];
  orderBtn.setAttribute('aria-pressed',String(state.orderMode));
  status.textContent=state.orderMode?'Selecciona los pliegues por orden de trabajo.':'Orden gráfico cancelado.';
  render();
 };
 pad.querySelectorAll('button[data-key]').forEach(button=>{
  button.onclick=()=>{
   const key=button.dataset.key;
   if(key==='clear')input.value='';
   else if(key==='back')input.value=input.value.slice(0,-1);
   else if(key==='sign')input.value=input.value.startsWith('-')?input.value.slice(1):'-'+input.value;
   else if(key==='decimal'&&!input.value.includes('.'))input.value+='.';
   else if(/^\d$/.test(key)&&input.value.length<10)input.value+=key;
   input.focus();input.setSelectionRange?.(input.value.length,input.value.length);
  };
 });
 zoomIn.onclick=()=>{state.zoom=clamp(state.zoom*1.3,.6,5);render();};
 zoomOut.onclick=()=>{state.zoom=clamp(state.zoom/1.3,.6,5);render();};
 resetView.onclick=()=>{state.zoom=1;state.panX=0;state.panY=0;render();};
 svg.addEventListener('wheel',e=>{
  e.preventDefault();state.zoom=clamp(state.zoom*(e.deltaY<0?1.15:.87),.6,5);render();
 },{passive:false});
 svg.addEventListener('pointerdown',e=>{
  // Capturar sólo el fondo: si capturamos los vértices, algunos
  // navegadores táctiles envían el click a svg y no al pliegue.
  if(e.target===svg)svg.setPointerCapture?.(e.pointerId);
  state.pointers.set(e.pointerId,{x:e.clientX,y:e.clientY});
  if(state.pointers.size===1)state.drag={x:e.clientX,y:e.clientY,
   origX:state.panX,origY:state.panY,moved:false};
  else state.drag=null;
 });
 svg.addEventListener('pointermove',e=>{
  if(!state.pointers.has(e.pointerId))return;
  const prev=state.pointers.get(e.pointerId);
  state.pointers.set(e.pointerId,{x:e.clientX,y:e.clientY});
  if(state.pointers.size===2){
   const all=[...state.pointers.values()];
   const dist=Math.hypot(all[0].x-all[1].x,all[0].y-all[1].y);
   if(state.pinchDistance)state.zoom=clamp(state.zoom*dist/state.pinchDistance,.6,5);
   state.pinchDistance=dist;state.ignoreClick=true;render();return;
  }
  if(state.drag){
   const dx=e.clientX-state.drag.x,dy=e.clientY-state.drag.y;
   if(Math.hypot(dx,dy)>8)state.drag.moved=true;
   if(state.drag.moved){state.panX=state.drag.origX+dx;state.panY=state.drag.origY+dy;render();}
  }
 });
 const endPointer=e=>{
  if(state.drag?.moved)state.ignoreClick=true;
  state.pointers.delete(e.pointerId);state.drag=null;state.pinchDistance=null;
  if(state.pointers.size===0&&state.ignoreClick){
   // click is synthesized immediately after pointerup; clear on next task.
   setTimeout(()=>{state.ignoreClick=false;},0);
  }
 };
 for(const ev of ['pointerup','pointercancel','lostpointercapture'])
  svg.addEventListener(ev,endPointer);
 pick('length',0);
 return {render,selectLength:index=>pick('length',index),selectAngle:index=>pick('angle',index)};
}
