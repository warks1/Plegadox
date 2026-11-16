# R98 · 16/11/2026 · Semáforo de topes según pose actual

Origen: vídeo grabado el 16/11/2026, con algunos pliegues en naranja
aunque no aparece contacto entre el tope y la chapa.

Diagnóstico: R97 mezclaba la interferencia en la pose actual y el plan
de penetraciones futuras con el tope HIPOTÉTICAMENTE inmóvil. El plan
puede programar un retroceso previo al plegado. Su `enabled` y sus
`clearanceWarnings` NO deben colorear de naranja una pose libre.

R98 diferencia:
- Verde: contacto inicial válido y pose 2D actual sin interferencia.
- Naranja: apoyo inválido, geometría insuficiente, holgura actual
  o penetración futura sin retirada fiable.
- Rojo: penetración actual del perfil 2D.
- La tarjeta distingue «RETIRADA PREVISTA · 2D» y «HOLGURA FUTURA»
  del riesgo de choque mostrado.

Se conservan selección manual de apoyo, orden 1-2-4-3, trayectoria
del tope, punzón y matriz. No equivale a validación física 3D de CNC.
Pruebas: gauge-risk-false-amber-r98.test.mjs y expectativas R83/R93.
