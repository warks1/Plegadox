# PlegadoX · R104 · 16/11/2026 · Apoyo automático en cara de pestaña preplegada

## Problema observado
R103 limitaba el selector automático al primer y último canto libre de la sección.
Podía descartar una alternativa aunque hubiera una cara EXTERIOR de una pestaña
anteriormente plegada accesible en el plano 2D. No debe utilizar cualquier
vértice interior como apoyo, ni cambiar el programa manual sin autorización.

## Cambio
- Primera etapa: evaluar ambos cantos libres con Stop 1 / Support 2 según
  el dedo que el operador eligió. Mantener la referencia original si es válida.
- Segunda etapa: únicamente si NO hay canto libre 2D viable y el dedo actual es
  **Stop 1**, revisar los segmentos interiores. La función
  `foldedStopFaceCandidate` exige un pliegue anterior completado, cara
  exterior vertical, solape frontal nominal, lado de llegada accesible y que
  `inspectGaugeProfile` no detecte penetración del dedo.
- No aplicar esta etapa a **Support 2** porque necesitaría comprobar la
  repisa inferior: una pared lateral no es una repisa.
- Registrar `autoSupportKind` y `needsFoldedFaceReview` en el simulador,
  diagnóstico JSON e interfaz. El aviso nunca constituye aprobación CNC.
- Los botones «Automático» / «Corregir apoyo» / «Buscar apoyo» muestran
  si la propuesta es un extremo libre o una pestaña preplegada.
- Al aplicar una sugerencia de extremo de ala, limpiar la antigua referencia
  de distancia manual de ese golpe; no arrastrar un punto interior que no
  formó parte de la propuesta.
- El semáforo distingue «sin contacto frontal» (ámbar en preparación) de
  «penetración geométrica» (rojo). No exige contacto después de soltar chapa.

## Seguridad y compatibilidad
- No modificar signos de pliegue, radios, orden elegido, tipo de punzón
  o matriz, ni cotas permanentes de máquina.
- Un resultado verde SOLO significa ausencia de interferencia 2D modelada
  en ese instante; NO es una medición 3D ni permiso de plegado.
- Sin CAD OEM completo, coordenadas verificadas X/R/Z, trayectoria
  continua ni validación de montaje, el resultado es ilustrativo y no
  puede enviarse como instrucciones CNC.

## Comprobación
- Pruebas añadidas: `tests/automatic-folded-gauge-r104.test.mjs` y
  `tests/gauge-advisor-folded-r104.test.mjs`.
- Regresiones cubren: prioridad del canto libre; fallo de ambos cantos;
  pared realmente preplegada; rechazo de vértices interiores; prohibición
  de reemplazar el modo manual; Support 2 sin fallback lateral; rechazo
  de penetración de útiles; preservación de pieza; distinción entre
  holgura, falta de contacto y penetración.
- Verificaciones focalizadas con código actual superadas. Suite completa
  `npm test`, despliegue PWA en dispositivo real y simulación física
  del recorrido X/R/Z **sin confirmar**.
