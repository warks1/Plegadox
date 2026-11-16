# PlegadoX R121 · Avisos fuera de la zona de plegado en 2D y perspectiva

**16 de noviembre de 2026 · versión 0.9.95 · main**

## Corrección solicitada desde captura iPhone

La tarjeta verde `TOPE 1 · SIN CHOQUE 2D` se anclaba al punto de contacto del dedo y la advertencia naranja `2D · MATRIZ` se mostraba al pie de la cabina, por lo que ambas podían ocultar la matriz al cambiar el encuadre. El problema era **presentación de la UI**, no un motivo para modificar la geometría de la herramienta, las referencias, el movimiento del punzón o el cálculo de interferencia.

## Cambio funcional en `machine-visual.js`

- `gaugeStatusCardLayout` dibuja un **carril superior estable** a Y=5 px, separado de los paneles flotantes laterales, tanto en iPhone como PC. Conserva el nivel verde/naranja/rojo y las leyendas de retirada o cambio de cota X/R.
- La vista 2D deja de poner una línea de texto con posición dependiente del dedo justo encima de la chapa o la V; usa **la misma tarjeta de estado que la perspectiva 2.5D**.
- La alerta de colisión/proximidad de punzón/matriz pasa al segundo carril, Y=44 px (`toolWarningHudLayout`); en sección métrica ocupa la primera posición (Y=5 px). Mantiene el mensaje de PENETRACIÓN/HOLGURA y el elemento afectado; el texto se recorta dentro de la tarjeta, no invade la matriz.
- El material, la V real del DXF, el escote del punzón, los tiempos de plegado, la geometría del tope, la secuencia y la política de bloqueo de riesgos **no cambian**.

## Validaciones automáticas

- `tests/status-hud-clear-tools-r121.test.mjs`: comprobación de los rectángulos de ambos avisos frente al polígono de la matriz en tamaños iPhone 390×245, 618×430, tableta 941×540 y PC 1440×900; sin solapes entre tarjetas y con espacio lateral para las herramientas/controles.
- Se actualiza la regresión R96: ahora exige que **ambas vistas** usen el carril superior, sin restaurar la antigua etiqueta del dedo pegada a la matriz.
- `tests/status-hud-r121-browser-smoke.mjs`: Playwright en móvil, tableta y PC; captura ambos modos en `test-results/r121-hud-*.png` y verifica que los dos carriles quedan por encima del contorno real de la matriz en la pieza de ensayo. Añadido a `.github/workflows/check.yml` en el grupo `topes`.

## CAD OEM: situación real

El rastreador R120 descargó DXF/ZIP de fabricantes e identificó referencias de UKB, Eurostamp y Mate. **Descargado no significa verificado ni instalado**: varias fichas UKB contienen líneas/arcos y capas cuyo contorno debe separarse sin mezclar anotaciones; las alturas totales de algunos DXF Eurostamp/Mate difieren de la **altura útil** publicada, un motivo para revisar datums antes de comparar y no para modificar cotas arbitrariamente. Los perfiles de máquina concreta, los amarres, Stop 1/Support 2 reales, Z1/Z2 y trayectorias CNC siguen pendientes de contraste físico.

No autoriza producción en máquina real.
