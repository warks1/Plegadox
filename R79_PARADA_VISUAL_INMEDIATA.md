# R79 · Interrupción de diagnóstico reflejada sin retrasos

## Incidencia reproducida
El workflow "Verificar Plegadox" de la build R78 terminó con fallo en
`tests/punch-guard-smoke.mjs`: el estado interno `sim.blocked` indicaba
una penetración 2D con el punzón, pero el rótulo `#simStatus` aún decía
«Plegado» al capturarlo inmediatamente después.

## Cambios
- Al activar la pausa **opcional** ante penetración 2D, actualizar
  `#simStatus` y `#collisionDetails` en el **mismo frame** en que
  `sim.blocked` pasa a estar activo. El refresco periódico de 250 ms
  sigue usándose durante la animación normal, sin mostrar un estado obsoleto.
- Mantener resaltado el aviso si `sim.blocked` está activo, incluso
  cuando las otras comprobaciones no produzcan otra advertencia.
- Ampliar el test Playwright en PC y móvil para comprobar texto y clase visual
  inmediatamente después del cambio de estado.

No se cambia el modo continuo por defecto. La pausa es diagnóstica, y ni
la señal ni el recorrido 2D constituyen seguridad CNC ni validación de
colisiones tridimensional.
