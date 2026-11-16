# R100 · 16/11/2026 · Planificador: apoyo real antes de valorar herramientas

En R99, el comparador conjunto penalizaba penetraciones geométricas de
chapa, punzón, matriz y tope, pero no bloqueaba una variante si el
cribado del tope NO observaba contacto frontal. Esa candidata podía
superar a una referencia físicamente presentable por tener menos avisos.
También agrupaba las holguras con las penetraciones en la puntuación.

Cambios de R100:
- `stopProblems` distingue **penetraciones**, **referencias inválidas**,
  **holguras**, y **falta de contacto observado**.
- El planificador descarta automáticamente una variante con falta de
  contacto o referencia inválida; en igualdad de geometría se prioriza
  una que tenga apoyo válido en el modelo 2D.
- La holgura 2D permanece advertida, pero no se convierte por sí sola
  en penetración confirmada.
- La interfaz informa de los apoyos no observados, las referencias
  inválidas y las holguras del tope al describir el plan.
- La pieza del usuario, el orden manual 1-2-4-3, los signos de ángulos
  y la selección manual de herramientas no se cambian.
- Tests: `tests/integrated-gauge-contact-r100.test.mjs` comprueba
  opciones sin apoyo, referencias inválidas, holguras y falta general
  de opciones presentables.

Alcance: confirmación NOMINAL de contacto en sección 2D; no garantiza
apoyo o acceso físico real en V85, Bystronic ni en otra máquina.
Siguen pendientes CAD OEM, cinemática completa X/R/Z, amarres,
recorridos continuos y ensayo de taller. No aprobar para CNC.
