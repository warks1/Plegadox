# PlegadoX · R113 · Contraste nominal DXF y restablecimiento de regresiones

**16/11/2026 · v0.9.87 · rama `main`**

## Qué cambia en el producto

1. `tool-cad-oem-audit.js` contrasta la **altura real medida** del contorno DXF con la altura de la referencia OEM seleccionada. La diferencia máxima de importación es de **0,5 mm**.
2. Compara **ángulo nominal (±0,1°)** y **V nominal o diámetro de punta (±0,05 mm)** con el valor introducido por el operador. **Estos tres datos son declarados, no medidos automáticamente del contorno.**
3. `tool-import-ui.js` conserva la ficha seleccionada durante la importación, recalcula ante cambios y desactiva guardar si hay cotas claramente incompatibles. La comprobación se repite dentro del propio manejador del botón Guardar.
4. Registra `cadSourceReference`, `cadSourcePage`, `cadNominalReviewStatus` y `cadNominalChecks` al incorporar una referencia preseleccionada, pero nunca `manufacturerVerified:true`. Los DXF sin ficha siguen admitidos para examen local, **no para certificación**.
5. La nueva biblioteca de evidencia registra **28 fichas** y **22 enlaces directos DXF/ZIP**; se añade **UKB 25.202**, matriz de **84°, V8, H100, R de entrada 0,8**, 1000 kN/m de carga máxima declarada. El ZIP oficial está enlazado, **no descargado ni inspeccionado**.

Referencia fabricante: <https://www.ukb-gmbh.de/en/25202.html>
Archivo OEM anunciado: <https://daten.ukb-gmbh.de/dxf/zip/25202.DXF.zip>

## Por qué el estado de CAD sigue pendiente

- La coincidencia nominal puede alertar de una referencia errónea; **no autentica el fichero** ni verifica la integridad del perfil, el amarre, la orientación, el plano de referencia, la longitud efectiva en Z o las modificaciones del útil real.
- La representación de cuerpo 2,5D por sección extruida no reproduce toda la geometría volumétrica ni el giro/deformación continuo de la chapa.
- Faltan archivos CAD OEM concretos y cotas medidas de la **TrumaBend V85** y de la **Bystronic 100T 3100**, incluyendo trancha, mesa, regletas, mordazas, adaptadores, topes 1/2 y apoyos.
- Falta calibración y contraste de las trayectorias **Y1/Y2/X/R/Z1/Z2** para cada máquina; un resultado sin avisos no constituye autorización CNC.

**Estatus industrial**: `verified:false` y `canApproveForMachine:false` donde corresponda. No fabricar basándose exclusivamente en esta simulación.

## Pruebas y recuperación de CI

- Nueva batería de **9 casos** para `tool-cad-oem-audit.js`: discrepancias de altura, V, ángulo, diámetro de punta; procedencia y no certificación; ausencia de ficha y cotas parciales.
- Nuevo caso de procedencia de **UKB 25.202**.
- Se corrigió la versión de la caché offline en `build-info.json` para que coincidiera exactamente con `sw.js`, evitando fallos de actualización PWA.
- La ejecución de CI del commit `f98c1924` fue **707/707 correcta**: <https://github.com/warks1/Plegadox/actions/runs/43909540298>.
- Las **13 regresiones de prueba heredadas** de R112 se trataron sin quitar barreras físicas del software. En ensayos de planificador con evaluadores de chapa, útiles y volumen simulados ahora también se simula explícitamente el evaluador de fases críticas; de otro modo el motor real podía rechazar con razón una opción durante la prueba sintética. Otras aserciones se corrigieron para comprobar el **resalte conservador real del visor de trancha**, penetración volumétrica realmente interior y mensajes precisos de alerta del tope.
- Las pruebas del motor físico **siguen siendo geométricas/modeladas**, no reemplazan ensayos con utillaje ni máquina OEM.

## Siguiente trabajo priorizado

1. Capturar los DXF/STEP **reales** por fabricante, referencia y versión de montaje; enlazar las cotas de plano con el polígono importado y rechazar contradicciones.
2. Confirmar datum **superior del punzón, asiento inferior de la matriz y Z de segmentos**, incluidos punzones de pata de cabra asimétricos y matrices reversibles.
3. Incorporar geometría de trancha, mesa, brazos y dedos de tope y comprobar sus **volúmenes recorridos**; nunca declarar ausencia de colisión si faltan estos cuerpos.
4. Validar en ejemplos existentes (incluida omega) y nuevas piezas el **orden automático y manual**, con avisos **verde/naranja/rojo** derivados de hechos geométricos, no supuestos.
5. Revalidar la colocación real de topes en 2D y 3D, tiempos de retroceso y barrido de punzón durante cada carrera, sin doble pisado ficticio.

**Nota**: de momento no se ha importado desde Internet un archivo OEM binario a la biblioteca del usuario, ni se ha realizado una homologación de seguridad industrial.
