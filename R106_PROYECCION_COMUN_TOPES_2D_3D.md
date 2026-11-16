# PlegadoX · R106 · 16 de noviembre de 2026
## Unificación de proyección del tope en 2D y perspectiva 2,5D

### Problema
La cabina dibujaba el dedo de tope, la cara frontal, el marcador de
contacto y la tarjeta de estado recalculando cada uno las coordenadas
de pantalla. La sección 2D y la perspectiva habían acumulado
transformaciones independientes; esto facilitaba desplazamientos
visuales al mantener o cambiar el código de renderizado.

### Cambio implementado
- `machineGaugeProjection(placement,cx,datumY,scale,dimensions)`
  proporciona **una sola proyección frontal** del perfil del tope, la
  cara de referencia STOP/SUPPORT, la contrahuella y el punto de
  contacto con la chapa.
- `rearMachine` utiliza el contorno y las caras proyectadas en
  vez de recalcularlas; la marca de contacto y la tarjeta del
  semáforo de la cabina utilizan **el mismo punto**.
- La extrusión 2,5D desplaza únicamente la cara posterior decorativa
  del cuerpo; el frente en contacto con la chapa NO se mueve.
- Se valida la entrada y se rechaza un punto de contacto o escala
  no finitos, en lugar de dejar que aparezca un dedo en una posición
  de pantalla indefinida.

### Prueba técnica
En la Omega geométrica con orden **1,2,4,3**, alternando Stop 1 y
Support 2, se compararon 24 fotogramas de preparación, sujeción,
plegado, retorno y cambio de golpe, además de 4 fotogramas de
matriz/punzón/chapa. Resultado focalizado:
**205 comprobaciones correctas, 0 discrepancias.**

La regresión reproducible está en
`tests/gauge-2d-3d-projection-r106.test.mjs`.

### Límites
Este cambio **no** convierte el dibujo actual en un simulador de
sólidos 3D ni verifica el recorrido continuo de ejes X/R/Z. Falta
validar visualmente la PWA en móviles y tablets y contrastar contra
las geometrías CAD OEM reales de la unidad. Los resultados 2D no
autorizan por sí solos un plegado físico ni instrucciones CNC.
