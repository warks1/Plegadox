# PlegadoX R137 · pantalla nativa Android sin recuadro blanco

**Fecha:** 17/11/2026 · **Versión:** 0.9.111 · **Base:** R136.

## Problema observado en la Galaxy

El usuario adjuntó una fotografía de su tablet Samsung con el **arranque nativo de Android** (fondo oscuro, símbolo PlegadoX pequeño sobre fondo blanco y texto «PlegadoX · Taller de plegado») ANTES de que aparezca la pantalla HTML premium seleccionada.

La pantalla inicial **no** la dibuja el motor de plegado ni el iframe del boceto elegido. Android/Chrome puede mostrar una pantalla de inicio generada a partir del `manifest.webmanifest` mientras arranca la WebAPK/PWA instalada.

## Causa en el repositorio

El manifiesto anterior declaraba `icon-premium-512.png` con `"purpose": "any maskable"`. Ese PNG era el icono de marca normal, con las esquinas transparentes/contorno redondeado. Un icono para máscara adaptable Android no debe asumir esquinas opacas ni confiar en que el sistema no rellene su fondo de blanco.

La fotografía no permite demostrar qué política exacta de máscara empleó esa versión de Android; el manifiesto sí contenía una declaración incorrecta para un recurso de esquinas transparentes.

## Corrección

1. **`icon-android-maskable.svg`**: nuevo recurso *solo para Android*, vectorial, con un rectángulo **opaco a sangre #060c16**. Reutiliza el símbolo premium original de `favicon.svg` (P cromada, curva azul, matriz V) y lo coloca con margen para la zona segura de iconos adaptables. No duplica el marco rectangular redondeado dentro de una segunda máscara Android.
2. **`manifest.webmanifest`**:
   - `name` y `short_name`: **PlegadoX** (sin subtítulo largo durante el arranque del sistema);
   - `background_color` y `theme_color`: `#060c16`, en continuidad con `splash-foto-premium.html`;
   - PNG premium de 192 y 512 px con `purpose: any`, para iconos normales;
   - SVG nuevo con `purpose: maskable`, sin mezclar los dos modos en el PNG de esquinas transparentes;
   - se **conservan** `start_url`, `scope`, `display: standalone` y la URL del manifiesto para no romper instalaciones existentes.
3. **`index.html`**: `theme-color` igual al fondo oscuro; se conserva íntegra la pantalla de carga premium en `splash-foto-premium.html` y su imagen `plegadox-premium-selected.png`.
4. **`sw.js`**: añade el nuevo SVG al precache, con versión `plegadox-static-0.9.111-safe-sw-r137`. El cache antiguo se elimina de forma habitual sin limpiar las piezas guardadas.
5. **iPhone/iPad**: no se toca el icono `icon-premium-180.png` ni el diseño seleccionado.

## Cómo comprobarlo en Galaxy después del despliegue

La PWA nueva puede cargar antes que Android actualice su icono de WebAPK. Abrir la app actual y pulsar **Actualizar PlegadoX** para renovar archivos web. Si el arranque **nativo** sigue mostrando el logo anterior, actualizar la WebAPK desde Chrome (`about://webapks` cuando esté disponible); como último recurso, hacer copia de seguridad de las piezas y reinstalarla desde Chrome. **Desinstalar sin copia puede borrar datos locales**. No se debe prometer que el icono nativo cambiará inmediatamente con un simple refresco de página.

## Límites y pruebas

- `tests/pwa-android-maskable-r137.test.mjs`: metadatos y compatibilidad de iconos, fondo, marca premium intacta, versión y precache.
- `tests/pwa-android-maskable-r137-browser-smoke.mjs`: Chromium con perfil Galaxy: carga SVG, rasteriza en canvas, comprueba alfa 255 en esquinas y colores oscuros, confirma que existen el dibujo metálico azul, el iframe y la imagen de carga seleccionada.
- Las pruebas de navegador **no ejecutan una WebAPK real de Android**. Verifican el recurso que Chrome recibe y el manifiesto, pero la experiencia del splash del sistema puede variar con la versión Samsung/Chrome.

**Fuentes técnicas:**
- https://web.dev/articles/add-manifest/
- https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps/How_to/Define_app_icons
- https://web.dev/articles/manifest-updates

El sistema operativo sigue mostrando una etapa inicial de arranque: la mejora elimina la causa del **fondo blanco en la máscara del icono**, no la capacidad de Android de enseñar su propio splash antes de nuestro HTML.
