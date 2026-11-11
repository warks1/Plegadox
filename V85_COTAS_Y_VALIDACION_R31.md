# PlegadoX R31 — Cotas recuperadas y estado de validación física de la Trumpf V85

Fecha de referencia: 11/11/2026. Máquina principal: Trumpf/TrumaBend V85 con configuración Cybelec.

## Procedencia: fotografías del control facilitadas el 30/10/2026

Las siguientes cotas están transcritas en \`machine-config.js\` y NO se deben sustituir por una máquina genérica:

- Trancha, L1–L10: **1340, 28, 2, 25.4, 20, 30, 125, 20, 39, 28 mm**.
- Mesa, L1–L7: **820, 80, 25.25, 25.25, 50, 20, 20 mm**.
- Tope Stop, L1–L6: **70, 100, 18, 25, 12, 0 mm**.
- Tope Support, L1–L6: **70, 100, 8, 25, 12, 8 mm**.
- Anchura configurada de trancha/portaherramientas: **2040 mm** cada una.
- Distancia de trabajo de herramienta: **30 mm**.
- Referencia L6 máximas/mínimas y Ox/Oz: valores registrados **0**. No significan que los recorridos físicos de los ejes sean cero.

La configuración editable del usuario tiene prioridad sobre los valores de fábrica del programa.

## Lo incorporado a la geometría 3D extruida R31

El motor **construye sólidos prismáticos sobre la sección 2D** en milímetros:

- Chapa: cada ala tiene espesor real y ocupa Z = [-ancho/2,+ancho/2].
- Punzón y matriz: la sección seleccionada del catálogo (o DXF importado) se extruye hasta la longitud individual documentada; en ausencia de ésta la ocupación Z se considera provisional.
- Trancha: envolvente del visor que usa provisionalmente **L7 = 125 mm como anchura de la sección** y el ancho Z configurado. Su altura relativa al punzón es HIPOTÉTICA: NO se usa L1 = 1340 como carrera.
- Mesa: envolvente del visor que usa provisionalmente **L2 = 80 mm como anchura de la sección**, manteniendo el alto de matriz seleccionado. No se deduce del valor L1 = 820 un origen vertical absoluto.
- Topes: contornos 2D del control derivados de L1–L4, sin espejar el dedo completo. L5/L6 conservados como cotas, NO convertidos en caras arbitrarias. La posición/anchura real en Z no está determinada; se usa una envolvente de posibilidad con el ancho completo de pieza, no un sólido certificado.

Los contornos nominales de catálogo, montajes, amarres y radios aún se consideran provisionales salvo que exista evidencia completa para la herramienta real y la máquina concreta.

## Recorrido

\`volume-trajectory-review.js\` revisa todas las operaciones, incluidos:
posicionamiento → aproximación → plegado → retorno → reposicionamiento.
Incluye instantes de cambio de fase y submuestras y detecta solapamientos conservadores de cajas barridas entre muestras.
Esto **no** demuestra que entre dos instantes no pueda existir contacto: no hay cinemática CNC X/R/Z identificada ni movimiento real de manos/volteos certificado.

## Criterio de seguridad

- **Permitido:** «Posible interferencia calculada», «Datos no contrastados», «Sin incidencia detectada en muestras».
- **Prohibido sin validación CAD/CNC y física:** «Sin colisiones garantizado», «Máquina segura», «Apto para fabricar».
- El operario conserva toda la capacidad de elegir punzón, matriz, orientación y orden; los avisos no se ocultan.
- La selección automática se calcula para todas las piezas: Omega, Cybelec, nuevas, importadas y de biblioteca.

## Evidencias que faltan para pasar de 2,5D a verificación industrial real

1. Contornos CAD de trancha, portapunzones, mordazas, mesa, portamatrices y obstáculos laterales, con ejes de referencia identificados.
2. Dimensiones 3D verificadas de dedos (separación Z, anchos, posiciones) y recorridos máximos X/R/Z medidos o documentados.
3. Carrera y trayectoria real de Y, herramientas de longitud segmentada, límites de carga y montajes autorizados.
4. Geometría de radios y chapa, maniobras físicas de volteo, retirada e inserción; tolerancias y calibración con patrón de taller.

**No volver a pedir al usuario las cotas L1–L10/L1–L7/L1–L6 ya registradas.** Ampliar exclusivamente la evidencia que no se pueda derivar de ellas, sin inventar geometrías.
