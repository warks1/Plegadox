# PlegadoX R35 · Precisión, selección de plegado y carga adaptable

## Cambios implementados
1. Pantalla seleccionada: se conserva sin alteraciones la imagen exacta `plegadox-premium-selected.png`. Contenido íntegro con `object-fit:contain`; el fondo de la misma foto llena el resto del viewport, tanto en portrait como landscape. La barra de carga y el mensaje pasan a un tamaño legible en pantalla vertical.
2. Planificador: ordenes diversificados por pliegue inicial/final; cribado de más útiles/secuencias en piezas habituales y descarte de planes automáticos con penetraciones modeladas de chapa, punzón, topes, trancha o mesa. La selección manual y sus informes se conservan.
3. Desarrollo: opción **BD individual medida** por pliegue geométrico, con fórmula `L = Σ alas exteriores − Σ BD_i`. Si una BD no se introduce se usa la compensación calculada con radio interior y factor K. El radio y K existentes siguen editables. En criterio neutro no se aplica una BD exterior. Las posiciones de plegado y exportaciones DXF consumen la misma longitud resultante.
4. Datos: mediciones antiguas conservan las mismas claves cuando no existen BD individuales. La versión PWA incrementa a v0.9.11/R35 para evitar seguir sirviendo recursos R34.

## Lo que sigue sin estar validado físicamente
- Los perfiles incluidos sin DXF o STEP del fabricante son **aproximaciones**. Una ficha parcial con altura, ancho, ángulo o radio NO define un contorno CAD de pata de cabra, cuello, amarre, matriz ni mordaza.
- La colisión 3D actual sigue siendo de secciones extruidas (2,5D) y posiciones muestreadas. No acredita ausencia de interferencia durante movimientos físicos continuos, volteo, acceso al pliegue ni recorridos reales X/R/Z/Y.
- BD y K obtenidos por una probeta con un material, lote, espesor, radio, útil y plegadora determinados NO son automáticamente válidos para otros parámetros.
- Por ello, **ningún plan ni desarrollo queda habilitado para fabricación automática sin verificación de taller**.

## Datos concretos todavía pendientes
- Contornos dimensionados DXF/STEP de cada punzón/matriz y geometrías reales de sujeción V85 (no fotos aproximadas); verificar escala, origen y referencia del amarre.
- Modelos y recorrido de trancha, mesa, montajes y dedos del tope, incluyendo Z y límites X/R/Y, con distancias de seguridad.
- Cupones de plegado medidos por combinación de material, espesor, V, punzón y radio, con BD y recuperación reales para calibración.
- Ensayos de trayectoria continua con distintas orientaciones, secuencias y piezas guardadas o nuevas; informe de incertidumbre y aprobación explícita por operario.

## Validación automatizada
- `npm test` incluye regresiones R35 para BD individual, compatibilidad con calibre antiguo, filtrado de penetraciones y variedad de orden.
- `tests/splash-viewport-r35-smoke.mjs` verifica visualización en escritorio, tablet y móvil, ambas orientaciones, y porcentaje de carga.
- GitHub Actions (PR) debe superar además las pruebas de navegador existentes antes de integrar.
