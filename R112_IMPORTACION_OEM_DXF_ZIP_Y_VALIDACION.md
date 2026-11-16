# PlegadoX · R112 · Importación CAD OEM en DXF y ZIP
**Fecha:** 16/11/2026 · versión 0.9.86.

## Propósito
Eliminar los obstáculos que impedían importar los archivos 2D reales de fabricantes, en especial DXF de AutoCAD con bloques insertados y ZIP publicados por UKB. **No se declara que un enlace OEM sea un CAD binario ya descargado ni que un contorno sin datum físico sea una simulación certificada.**

## Mejoras de lectura de DXF
`tool-dxf.js` admite:
- Un contorno cerrado en `LWPOLYLINE` o `LINE/ARC`.
- DXF con un único `BLOCK` referenciado por un `INSERT` en la sección `ENTITIES`, aplicando base, traslado X/Y, giro y escala positiva uniforme. Se rechazan perfiles anidados, varios INSERT, referencias 3D, matrices de repetición y transformaciones reflejadas o de escala desigual.
- Aristas individuales representadas como LWPOLYLINE cerradas de dos vértices: se recomponen en un único contorno comprobado; una sola arista aislada o una arista de dos vértices con `bulge` se rechaza.
- El importador de máquinas conserva sus límites dimensionales propios al transformar un bloque, distintos de los de punzones/matrices.

**Riesgos pendientes:** DXF con `SPLINE`, `ELLIPSE`, varios perfiles interiores o cuerpos 3D no se convierten artificialmente a un único contorno. Su transformación requerirá conversión OEM/CAD externa o soporte con topología explícita.

## ZIP DXF oficial (R112)
`cad-zip-reader.js` permite abrir directamente desde el formulario de útiles un archivo `.DXF.ZIP` o `.ZIP` de hasta 8 MiB. Lee el directorio central, identifica **un único** DXF, acepta STORE o Deflate (si el navegador admite `DecompressionStream('deflate-raw')`), limita la salida a 1 MiB, verifica que las cabeceras son coherentes y comprueba **CRC32**. Rechaza ZIP64, archivos cifrados, rutas peligrosas, tamaños anunciados incoherentes y más de un DXF en un ZIP.

**CRC válido NO significa que el fabricante del fichero o su montaje estén verificados.** Cuando un ZIP tenga varias variantes de herramientas, se exige extraer y elegir el DXF concreto manualmente. La compatibilidad de Deflate depende del navegador y puede requerir descompresión externa.

## Fuentes OEM: 27 fichas / 21 enlaces directos
Además de las 25 fichas anteriores, nuevas fuentes verificadas en la página oficial UKB:
- **UKB 25.500** · matriz 30°, V5, radio de entrada 0,6 mm, H100 mm, capacidad nominal 150 kN/m. Fuente: https://www.ukb-gmbh.de/en/25500.html . Enlace de descarga directo: https://daten.ukb-gmbh.de/dxf/zip/25500.DXF.zip
- **UKB 25.621** · matriz 84°, V6, radio de entrada 0,6 mm, H150 mm, capacidad nominal 1000 kN/m. Fuente: https://www.ukb-gmbh.de/en/25621.html . Enlace directo: https://daten.ukb-gmbh.de/dxf/zip/25621.DXF.zip . El fabricante menciona una variante de 86° **25.601 bajo pedido**, distinta del perfil de 84°.

Las páginas oficiales proporcionan enlaces, dimensiones y características, pero el entorno de recuperación web rechaza el contenido `application/zip`. **Ningún ZIP OEM original ha sido descargado y descomprimido por el asistente en esta revisión.** Por ello el inventario muestra `ENLACE_CONFIRMADO_NO_IMPORTADO` y la máquina sigue sin CAD OEM físico certificado.

## Pruebas focalizadas realmente ejecutadas
- `tests/tool-dxf-block-r112.test.mjs`: **13/13** al probar BLOCK, INSERT, aristas WILA de 2 puntos, unidades y rechazos de formas inseguras.
- `tests/cad-zip-reader-r112.test.mjs`: **8/8** de integridad de cabeceras, CRC, límites, Deflate inyectado y lectura posterior con el importador DXF. Los ZIP de prueba son sintéticos.
- `tests/cad-evidence-r109.test.mjs`: **10/10** de identidad de referencia, dimensiones publicadas, amarre y prohibición de mezclar fichas de fabricantes distintos.
- Revisión sintáctica local de módulos modificados y sincronización de build/caché.
- Nuevo `.github/workflows/ci.yml` para ejecutar `npm test` completo con Node 22 en GitHub Actions al recibir cambios. **Su resultado completo debe revisarse en GitHub Actions; no se afirma todavía que esté verde.**

## Siguiente fase física
1. Recuperar de fabricantes o instaladores los DXF/STEP autorizados por **número de serie y referencia** de útiles, amarres, tope, trancha, mesa y grupo de máquina.
2. Obtener longitud en Z y posición de cada segmento; revisar estructura de ZIP y disponer de una representación de volumen real, no solo una sección 2D.
3. Contrastar cada contorno con alturas, radios, V y datums en fichas OEM. Si dos fuentes difieren, bloquear la selección automática antes de decidir.
4. Validar los recorridos de los ejes reales **Y1/Y2/X/R/Z1/Z2** y la trayectoria de chapa a lo largo de todo el ciclo.
5. Mantener `verified:false` y prohibición de considerar una simulación como certificación industrial hasta completar la geometría, los límites y una prueba controlada.

La nueva capacidad es **leer más formatos de CAD**, no fabricar datos que los fabricantes no han proporcionado.
