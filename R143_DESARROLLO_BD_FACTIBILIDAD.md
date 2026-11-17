# PlegadoX R143 · evitar planos de desarrollo inviables

**17/11/2026 · v0.9.117**

## Corrección
El desarrollo con fórmula de BA/BD podía ser numéricamente finito y, aun así, dejar algún tramo de ala negativo tras descontar la BD de dos pliegues vecinos. La nueva propiedad `flatSegments` reparte BA o BD por mitades entre alas contiguas, tal como hace el plano desarrollado, e identifica tramos no positivos en `invalidFlangeIndexes`.

`flatPatternFeasible` exige longitud total positiva, tramos por ala positivos y BA/BD finitos. Un patrón inviable genera un error descriptivo en `flatBendLayout`; el botón exportar DXF se bloquea en la interfaz existente, sin alterar valores de probeta ni propiedades de la pieza. El comparador V lo indica, pero mantiene la elección manual de útil.

## Verificación
`tests/development-feasibility-r143.test.mjs`: Omega estándar, deducción real imposible, pliegue extremo y cotas neutras. La fórmula para piezas factibles no cambia.

## Límites
**Factible matemáticamente no significa seguro físicamente.** Persisten las incertidumbres de CNC, CAD OEM, recuperación, tolerancias y colisiones de máquina. R143 sigue siendo candidato funcional, no certificación industrial.
