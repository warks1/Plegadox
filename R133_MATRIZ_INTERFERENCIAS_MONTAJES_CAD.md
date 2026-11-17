# PlegadoX R133 — matriz de interferencias, CAD faltante y compatibilidad de amarres

**Fecha:** 17/11/2026 · **Versión:** 0.9.107 · **Base:** R132.

## Qué se corrige

1. El motor de barrido tenía una **lista manual parcial de pares** (trancha, punzón, mesa, matriz, dedos, amarres, adaptadores, soportes) que omitía, entre otros, **punzón/soporte delantero, trancha/adaptador inferior, amarre superior/soporte delantero y adaptador superior/mesa**. Algunas parejas con dedos se evaluaban dos veces en sentido inverso.
2. Un sólido de amarre o soporte ausente en el modelo se saltaba silenciosamente y podía no aparecer como *pareja sin verificar*, aun cuando en la parte general ya constara una categoría CAD pendiente.
3. El inventario de CAD seguía exigiendo `stop`/`support` genéricos aunque la escena R129 permitía los dos contornos individuales Z1 y Z2.
4. Encontrar un DXF de herramienta Promecam no demuestra su encaje en un amarre superior WILA. La compatibilidad depende del **zanco de herramienta, la mordaza y el adaptador concretos**; tampoco se deben asumir cotas de otra Bystronic/Trumpf.

## Implementación

- `machine-interference-pairs-r133.js`: matriz de **20 combinaciones superior/inferior + 9 de tope** con dedo único, o **20+18+1=39** con dos dedos Z1/Z2. Sin duplicados; mantiene el barrido de dedos contra chapa y el autocruce Z1/Z2. Cada par se expande desde cuatro componentes superiores (trancha, punzón, amarre, adaptador) y cinco inferiores (mesa, matriz, amarre, adaptador, soporte delantero). Los pares del **mismo conjunto montado** (6 superiores, 10 inferiores) no se clasifican como accidentes de traslación; permanecen explícitamente pendientes de verificación OEM.
- `machine-axis-geometry.js`: cada intervalo reporta pares con ambos prismas válidos, contactos CAD-CAD versus provisionales, **número de parejas sin comprobar por geometría ausente**, detalle del motivo, muestras de máximo 24 casos, montajes no acreditados y recorte de lista si supera 120 eventos. Mantiene la optimización R132 solo para pares geométricamente separados. Una falta de contorno no se convierte en “libre de colisión”.
- `machine-cad-ui.js` / `index.html`: diagnóstico y expansión de interfaces de montaje excluidas; muestra cobertura pendiente y qué CAD hay que obtener antes de considerar cada familia.
- `cad-evidence.js`: el inventario cuenta la familia Stop/Support como importada cuando están **ambos** DXF independientes Z1+Z2; uno solo no basta. No significa montaje verificado.
- `machine-mount-compatibility-r133.js` y `cad-evidence-ui.js`: advertencia nominal por herramienta y máquina. Para Bystronic de 2006 con amarre superior **WILA** declarado, un punzón Amada/Promecam requiere comprobar **adaptador superior**. Para la base inferior declarada como Promecam sobre regleta, una matriz inserto 1V exige cotejar alojamiento, anchos, longitud Z y datums. Las coincidencias de familia también quedan **sin certificación**. La V85 no recibe un tipo de amarre inventado.
- PWA: nuevos módulos y caché estático sincronizados en `0.9.107`.

## Evidencia consultada

La documentación oficial WILA diferencia la fijación New Standard de European Style/Promecam y explica adaptadores/retrofits; **no atribuye configuración a una unidad sin inspección**:
https://www.wilatooling.com/knowledge-innovation/knowledge-articles/tool-tang/

Eurostamp 3163 V16/88° y 3165 V25/88° ofrecen DXF enlazado y datos nominales en sus fichas:
https://eurostampsrl.it/en/11184/1v-self-centering-dies-88-amada/3163-1v-dies-self-centering-dies-88
https://eurostampsrl.it/en/11198/1v-self-centering-dies-88-amada/3165-1v-dies-self-centering-dies-88

Los enlaces DXF de Eurostamp **no están importados ni incorporados como bytes CAD**; no se infiere su perfil a partir de dibujos ni se añade un fichero OEM sin licencia/revisión.

## Pruebas

- `tests/machine-interference-matrix-r133.test.mjs`: 29/39 parejas únicas, inclusiones esenciales, exclusiones de ensamblaje, CAD ausente, contadores reales del motor y cobertura de dedos Z1/Z2.
- `tests/machine-mount-compatibility-r133.test.mjs`: adaptador WILA/Promecam, bases con regleta, modelos de amarre desconocido, coincidencia nominal sin aprobación.
- `tests/machine-interference-matrix-r133-browser-smoke.mjs`: Chrome Galaxy emulado, inspección CNC sintética, lista de pares sin comprobar, 16 interfaces de montaje y captura, manteniendo las pruebas R125–R132.

## Limitación física

La matriz representa una **lista de comprobaciones geométricas de prismas rígidos extruidos 2,5D**, no un CAD OEM volumétrico de trancha, amarres, dedos y mesa. Los pares del mismo conjunto montado necesitan otra revisión estática y cinemática OEM, y todos los recorridos de giro y deformación de chapa permanecen sin certificar. No se garantiza ausencia de colisiones reales, no se autorizan programas de CNC y no se envían órdenes a máquina. Esta versión evidencia qué queda **sin verificar** en vez de esconderlo.
