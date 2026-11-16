# PlegadoX R122 · tres matrices CAD oficiales UKB 84° para el inventario

**16/11/2026 · versión 0.9.96 · rama main**

## Nuevas referencias verificadas en fichas del fabricante

Se han añadido al catálogo de referencias CAD externas, sin simular que el archivo está instalado, las matrices de **UKB-System Trumpf/Wila/Bystronic**:

| Referencia | V | Ángulo | R de entrada | H | Carga máxima publicada |
| --- | ---: | ---: | ---: | ---: | ---: |
| 25.203 | 10 mm | 84° | 1 mm | 100 mm | 1000 kN/m |
| 25.304 | 12 mm | 84° | 1 mm | 100 mm | 400 kN/m |
| 25.205 | 16 mm | 84° | 1,6 mm | 100 mm | 1000 kN/m |

Fuentes oficiales:
- https://www.ukb-gmbh.de/en/25203.html (DXF: https://daten.ukb-gmbh.de/dxf/zip/25203.DXF.zip)
- https://www.ukb-gmbh.de/en/25304.html (DXF: https://daten.ukb-gmbh.de/dxf/zip/25304.DXF.zip)
- https://www.ukb-gmbh.de/en/25205.html (DXF: https://daten.ukb-gmbh.de/dxf/zip/25205.DXF.zip)

Los tres enlaces **Download DXF** aparecen en la ficha de fabricante. Se ha contrastado que los enlaces conducen a contenido ZIP; estos contenidos no se han declarado automáticamente interpretados ni instalados.

## Cómo se usa en PlegadoX

Las referencias aparecen en el inventario CAD OEM y en el asistente para importar herramientas desde ficha. El usuario puede abrir el enlace y seleccionar el perfil/capa/ciclo concreto que tenga un único contorno cerrado y completo. El sistema conserva `profileAccuracy:'provisional'` y `verifiedSpecs:false` hasta que el perfil de la unidad montada y su amarre queden acreditados.

**No mezclar** V10/84, V12/84 o V16/84 con herramientas de 85° u 88°; tampoco asumir que la familia comercial de amarre identifica las mordazas instaladas o la longitud Z real.

## Pruebas

`tests/ukb-84deg-cad-r122.test.mjs` verifica cotas publicadas, referencia singular, enlace OEM, estado `ENLACE_CONFIRMADO_NO_IMPORTADO`, y que los registros **no inventen longitud de segmento, amarre verificado ni perfil instalado**.

## Lo que no puede certificarse desde internet

La información descargable puede completar geometría comercial de referencia, pero **no** valida la trancha, mesa, dedos Stop/Support, amarres y ajustes particulares de una Trumpf V85/Bystronic reales, ni las trayectorias X/R/Z1/Z2/Y1/Y2. Es necesaria la verificación de componentes y datums instalados antes de aprobar un programa físico.
