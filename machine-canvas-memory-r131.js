/**
 * PlegadoX R131 · protección de memoria del canvas industrial 3D.
 * El tamaño del bitmap se limita de forma uniforme (sin deformar
 * coordenadas X/Y); sólo afecta a la resolución visible, NUNCA a
 * colisiones, precisión CAD o cálculo del CNC.
 */
const finite=(n,fallback)=>Number.isFinite(Number(n))&&Number(n)>0?
 Number(n):fallback;
export function canvasRenderSize(width,height,requestedDpr=1,maxPixels=1200000){
 const w=finite(width,1),h=finite(height,1);
 const desired=Math.min(4,finite(requestedDpr,1));
 const pixels=Math.max(16384,Math.floor(finite(maxPixels,1200000)));
 const dpr=Math.min(desired,Math.sqrt(pixels/(w*h)));
 // El bitmap nunca supera el presupuesto, incluso con pantallas
 // ultra-anchas y el usuario forzando la calidad gráfica máxima.
 const bitmapWidth=Math.max(1,Math.floor(w*dpr));
 const bitmapHeight=Math.max(1,Math.floor(h*dpr));
 return Object.freeze({
  width:bitmapWidth,height:bitmapHeight,
  dpr,requestedDpr:desired,pixelCount:bitmapWidth*bitmapHeight,
  capped:dpr<desired-1e-9,maxPixels:pixels,
  approximateBytes:bitmapWidth*bitmapHeight*4
 });
}
