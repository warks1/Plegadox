# PlegadoX R36 — Investigación técnica y evaluación CAD/CNC

Fecha: 14/11/2026. Máquina configurada: Trumpf TrumaBend V85 (2006), control Cybelec, según cotas y vídeos facilitados por el usuario.

## 1. Fuentes técnicas contrastadas

| Fuente | Documentación | Consecuencia para PlegadoX |
|---|---|---|
| TRUMPF | Manual de utillaje 2024: https://www.trumpf.com/filestorage/TRUMPF_Master/Products/Services/Bending_tools/Manuals/TRUMPF-bending-tools-manual-EN.pdf | La selección depende del método, espesor, radio, herramienta, sujeción, geometría y límites. No confundir punta con H total. |
| TRUMPF | Catálogo de útiles 2025: https://www.trumpf.com/filestorage/TRUMPF_Master/Products/Services/01_brochures/TRUMPF-bending-tools-catalog-EN.pdf | Mantener por REFERENCIA fabricante, capacidad kN/m, longitud, H, R y V, sin convertir dibujos generales en CAD con precisión ficticia. |
| MECOS / TECNOSTAMP | Catálogo de 168 páginas Ed. 23/2025: https://ieferia.interempresas.net/FeriaVirtual/Catalogos_y_documentos/352/CATALOGO-TECNOSTAMP-2025-ED.-23.pdf | Fichas de geometría acotada de familias AMADA/Promecam, TRUMPF, WILA y BYSTRONIC. No todas las caras, contornos y radios de transición se deducen sólo del alto/ángulo; una figura PDF no es un DXF certificado. |
| Delem | Profile‑T: https://delem.com/en/solutions/offline-software/profile-t/profile-t | Programación y comprobación del orden 2D/3D, dedos, adaptadores, perfiles DXF y modelos 3D de pieza. |
| LVD | CADMAN‑B: https://www.lvdgroup.com/en/software/cadman-v8/cadman-b | Deducción basada en herramientas y materiales, con base de datos de calibración. |
| Metalix | MBend: https://www.metalix.net/product/mbend/ | Secuencia optimizada, posicionamiento automático de topes, retracción y control manual. |
| Haas | Manual de ejes de plegadora, revisión 07/2026: https://legacy-aem.haascnc.com/content/haascnc/en/service/online-manuals/haas-press-brake---operator-s--service-manual/hpb---introduction.html | Separar Y1/Y2 (trancha), X (profundidad), R (altura de tope), Z1/Z2 (dedos transversales). Estos nombres NO proporcionan los límites de una V85 concreta. |
| Cincinnati | EM-499 gage allowance: https://wwwassets.e-ci.com/PDF/Manuals/EM-499.pdf | La compensación de galga depende de dimensiones y radio; el ajuste real exige primera pieza y medición. |
| ISO | ISO 6909:2026: https://www.iso.org/standard/83403.html | Norma de seguridad específica para plegadoras, publicada 2026-05. Dice expresamente que no es aplicable retroactivamente a máquinas anteriores a su publicación. Puede orientar revisiones; no certifica este software ni la V85 de 2006. |

### Ejemplo concreto de catálogo técnico
TECNOSTAMP 11.820 aparece en la sección AMADA–PROMECAM (página impresa 15) con **85°, R0,60 mm, H115 mm y 20 t/m**. Estas cuatro magnitudes respaldan su referencia nominal, **no todos los vértices del cuello, agarre, redondeos y caras**. No añadir automáticamente como herramienta físicamente disponible de taller. Para incorporarla como CAD confiable falta perfil de ingeniería acotado en unidades y coordenadas correctas.

## 2. Datos V85 recuperados (no pedir otra vez)

Cotas documentadas por el usuario a partir de fotos Cybelec:
- Trancha L1–L10: 1340, 28, 2, 25,4, 20, 30, 125, 20, 39, 28 mm.
- Mesa L1–L7: 820, 80, 25,25, 25,25, 50, 20, 20 mm.
- Stop L1–L6: 70, 100, 18, 25, 12, 0 mm.
- Support L1–L6: 70, 100, 8, 25, 12, 8 mm.
- Anchura registrada de trancha/portaherramientas: 2040 mm. Distancia de herramienta: 30 mm.

Estas L* son cotas del dibujo de control; no son recorridos Y/X/R/Z ni un sistema de coordenadas OEM completo. Fichas comerciales de otras variantes V85 no se cargan como valores medidos de la máquina del usuario.

## 3. Cambios implementados

- `machine-cad.js`: se pueden incorporar DXF ASCII cerrados en milímetros de trancha, mesa, Stop y Support, con origen X/Y y ocupación transversal Z declarados. Conserva procedencia y marca **industrialVerified=false**.
- `tool-dxf.js`: perímetros mayores permitidos EXCLUSIVAMENTE al importar CAD de máquina; herramientas ordinarias conservan sus máximos y protección frente a contornos abiertos/autointersecados.
- `volume-engine.js`: cuando existe CAD del componente sustituye su envolvente provisional; corregido error de colocar la trancha por debajo del punzón al restar H: el perfil del punzón crece de punta `Y=0` a cabeza `Y=H`.
- `machine-axis-motion.js`: lectura de programa/registro de Y1/Y2/X/R/Z1/Z2; validación de límites y velocidades declarados, interpolación de poses, detección de violaciones, vínculo de pieza+herramientas+orden; sin valores inventados.
- `volume-trajectory-review.js` y `integrated-bend-planner.js`: muestran componentes CAD utilizados/pendientes y advertencias de la traza de ejes; no recomiendan una variante que incumpla los límites registrados.
- `index.html` y `machine-cad-ui.js`: controles de carga/retirada CAD y una plantilla de posiciones/limitaciones de ejes en **Máquina**. Todo el procesamiento es local.
- No se borra ninguna pieza, se conserva el modo manual y el backup original.

## 4. Qué NO se puede afirmar

**No se ha obtenido CAD original OEM completo de la V85 ni todos los perfiles originales del catálogo particular del usuario.** El catálogo general MECOS anteriormente referenciado sólo enumera familias; la edición técnica 2025 encontrada ahora aporta más dibujos de referencia pero no identifica por sí sola el conjunto realmente montado, sus amarres ni su referencia X/Y/Z.

**No existe todavía un algoritmo de movimiento continuo CNC certificado**: la malla de chapa es un modelo de espesor extruido y el chequeo de las trayectorias usa muestras discretas. El importador CAD admite secciones cerradas DXF 2D, no sólidos STEP OEM completos ni todos sus huecos/componentes. Las trazas de ejes se validan contra límites; si existen perfiles CAD, una correspondencia calibrada de signos y datum, y poses que declaren chapa inmóvil, se proyectan los movimientos en sólidos 2,5D. Sigue sin existir una cinemática OEM completa, inclinación 3D de Y1/Y2, el segundo dedo ni deformación real.

Para avanzar a certificación de colisiones operativas se necesitan, sin inventar números:
1. Sólidos reales de punzón, matriz, sujeciones, trancha, mesa, bastidor y dedos y cotas de montaje registradas al mismo origen.
2. Límites y referencias reales Y1/Y2/X/R/Z1/Z2; ancho y posición física de dedos; tool stations, segmentos, solapes y zonas prohibidas.
3. Plan detallado de manipulación: retirada, giro/volteo, alimentación y contacto real de chapa, con deformación y radio compensados.
4. Pruebas industriales con piezas patrón y cálculos de distancias/tolerancias contra medidas reales. **Ningún botón del programa autoriza producción automática.**

## 5. Pruebas
`tests/machine-cad-motion-r36.test.mjs` comprueba el DXF y su datum, el Z, la posición de trancha, la trazabilidad, los límites/speeds Y1/Y2/X/R/Z1/Z2, la detección de infracciones y la desvinculación de trazas al cambiar pieza. Las pruebas existentes R35 deben seguir sin cambios.


## 6. Mejoras adicionales: volumen barrido y vinculación de ejes

Referencia sobre comportamiento industrial esperado: Metalix documenta que MBend muestra movimientos físicos de los dedos entre golpes y también los volteos y rotaciones de la pieza, no únicamente su posición final: https://www.metalix.net/products/mbend/simulating-bends/

- `swept-volume.js` detecta penetraciones EN EL INTERVALO que no aparecen en sus extremos: para un prisma de sección constante trasladado sin giro y con Z constante, su volumen barrido es el perímetro extruido por el desplazamiento más la sección inicial. Contrasta esas superficies usando intersección de polígonos; no confundirlo con CNC continuo.
- `volume-trajectory-review.js`: usa ese cálculo si dos cuerpos mantienen EXACTAMENTE su sección y Z en las poses adyacentes. Si la chapa se dobla, gira, cambia su sección o se desplaza en Z, el intervalo queda pendiente y se muestra aviso AABB conservador.
- `machine-axis-geometry.js`: acepta `signs` (+1 o -1) para Y, X, R, Z1 y Z2, `activeFinger`, `referenceSceneTime`, `ramTiltTolerance` y `machineConfigKey` de la V85. No se fabrican ceros CNC. Las poses de la traza pueden indicar `sceneTime` (tiempo en el visor), que es DISTINTO de `time` (segundos del CNC). Únicamente cuando dos poses consecutivas declaran el mismo `sceneTime` referenciado se considera chapa inmóvil para ese intervalo.
- En esos intervalos se desplazan la trancha y el punzón con el desplazamiento medio Y1/Y2, condicionado a no variar su desnivel más que la tolerancia indicada; el dedo seleccionado se desplaza con X, R y Z1 o Z2. Se comparan ram/chapa, gauge/chapa, gauge/mesa, ram/mesa, ram/gauge, etc. El segundo dedo se documenta expresamente como pendiente.
- La auditoría de taller y el planificador distinguen choques del visor, choques del recorrido calibrado y límites de ejes superados, sin proponer como solución automática un candidato con colisión modelada detectada.
- En la pantalla **Máquina** hay una plantilla JSON para los ejes y otra plantilla JSON para la correspondencia CAD. Los campos de signo y referencia no tienen valores prefabricados. La copia integral incluye geometrías CAD, trazas y datum, con detección de conflictos/rollback y compatibilidad con proyectos anteriores.
- Pruebas: `tests/swept-volume-r36.test.mjs`, `tests/calibrated-axis-cad-r36.test.mjs`, `tests/backup-machine-cad-r36.test.mjs`. Hay casos para choque intermedio, movimiento relativo, separación Z, Y1/Y2 inclinado, cambio de pieza, corrupción del backup y preservación de datos históricos.

### Ejemplo de contrato para el operario

Primero se importan los perfiles CAD y las cotas de ocupación Z. Después se importa una traza que declare `time` en segundos y `sceneTime` de su estado de chapa en cada pose. Finalmente se importa una calibración de sentidos de eje, dedo activo y referencia temporal asociada a la versión de configuración V85.

Si no se conoce la relación de coordenadas, **no puede ponerse +1 arbitrariamente para todos los ejes**. Una coincidencia geométrica obtenida con signos inventados es inválida.

### Límites que siguen abiertos

No se garantiza la detección de contacto tangente (penetración de volumen cero), radios/deformación de chapa bajo esfuerzo, movimientos no lineales entre poses CNC, agarre/manipulación, inclinación Y1/Y2 a lo largo de la trancha, segundo dedo, interferencia con bastidor y sujeciones, ni utillajes segmentados no registrados. Un barrido condicionado del visor o de ejes no equivale a una certificación de colisiones ni puede ejecutarse como programa de seguridad de máquina.
