# Plegadox — revisión del vídeo real, 30 de octubre de 2026

**Archivo analizado:** ScreenRecording_10-30-2026 17-31-00_1.mp4  
**Duración:** 103,475 segundos · 512 × 1108 px · 30 FPS · vídeo H.264 y audio AAC.  
**Estado de revisión:** fotogramas del vídeo examinados a lo largo de toda la grabación. **No se obtuvo una transcripción fiable de la narración**; por eso este informe distingue los defectos visibles de cualquier instrucción oral que no pudo comprobarse con precisión.

## Seguimiento visual de la grabación

| Tiempo aproximado | Qué se ve | Resultado |
|---|---|---|
| 00–12 s | Interfaz de Plegadox abierta en un smartphone. Ampliación y desplazamiento de la zona de máquina, con punzón y matriz V16. | Identificar medidas y solapamiento de mandos sobre el visor. |
| 13–20 s | Secuencia de plegado visible y controles de reproducción. | Comprobar que cada golpe responde al orden, sin mostrar la omega terminada desde el principio. |
| 21–29 s | Comienzo del plegado; durante el **segundo golpe de −90°** la chapa dibujada atraviesa visualmente la V o el cuerpo de matriz. | Defecto de presentación física y posicionamiento. |
| 30–60 s | Continúa la reproducción por operaciones 3 y 4, reiniciándose la secuencia. | Garantizar continuidad de reproducción y que los pliegues previos permanezcan en el desarrollo acumulado de la pieza. |
| 63–76 s | Desplazamiento hasta biblioteca de herramientas; selección por tipo y referencia. | Accesibilidad y legibilidad en móvil. |
| 77–101 s | Se observan punzones rectos **88°, 30° y 60° prácticamente idénticos** en la biblioteca, con fichas etiquetadas como paramétricas. Alternancia de punzones y matrices. | Sustituir siluetas genéricas por perfiles diferenciados según ángulo y apertura de V. |

## Correcciones aplicadas al código

1. **Presentación del pliegue negativo:** `presentedForMachine()` distingue la dirección local del plano de la presentación de la chapa cuando se usa un punzón que baja desde arriba. La pieza final mantiene el **−90° real**. En la escena de máquina se representa la **presentación volteada** de manera ilustrativa; no se afirma haber calculado la trayectoria completa de retirada y volteo.
2. **Formación contra la matriz:** se ha sincronizado el contacto visual entre punta de punzón y chapa durante la fase de conformado, en lugar de comenzar a animar el ángulo con la punta aún separada del centro de trabajo.
3. **Punzones no idénticos:** `tool-profiles.js` construye la transición de la punta a partir de la trigonometría del ángulo **incluido**, diferencia geometrías de 30°, 60° y 88° y alimenta tanto las miniaturas como el visor orbital y el punzón representado en la máquina.
4. **Matrices diferentes:** `sectionDie()` calcula la profundidad de V a partir de la apertura y del ángulo incluido: por ejemplo, V6/30° es visualmente diferente de V6/88°.
5. **Inspector orbital de herramientas:** el visor 3D puede abrirse en una ventana grande para ratón o pantalla táctil, con zoom, referencia, datos conocidos y advertencia de perfil provisional. El botón de cierre y la tecla Escape permiten salir.
6. **Visibilidad de la operación:** se elimina el indicador circular naranja que estaba dibujado encima del punto donde la chapa contacta con la matriz. El ángulo se sigue mostrando en el panel de control.

## Verificaciones añadidas

- **Pruebas de motor:** signos positivos y negativos, continuidad de la pieza desde chapa plana, geometrías distintas 30/60/88, profundidad de V, orientación de presentación de pieza.
- **Pruebas en navegador:** reproducción del segundo golpe negativo, miniaturas no idénticas, inspección 3D giratoria y ampliada, pantallas PC y móvil.
- **Regresión general:** pantallas responsive y demás módulos existentes.

## Límites pendientes — no presentarlos como resueltos

- El **volteo físico real** entre operaciones sigue necesitando trayectorias 3D de entrada, retirada, giro y posicionamiento, con topes y herramientas acotadas.
- Los modelos de catálogo continúan siendo **paramétricos provisionales**, no perfiles CAD oficiales exactos. Las cotas específicas no presentes en el catálogo general MECOS deben verificarse con fichas técnicas de cada referencia antes de construir colisiones industriales.
- No hay cálculo certificado de toneladas, fuerza de contacto, deformación plástica, recuperación ni colisiones completas de máquina.
- Este informe **no sustituye la revisión literal del audio**, porque no fue posible obtener una transcripción fiable. No atribuir al usuario indicaciones que no estén documentadas.

**Software nuevo: Plegadox.** No se modifica Plegar Pro Plus.
