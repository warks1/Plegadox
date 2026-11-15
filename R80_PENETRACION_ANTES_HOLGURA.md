# R80 · Prioridad de penetración sobre holgura en topes

## Fallo identificado
El inspector `inspectGaugeProfile` devolvía la **primera advertencia** encontrada,
aunque fuese sólo una falta de holgura por espesor. En una chapa con varios
tramos, una penetración posterior contra el cuerpo del tope podía quedar
sin notificar, por lo que el planificador de retirada R76 no la vería.

## Corrección
- Analizar **todos** los tramos de chapa y conservar la primera advertencia
  de holgura sólo como resultado subsidiario.
- Devolver inmediatamente la **penetración** cuando el eje central atraviesa
  el sólido 2D, incluso si antes hubo una holgura en otro tramo.
- Añadir pruebas directas del inspector y del planificador con una pieza
  de dos tramos: el primero roza por arriba; el segundo entra dentro
  del perfil del dedo.
- Mantener en las piezas sin penetración la regla R76: ninguna retirada
  automática por una holgura aislada.

La comprobación sigue siendo un cribado geométrico 2D y NO valida
trayectorias de ejes ni interferencias 3D; no sirve para aprobar
una secuencia CNC sin datos OEM calibrados y verificación física.
