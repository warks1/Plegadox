# PlegadoX · R114 · Integridad de diagnósticos, catálogo CAD y arranque

**16 de noviembre de 2026 — v0.9.88 — main**

## Correcciones de funcionamiento

### 1. Arranque e interfaz del planificador
Se corrigió en `app.js` la falta de un operador `+` entre los campos «holguras de tope» y «envolventes 3D». El error podía impedir que el módulo JavaScript se analizara y, por tanto, que cargara el programa. El flujo `.github/workflows/ci.yml` incluye ahora `node --check app.js`, `node --check integrated-bend-planner.js`, `node --check planner-evidence-integrity.js`, `node --check tool-import-ui.js` y `node --check cad-import-sources.js`, además de las pruebas automatizadas.

### 2. El detalle de una interferencia prevalece sobre un contador incorrecto
Nuevo módulo `planner-evidence-integrity.js` integrado en `integrated-bend-planner.js`:

- Si un golpe de punzón o matriz contiene `category:'penetration'` pero el resumen `penetrationOperations` vale 0, el plan se bloquea como **penetración modelada**.
- Si un barrido de trancha contiene `severity:'interferencia-envolvente'` o `penetracion-barrido-lineal-modelado` pero el resumen de máquina vale 0, el plan se rechaza.
- Si el diagnóstico de ejes incluye eventos o infracciones que no figuran en los contadores, se conservan los hallazgos.
- Si una operación indica `contactObserved:false`, un `contactNotObserved:0` inconsistente NO permite elegirla como apoyo válido.
- Una `clearance`, una falta de apoyo o un barrido `no resuelto` NO se falsifican como choque demostrado.
- `physicalReview` expone por separado **colisiones modeladas**, **errores de referencia de tope**, **datos físicos sin verificar** y **avisos de holgura**. El manual se analiza independientemente.

No se ha eliminado la posibilidad de elegir manualmente útiles y orden. Las recomendaciones siguen siendo orientativas.

### 3. Los DXF inventariados aparecen en el importador
Nuevo `cad-import-sources.js`, usado en `tool-import-ui.js`. Reúne las fichas del catálogo y las entradas de `CAD_EVIDENCE_SOURCES` con enlace directo a DXF/ZIP, evitando duplicar URLs idénticas. En particular, **UKB 25.202** (V8, 84°, H100 mm, radio de entrada 0,8 mm) está ahora accesible para preparar/importar desde la interfaz; antes estaba registrada sólo en el inventario técnico.

Fuente oficial de UKB: https://www.ukb-gmbh.de/en/25202.html

**No se ha descargado aquí el ZIP original del fabricante**, por lo que sigue como `ENLACE_NO_IMPORTADO`. La aplicación ofrece enlaces y permite importar archivos manualmente; la importación automática puede depender de CORS y compatibilidad del navegador.

El formulario deja vacía la **longitud Z** si la ficha no la documenta. Un texto comercial que mencione varios sistemas («TRUMPF/WILA/BYSTRONIC») **no se interpreta como amarre Beyeler validado**: requiere selección manual y cotejo con la mordaza real.

### 4. Mensajes para el operario
Se incluye el estado del cotejo físico en cada alternativa del planificador. Una falta de CAD se comunica como **«datos físicos pendientes (NO significa colisión)»** en lugar de confundirla con una penetración. El plan muestra motivos específicos para que el operador sepa qué medir, importar o revisar.

## Comprobación automática
Tras la incorporación de la batería `tests/planner-evidence-integrity-r114.test.mjs` y `tests/cad-import-sources-r114.test.mjs`, la ejecución completa de CI de la versión 0.9.88 terminó con **723 pruebas correctas y 0 fallos**.

## Limitaciones pendientes, sin ocultar

- La sección DXF de un útil no valida longitud de segmentos Z, montaje OEM, orientaciones físicas, cuerpos ocultos ni tolerancias.
- Las envolventes de trancha, mesa, dedos de tope y adaptadores son provisionales salvo CAD del componente exacto importado y cotejado.
- El recorrido real Y1/Y2/X/R/Z1/Z2, sus tiempos e inclinaciones, el transporte/volteo y la trayectoria tridimensional continua de chapa siguen pendientes de comprobación física.
- Ni una etiqueta verde ni un plan «mejor estimación» equivalen a seguridad CNC certificada.

**Siguiente etapa:** conseguir CAD STEP/DXF exacto por referencia de la máquina y cada pieza montada (especialmente punzón, matriz, trancha, mesa, topes y amarres); contrastarlo contra cotas, datum y Z reales; y probar los barridos completos y orden automático/manual con la omega y piezas nuevas antes de una prueba controlada en taller.
