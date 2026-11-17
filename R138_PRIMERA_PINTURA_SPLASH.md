# PlegadoX R138 · imagen premium desde la primera pintura

**17/11/2026 · v0.9.112 · R138**

## Problema
En R137, el boceto premium seleccionado existía solo dentro de `splash-foto-premium.html`, abierto mediante un `iframe`. Un arranque con caché fría podía enseñar únicamente un fondo de espera antes de que ese documento recibiera el boceto, dando la impresión de una pantalla adicional.

## Corrección
1. `index.html`: estilos críticos inline al inicio de la cabecera para evitar un destello de fondo mientras se obtiene `styles.css`.
2. Precarga de `plegadox-premium-selected.png` con prioridad alta y muestra directa de la imagen exacta aprobada en `img#pxSplashImmediate`. `object-fit:contain` mantiene el encuadre 1672×941 en móvil, tablet, PC y Mac.
3. El iframe sigue usando la pantalla de carga aprobada con barra y porcentaje real, pero permanece opaco en cero hasta que se haya creado su controlador `PlegadoXLoading`. Al estar listo se sincroniza con el porcentaje acumulado y se muestra.
4. Si el iframe finalizó antes de registrar `load`, comprobación adicional de `contentDocument.readyState`.
5. No se añade espera artificial y no se modifica ni la foto ni la lógica geométrica, ni `localStorage`, `IndexedDB` o los datos de proyectos. Build, versión y caché quedan alineados en R138.

## Límite técnico Android
El splash del sistema operativo de una WebAPK se dibuja **antes** de cargar HTML. No es posible suprimirlo desde JavaScript de una PWA. La R137 unificó su nombre, tema y recurso maskable; la R138 mejora el tramo del navegador hasta el splash premium aprobado. Chrome/Android puede tardar en regenerar la WebAPK instalada; no desinstalar sin respaldar las piezas.

## Comprobación
`tests/splash-first-paint-r138.test.mjs` comprueba CSS de primera pintura, preload, la misma imagen, transición condicional del iframe y versiones. Las pruebas de Chromium no verifican de manera concluyente el splash nativo de una Galaxy física.

**Pendiente:** observar un arranque frío y otro caliente en un dispositivo Samsung real, además de iPhone y tablet, una vez instalada la R138.