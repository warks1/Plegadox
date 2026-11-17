# R142 · distribución de PlegadoX en Windows, iOS y Android

**17/11/2026 · v0.9.116 · R142**

## Entregables Windows
`PlegadoX-USB-Windows.zip`: programa portable que usa `PlegadoX.exe` y `app/` desde un USB. `PlegadoX-Instalador-Windows.exe`: instalador Inno Setup por usuario para Windows 10/11 x64 con menú Inicio, escritorio opcional y desinstalador. Ambos usan el MISMO HTML, CSS y motores JS.

La compilación de Windows en GitHub Actions comprueba launcher Python, activos completos del USB, ejecutable `--self-test`, compilación de instalador, instalación silenciosa, prueba del EXE instalado, desinstalación y hashes SHA256.

En portátil, las copias generadas van a `MIS_PROYECTOS` junto al EXE. En instalado, se almacenan en `%LOCALAPPDATA%\\PlegadoX\\MIS_PROYECTOS`, fuera del directorio de instalación para evitar pérdidas durante actualizaciones y desinstalaciones. Los datos localStorage de un navegador no se transfieren automáticamente entre equipos.

Los EXE aún carecen de firma Authenticode; una advertencia SmartScreen no se soluciona desactivando seguridad, sino firmando y distribuyendo archivos de origen verificable.

## PWA para teléfonos y tablets
Las PWA actuales permiten **Añadir a pantalla de inicio** desde Safari en iOS/iPadOS y **Instalar aplicación** desde Chrome en Android. El icono y splash de Android del sistema no se controlan por JS de la PWA.

Una publicación **nativa** requiere builds firmadas, controles de privacidad y revisiones de Apple/Google. iOS: preparar proyecto para Xcode, equipo de firma, TestFlight y App Store Connect. Android: construir AAB con TWA/Bubblewrap u otro contenedor con funcionalidad adecuada y verificar Digital Asset Links desde la raíz del dominio. Ningún IPA/AAB nativo ni publicación de tiendas forma parte de esta revisión.

## Riesgos pendientes
La geometría es orientativa, CAD OEM y recorridos físicos aún incompletos, sin autorización de producción CNC ni garantía de ausencia de colisiones. No hemos certificado una Samsung física. Véase [FINAL_RELEASE_CHECKLIST.md](./FINAL_RELEASE_CHECKLIST.md).

Esta revisión es **candidata de distribución funcional** para talleres de prueba, no etiqueta final industrial certificada.
