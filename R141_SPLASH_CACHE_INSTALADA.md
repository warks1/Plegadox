# PlegadoX R141 · pantalla premium prioritaria desde caché local

**17/11/2026 · v0.9.115 · R141**

La imagen original del boceto premium y el documento `splash-foto-premium.html` se descargaban nuevamente al abrir PlegadoX incluso cuando ya estaban en la caché versionada de la PWA. En una Galaxy, un arranque con red variable podía retardar la llegada del fotograma premium. La pantalla y la barra se sincronizaron previamente en R139/R140; esta revisión reduce esa dependencia de red en arranques posteriores.

El Service Worker usa **cache-first sólo para los dos recursos del splash**, leyendo únicamente `CACHE` de la revisión instalada. Al instalar o actualizar una revisión, `cache.addAll(APP_FILES)` obtiene los archivos vigentes antes de activarla. El HTML principal y los módulos permanecen en **network-first**, con respaldo offline, para evitar versiones obsoletas de cálculos y gráficos.

Se añade `tests/splash-cache-r141.test.mjs` y `tests/splash-cache-r141-browser-smoke.mjs` al grupo de inicio de GitHub Actions. La prueba Galaxy comprueba ambos recursos precargados, desconecta la red, recarga y verifica fotografía premium y barra presentes sin conexión. No se alteran las piezas, el modelo CAD, la foto aprobada ni la pantalla nativa previa de Android.

Esta optimización no demuestra una solución general de congelaciones en una Samsung física; es una mejora localizada del arranque web, pendiente de validación allí.
