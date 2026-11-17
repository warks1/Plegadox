# PlegadoX R139 · foto y barra juntas desde el primer fotograma

**17/11/2026 · v0.9.113 · R139**

## Incidencia
El boceto premium aprobado se precargaba en la página padre, pero el `iframe` podía descubrir su controlador `PlegadoXLoading` antes de que su fotografía de fondo estuviera cargada. La condición anterior `if(photo?.complete && !photo.naturalWidth)return;` no impedía revelar el documento cuando `photo.complete === false`. La barra del `iframe` podía aparecer sobre un fondo oscuro unos segundos antes de la máquina.

## Corrección
- Se coloca una **barra inicial sincronizada dentro del mismo contenedor de la fotografía**, con dimensiones y posición equivalentes a la barra premium. Ambos elementos permanecen invisibles hasta que la imagen inicial está cargada y `decode()` ha terminado; se hacen visibles en una sola actualización de clases.
- Las etiquetas y el porcentaje son los **mismos avances reales del cargador**; no hay temporizadores de porcentaje ni barra independiente previa.
- La segunda capa (`iframe`) solo se revela después de `photo.complete`, `photo.naturalWidth > 0` y `photo.decode()`. La transición oculta la barra inicial en el mismo ciclo en que aparece la barra definitiva.
- Si la fotografía no carga, el usuario puede pulsar **Reintentar inicio** en vez de quedarse con un progreso sin fondo.
- Se conservan el PNG aprobado, la composición visual del boceto, el almacenamiento local y el cacheo offline. Se actualizan versión, build y service worker.

## Límite
La pantalla de lanzamiento nativa del sistema Android/WebAPK sucede antes de que el navegador dibuje la página web y no se puede sincronizar desde JS/CSS. La corrección R139 cubre el arranque **web**. La observación en Samsung real, con caché fría y caliente, queda pendiente.

## Pruebas
- `tests/splash-sync-r139.test.mjs`: estructura, sincronía foto/barra, espera de decodificación del iframe, versión y caché.
- `tests/splash-first-paint-r138.test.mjs`: conserva la regresión R138 sin fijar un release antiguo.
