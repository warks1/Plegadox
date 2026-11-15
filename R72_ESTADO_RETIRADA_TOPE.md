# R72 · Decisión de retirada visible

Al seleccionar un golpe, el visor indica si el tope debe MANTENERSE,
RETIRARSE (sugerencia de colisión 2D), si la decisión es INDETERMINADA,
o si se debe CORREGIR EL APOYO inicial antes de una retirada.

El mismo `technicalScene.gaugePlan` que dirige la trayectoria alimenta
el texto y `data-retraction`. Se añade una comprobación de navegador de
las cuatro alternativas, con cambios de herramientas y stop en PC/móvil.
No se introduce retroceso por defecto ni se modifica el orden manual.

El resultado es provisional: no se valida cinemática real X/R/Z,
contacto volumétrico CAD, útiles OEM ni seguridad industrial.
