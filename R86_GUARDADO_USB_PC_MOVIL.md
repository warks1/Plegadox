# PlegadoX R86 · Prueba integral del guardado USB y tamaño de las copias

- El paquete USB de Windows sigue compilándose con PyInstaller e incluye toda la aplicación.
- La API local guarda JSON de backup completo en formato compacto, manteniendo el límite de 4 MB coherente con la importación en el otro PC.
- Rechaza guardar un archivo temporal que, después de la serialización del servidor, exceda el máximo; nunca lo publica como backup terminado.
- Un nuevo test de Playwright, ejecutado en la batería «datos» en PC y iPhone, simula la API local para comprobar que el botón solo aparece en modo USB, que no guarda sin pulsación, que envía el proyecto completo con token y que confirma el fichero físico devuelto por el servidor.
- Cuando la API local no existe, el botón permanece oculto: la aplicación pública no puede escribir en el disco del usuario.
- Se mantienen las pruebas reales del servidor Windows (token, origen, tamaño, esquema y creación del archivo).

La copia no se carga ni sincroniza automáticamente al cambiar de PC. El usuario debe seleccionar «Restaurar proyecto completo». La comprobación 2D/3D de plegado continúa siendo orientativa.
