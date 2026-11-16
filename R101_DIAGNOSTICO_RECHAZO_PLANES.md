# R101 · 16/11/2026 · Explicar por qué un plan se descarta

Al comparar automáticamente herramientas y orden de plegado, la salida
«no hay plan válido» mezclaba dos circunstancias diferentes:
1. No existe referencia de apoyo nominal del tope en sección 2D.
2. El apoyo existe, pero aparecen otras penetraciones o límites
   de útiles/máquina.

R101 conserva los bloqueos de R100 y añade:
- Estado `SIN_APOYO_NOMINAL_2D_VIABLE` cuando ninguna alternativa
  automática evaluada tiene apoyo nominal 2D observado.
- `rejectionSummary` cuantifica alternativas sin contacto,
  referencias inválidas, penetraciones con el tope y con los útiles.
- El resumen se calcula sobre alternativas automáticas, NO sobre el
  programa manual, que permanece consultable independientemente.
- La pantalla indica la causa real del rechazo e invita a revisar
  la cara frontal, el ala de referencia y STOP/SUPPORT.
- Tres pruebas específicas verifican rechazo por falta de contacto,
  por penetración de herramienta y por referencia interior inválida.

La geometría OEM de la máquina, la cinemática real X/R/Z y el
recorrido continuo de los útiles siguen sin estar certificados.
No se modifica ninguna pieza ni se emiten instrucciones CNC.
