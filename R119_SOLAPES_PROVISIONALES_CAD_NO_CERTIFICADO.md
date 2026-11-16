# PlegadoX R119 · Solapes provisionales separados de interferencias modeladas con CAD

**16 de noviembre de 2026 · versión 0.9.93 · rama `main`**

## Problema físico abordado

Cuando se desconoce la posición Z o la anchura real de un dedo de tope, `volume-engine.js` genera una envolvente **conservadora** que ocupa toda la anchura de la chapa. Asimismo la trancha y mesa usan siluetas esquemáticas si falta su CAD. Un solape de una de estas envolventes NO demuestra que dos sólidos reales colisionen: el perfil y la distribución Z del componente podrían evitarlo.

Antes, esos solapes se clasificaban igual que una intersección sobre un CAD importado, provocando contadores de «interferencia modelada» que transmitían una certeza excesiva.

## Cambios efectuados

1. **`volume-engine.js`:** inspección de chapa contra ram/bed/gauge/amarres: `solape-envolvente-provisional` cuando la geometría es ilustrativa, `interferencia-envolvente` cuando el sólido procede de un CAD declarado/importado. Los contactos normales chapa/punzón/matriz siguen siendo una categoría independiente. Un CAD importado sigue SIN certificar montaje ni ejecución.
2. **`volume-trajectory-review.js`:** los barridos lineales con cuerpo provisional se registran como `solape-barrido-provisional`, sin atribuirles `penetracion-barrido-lineal-modelado`. Se conservan contadores independientes `provisionalMachineWarnings`, `provisionalRamWarnings`, `provisionalBedWarnings`, `provisionalGaugeWarnings` y `provisionalByKind`. Las pruebas de barrido siguen comprobando Z y las posiciones intermedias.
3. La selección del evento más grave por cuerpo/golpe no elimina los solapes provisionales coincidentes ni los instantes de geometría inválida. Se preservan `provisionalKinds` y `unresolvedFindingsCount`, incluidos los fotogramas previos a una penetración modelada.
4. **`planner-evidence-integrity.js`:** reconcilia ambos diagnósticos sin sumar el solape provisional a `modeledMachineWarnings`. El resumen físico lo describe en **datos incompletos** como «Solape con envolvente provisional sin CAD OEM», no en `collisions`.
5. **`integrated-bend-planner.js`:** sigue **bloqueando** la recomendación automática si el candidato contiene un solape provisional, precisamente por prudencia. Distingue el motivo del bloqueo de una interferencia sobre CAD declarado. Mantiene la elección de secuencia y útiles MANUAL.
6. **`app.js`:** información al operario con contadores diferentes para interferencia de trancha en CAD declarado y solapes contra envolventes sin CAD real de trancha, mesa y tope. No los llama una colisión física demostrada.

## Pruebas nuevas y regresiones

- `tests/provisional-volume-risk-r119.test.mjs`: cinco pruebas de volumen de trancha esquemática, CAD de ensayo, tope en Z desconocida, conservación de incertidumbre por muestra y prohibición de recomendar alternativas con riesgos provisionales.
- Se actualizan pruebas sintéticas de barrido geométrico y geometría indeterminada para distinguir un sólido sin CAD y contar las poses afectadas.
- Resultado del CI después de esas pruebas: **749/749 aprobadas, 0 fallos**.

**Importante:** «provisional» no significa «seguro». Es una interferencia *posible* por geometría desconocida y permanece bloqueante para la recomendación automática. Un «sin interferencia detectada» tampoco demuestra ausencia de colisión física.

## Pendiente para una validación industrial real

Faltan la posición Z y longitud reales del Stop 1/Support 2, perfiles OEM DXF/STEP y datums de montaje verificados de punzones, matrices, trancha, mesa y amarres, así como la cinemática CNC Y1/Y2/X/R/Z1/Z2, radios reales, tolerancias y fases de giro/deformación. **No hay autorización de fabricación por el planificador** sin validación específica sobre el equipamiento instalado.

Próxima inspección prioritaria: repetir la omega en los golpes 2 y 4 con captura de contacto frontal, retirar físicamente el tope según su carrera posible, comprobar el acceso de la trancha y registrar la configuración exacta de cada dedo.
