# PlegadoX · R115 · Incertidumbre física separada de colisiones

**16/11/2026 · v0.9.89 · rama main**

## Error lógico corregido
El resumen de `scanVolumeTrajectory()` contabilizaba cualquier incidencia de la trancha/mesa/topes dentro de `modeledMachineWarnings`. Incluía indebidamente hallazgos con severidad `intervalo-barrido-no-resuelto` o `geometria-invalida`, pese a que estos hallazgos NO acreditan una intersección volumétrica. El planificador podía tratarlos como choque.

## Solución R115
- `volume-trajectory-review.js` da prioridad a `interferencia-envolvente` y `penetracion-barrido-lineal-modelado` cuando varias incidencias del mismo cuerpo y operación compiten; no deja que una primera geometría inválida o un intervalo incierto oculten una penetración modelada posterior.
- Sólo incidencias de **interferencia modelada** se incorporan a `byKind` para cuerpos de máquina y a `modeledMachineWarnings`. Los contactos de punzón y matriz permanecen en su categoría separada, sin declarar de forma automática un choque de trancha.
- Las incidencias `intervalo-barrido-no-resuelto` o `geometria-invalida` se informan en `unresolvedGeometryFindings` y en el resumen de incertidumbres, sin presentarlas como colisiones confirmadas.
- `planner-evidence-integrity.js` propaga la incertidumbre al diagnóstico físico de la alternativa: **pendiente de comprobar**, no «libre», pero tampoco «colisión» inventada.
- La interfaz mantiene los semáforos y el orden manual existentes. Este cambio no anula ninguna colisión realmente modelada.

## Ensayos
`tests/volume-uncertainty-r115.test.mjs` añade 5 casos:
1. Barrido sin resolver: 0 colisiones de trancha, incertidumbre retenida.
2. Geometría inválida de amarre: no es una penetración.
3. Penetración de trancha posterior: prevalece sobre primera geometría incompleta.
4. Contacto posible de punzón: distinto de choque de trancha.
5. Barrido lineal de tope con penetración modelada: prevalece sobre aviso de AABB incierto.

La batería completa tras incorporar estos casos dio **728/728 pruebas correctas**. La versión se publica como **R115 / 0.9.89** y el `build-info.json` coincide con la caché PWA.

## No es certificación industrial
- Una envolvente 2,5D con intersección es una **interferencia modelada**, no necesariamente choque real de la máquina sin CAD OEM acotado.
- La ausencia de penetración en esos barridos NO certifica el recorrido CNC completo.
- Continúa pendiente contrastar sección, Z, amarres, mesa, trancha, topes, herramientas y velocidades/trayectorias reales Y1/Y2/X/R/Z1/Z2 de cada plegadora, además del movimiento continuo y giro/volteo de la chapa.
- El usuario puede cambiar el orden manualmente. No ejecutar el programa en producción sólo porque el planificador recomiende un orden.

## Siguiente comprobación útil
En una omega real, contrastar cada aviso naranja y rojo de las fases P1/P2/P3/P4 con vídeo, posición del dedo y referencias de tope, y verificar si se trata de colisión del cuerpo, apoyo incorrecto o simplemente tramo temporal sin datos. Completar CAD físico por referencia y registrar pruebas de banco de toda la maniobra.
