# PlegadoX R140 · fin de carga protegido ante imágenes lentas

**17/11/2026 · R140 · v0.9.114**

La R139 corrigió que el iframe mostrara su barra antes de la fotografía. Quedaba un caso: los módulos podían cargarse más deprisa que la imagen, con lo que `finishSplash()` eliminaba la pantalla antes de que se hubieran pintado juntos la foto y el progreso.

Se añade `waitForSplashVisual()` para esperar carga y decodificación del PNG premium antes de ejecutar el 100% y cerrar la pantalla. La espera es por evento (sin progreso simulado) y tiene un límite de seis segundos si el PNG no responde, sin bloquear el acceso a la app offline.

**Verificación:** `tests/splash-delay-r140.test.mjs` y `tests/splash-delay-r140-browser-smoke.mjs`. Este último fuerza descargas lentas en tamaños Galaxy, iPhone y tablet horizontal y comprueba que no aparezca la barra aislada ni se cierre el splash sin foto. Está integrado en la matriz de GitHub Actions, grupo `inicio`, con capturas para diagnóstico.

No modifica el boceto original, la geometría, los datos de las piezas ni el splash nativo de Android (que es externo a la página web). La prueba Chromium no equivale a una prueba física de la WebAPK Samsung.
