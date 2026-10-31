/** Camino de rectángulo redondeado compatible con Canvas 2D anteriores.
 * No rellena ni traza: quien llama controla beginPath()/fill()/stroke().
 * Los tamaños negativos se normalizan; un radio grande se recorta.
 */
export function roundedRectPath(ctx,x,y,width,height,radius=0){
 if(typeof ctx.roundRect==='function'){
  ctx.roundRect(x,y,width,height,radius);
  return;
 }
 const left=Math.min(x,x+width),top=Math.min(y,y+height);
 const w=Math.abs(width),h=Math.abs(height);
 const r=Math.min(w/2,h/2,Math.max(0,Number(radius)||0));
 ctx.moveTo(left+r,top);
 ctx.lineTo(left+w-r,top);
 ctx.quadraticCurveTo(left+w,top,left+w,top+r);
 ctx.lineTo(left+w,top+h-r);
 ctx.quadraticCurveTo(left+w,top+h,left+w-r,top+h);
 ctx.lineTo(left+r,top+h);
 ctx.quadraticCurveTo(left,top+h,left,top+h-r);
 ctx.lineTo(left,top+r);
 ctx.quadraticCurveTo(left,top,left+r,top);
 ctx.closePath();
}
