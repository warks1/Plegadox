# PlegadoX R126 · rendimiento Galaxy y trazabilidad del tope
Fecha: 17/11/2026 · Versión: 0.9.100

## Mejoras comprobables
- Los sólidos y su triangulación se calculan de nuevo únicamente si cambia la referencia de la pieza, el tiempo de la simulación, el límite de caras o si se invalida la escena por cambio de máquina, CAD o pieza. El giro táctil y el zoom reutilizan los mismos vértices.
- El visor exige coincidencia **exacta** del programa Y1/Y2/X/R/Z1/Z2 con la clave de pieza y el identificador de máquina activa, y de la calibración de ejes con la configuración geométrica. Si alguna clave difiere, las trazas no aparecen. La ausencia de una línea no implica ausencia de riesgo.
- Se muestra en el panel de opciones la causa del semáforo del tope durante la pose actual. El texto se calcula con el motor de riesgo 2D existente y conserva rojo real si se detectó penetración geométrica en 2D; naranja no es sinónimo de penetración.
- Si el dedo no tiene perfil DXF colocado con Z aportada, el visor usa provisoriamente toda la anchura de la chapa para dibujar el volumen, indicando claramente que un solape aparente no demuestra choque 3D.
- No se modifican el solver de contacto, las distancias de retirada, el orden de plegado ni las alarmas actuales, que requieren más evidencia para cambios en producción.

## Importador CAD DXF recuperado
- Se ha corregido una expresión regular con doble barra invertida que rechazaba **todos** los nombres de archivos locales `.dxf` y `.zip`. El importador ya reconoce los ficheros DXF ASCII y ZIP admitidos.
- Un DXF declarado en pulgadas deja de presentar una opción ambigua de selección de contorno: permanece bloqueado con el motivo real de unidades no milimétricas. La geometría fuera del plano XY también sigue rechazada.
- Prueba con Chromium sobre archivo punzón/matriz válido, persistencia y rechazo de pulgadas/no plano: `tests/tool-dxf-browser-smoke.mjs`.
- Enlaces oficiales nuevos: [Eurostamp 1015 pata de cabra 88° R3 H88,5](https://eurostampsrl.it/en/10556/punches-88/1015-punch-88) y [Eurostamp 1063 recto 88° R0,8 H104,65](https://eurostampsrl.it/en/9775/punches-88-amada/1063-punches-88), con los DXF públicos `1015.dxf` y `1063.dxf` catalogados **como pendientes de descargar, revisar y colocar**. No son sólidos de máquina montados ni pruebas de amarre.

## Validación
- `tests/machine-solids-r126.test.mjs`: caché, invalidación, procedencia de ejes y semáforo.
- `tests/machine-volume-r126-browser-smoke.mjs`: vista Chrome Galaxy simulada. Verifica que rotar no vuelve a generar malla, pero cambiar la operación o máquina sí.
- CI de navegador y `npm test`. Los resultados están en GitHub Actions.

## CAD real y CNC: pendientes obligatorios
Esta revisión no certifica colisiones ni convierte las longitudes L1…Ln en perfiles OEM reales. Aún hay que aportar perfiles completos de trancha/mesa y amarres, posiciones reales de Stop/Support en Z, topes mecánicos de los ejes, punto cero de X/R/Y1/Y2/Z1/Z2, geometrías 3D de útiles y registros CNC completos de la unidad montada. Verificaciones del usuario y personal cualificado antes de fabricar.
