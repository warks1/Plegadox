# R89 · Semáforo de tope según referencia física y calidad de comprobación

La ausencia de un choque en una comprobación parcial NO basta para mostrar verde.

- **Verde:** análisis de la sección 2D reconocido como válido, sin interferencia prevista y referencia de apoyo adecuada.
- **Naranja:** punto interior, ala de apoyo sin extremo libre, tope sin cara utilizable, asiento frontal incorrecto durante preparación, datos geométricos ausentes, necesidad de retirada o riesgo residual.
- **Rojo:** penetración geométrica detectada actualmente. No se afirma que sea inevitable si se cambia la herramienta, presentación o secuencia.
- El análisis del apoyo frontal se realiza durante **Posicionamiento/Aproximación**; no se exige mantener contacto cuando la chapa se retira en Retorno.
- Cabina y sección técnica comparten el evaluador `gaugeRiskStatus`. No se modifica la secuencia manual 1-2-4-3 ni la cinemática del punzón.
- Pruebas R89 comprueban referencias inválidas, geometría insuficiente, prioridad roja y fases reales de la Omega.

**Alcance:** simulador geométrico 2D, no verificación de máquina ni autorización para ejecutar CNC. Los CAD OEM y recorridos físicos de V85/Bystronic siguen siendo necesarios.

Los rótulos «TOPE» de la sección (móvil y escritorio) y el contorno del punto de contacto en cabina heredan también el semáforo; no permanecen verdes cuando el indicador principal es naranja o rojo.
