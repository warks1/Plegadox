# PlegadoX: instalación en Windows, iPhone/iPad y Android

## Windows 10/11, 64 bits: instalar desde un pendrive

1. En el repositorio [PlegadoX](https://github.com/warks1/Plegadox), abre **Actions** → **Compilar PlegadoX portátil USB para Windows**. Selecciona una ejecución con resultado verde.
2. Descarga el artifact **PlegadoX-Instalador-Windows**. Extrae el ZIP que entrega GitHub Actions y copia `PlegadoX-Instalador-Windows.exe` al pendrive.
3. En el PC, ejecuta el instalador desde el USB y sigue los pasos. Se instala para el usuario actual (no necesita permisos de administrador), crea un acceso en el menú Inicio y permite crear uno en el escritorio.
4. Abre PlegadoX desde el menú Inicio. El lanzador inicia el servidor privado en `127.0.0.1:8765` y abre el navegador. Mantén abierta la pequeña ventana mientras trabajas.
5. Al terminar, cierra la ventana de PlegadoX. No retires el pendrive durante la instalación.

**Copias de seguridad en el Windows instalado:** se guardan al exportar desde el software en `%LOCALAPPDATA%\\PlegadoX\\MIS_PROYECTOS`, fuera de `%LOCALAPPDATA%\\Programs\\PlegadoX`. Los proyectos guardados sólo en el navegador de otro PC no se trasladan automáticamente: usa **copia completa / restaurar**.

## Windows sin instalación: portátil desde pendrive

En la misma ejecución, descarga **PlegadoX-USB-Windows**, extrae el contenido completo al USB (no sólo el EXE) y abre `PlegadoX.exe`. Las copias completas generadas desde esta edición van en `MIS_PROYECTOS` dentro del mismo pendrive. Es útil para distintos ordenadores. Cada navegador conserva su propia memoria local.

## iPhone y iPad: instalar la aplicación web

1. Abre con **Safari** la dirección HTTPS publicada de PlegadoX.
2. Pulsa **Compartir** → **Añadir a pantalla de inicio**. Activa **Abrir como app** si aparece y confirma.
3. Entra desde el icono de PlegadoX. Tras una primera carga conectada, dispone de recursos para abrirse también sin conexión.

Esta instalación es una **PWA**, no un paquete `.ipa` ni una app que ya esté en App Store.

## Samsung y otros Android: instalar la aplicación web

1. Abre PlegadoX desde **Google Chrome**.
2. Pulsa **⋮** → **Instalar aplicación**, o **Añadir a pantalla de inicio** cuando esa sea la opción disponible.
3. Abre desde el icono creado. En dispositivos Samsung/Chrome puede mostrarse primero un splash nativo de Android/WebAPK, antes de la pantalla premium interna.

Esta instalación es una **PWA**, no un APK/AAB publicado ya en Google Play.

## Publicación futura en tiendas

**App Store (iOS):** crear un proyecto compatible con Xcode (nativo o híbrido con funciones adecuadas), configurar identificador de paquete, firma Apple, permisos, política de privacidad, pruebas con TestFlight y revisión en App Store Connect. Una web dentro de un simple contenedor puede no superar la revisión de funcionalidad mínima de Apple.

**Google Play (Android):** utilizar aplicación Android propia o una Trusted Web Activity construida con Bubblewrap/PWABuilder, generar un AAB firmado, verificar Digital Asset Links y tramitar revisión en Play Console. La asociación exige controlar `/.well-known/assetlinks.json` en el origen HTTPS (la raíz del dominio, no sólo una subcarpeta de GitHub Pages). Es necesario disponer de cuenta Play Console.

## Avisos y seguridad

- Los EXE todavía no están firmados digitalmente. Windows puede mostrar advertencias sobre software sin reputación; no desactives protecciones del sistema.
- En cada ejecución se genera `SHA256SUMS.txt` para comprobar los paquetes. El hash asegura integridad respecto a esa descarga, no sustituye una firma de editor.
- Antes de actualizar, desinstalar o cambiar de equipo, exporta una copia completa y comprueba que pueda restaurarse.
- La simulación de colisiones del plegado sigue siendo orientativa: no certifica que una secuencia sea segura para una máquina real.

Consultar [final release checklist](./FINAL_RELEASE_CHECKLIST.md) y [R142](./R142_DISTRIBUCION_WINDOWS_IOS_ANDROID.md).
