# PlegadoX · R107 · 16/11/2026
## Diagnóstico medible de holguras chapa/tope en la Omega

### Defecto reproducido
Los cuatro golpes de la Omega (orden 1→2→4→3) muestran una proximidad
temporal entre el ala que empieza a levantarse y el dedo trasero.
El detector previo sólo devolvía «holgura» y la primera coordenada
encontrada, sin medir la separación real chapa/dedo. Así era imposible
distinguir un roce geométrico, una limitación de la sección idealizada
y una auténtica penetración de la fibra media.

Había un segundo fallo: el predictor muestreaba .44, .48, .52… y podía
saltar una proximidad breve a .46. El escáner de secuencia tampoco
incluía ese instante, aunque la animación sí lo enseñaba.

### Nueva métrica
`inspectGaugeProfile` recorre los tramos de la fibra media y las
aristas del contorno 2D del tope y conserva la distancia **mínima**,
no la primera que aparece:
- `distanceMm`: distancia mínima entre fibra media y contorno del dedo.
- `requiredMm`: umbral de **e/2** adoptado en el cribado geométrico.
- `deficitMm`: máximo entre cero y `requiredMm - distanceMm`.
- `point` / `closestFingerPoint`: puntos más próximos de chapa y dedo.
- `segment` / `fingerEdge`: identificadores de las aristas implicadas.

La geometría de sección es provisional. Esas distancias **NO** son
mediciones de un dedo CAD verificado ni una tolerancia industrial
establecida por el fabricante.

### Muestras reproducidas · Omega estándar e=2 mm · Stop 1
| Golpe | Pliegue | Instante del ciclo | Distancia 2D | Umbral e/2 | Déficit 2D | Resultado |
|---|---:|---:|---:|---:|---:|---|
| G1 | P1 | 48 % | 0,085 mm | 1,00 mm | 0,915 mm | Holgura, ámbar |
| G2 | P2 | 46 % | 0,018 mm | 1,00 mm | 0,982 mm | Holgura, ámbar |
| G3 | P4 | 48 % | 0,085 mm | 1,00 mm | 0,915 mm | Holgura, ámbar |
| G4 | P3 | 46 % | 0,785 mm | 1,00 mm | 0,215 mm | Holgura, ámbar |

Ninguna de esas cuatro poses mostró penetración de **fibra media** del
tope en el modelo 2D. Una holgura menor que e/2 NO garantiza
ausencia de interferencia del volumen real de la chapa. No
etiquetar estos avisos como colisiones físicas confirmadas ni
forzar verde para ocultarlos.

### Mejoras del muestreo y presentación
- Predicción de retirada: incluye .44, .45, .46, .47, .48, .52…
  y conserva comprobaciones hasta .83.
- Revisión temporal habitual de 18 intervalos (19 instantes):
  incluye .46 y .48 sin perder los puntos críticos de cierre .36–.44
  ni la densidad del traslado entre .84 y 1.00.
- El pronóstico conserva `minClearanceMm` y `maxDeficitMm`.
- Semáforo y tarjeta 2,5D informan la holgura en mm, no un
  «posible choque» genérico. El panel de pieza explica la distinción
  frente a una penetración de fibra media. El informe JSON almacena
  además aristas y puntos próximos.
- **No se ordena retroceso automático basándose sólo en holgura
  de contornos provisionales**; la retirada física debe validarse
  contra CAD, sujeción, ciclos y carrera real de ejes X/R/Z.

### Pruebas y pendientes
Se añade `tests/gauge-clearance-metrics-r107.test.mjs`:
medición de 1 mm frente a 2 mm en geometría controlada, selección
del mínimo entre distintos segmentos, prioridad roja de penetración,
ausencia de retroceso automático por simple holgura, coherencia
del JSON con visor, e instantes críticos .46/.48 en escáner y
predicción G2/G4.

Pruebas focalizadas efectuadas en el código activo y congruencia
temporal de 19 muestras correctas. No consta todavía ejecución
completa y exitosa de `npm test` en Actions ni validación visual
en el teléfono. No hay certificación física de la máquina.
