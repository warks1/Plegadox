/**
 * Mouse translation for the press-brake profile viewer.
 * Length drag projects pointer displacement onto the original segment
 * direction: dragging a vertical flange is not misread as horizontal.
 * Pure geometry, identical for desktop mouse and precision stylus.
 */
export function flangeLengthFromMouseDrag({
 originalLength, deltaX,deltaY,
 segmentX,segmentY,scale,zoom=1
}){
 const numbers=[originalLength,deltaX,deltaY,segmentX,segmentY,scale,zoom];
 if(numbers.some(n=>!Number.isFinite(n))||originalLength<=0||scale<=0||zoom<=0)
  throw Error('Geometría de arrastre no válida');
 const length=Math.hypot(segmentX,segmentY);
 if(length<1e-9)throw Error('Ala no proyectable');
 const dx=segmentX/length,dy=segmentY/length;
 const proposed=originalLength+(deltaX*dx+deltaY*dy)/(scale*zoom);
 return Math.max(1,Math.min(10000,Math.round(proposed*10)/10));
}
