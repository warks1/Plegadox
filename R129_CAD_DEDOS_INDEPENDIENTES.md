# PlegadoX R129 — dos perfiles CAD distintos para los dedos Z1 y Z2

Fecha: 17/11/2026 · versión 0.9.103 · base R128.

## Problema corregido

R128 distinguía Z1 y Z2 en la escena 3D, pero solo permitía una única sección DXF compartida. En una plegadora con dedos de formas o montajes diferentes, copiar ese contorno a ambos extremos generaba sólidos geométricamente incorrectos. Los sistemas de tope pueden tener diferentes configuraciones y opciones; **no se puede asumir que toda TruBend V85 monta exactamente el mismo tipo de dedo ni las mismas opciones de ejes**.

## Mejoras de R129

- La biblioteca de CAD de máquina acepta `stopZ1`, `stopZ2`, `supportZ1`, `supportZ2`, además de los perfiles comunes `stop` y `support`.
- Cada uno se importa como DXF ASCII métrico, con su origen X/Y y fuente documental individual. Se conserva su geometría original, sin reemplazarla por la sección del otro dedo.
- El panel **Dos dedos Z1/Z2** permite dos modos: sección compartida (el comportamiento compatible con R128) o **dos DXF independientes**, sin obligar a afirmar que tienen la misma forma.
- La configuración de Z1/Z2 almacena la huella local de cada DXF importado. **Si cambia cualquiera de los dos archivos, offsets X/Y, fuente o revisión de máquina, el conjunto deja de modelarse como comprobado y se debe recalibrar**. La huella detecta revisiones locales; no acredita autenticidad del fabricante.
- En la pose de referencia del montaje, el motor dibuja **dos prismas diferentes**, cada cual con su propio contorno XY y banda de ocupación Z documentada.
- Los motores de trayectoria, barrido de interferencias y visor volumétrico consumen esos mismos sólidos y verifican su interacción con chapa, punzón, matriz, mesa, trancha y entre Z1/Z2. No se atribuye una posición real fuera del instante calibrado.
- La ausencia del perfil común `stop`/`support` no se cuenta como falta de CAD cuando están registrados ambos perfiles independientes; se siguen exigiendo los perfiles de los demás componentes.

## Validación

- `tests/machine-independent-fingers-r129.test.mjs`: importación y diferencias de perfiles, validación de identidad, cambios de forma, posiciones y cobertura.
- `tests/machine-independent-fingers-r129-browser-smoke.mjs`: Chrome Galaxy emulado, guardado de dos CAD distintos, prueba visual 3D, giro con caché y bloqueo automático al actualizar el DXF del dedo Z2.
- Se conservan las regresiones R125–R128 y los recorridos de pruebas generales.

## Evidencia externa consultada (no sustituye el CAD)

- Ficha de una **TrumaBend V85 usada** con ejes Y1/Y2/X/R/Z1/Z2 y conjunto WILA como equipamiento de *esa unidad*, no de todas las máquinas: https://www.frech-maschinen.de/en/datenblatt.php?language=uk&machineno=1073-96964
- Manual oficial **BySoft CAM**, edición 2022, explica ajustes de dedos y referencias de tope, pero no aporta el sólido CAD real de la Trumpf V85: https://bystronic-mediacenter.picturepark.com/v/uSPrfoiG/
- Brochure TRUMPF de familias TruBend (no de la V85 concreta), que muestra variantes de topes adicionales: https://www.trumpf.com/filestorage/TRUMPF_Master/Products/Services/01_brochures/TRUMPF-product-enhancements-catalog-EN.pdf

## Límites

Las medidas de los dedos, el origen X/Y/Z y el contorno físico han de coincidir con la máquina que se va a utilizar. Ninguno de estos cambios consigue un sólido STEP OEM completo, ni acceso al CNC/PLC, ni certificación física de seguridad. Las geometrías calculadas siguen siendo **prismas extruidos de sección 2D**, con barridos lineales de registros de ejes declarados y sin verificación de flexión/deformación continua.
