# PlegadoX · R108 · 16/11/2026

## Motor de retorno de dedos traseros X/R · comparación 2D de rutas

### Defecto real de la previsualización
R107 trasladaba simultáneamente los ejes de referencia X (aproximación
del dedo) y R (altura) mediante interpolación diagonal. R108 exploró
separar los movimientos —R primero, después X—. Ese orden fijo
introdujo una **penetración 2D** al cambiar de G3 a G4 en una variante
de la Omega, con alas 60/85/120/85/60 mm, Stop/Support alternos
`[2,1,2,1]`; en el desplazamiento anterior diagonal esa penetración
no aparecía en las muestras examinadas. Por tanto, imponer R→X a todas
las piezas **NO** es una solución aceptable.

### Corrección final incorporada
- `stagedGaugeAxes` admite **R→X** y **X→R**. Nunca cambia X/R a la
  vez en un instante del trazado, y respeta las referencias nominales.
  Durante el retroceso preventivo la retirada inicial sigue siendo X;
  durante el retorno se comparan ambas secuencias.
- `chooseGaugeAxisOrder` ordena ambas alternativas por penetraciones
  actuales sobre el contorno de chapa/tope 2D, avisos de geometría no
  evaluable, holguras y, ante empate, preferencia estable por R→X.
- `technicalScene` evalúa **61 posiciones por recorrido** entre .84 y
  .99 de la operación. Usa `presentedAtStage`,
  `sectionPresentation`, `contactKinematics`, redondeos de pliegue
  y `inspectGaugeProfile`, el mismo modelo de sección que alimenta
  visor y diagnóstico. El resultado se cachea por pieza, útiles,
  máquina, golpe y referencias para evitar repetirlo por fotograma.
- Se guarda `axisOrder`, candidatos, penetraciones muestreadas
  y `movementCollisionUnresolved`. Si **ambas rutas** muestran
  penetración, la revisión marca ámbar por recorrido X/R no válido
  en 2D, una sola vez por operación. La penetración en la pose
  presente tiene prioridad **ROJA**.
- Las pantallas y el diagnóstico JSON identifican el eje activo
  y evitan llamar «retroceso por colisión» a un simple cambio de cota.

### Regresiones reproducidas en el modelo 2D
| Caso | Ruta R→X | Ruta X→R | Selección |
|---|---|---|---|
| Omega estándar 50/50/50/50/50 mm, orden 1–2–4–3 | 0 poses con penetración | 0 poses con penetración | R→X (estable) |
| Omega 60/85/120/85/60 mm, Stop/Support [2,1,2,1], G3→G4 | **6** poses con penetración 2D | **0** poses con penetración 2D | **X→R** |

Después de seleccionar X→R, la revisión temporal del caso
de regresión no encuentra penetraciones durante el movimiento
del dedo en las muestras usadas. El resto de avisos de holgura
no se convierten en órdenes de retirada sin evidencia.

### Verificaciones efectuadas
- `tests/gauge-axial-return-r108.test.mjs`: **6 casos superados**
  en el entorno de ejecución de funciones del código real.
- `tests/gauge-axis-route-selection-r108.test.mjs`: **7 casos
  superados** incluyendo las dos Omega, la elección de ruta,
  el semáforo y la ausencia de duplicados.
- `tests/gauge-clearance-metrics-r107.test.mjs`: **8 casos
  anteriores superados** tras el cambio.

Estas comprobaciones focalizadas **NO sustituyen `npm test` completo
en Node/GitHub Actions**, ni pruebas visuales en navegador o móvil.

### Limitación de seguridad
No se ha importado la geometría volumétrica CAD OEM completa de
mesa, trancha, útiles, topes, mordazas y ejes, ni se han medido las
carreras y velocidades reales X/R/Z de la unidad del operario.
**0 penetraciones en 61 poses 2D no significa ruta física segura**.
No emitir CNC, no prometer certificación de ausencia de colisiones
y no convertir el resultado en autorización de fabricación.
