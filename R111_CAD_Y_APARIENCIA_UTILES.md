# PlegadoX · R111 · CAD y apariencia geométrica de punzones y matrices

**16 de noviembre de 2026 — v0.9.85**

## 1. Búsqueda de CAD físico: estado verificable

Se han registrado **25 fichas técnicas y 19 enlaces directos a DXF/ZIP de fabricantes** en `cad-evidence.js`, además de documentos accesibles sólo mediante cuenta del fabricante, correo, distribuidor o una instalación licenciada. Los enlaces fueron localizados en páginas técnicas de UKB, Eurostamp, Mate y SOCLAM. No confundir **enlace directo** con **archivo binario descargado e inspeccionado**: los ZIP/DXF de terceros todavía no han sido incorporados a la versión publicada.

### Ocho referencias adicionales UKB

| Referencia | Tipo | Características declaradas | Archivo OEM (ZIP/DXF) |
| --- | --- | --- | --- |
| 11.151 | Punzón 85° | H104,5; R0,8; 500 kN/m | https://daten.ukb-gmbh.de/dxf/zip/11151.DXF.zip |
| 11.200 | Punzón 85° | H66,5; R0,8; 1000 kN/m | https://daten.ukb-gmbh.de/dxf/zip/11200.DXF.zip |
| 10.170 | Punzón 85° | H66,74; R0,6; 350 kN/m | https://daten.ukb-gmbh.de/dxf/zip/10170.DXF.zip |
| 25.406 | Matriz V20/30° | H100; R2; 600 kN/m | https://daten.ukb-gmbh.de/dxf/zip/25406.DXF.zip |
| 29.351 | Matriz WILA V8/30° | H100; R2,5; 800 kN/m | https://daten.ukb-gmbh.de/dxf/zip/29351.DXF.zip |
| 29.353 | Matriz WILA V16/30° | H100; R3,5; 800 kN/m | https://daten.ukb-gmbh.de/dxf/zip/29353.DXF.zip |
| 25.501 | Matriz V6/30° | H100; R0,6; 170 kN/m | https://daten.ukb-gmbh.de/dxf/zip/25501.DXF.zip |
| 29.552 | Matriz WILA V12/30° | H55; R1; 800 kN/m | https://daten.ukb-gmbh.de/dxf/zip/29552.DXF.zip |

Los ángulos, radios, alturas y aperturas de estas referencias son metadatos de ficha; **no se ha demostrado aún la fidelidad geométrica de los polígonos ni sus datums en un fichero OEM descargado**. Las cargas dependen de condiciones comerciales de uso que se deben verificar.

## 2. Apariencia: error reproducido y corregido

**Problema de la pata de cabra:** el importador previo normalizaba X tomando el centro de la caja exterior del contorno. Cuando el cuello era asimétrico, el eje frontal de la punta podía quedar desplazado respecto al eje de plegado de la matriz.

**Solución R111:** `tool-cad-datum.js` localiza el punto de trabajo inferior del punzón y la(s) garganta(s) superiores de la matriz. `importedTool()` traslada todo el contorno a ese origen **sin deformar el dibujo original**. En un útil asimétrico sintético se reprodujo una diferencia de 19,5 mm entre centro exterior y eje de trabajo; el perfil alineado conserva punta X=0.

**Matrices reversibles o con varias V:** cuando el análisis detecta más de una garganta, obliga a elegir el eje de la V activa; no centra la caja exterior ni escoge al azar. Una matriz sin V identificable no puede registrarse como matriz convencional mediante un eje arbitrario. Detectar una V no demuestra que el perfil venga del fabricante ni que su amarre sea correcto; algunas matrices reversibles también tienen vías en caras opuestas y requieren inspección del dibujo de montaje.

**Visor de importación:** la vista previa muestra línea(s) de eje de trabajo y permite especificar X en milímetros. Se limpian los valores de eje y amarre al preparar otra referencia. En la ficha del útil se indica si está alineado, aún sin montaje OEM verificado, o si su eje es desconocido.

**DXF antiguos:** los DXF guardados antes de R111 se normalizan en memoria, sin sobreescribir la copia local. Si el eje es ambiguo, permanecen disponibles para el operador pero se excluyen de recomendaciones automáticas hasta su reimportación con eje elegido.

**Perfiles provisionales existentes:** se corrigieron los vértices duplicados de CONIC GN9/GN6 y el ejemplo Beyeler R. Después del ajuste, los 25 punzones y las 43 matrices del catálogo superan `validateContour` (68/68 perfiles cerrados sin aristas degeneradas). Que un croquis paramétrico sea válido **no lo convierte en CAD OEM físico**.

## 3. Verificación focalizada

- `tests/tool-dxf.test.mjs`, `tests/tool-cad-datum-r111.test.mjs` y `tests/catalog-appearance-r111.test.mjs`: **20 casos aprobados** contra módulos actuales.
- `tests/tool-cad-legacy-r111.test.mjs`: **4 casos aprobados** para migración en memoria.
- `tests/cad-evidence-r109.test.mjs`: **10 casos aprobados** después de añadir las 8 fichas UKB.
- Auditoría de `CATALOG_PUNCHES` y `CATALOG_DIES`: **68/68 perfiles validados**.
- `tooling-advisor.js`: ensayo focalizado confirma que un DXF con `datumPending=true` no resulta elegido automáticamente.

Las pruebas de contornos emplean geometrías sintéticas y bibliotecas del proyecto. **No hay ejecución completa confirmada de `npm test` ni verificación 3D real de un conjunto de máquina montado.**

## 4. CAD todavía pendiente para validar colisiones físicas

- Conjuntos exactos de Trumpf TrumaBend V85 y Bystronic 100T 3100: viga/trancha, mesa, amarres y regletas, dedos Stop/Support y soportes.
- La **referencia OEM exacta** de los útiles montados, su longitud efectiva Z, segmentación, datum de sujeción, posición real y orientación.
- Sólidos CAD/STEP, cotas X/Y/Z, tolerancias y trayectorias efectivas de Y1/Y2/X/R/Z1/Z2.
- Validación contra perfiles descargados del fabricante y comprobación controlada en taller.

Para intentar obtener el CAD de conjunto, consultar **MyTRUMPF** para herramienta concreta y datos de máquina, y **BySoft CAM** para configuraciones y modelos 3D de máquina, topes y útiles bajo licencia. La presencia de un fichero con nombre similar no acredita compatibilidad con el número de serie del taller.

**Conclusión:** R111 corrige errores concretos de representación y añade fuentes reales, pero no certifica la inexistencia de colisiones. No utilizar como autorización de un ciclo CNC hasta contrastar el montaje físico.
