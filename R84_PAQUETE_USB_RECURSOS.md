# PlegadoX R84 · Auditoría de recursos del pendrive

- La versión USB mantiene el PlegadoX completo y el ejecutable probado en Windows.
- La compilación incluye un auditor sin dependencias externas (`portable/verify_bundle.py`) que examina la carpeta `dist/PlegadoX-USB-Windows/app` REAL después de copiar los archivos.
- Valida las 65+ referencias offline del service worker, `build-info.json`, el splash original aprobado con su imagen, los vínculos locales de HTML, archivos importados de JavaScript, recursos CSS e iconos del manifiesto.
- Si falta un recurso, si su ruta sale fuera del paquete o si la versión de caché no coincide, detiene la compilación antes de publicar el ZIP.
- `PlegadoX.exe --self-test` abre su servidor HTTP local y verifica por HTTP todos los recursos de `APP_FILES`, además de la portada y metadatos; es una prueba del ejecutable compilado en Windows.
- Los datos siguen guardándose en el navegador de cada PC, no automáticamente en el USB. Exportar copias integrales para transportar proyectos y útiles.
- No se certifican trayectorias CNC ni seguridad industrial mediante pruebas de interfaz.
