/**
 * PlegadoX R61 · Exportar contornos dibujados POR COTAS a DXF ASCII.
 * El DXF contiene una sección geométrica 2D en milímetros y NO es
 * CAD OEM, modelo 3D, programa CNC ni garantía de compatibilidad de amarre.
 */
import {validateContour} from './tool-dxf.js';
const number=value=>{
 if(!Number.isFinite(value)||Math.abs(value)>1000000)throw Error('Cota DXF fuera de rango');
 return Number(value.toFixed(6)).toString();
};
const pair=(code,value)=>String(code)+'\n'+String(value)+'\n';
export function exportToolContourDxf(input){
 const points=Array.isArray(input)?input:input?.points??input?.profilePoints;
 const contour=validateContour(points);
 const name=String(input?.name||'PLEGADOX_USER_PROFILE').trim();
 if(name.length>70)throw Error('Nombre demasiado largo');
 let output='';
 output+=pair(0,'SECTION')+pair(2,'HEADER');
 output+=pair(9,'$ACADVER')+pair(1,'AC1015');
 output+=pair(9,'$INSUNITS')+pair(70,4);
 output+=pair(0,'ENDSEC');
 output+=pair(0,'SECTION')+pair(2,'ENTITIES');
 output+=pair(0,'LWPOLYLINE');
 output+=pair(8,'PLEGADOX_PARAMETRICO');
 output+=pair(90,contour.points.length);
 output+=pair(70,1);
 for(const [x,y] of contour.points)output+=pair(10,number(x))+pair(20,number(y));
 output+=pair(0,'ENDSEC')+pair(0,'EOF');
 return output;
}
export function safeToolDxfName(value){
 const base=String(value||'util-parametrico').normalize('NFD')
  .replace(/[\u0300-\u036f]/g,'').toLowerCase()
  .replace(/[^a-z0-9_-]+/g,'-').replace(/^-+|-+$/g,'').slice(0,55);
 return (base||'util-parametrico')+'-NO-CERTIFICADO.dxf';
}
