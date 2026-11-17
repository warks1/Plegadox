# CAD y rendimiento · R126 · 17 de noviembre de 2026

## Resultado tangible

49 URLs directas examinadas: 47 archivos descargados (47 DXF, algunos contenidos en ZIP); dos respuestas 403 de SOCLAM. `cad-downloads/manifest.json` conserva URL de ficha, URL de descarga, tamaño y SHA-256 del original. `cad-downloads/audit.json` conserva el resultado del importador para cada fichero. Los enlaces están en Máquina → Archivos CAD descargados.

Cinco contornos se leen completos directamente. Otros 42 necesitan seleccionar capa o circuito con el importador existente; no se elige automáticamente una silueta entre varias. Ningún archivo se marca como montado ni verificado físicamente. Los originales permanecen sin modificaciones y se cargan sólo bajo demanda.

## Fuentes nuevas y alternativas investigadas

| Fuente | Contenido observado | Aplicación y límite |
|---|---|---|
| https://www.ukb-gmbh.de/en/14164.html | UKB 14.164, sistema Bystronic, punzón H250, 85°, R1; DXF ZIP descargado | Referencia concreta; no equivale al punzón instalado |
| https://www.ukb-gmbh.de/en/60920.html | UKB 60.920, adaptador inferior Amada → Trumpf/Wila/Bystronic, H60; DXF ZIP descargado | Sentido de adaptación explícito; NO asumir que sea la regleta del usuario |
| https://www.wilatooling.com/products/press-brake-tool-holders/ | Familias de amarres; descargas mediante correo/MyWILA | No se enviaron mensajes ni se descargó un amarre de la unidad |
| https://argesystems.com/en/project/back-gauges-2/ | Sistemas de topes M1–M8 y fichas de ejes | Referencia de otro fabricante, no CAD del dedo Trumpf/Bystronic |
| https://bystronic-mediacenter.picturepark.com/v/a7szE377/ | Manual BySoft CAM: BackStopModels, BendingMachines, VrModels | Documenta dónde existen modelos de sistema; no proporciona el conjunto de esta máquina |
| https://grabcad.com/library/hydraulic-press-brake-1 | Modelo comunitario referenciado públicamente | Acceso 403; contenido binario y licencia no comprobados; no importado |
| https://www.stlfinder.com/model/hydraulic-press-brake/8359827 | Índice comunitario de una prensa de 60 t, autor Kanhaiya Jha; STEP/IGES anunciado | Máquina distinta; candidato visual, no geometría física de V85 |
| https://marathon-os.com/library/press-brake-fixture-standard-mechanical-681debcc3b7ab9fcc5d83abc | Útil de plegado genérico en STEP anunciado por el proveedor | No identificado como parte de V85/Bystronic; no incorporado a colisiones |
| https://www.cnstamp.net/bystronic-type/index_3.html | Fabricante alternativo anuncia soporte DXF/DWG/STEP/IGES | No se encontró descarga directa del conjunto de máquina |
| https://vanthanbk.com/sheet-metal-press-brake-tool-sources | Proyecto de terceros describe perfiles OEM y aproximaciones propias | Pista de investigación, no se adoptan sus equivalencias como CAD exacto |

También se buscaron combinaciones de TrumaBend V85 / TruBend / Bystronic / STEP / CAD / backgauge en motores web y repositorios comunitarios. No se localizó un ensamblaje completo descargable y contrastado de las dos unidades. Esto no prueba que no exista en otro archivo o proveedor.

## Qué falta para el objetivo volumétrico

Sólidos o secciones y segmentación Z de trancha, mesa, mordazas, regleta/adaptadores y dedos exactos; identidad de variante y montaje; origen y sentido de los ejes; límites, velocidades y trazas comprobadas. Los DXF de útiles son secciones 2D, no un ensamblaje STEP ni una trayectoria física. Un perfil extruido sólo representa geometría constante a lo largo de la longitud declarada. No se convierte un modelo comunitario genérico en OEM mediante cambiar el nombre.

## Rendimiento

La comparación automática de útiles/secuencias se ejecutaba síncronamente en el hilo de interfaz después de un setTimeout. Se mueve a un Worker aislado con copia de catálogos, configuración CAD/ejes y máquina activa; conserva los mismos límites y cálculos. Cada edición cancela el worker anterior y descarta resultados obsoletos. No existe fallback síncrono que vuelva a bloquear. Límite de 45 segundos con mensaje de error; el orden manual permanece.

Modo SOFTWARE → Rendimiento gráfico → Ligero · tablet: ratio de píxel máximo 1, máquina cada 100 ms, pieza 3D cada 200 ms y rótulos cada 400 ms. Automático lo selecciona cuando el navegador informa ≤4 GB de memoria o ≤4 hilos. Calidad conserva el presupuesto previo. Las comprobaciones geométricas no se reducen. Los eventos de cambio de tamaño se agrupan en un único repintado por frame.

Validación: 796 pruebas unitarias superadas, incluida equivalencia real entre cálculo aislado en worker y cálculo original, cancelación de respuestas obsoletas y selección del presupuesto gráfico. No se ha medido el rendimiento en la Samsung real ni verificado visualmente en este entorno; Chromium local no puede arrancar. Los cambios no constituyen una máquina volumétrica completa ni recorridos físicamente certificados.
