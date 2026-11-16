# R99 · 16/11/2026 · Causa específica del aviso naranja

Tras la corrección R98, las 564 pruebas del motor pasaron y el informe
de regresión de la Omega con orden 1-2-4-3 mostró apoyo inicial correcto
en los cuatro golpes; en G2 se planificó retirada preventiva.

Problema adicional: la tarjeta 3D mostraba «REVISAR APOYO / HOLGURA»
para diferentes incidencias, y un rótulo de movimiento podía tapar
el motivo real de un aviso naranja.

Cambios R99:
- `gaugeRiskStatus` adjunta códigos de causa:
  `apoyo-invalido`, `comprobacion-incompleta`, `holgura-actual`,
  `interferencia-actual`, `retirada-no-fiable` y `penetracion-actual`.
- El indicador de la cabina 3D distingue apoyo incorrecto, geometría
  insuficiente, holgura actual y retirada no fiable.
- Una incidencia actual prevalece sobre la sublínea de movimiento del dedo;
  el rojo por penetración mantiene prioridad.
- El diagnóstico JSON exporta el código y el pronóstico de retirada.
- Se añade `tests/gauge-amber-diagnostics-r99.test.mjs` con comprobación
  de la Omega y mensajes del semáforo.
- Se versiona R99 / 0.9.73 con caché PWA propia.

La validación es de geometría 2D del simulador; no autoriza recorridos
CNC ni sustituye el CAD volumétrico documentado de la máquina.
No se cambian longitudes, orden, cinemática del punzón ni ejes del tope.
