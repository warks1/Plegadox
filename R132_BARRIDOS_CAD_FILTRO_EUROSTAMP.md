# PlegadoX R132 — filtro físico conservador de barridos y nuevos CAD OEM de herramientas

**Fecha:** 17/11/2026 · **Versión:** 0.9.106 · **Base:** R131.

## Objetivo

Reducir la carga de CPU en revisión volumétrica de recorridos X/R/Z/Y1/Y2 con múltiples cuerpos CAD y conservar detección de interferencias ENTRE poses. Un filtro AABB no puede sustituir la colisión por polígonos; únicamente puede descartar parejas cuya separación geométrica está matemáticamente garantizada en al menos un eje, **si la traslación entre poses es lineal**. Los datos inválidos NO se descartan.

## Motor geométrico

- `machine-swept-broadphase-r132.js` construye el AABB temporal conservador de las poses de partida y llegada de cada prisma. Para movimientos lineales rígidos, este volumen contiene todas las posiciones intermedias.
- Si ambos AABB barridos están separados en X, Y o Z (sin intersección de volumen), se evita ejecutar triangulación/intersección de polígonos: **no puede existir penetración volumétrica positiva en ese barrido lineal**, pero los contactos tangenciales y errores de dimensiones quedan sin certificar.
- Si pueden cruzarse, se ejecuta el motor existente `sweptPrismPair` en todos los casos; **un cruce AABB no genera colisión por sí solo**.
- Si falta el CAD o tiene geometría inválida, no se descarta el caso: permanece sin resolver mediante el motor geométrico.
- Integración en `machine-axis-geometry.js` (trancha, útiles, amarres, mesa y Z1/Z2, además de chapa) y `volume-trajectory-review.js` (barrido entre poses del simulador).
- `broadphaseRejectedPairs`, `narrowphasePairsChecked`, `broadphaseRejectedSweeps` y `narrowphaseSweeps` miden operaciones geométricas evitadas, sin fingir reducción de tiempo en milisegundos o certificados de ausencia de colisiones. El diagnóstico CAD/CNC muestra el número de pares separados.
- La caché gráfica Galaxy R131 se conserva intacta y el algoritmo no se limita a móvil: el motor funciona igual en PC, tablet e iOS.

## Investigación de CAD de fabricantes, sin importar geometrías no verificadas

Las fichas OEM y enlaces reales a DXF **no equivalen al fichero leído**. El catálogo ya contenía el punzón Eurostamp 1015 (88°, H88,5, R3), que se conserva sin duplicarlo. R132 añade:

| Fabricante | Herramienta | Datos de ficha | DXF enlazado |
|---|---|---|---|
| Eurostamp | Matriz 3163 (1V autocentrante) | V16, 88°, H60 mm, 100 t/m | https://eurostampsrl.it/dxf/3163.dxf |
| Eurostamp | Matriz 3165 (1V autocentrante) | V25, 88°, H60 mm, 100 t/m | https://eurostampsrl.it/dxf/3165.dxf |

Fichas OEM: https://eurostampsrl.it/en/11184/1v-self-centering-dies-88-amada/3163-1v-dies-self-centering-dies-88 y https://eurostampsrl.it/en/11198/1v-self-centering-dies-88/3165-die-88. Ambos enlaces `Download DXF` aparecen en las fichas; no se han obtenido ni parseado los bytes CAD en esta revisión. El software obliga a cotejar escala real, ranura, tipo de amarre, altura útil, Z y radio de hombros antes de usar las herramientas en planificación.

## Pruebas

- `tests/machine-swept-broadphase-r132.test.mjs`: separación X/Y/Z; cruce intermedio con extremos libres; AABB solapado sin choque; CAD inválido que permanece pendiente; catálogo OEM sin inventar fichero; barridos de trancha/mesa que conservan eventos y número de pares filtrados.
- `tests/machine-swept-broadphase-r132-browser-smoke.mjs`: prueba Galaxy Chrome, piezas y CAD sintéticos (señalados **NO OEM**), comprobación de choque de mitad de carrera, contador de separaciones, referencias de Eurostamp y captura de diagnóstico.
- CI conserva las suites R125–R131 y pruebas generales.

## Seguridad y limitaciones

El modelo es de prismas extruidos y traslaciones rígidas lineales. **No debe utilizarse para autorizar la puesta en marcha, asegurar la ausencia de contactos tangenciales ni sustituir simulación OEM/CNC**. Los movimientos de chapa con giros/deformación, trayectorias curvas, aceleración real, variación Y1/Y2 y montajes pendientes siguen requiriendo CAD OEM medido, posición real de ejes, validación y ensayo físico. Los datos faltantes nunca se rellenan con supuestas dimensiones de otro fabricante.
