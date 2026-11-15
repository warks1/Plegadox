# R66 · Referencias CAD de plegadora y muestreo temporal de topes

El datum de ejes admite tanto la clave histórica v85-xxxxxxxx como la
clave de perfil real machine-xxxxxxxx. Las importaciones requieren igualdad
exacta con la configuración activa, incluyendo tipo de plegadora y cotas.
Se repara el filtro de nombres .json del importador, que estaba escapado
incorrectamente y rechazaba los ficheros de calibración.

Las plantillas de ejes y de datum incluyen el ID de la plegadora seleccionada
en su nombre y JSON. No aportan signos, límites CNC ni homologaciones.
Se amplía la cobertura discreta del recorrido del dedo para muestrear
36-44% (retroceso condicional) y 84-99% (reubicación al siguiente golpe)
sin alterar el número total de puntos ni el orden manual de la pieza.

La geometría de la máquina, los amarres y recorridos siguen siendo
provisionales hasta cotejarlos con CAD OEM y medidas reales, y ninguna
alerta 2D equivale a certificación física de ausencia de colisiones.
