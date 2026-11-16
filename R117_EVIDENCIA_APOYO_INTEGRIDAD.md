# PlegadoX · R117 · Evidencia completa de apoyo por golpe

**16/11/2026 · versión 0.9.91 · rama main**

## Problema detectado

El planificador conjunto estaba dispuesto a considerar viable una alternativa cuando un evaluador de topes devolvía `contactNotObserved:0` pero omitía las operaciones o las condiciones de contacto. Este contador solo demuestra que el evaluador **no declaró** ausencia de contacto; no demuestra que el canto esté apoyado físicamente contra la cara frontal del dedo.

La R116 había aprobado las 732 pruebas de código, las comprobaciones visuales de inicio, simulación, topes y datos, el paquete USB Windows y Pages. La R117 añade protección para los datos de contacto incompletos.

## Cambios en el motor

- `reconcileGaugeEvidence(report,expectedOperations)` exige resultados de contacto booleanos para todos los golpes examinados. Si faltan operaciones, faltan valores booleanos o sobran filas, marca `incompleteContactData`.
- Si los registros especifican un número de operación, se comprueba que cubran **todos los índices diferentes**. Cuatro registros con `operation:0` no se aceptan como cuatro golpes comprobados.
- `integrated-bend-planner.js` conserva `gaugeContactUnknown`, `gaugeMissingOperations` y `gaugeUnexplainedOperations` en cada candidato, incluido el programa manual.
- No se recomienda automáticamente ninguna alternativa que carezca de un informe de apoyo completo. El programa manual permanece editable y nunca se sustituye sin acción del usuario.
- El nuevo estado `DATOS_CONTACTO_TOPE_INCOMPLETOS` diferencia **falta de evidencia** de **apoyo físicamente inválido**, **holgura**, o **penetración detectada**.
- En `app.js` el operador recibe el número de variantes con datos incompletos; se explica que esto NO significa colisión ni imposibilidad física de apoyar la chapa.

## Pruebas añadidas y reconciliadas

Nueva batería `tests/gauge-evidence-completeness-r117.test.mjs` con casos de operaciones ausentes, booleanos de contacto omitidos, datos completos para cuatro golpes, registros duplicados, bloqueo de recomendaciones no comprobadas, y conservación de la selección manual.

Se actualizan los escenarios sintéticos existentes de R35, R100, R101 y del planificador integrado para que declaren **el contacto en todos los golpes que dicen haber evaluado**, manteniendo las incidencias que originalmente pretendían comprobar.

**No se ha relajado la detección de colisiones para aprobar las pruebas.** Las pruebas de regresión distinguen un rechazo por penetración de un rechazo por ausencia de información.

## Límites físicos importantes

Esto es un control de integridad del **informe nominal 2D**, no una certificación del contacto industrial. Siguen pendientes de obtener y contrastar los perfiles DXF/STEP de la máquina y de los componentes físicos montados: punzones, matrices, amarres, trancha, mesa, adaptadores, topes y cotas longitudinales Z. Además hay que comprobar los recorridos físicos Y1/Y2/X/R/Z1/Z2, el volteo y la deformación de chapa en 3D continuo.

La planificación automática propone combinaciones orientativas; nunca habilita la ejecución CNC sin validación externa.

**Próximo paso de taller:** reproducir la omega con orden 1-2-4-3, Stop 1/Support 2 y los útiles reales, contrastando el instante de contacto y retirada del dedo contra el vídeo, sin atribuir un naranja por falta de CAD a una colisión.
