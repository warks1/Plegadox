# R77 · El visor deja de confundir reubicación con retirada

La cabina distingue tres situaciones observables:
- TOPE quieto durante el plegado sin penetración prevista.
- RETROCESO/APARCADO sólo si el predictor 2D ordenó apartar el dedo.
- CAMBIO DE COTA del tope X/R para el siguiente pliegue, sin presentarlo
  al operador como retirada para evitar colisión.

La leyenda de la chapa también deja de anunciar `RETIRADA` del tope
cuando se está reorientando la chapa pero no se ordenó apartar el dedo.

Regresiones unitarias de los nombres de movimiento; se conserva el Boceto 1,
los perfiles y la cinemática previamente corregida en R76.
