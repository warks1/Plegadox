# PlegadoX R136 — dos semáforos de tope: sección 2D frente a recorrido CNC

**Fecha:** 17/11/2026 · **Versión:** 0.9.110 · **Base:** R135

## Error de interpretación corregido

Hasta R135, el tope del visor 3D se coloreaba a partir del semáforo de **perfil 2D** y la coincidencia transversal Z declarada. Un tope naranja por falta de referencia frontal, holgura de sección o geometría incompleta podía parecer una interferencia de CAD **3D comprobada**, aunque el módulo físico de ejes no hubiese detectado ninguna. También faltaba distinguir una traza CNC realmente vinculada al plano de pieza de una traza de otra configuración de máquina.

## Solución R136

- El indicador **TOPE 2D** mantiene su nivel original: rojo por penetración de perfil 2D, naranja por falta de apoyo/holgura/datos de sección y verde por comprobación 2D favorable bajo sus condiciones conocidas.
- **CNC DEL TOPE** es un indicador ADICIONAL, separado, con leyenda propia en los sólidos orbitales y texto que explica causa y limitaciones. No repinta falsamente el dedo con eventos del CNC que no están sincronizados a ese fotograma.
- El motor `machine-cnc-gauge-semaphore-r136.js` utiliza el reporte R133–R135 **solo para pares donde intervenga `gauge`, `gaugeZ1` o `gaugeZ2`**:
  - **ROJO**: nueva penetración MODELADA de tope entre **DOS perfiles CAD importados** (con las restricciones de Y1/Y2). NO es colisión física inevitable ni autorización/orden CNC.
  - **NARANJA**: nueva penetración con envolventes provisionales, un montaje previo ya solapado o una causa temporal indeterminada. No se transforma un contacto previo en choque nuevo.
  - **NEUTRO (gris, no naranja)**: no hay traza o datum aplicable, falta CAD físico, hay parejas sin comprobar, intervalos omitidos, inclinación Y1/Y2 desconocida o informe obsoleto. Desconocimiento **no es choque detectado**.
  - **VERDE**: solo si el modelo revisó intervalos de chapa inmóvil, existe cobertura de los sólidos/pares relevantes y no se detectó penetración volumétrica del tope. **No significa libre de contacto tangencial, validez OEM, ni seguridad certificada**.
- `machine-cad-ui.js` emite el resumen ya calculado sin volver a computar colisiones en cada renderizado o al mover la cámara. El indicador se invalida al cambiar pieza/máquina/DXF/registro/datum.
- `machine-volume-viewer.js` comprueba la **clave de pieza**, **identificador de máquina**, **clave de cotas CAD** y **tiempo de escena de la chapa inmóvil** antes de dibujar el nivel del CNC. Si no coinciden, pone el indicador CNC neutro. Una traza de movimiento **no es la misma cosa que el fotograma orbital**, por lo que NO se usa para repintar un dedo como si estuviera chocando en esa pose.
- Mantiene la caché de escenas y límites de píxeles Galaxy R131: actualizar la leyenda debe reutilizar sólidos y triangulación.

## Pruebas

`tests/machine-cnc-gauge-semaphore-r136.test.mjs`:
- neutral sin trazas, datum o con CAD incompleto;
- rojo modelo nuevo CAD-CAD, Z1 contra Z2 y sin aproximación no modelada de inclinación Y1/Y2;
- naranja provisional, preexistente o incertidumbre de geometría;
- aviso de trancha/mesa no contamina el color del tope;
- verde solo para un modelo de pares completamente cubiertos sin penetraciones;
- invalidación pieza, máquina, cotas CAD y tiempo de escena;
- cruce real del **modelo sintético** de tope/mesa a lo largo del eje X sin atribuirlo a un CNC real.

`tests/machine-cnc-gauge-semaphore-r136-browser-smoke.mjs`: Chrome con perfil Galaxy, escena 3D, anuncio CNC, cambio de evidencia, bloqueo de datos obsoletos, JSON de auditoría y ausencia de nueva triangulación por actualizar el texto.

## Límites

El motor actual sigue utilizando geometría de prismas **2,5D extruidos**, no una plegadora 3D OEM completa. El rojo indica un solape nuevo entre perfiles declarados, no un accidente inevitable; el verde es solamente del modelo. No se modelan todos los recorridos PLC, giros/deformación, tolerancias reales, huellas completas de amarre ni contacto de fuerza. Nadie debe ejecutar una pieza en la máquina basándose únicamente en este semáforo. Completar CAD OEM verificado, referencia de montaje y captura de ejes CNC sigue siendo la prioridad.
