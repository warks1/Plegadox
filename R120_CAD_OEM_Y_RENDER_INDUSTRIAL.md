# PlegadoX · R120 · CAD OEM original + estética industrial de simulación

**Revisión: 16 noviembre 2026**  
**Rama:** `main`  
**Implementación iniciada en v0.9.94 (R120); los cambios posteriores de la rama principal se conservan.**

## 1. Avance comprobado por ejecución remota real

El lector automático `tools/oem-cad-remote-audit.mjs` y el workflow
`.github/workflows/oem-cad-remote-audit.yml` han descargado y examinado directamente
**35 enlaces DXF/ZIP oficiales**. El informe reproducible contiene fecha,
URL, hash SHA-256 del archivo, número de entradas DXF, capas y contornos.

**Última auditoría:** https://github.com/warks1/Plegadox/actions/runs/43964130087

| Comprobación | Resultado |
|---|---:|
| URL de DXF/ZIP verificadas por auditoría | 35 |
| Ciclos 2D cerrados genuinos hallados, deduplicados por hash de vértices | **28** |
| Archivos/capas individuales adicionales potencialmente utilizables | **3** |
| Ciclos que coinciden directamente con la H publicada en el catálogo | **3** |
| Perfiles CAD autenticados contra los componentes físicos del taller | **0** |
| Conjuntos físicamente validados para autorización CNC | **0** |

Los ciclos son **geometría extraída de aristas reales DXF originales**,
no reconstrucciones dibujadas de memoria. «Ciclo cerrado» demuestra
consistencia topológica en el archivo, no correspondencia con el útil
instalado ni compatibilidad con un amarre.

Entre los ciclos con H nominal igual a la ficha aparecen las referencias
UKB **14.153 (H175)**, **22.316 (H60)** y **22.308 (H60)**.
Otras referencias revelan una diferencia sistemática entre altura dibujada
y altura publicada, por ejemplo **25.202: H CAD 120 mm frente a H ficha
100 mm** y **11.780: H CAD 165 frente a H ficha 135 mm**.
Pueden corresponder a datums y partes de fijación distintas, pero esto
**no queda demostrado** solo con el enlace: sin documentación de la
referencia de altura no se aplica ninguna compensación.

## 2. Ampliación del catálogo OEM

Añadidas las matrices de **30° UKB V8, V10, V12, V16, V24, V30 y V32**,
con referencia, apertura, radio de hombro, altura nominal, carga máxima
y enlace original de fábrica.

Añadidos los punzones UKB de **30° 11.780, 11.880, 11.810,
14.153 y 14.169**, con ángulo, radio de punta, altura, carga y
familia de amarre declarada (Amada o Bystronic).

Las fichas UKB no certifican que el componente concreto sea intercambiable
con la fijación **WILA/Promecam o Trumpf** instalada en el taller.
Tampoco se asigna por defecto la longitud longitudinal Z de una
referencia de sección: hay piezas enteras, segmentadas y con cuernos.

**Ejemplos de fuentes directas del fabricante:**
- https://www.ukb-gmbh.de/en/11780.html
- https://www.ukb-gmbh.de/en/14153.html
- https://www.ukb-gmbh.de/en/25405.html
- https://www.ukb-gmbh.de/en/25202.html

Las fichas quedan como **ENLACE_CONFIRMADO_NO_IMPORTADO**.
Ninguna se promociona a «perfil OEM físicamente validado» sin registrar
fichero, referencia, datums y montaje.

## 3. Importación de geometría auténtica

1. `cad-zip-reader.js`: valida tamaño/CRC y permite seleccionar el nombre
   exacto de un DXF del ZIP. Descarta metadatos `__MACOSX/._*.DXF`,
   presentes en muchos ZIP UKB, sin confundirlos con una segunda geometría.
2. `tool-dxf.js`: enumera capas del DXF y permite elegir
   explícitamente una capa del perfil. Además detecta **circuitos
   realmente cerrados** de LINE/ARC, aun si existen cadenas sueltas
   auxiliares. Se eliminan ramas abiertas del análisis de ciclos,
   **sin conectar puntos nuevos ni cerrar huecos inventados**.
   El operador debe seleccionar el circuito exacto. Componentes con
   auto-intersección, dimensiones imposibles o varios contornos unidos
   de forma ambigua siguen rechazándose.
3. `tool-import-ui.js`: selección visible de **archivo DXF del ZIP,
   capa y circuito cerrado** para archivos locales y descargas
   directas cuando el navegador permite CORS.
4. `tool-cad-oem-audit.js`: antes de guardar, contrasta cotas
   declaradas con el contorno. Una discrepancia de referencia
   o datum deja la importación **bloqueada como OEM validado**.
5. La auditoría remota no republica ni incorpora en la rama
   los DXF originales de terceros. La selección y el análisis
   de un archivo descargado se realizan en la sesión del operador.

## 4. Apariencia industrial de útiles y simulaciones

- Nuevo módulo `industrial-tool-finish.js`: **acero mecanizado**
  con degradado de material, canto pulido, reflejos y líneas
  sutiles de rectificado. Todas las texturas están recortadas
  dentro del **polígono geométrico real**.
- `machine-visual.js`: punzón superior y matriz inferior
  renderizados con esa técnica usando el contorno del motor.
  Se elimina el dibujo artificial de una **V ideal superpuesta**
  que podía contradecir una matriz DXF de geometría especial.
- `app.js`: tarjetas de punzones y matrices con material acero
  cromado mediante gradientes SVG, conservando las referencias,
  cotas y formas diferenciadas, incluidas patas de cabra.
- `tool-import-ui.js`: previsualización industrial del fichero
  importado sobre cuadrícula técnica.
- `sw.js`: nueva dependencia de visualización incluida en
  el caché offline versionado.

**No se han modificado los puntos de colisión ni simulado cavidades
que no aparezcan en el contorno OEM.**
El acabado gráfico es una mejora visual y no altera la geometría física.

## 5. Pruebas

Baterías añadidas o ampliadas:
- `tests/industrial-tool-finish-r120.test.mjs`
- `tests/cad-oem-ukb-r120.test.mjs`
- `tests/multi-dxf-oem-zip-r120.test.mjs`
- `tests/cad-oem-layer-selector-r120.test.mjs`
- `tests/cad-oem-cycle-selector-r120.test.mjs`

**CI comprobado:** 773 pruebas, 773 aprobadas, 0 fallos, en
https://github.com/warks1/Plegadox/actions/runs/43964130132

Las pruebas prueban la integridad del código y los casos sintéticos;
**no sustituyen una prueba física sobre la plegadora**.

## 6. Inventario OEM físico aún pendiente

No es posible afirmar que estén incluidos «todos los CAD OEM» de
la Trumpf V85 y de la Bystronic del taller sin identificar sus
**componentes realmente instalados**: trancha, mesa/bombeo,
fijación superior, adaptador inferior, dedos STOP/SUPPORT,
longitudes segmentadas de punzones/matrices, cuernos, ejes,
límites de carrera y posiciones Z.

El proyecto puede localizar referencias de fabricante y mostrar
contornos reales **una vez seleccionados y cotejados**. La
comprobación completa requiere además cotas de montaje, la placa
exacta de máquina y trayectorias CNC Y1/Y2/X/R/Z1/Z2.
**Ni un ZIP OEM descargado ni una prueba geométrica 2,5D
autorizan fabricar automáticamente**.

### Fuentes pendientes de acceso
- SOCLAM: varios enlaces públicos devuelven 403.
- WILA: algunas bibliotecas DXF exigen MyWILA o cuenta.
- Mecos y piezas de la máquina: falta identificar la referencia
  exacta y disponer de los ficheros descargables originales; no
  se ha reconstruido ningún OEM 3D a partir de fotografías.

**Objetivo siguiente:** contrastar cada uno de los 28 circuitos
originales encontrados con su ficha y altura de montaje,
sin deducir correcciones de 20/30 mm; una vez conciliados,
habilitar su uso como contorno 2D provisional en la simulación
y verificar a posteriori las colisiones reales del taller.
