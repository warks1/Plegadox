# R65 · Reproducción fluida y pruebas de interfaz

Corregidas dos suposiciones obsoletas de los tests de navegador: los lados del ejemplo Omega son automáticos, no posiciones manuales por defecto; y un details HTML con atributo open presente devuelve el texto vacío, que no debe confundirse con cerrado. El usuario conserva la posibilidad de elegir cada lado manualmente.

Durante Play la sección 2D se pinta aproximadamente a 15 FPS, la vista 3D a 10 FPS y el estado a 4 FPS; el reloj y los botones funcionan independientemente. La edición de piezas sigue repintando todo de inmediato. El control diagnóstico de pausa ante penetración conserva un paso más conservador. También se corrige el DO duplicado en el logotipo de la cabecera.

PlegadoX no dispone de certificación de seguridad ni de trayectorias CNC verificadas, y los perfiles de tope/utillaje pendientes de CAD real continúan etiquetados como provisionales.
