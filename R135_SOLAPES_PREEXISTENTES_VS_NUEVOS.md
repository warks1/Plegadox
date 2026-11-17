# PlegadoX R135 — penetración generada durante la carrera vs solape previo

**Fecha:** 17 de noviembre de 2026 · **Versión:** 0.9.109 · **Base:** R134.

## Motivación
Un error de datum/montaje del modelo, una superposición entre envolventes ilustrativas o una interfaz ya penetrada al comenzar el barrido no significan necesariamente que el MOVIMIENTO haya provocado una nueva colisión. Hasta la R134, los eventos no diferenciaban correctamente su origen temporal, aunque se conociera la primera ventana de solape. Esto confundía los avisos del semáforo y dificultaba diagnosticar interferencias aparentemente falsas.

## Nuevo diagnóstico
- `machine-contact-evolution-r135.js` compara el volumen de intersección en la pose inicial y final de **cada pareja de sólidos válidos** y el desplazamiento relativo rígido. Clasifica:
  - `NUEVA_AL_FINAL`: ambos cuerpos separados inicialmente y penetrados en la pose final.
  - `TRANSITORIA_ENTRE_POSES`: ambos extremos separados pero el barrido continuo detectó penetración **entre posiciones**.
  - `PREEXISTENTE_SIN_MOVIMIENTO_RELATIVO`: el solape ya existía al inicio y las piezas no cambiaron su posición una respecto a la otra. Puede tratarse de montaje, perfil/datum incorrecto o interferencia anterior; no se genera un choque nuevo durante esa carrera.
  - `PREEXISTENTE_EN_EXTREMOS`: hay penetración tanto al empezar como al terminar. **La trayectoria puede agravarla**, no se da por resuelta.
  - `PREEXISTENTE_RESUELTA_AL_FINAL`: solape al principio y ausencia de penetración en la pose final. El evento sigue registrado para verificar montaje y retirada del tope.
  - `GEOMETRIA_INDETERMINADA` / `MOVIMIENTO_NO_RIGIDO`: no se atribuye un origen temporal sin geometría o traslación válida.
- `machine-axis-geometry.js` añade por incidencia `contactEvolutionCode`, `contactEvolutionLabel`, `preexistingAtStart`, `createdDuringThisInterval`, `initialOverlapMm3`, `finalOverlapMm3` y `relativeTranslationMm`. Conserva la primera ventana temporal R134, la matriz física R133 y el informe exportable JSON. `contactEvolutionSummary` informa las cantidades totales.
- **Máquina → Recorridos físicos de ejes → Diagnóstico CAD/CNC** muestra el resumen, con un filtro de incidencias **Todas / nuevas o transitorias / preexistentes / inciertas**. El filtro sólo reordena y visualiza los eventos previamente analizados; **no recalcula CAD cada vez**, para evitar sobrecarga en la Galaxy.
- Los casos nuevos se listan antes que los preexistentes, sin ocultar la falta de CAD ni borrar el resto de eventos.
- La PWA registra la versión **PLEGADOX-20261117-R135** y su caché offline sincronizada.

## Seguridad y límites
**Solape preexistente NO implica contacto normal, ni montaje verificado, ni ausencia de peligro.** Una geometría parcial o mal posicionada podría producir solapes falsos, pero también podría ocultar una interferencia verdadera. El algoritmo sólo separa la cronología de **penetración volumétrica de prismas 2,5D**, sin inferir fuerzas, flexión de trancha, huellas de amarre, topes físicos, tolerancias, contacto tangencial o comportamiento real de la CNC. No se modifica automáticamente ningún semáforo ni se declara una pieza apta para fabricación. Los resultados continúan con `physicalCollisionCertified=false` y `canApproveForMachine=false`. Sigue siendo necesario importar y cotejar CAD OEM y posiciones CNC de la máquina específica.

## Verificación
- `tests/machine-contact-evolution-r135.test.mjs`: siete casos geométricos de origen temporal, movimientos solidarios, perfiles inválidos, resúmenes, integración con la traza sintética de trancha y adaptador, prueba de resultado no certificado y controles PWA.
- `tests/machine-contact-evolution-r135-browser-smoke.mjs`: Chrome Galaxy emulado, pieza con **penetración nueva de trancha/mesa** y **solape preexistente de adaptador/mesa**, filtros de nueva/preexistente y exportación JSON con evidencias. Conserva regresiones R125–R134.
