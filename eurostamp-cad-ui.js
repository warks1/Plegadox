/**
 * R38 · Interfaz para asociar un CAD DXF original al SKU Eurostamp.
 * Los dibujos de ficha no se convierten aquí en perfiles 3D inventados.
 */
import {EUROSTAMP_ALL,EUROSTAMP_REFERENCES} from './eurostamp-catalog.js';
import {parseEurostampProfile,persistEurostampProfile,applyEurostampProfile} from './eurostamp-cad.js';
import {DIES,PUNCHES} from './engine.js';
const $=id=>document.getElementById(id);
function drawPreview(canvas,points){
 const w=Math.max(300,Math.round(canvas.clientWidth||450)),h=215;
 const ratio=Math.min(window.devicePixelRatio||1,2);
 canvas.width=Math.round(w*ratio);canvas.height=h*ratio;
 const ctx=canvas.getContext('2d');
 if(!ctx)return;
 ctx.setTransform(ratio,0,0,ratio,0,0);
 ctx.fillStyle='#071c2f';ctx.fillRect(0,0,w,h);
 const xs=points.map(p=>p[0]),ys=points.map(p=>p[1]);
 const left=Math.min(...xs),right=Math.max(...xs),
  bottom=Math.min(...ys),top=Math.max(...ys);
 const scale=Math.min((w-45)/Math.max(1,right-left),(h-45)/Math.max(1,top-bottom));
 const project=([x,y])=>[w/2+(x-(left+right)/2)*scale,
  h-18-(y-bottom)*scale];
 ctx.beginPath();
 points.forEach((p,i)=>{const [x,y]=project(p);i?ctx.lineTo(x,y):ctx.moveTo(x,y);});
 ctx.closePath();ctx.fillStyle='#3a778c';ctx.strokeStyle='#c1efff';ctx.lineWidth=1.5;
 ctx.fill();ctx.stroke();
 ctx.font='11px system-ui';ctx.fillStyle='#d3eff8';
 ctx.fillText('DXF 2D · cota sin certificación de amarre',10,14);
}
export function setupEurostampCadImporter(){
 const panel=$('eurostampCadPanel'),select=$('eurostampCadRef'),
  file=$('eurostampCadFile'),commit=$('eurostampCadCommit'),
  status=$('eurostampCadStatus'),source=$('eurostampCadSource'),
  canvas=$('eurostampCadCanvas');
 if(!panel||!select||!file||!commit||!status||!source||!canvas)return;
 select.replaceChildren(...EUROSTAMP_ALL.map(t=>{
  const opt=document.createElement('option');
  opt.value=t.id;
  opt.textContent=(t.opening!=null?'Matriz':'Punzón')+' · '+t.reference+
   ' · '+t.angle+'° · H'+t.height+' mm'+
   (t.type==='cabra'?' · pata de cabra':'');
  return opt;
 }));
 let proposed=null;
 const say=(message,error=false)=>{
  status.textContent=message;status.dataset.error=String(error);
 };
 const refresh=()=>{
  proposed=null;commit.disabled=true;canvas.hidden=true;
  const t=EUROSTAMP_ALL.find(t=>t.id===select.value);
  if(!t)return;
  source.href=t.productUrl||EUROSTAMP_REFERENCES.historical2017;
  source.textContent=t.productUrl?
   'Abrir ficha Eurostamp y descargar su DXF original':
   'Consultar catálogo Eurostamp 2017 (DXF actual no localizado)';
  say('Referencia '+t.reference+' · '+t.angle+'° · H'+t.height+
   ' mm. '+(t.productUrl?'Descarga el DXF de la ficha Eurostamp.':
    'Referencia histórica; aporta un DXF OEM que coincida con esta referencia.')+
   ' Se verificará la altura y que el perfil cierre sin autointersecciones.');
 };
 select.addEventListener('change',()=>{file.value='';refresh();});
 file.addEventListener('change',async()=>{
  proposed=null;commit.disabled=true;canvas.hidden=true;
  const chosen=file.files?.[0];
  if(!chosen)return;
  try{
   if(chosen.size>1024*1024)throw Error('Máximo 1 MB');
   const profile=parseEurostampProfile(await chosen.text(),{
    id:select.value,fileName:chosen.name
   });
   proposed=profile;drawPreview(canvas,profile.profilePoints);
   canvas.hidden=false;commit.disabled=false;
   say('DXF válido · '+profile.profilePoints.length+' vértices · '+
    'H de fabricante conservada · '+profile.datumStatus+
    '. Revisa la cara de trabajo y el amarre ANTES de vincular.');
  }catch(err){say('No se puede vincular el CAD: '+err.message,true);}
 });
 commit.addEventListener('click',()=>{
  if(!proposed||proposed.id!==select.value)return;
  try{
   // Almacenamiento primero, mutación del motor después. Sin enlace
   // ni contorno provisional si el guardado local falla.
   persistEurostampProfile(localStorage,proposed);
   applyEurostampProfile(DIES,PUNCHES,proposed);
   say('✓ Contorno DXF 2D vinculado a Eurostamp '+proposed.reference+
    ' y guardado en ESTE navegador. El visor lo usa en sección y 3D '+
    'extrusionado. No valida el montaje, el giro ni colisiones CNC.');
   commit.disabled=true;
   window.dispatchEvent(new Event('plegadox:pieceChanged'));
   if(typeof window.PLEGADOX_REDRAW==='function')window.PLEGADOX_REDRAW();
  }catch(err){say('Error al guardar el CAD: '+err.message,true);}
 });
 window.addEventListener('plegadox:selectEurostampCad',event=>{
  const t=EUROSTAMP_ALL.find(x=>x.id===event.detail?.id);
  if(!t)return;
  panel.open=true;select.value=t.id;file.value='';refresh();
  panel.scrollIntoView({behavior:'smooth',block:'start'});
 });
 select.value=EUROSTAMP_ALL[0]?.id||'';refresh();
}
setupEurostampCadImporter();
