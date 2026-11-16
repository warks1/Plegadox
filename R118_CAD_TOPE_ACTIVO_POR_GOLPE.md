# PlegadoX R118 · CAD del tope activo según cada golpe

**16/11/2026 · versión 0.9.92 · main**

## Qué se ha corregido

El motor volumétrico `buildVolumeScene` incluía **Stop 1 y Support 2** en `missingCadComponents` en cada fotograma, incluso si el golpe actual sólo utilizaba uno. Esto podía crear incidencias de **CAD pendiente** que no correspondían a un componente activo y contaminar el diagnóstico mostrado al operario.

La R118 requiere ahora el CAD del **dedo activo** identificado por `stopByBend[activeBend]`. La revisión de secuencia `scanVolumeTrajectory` acumula los perfiles requeridos de todos los golpes, por lo que una pieza que utilice ambos dedos sigue necesitando ambos CAD.

### Comportamiento

| Secuencia / situación | CAD que se considera necesario |
| --- | --- |
| Golpe que emplea Stop 1 | Stop 1; no se marca Support 2 por ese golpe |
| Golpe que emplea Support 2 | Support 2; no se marca Stop 1 por ese golpe |
| Stop 1 importado y activo, Support 2 ausente | No se reclama Support 2 sólo por existir en el catálogo |
| Omega que usa Stop 1 y Support 2 en golpes distintos | El informe conjunto exige ambos perfiles |

No se modifican las geometrías, secciones ni tolerancias de los dedos; **no se está afirmando una nueva verificación física**. Permanecen las advertencias por falta de CAD real de trancha, mesa y otros elementos efectivamente necesarios.

## Pruebas

Nuevo archivo `tests/active-gauge-cad-r118.test.mjs` con cuatro regresiones. La batería íntegra después de estos cambios completó **744/744 pruebas aprobadas, 0 fallos**. `index.html`, `software-about.js`, `package.json`, `build-info.json` y `sw.js` se sincronizaron a **R118 / 0.9.92**.

## Límites pendientes

La sección 2,5D y el ancho Z nominal no acreditan el CAD OEM del dedo ni su posición real por los ejes X/R/Z. Siguen faltando las referencias CAD de punzón/matriz, amarres, trancha, mesa y soportes de las máquinas concretas, así como la trazabilidad del montaje real. La comprobación física y recorridos CNC reales son imprescindibles antes de cualquier validación industrial.

La elección manual de matriz, punzón y orden se conserva, y ninguna recomendación autoriza fabricación por sí sola.
