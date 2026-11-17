# PlegadoX R131 · memoria Galaxy y evidencia diferencial Y1/Y2

Fecha: 17/11/2026 · Versión 0.9.105 · Base R130.

## Problemas abordados
- En una Galaxy con navegador Chrome de alta densidad, el canvas 3D podía reservar un bitmap enorme al usar calidad alta; la triangulación estaba en caché solo para el último instante, por lo que al volver a una fase anterior se reconstruían piezas y máquinas completas.
- Los barridos de trancha, punzón y amarres superiores movían rígidamente el perfil por el **promedio** de los ejes Y1/Y2. Si se movían desigualmente pero la diferencia quedaba dentro de la tolerancia del datum, el código podía etiquetar como **intersección entre dos DXF** un cálculo en el que la inclinación real del conjunto no estaba modelada.

## Mejoras

1. `machine-canvas-memory-r131.js`: reduce proporcionalmente la resolución del bitmap visible para garantizar un límite explícito de memoria. Eco hasta 1,2 millones de píxeles (~4,8 MB por RGBA), equilibrado 2,2 millones (~8,8 MB), alto 3,6 millones (~14,4 MB), **sin cambiar ninguna malla, volumen ni cálculo de seguridad**. El modo de alta calidad tampoco puede reservar de forma ilimitada.
2. `machine-solid-frame-cache.js`: caché LRU configurable y acotada (2 escenas eco, 3 equilibrado, 4 alto). Al revisitar una fase, reutiliza sólidos y triangulación sin reconstruirlos. Cambiar máquina, pieza o CAD invalida la caché. No persiste escenas en el dispositivo.
3. `machine-ram-tilt-evidence-r131.js`: calcula la diferencia Y1/Y2 **relativa al datum**, no el valor absoluto de la separación entre cilindros. Informa la desviación máxima respecto al desplazamiento medio en mm.
4. `machine-axis-geometry.js`: si esa diferencia supera la tolerancia declarada, el intervalo continúa SIN RESOLVER. Si es menor pero no nula, marca el cálculo del conjunto superior como **aproximado** y degrada posibles cruces CAD/CAD afectados a evidencia provisional, no a penetración geométrica exacta. La advertencia y el evento no desaparecen.
5. El diagnóstico de ejes muestra los intervalos con Y1/Y2 diferenciales y su incertidumbre máxima en mm, y conserva estos datos en el informe JSON de R130.

## Verificación

- `tests/machine-ram-galaxy-r131.test.mjs`: cotas de memoria, geometría visible no deformada, cache LRU, invalidación, comparación Y1/Y2, clasificación de intersecciones, rechazo de inclinación fuera de tolerancia.
- `tests/machine-ram-galaxy-r131-browser-smoke.mjs`: Chrome Galaxy emulado, vuelta entre dos golpes con caché, escena de alta resolución limitada, restauración eco y captura de pantalla.
- Continúan las regresiones del simulador y de la PWA R125–R130.

## Limitaciones

Los 1,2–3,6 MP se refieren solo al bitmap de **este** canvas, no a la memoria total de la aplicación; no garantizan rendimiento en todas las tablets Samsung ni validan la simulación en el equipo físico del usuario. La desviación Y1/Y2 reportada es una aproximación geométrica del error de **traslación media**, no una modelización de flexión o torsión del bastidor o de la trancha. Sigue faltando CAD OEM volumétrico completo, recorrido sincronizado de control CNC y verificación física de ceros, amarres y utillaje. Ningún resultado autoriza producción.
