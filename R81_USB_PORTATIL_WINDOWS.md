# PlegadoX R81 · Edición portátil USB Windows

Se incorpora una compilación independiente de Windows (GitHub Actions,
workflow "Compilar PlegadoX portátil USB para Windows").

- El artefacto de Actions es un ZIP llamado PlegadoX-USB-Windows.
- Dentro está la carpeta PlegadoX-USB-Windows con:
  - PlegadoX.exe, un launcher creado con PyInstaller que incluye Python.
  - app/, el software web completo sin servicios externos.
  - INSTRUCCIONES.txt y MIS_PROYECTOS/LEEME.txt.
- Al ejecutar el EXE, abre http://127.0.0.1:8765/ en el navegador
  predeterminado del PC; no es necesario instalar Node ni Python.
- Sólo atiende conexiones locales y permite cerrar el servidor
  con su propia ventana; no escribe en el sistema ni necesita
  privilegios de administrador para funcionar en un PC estándar.
- El icono del ejecutable usa icon-premium-512.png.
- Los proyectos guardados en el navegador de cada PC no son,
  por defecto, portátiles: usar copia integral/exportar e importar
  en el nuevo PC. La carpeta MIS_PROYECTOS es para esas copias.
- Windows no permite fiarse de un autoarranque desde una memoria
  USB convencional; el inicio es por doble clic en PlegadoX.exe.
- El EXE compilado no está firmado digitalmente: su distribución
  comercial requerirá firmar, probar y documentar la versión.

Esta edición no implica certificación de seguridad CNC/colisiones.
