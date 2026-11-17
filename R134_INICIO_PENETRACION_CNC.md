# PlegadoX R134 · inicio de penetración modelada acotado en el tiempo

**Fecha:** 17/11/2026 · **Versión:** 0.9.108 · **Base:** R133.

## Problema concreto

Hasta R133, cuando una pareja de cuerpos se cruzaba en un intervalo de trayectoria CNC (por ejemplo, entre t=0,000 s y t=5,000 s), el diagnóstico informaba **todo el tramo** como incidencia, aunque el solape entre los perfiles rígidos comenzara mucho después. Esto dificultaba localizar el movimiento que produce el cruce y podía confundirse con una colisión durante la totalidad de la carrera.

## Solución R134

- **`machine-first-penetration-r134.js`**: calcula una VENTANA temporal de la primera penetración *positiva del modelo* bajo traslación lineal rígida XYZ de prismas 2,5D. Usa `sweptPrismPair` sobre la primera mitad del intervalo y subdivide, siguiendo la primera mitad con penetración. **No es muestreo discreto:** se inspecciona el barrido continuo de cada subintervalo, por lo que una penetración entre dos imágenes no se pierde por el tamaño del paso.
- La ventana es un intervalo aproximado `[inicio,fin]` expresado en **segundos CNC declarados**, con anchura objetivo de **0,02 s**, máximo ocho pasos por evento. Aun con precisión de reloj no afirma ser el momento físico del primer contacto: el modelo no incorpora tolerancias, aceleraciones, contacto tangente, flexión ni datums OEM contrastados.
- Si ya hay penetración en el primer fotograma, el estado `PENETRACION_PRESENTE_AL_INICIO` lo indica explícitamente y no inventa una hora anterior.
- Si se observa giro/deformación, geometría indeterminada o intervalo no lineal, la hora permanece **SIN RESOLVER**, nunca se sustituye por un número plausible.
- **Presupuesto Galaxy:** se refinan hasta 12 eventos por diagnóstico por defecto (configurable en llamadas internas de 0 a 24). Los restantes se mantienen como incidencias completas con `impactWindowStatus=PENDIENTE_PRESUPUESTO`. Nunca se oculta una interferencia ni se convierte en verde por ahorrar CPU.
- `machine-axis-geometry.js`: almacena `impactWindowSeconds`, estado, resolución, método y limitación física por evento, y resume ventanas calculadas, pendientes y no resueltas.
- **Máquina → Recorridos físicos de ejes → Diagnóstico CAD/CNC**: muestra el tramo entero y la **primera penetración MODELADA acotada** cuando existe. El informe JSON contiene ambos campos y advierte que `firstPhysicalContactVerified=false` y `canApproveForMachine=false`.
- Conservar matrices 29/39 de la R133, protección de RAM Galaxy de la R131 y filtro de pares separados de la R132.

## Ejemplo matemático sintético

Un prisma de sección 2×2 mm parte en X = −12 mm y se traslada a X = 18 mm en cinco segundos. Otro prisma ocupa X = 0..2 mm, con solape Y/Z válido. La primera penetración positiva comienza cuando el borde derecho supera X = 0, tras 10 mm, aproximadamente al **33,333% del recorrido**. R134 localiza el umbral en una ventana de como máximo 0,02 s, sin afirmar que exista dicho movimiento real en ninguna plegadora.

## Verificación

- `tests/machine-first-penetration-r134.test.mjs`: penetración ENTRE poses libres, inicio ya solapado, dos cuerpos móviles, desplazamiento Z de dedos, deformación y tiempos erróneos, presupuesto de refinamiento cero, integración en informe volumétrico y PWA.
- `tests/machine-first-penetration-r134-browser-smoke.mjs`: prueba Chromium Galaxy con geometría sintética etiquetada NO OEM, selección de la pestaña Máquina, ventana mostrada en el diagnóstico y exportación JSON. El resto de las regresiones permanecen en CI.

## Límites industriales

**No es detección continua exacta de colisión de un CAD 3D real, ni primer contacto físico.** El resultado depende de que todos los sólidos se comporten como prismas rígidos y los valores CNC correspondan exactamente a la unidad instalada. Los giros de chapa, deformación durante el plegado, holgura por herramientas, cinemática OEM con inclinación real Y1/Y2 y sincronización PLC/CNC quedan pendientes. Las pruebas automatizadas emulan Chrome de Galaxy; no verifican el rendimiento en una tablet Samsung física.
