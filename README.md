# Plegadox — control y simulador de plegado

## Estado actual · R134 (v0.9.108) · 17 de noviembre de 2026

- **Intervalos CNC más informativos:** el barrido 2,5D calcula una ventana aproximada de la **primera penetración modelada** entre dos poses de ejes, sin atribuir el cruce al tramo entero ni inventar un instante de choque físico.
- **Sin perder incidencias por rendimiento:** hasta 12 ventanas refinadas por informe (máximo diez subdivisiones cada una); el resto de los eventos conservan la advertencia con la marca temporal pendiente. Se permiten límites configurables.
- **En Galaxy y PC:** Máquina → Recorridos físicos de ejes → Diagnóstico CAD/CNC muestra los intervalos del modelo y permite exportar JSON con la incertidumbre explícita.
- **Build:** PLEGADOX-20261117-R134 · 0.9.108 · [Informe R134](./R134_INICIO_PENETRACION_CNC.md). No certifica OEM/CNC, colisiones físicas ni primer contacto.



## Estado actual · R133 (v0.9.107) · 17 de noviembre de 2026

- **Matriz de interferencias física sin duplicados:** comprueba el conjunto superior contra todo el inferior, más cada dedo Stop/Support, con 29 combinaciones de dedo común o 39 para Z1/Z2 independientes. Los amarres montados sobre el mismo conjunto requieren comprobación estática distinta.
- **Huecos visibles:** si falta un DXF o un perfil montado, el diagnóstico identifica qué pareja no puede comprobar y no interpreta esa ausencia como «sin colisiones».
- **Amarres WILA/Promecam:** el catálogo advierte si se necesitaría adaptador superior, regleta inferior o geometría de amarre aún no contrastada. No propone equivalencias físicas por marca.
- **Inventario de dedos:** Z1+Z2 separados cubren Stop/Support sin requerir un perfil común ficticio, pero no acreditan montaje OEM.
- **Build:** PLEGADOX-20261117-R133 · 0.9.107 · [Informe R133](./R133_MATRIZ_INTERFERENCIAS_MONTAJES_CAD.md). Sin certificación industrial ni seguridad CNC.


## Estado actual · R132 (v0.9.106) · 17 de noviembre de 2026

- **Revisión 3D más eficiente y conservadora:** un filtro AABB temporal descarta parejas completamente separadas, reduciendo triangulaciones sin suprimir las colisiones que pueden ocurrir **entre** poses del CNC.
- **Sin ocultar incertidumbre:** los cuerpos inválidos pasan al motor detallado; un AABB que se cruza no se presenta como choque. El panel de ejes muestra las parejas descartadas de forma segura.
- **Más referencias OEM:** matrices Eurostamp 3163 V16/88° y 3165 V25/88° con ficha y DXF oficial enlazado; archivos aún **no importados ni verificados**. No duplicar el 1015 ya existente.
- **Build:** PLEGADOX-20261117-R132 · 0.9.106 · [Informe técnico R132](./R132_BARRIDOS_CAD_FILTRO_EUROSTAMP.md).
- **Seguridad:** continúa siendo simulación paramétrica sin certificación OEM/CNC completa, sin celdas 3D en maniobras de giro/deformación.



## Estado actual · R131 (v0.9.105) · 17 de noviembre de 2026

- **Galaxy Chrome:** límite de resolución para evitar bitmaps 3D demasiado grandes en pantallas UHD, incluso en calidad alta. Eco: máximo 1,2 millones de píxeles; caché LRU de escenas y golpes recientes sin recalcular CAD al volver atrás.
- **Trancha Y1/Y2:** se informa el error de aproximación en mm cuando ambos cilindros no se desplazan igual respecto al datum; esos contactos se consideran **provisionales**, no intersecciones exactas de CAD.
- **Validación:** pruebas de memoria, recorrido Y1/Y2, revisión del golpe y navegador Chrome Galaxy; cálculo de colisiones independiente de la calidad gráfica.
- **Build:** PLEGADOX-20261117-R131 · 0.9.105 · informe [R131_GALAXY_MEMORIA_RAM_Y1_Y2.md](./R131_GALAXY_MEMORIA_RAM_Y1_Y2.md). Ningún informe certifica ausencia de colisiones OEM/CNC.



## Estado actual · R130 (v0.9.104) · 17 de noviembre de 2026

- **Trazas de ejes vinculadas a la pieza completa:** invalida el CNC guardado al cambiar elección Stop/Support, ala/punto de apoyo, radio o desarrollo, además de orden/útiles. Rechaza una traza de otra plegadora.
- **Avisos de colisión más fiables:** separa solapes entre dos CAD aportados, CAD contra geometría calculada y dos envolventes provisionales. Ningún nivel se declara físicamente certificado.
- **Diagnóstico exportable:** en Configuración de máquina → Recorridos físicos de ejes, visualizar los cuerpos e intervalos afectados y descargar el informe JSON de evidencias.
- **Cobertura real de CAD:** admite perfil compartido o DXF independiente Stop/Support Z1/Z2 sin exigir ambos a la vez.
- **Build:** PLEGADOX-20261117-R130 · 0.9.104 · informe [R130_TRAZAS_CNC_EVIDENCIAS.md](./R130_TRAZAS_CNC_EVIDENCIAS.md).



## Estado actual · R129 (v0.9.103) · 17 de noviembre de 2026

- **Cada dedo puede tener su propio CAD:** importar Stop Z1/Z2 o Support Z1/Z2 con sección XY, origen X/Y y fuentes documentales diferentes, o mantener un DXF compartido si son iguales.
- **Z física vinculada al DXF:** no aplicar las bandas transversales Z cuando cambie cualquiera de los archivos o montajes; no extrapolar posición fuera de la pose de referencia.
- **Sólidos y barridos:** dos cuerpos CAD individuales participan en la vista 3D, interacción con chapa/útiles/trancha y comprobación geométrica de movimientos Z1 contra Z2. Sin certificación de seguridad CNC.
- **Build:** PLEGADOX-20261117-R129 · 0.9.103 · informe [R129_CAD_DEDOS_INDEPENDIENTES.md](./R129_CAD_DEDOS_INDEPENDIENTES.md).



## Estado actual · R128 (v0.9.102) · 17 de noviembre de 2026

- **Dos dedos físicos:** permite documentar y dibujar Z1 y Z2 por separado con perfil DXF, extremos Z medidos, revisión de máquina y pose de referencia, sin extrapolar cotas faltantes.
- **Análisis transversal:** elimina la falsa envolvente completa de tope en la pose declarada; detecta por separado los cruces Z y los barridos X/R/Z1 y Z2 en fases de chapa inmóvil.
- **Garantía de integridad:** vuelve a «posición no documentada» fuera de la pose o al cambiar perfil/máquina, y conserva la visualización 2,5D y todas las alertas.
- **Build:** PLEGADOX-20261117-R128 · 0.9.102 · informe [R128_DOS_DEDOS_CAD_Z_CNC.md](./R128_DOS_DEDOS_CAD_Z_CNC.md). Sigue sin certificación CNC ni CAD STEP OEM integral.



## Estado actual · R127 (v0.9.101) · 17 de noviembre de 2026

- **Topes 3D:** rojo/naranja/verde de acuerdo con el diagnóstico, no color naranja fijo. Si falta el ancho y Z del dedo, se muestra una envolvente discontinua, no geometría OEM inventada.
- **Contraste Z:** un dedo DXF declarado fuera de la anchura transversal de la chapa no puede ofrecer apoyo ni producir penetración 3D en el mismo intervalo Z; la sección 2D original continúa visible.
- **Perspectivas:** las capas se comparten entre visor 2,5D y 3D sin ocultar alarmas de seguridad. La exportación PNG captura la vista orbital 3D efectiva.
- **Build:** PLEGADOX-20261117-R127 · 0.9.101. Informe [R127_TOPE_3D_CAPAS_CNC.md](./R127_TOPE_3D_CAPAS_CNC.md). Ni CAD OEM completo ni certificación industrial.



## Estado actual · R126 (v0.9.100) · 17 de noviembre de 2026

- **Samsung Galaxy Chrome:** caché de geometría para que orbitar/zoom no regenere cada sólido; invalida al cambiar pieza, golpe, máquina o CAD.
- **Ejes coherentes:** bloquea visualización de trazas relativas procedentes de otra pieza, máquina o datum; los recorridos CNC siguen sin estar certificados.
- **Tope y semáforo:** muestra el motivo preciso del color 2D y aclara que sin Z real del dedo un solape volumétrico provisional no demuestra colisión.
- **Importación CAD:** reparado el reconocimiento de .dxf/.zip locales y el bloqueo explicativo de DXF en pulgadas. Ficha Eurostamp 1015 cotejada y 1063 añadida con enlaces DXF; ambos archivos siguen pendientes de importar y verificar.
- **Build:** PLEGADOX-20261117-R126 · 0.9.100. Informe: [R126_GALAXY_CACHE_TOPE_CNC.md](./R126_GALAXY_CACHE_TOPE_CNC.md).



## Estado actual · R125 (v0.9.99) · 17 de noviembre de 2026

- **Samsung Galaxy / Chrome:** resolución y ritmo de dibujo adaptables; selector Automática/Económica/Equilibrada/Alta; eventos ResizeObserver redundantes reducidos.
- **Sólidos 3D orbitales:** malla de chapa, punzón, matriz, trancha, mesa y tope a partir del motor volumétrico ya disponible, sin sustituir la vista 2,5D.
- **Trazas de movimiento:** Y1/Y2/X/R/Z1/Z2 sólo si se ha introducido un programa físico y signos calibrados; los trazos son relativos, no una trayectoria CNC absoluta homologada.
- **Sin homologación:** superficies OEM, datums absolutos, recorridos reales y colisiones de máquina siguen pendientes.
- **Build:** PLEGADOX-20261117-R125 · 0.9.99. Detalles: [R125_SOLIDOS_3D_GALAXY.md](./R125_SOLIDOS_3D_GALAXY.md).



## Estado actual · R112 (v0.9.86) · 16 de noviembre de 2026

- **Formatos DXF OEM ampliados:** admite un contorno de `BLOCK/INSERT` con transformación 2D (base, traslado, giro y escala uniforme), así como aristas LWPOLYLINE de dos puntos que deben ensamblarse en un único perfil. Se rechazan reflujos, INSERT múltiple, objetos 3D y contornos no inequívocos.
- **ZIP DXF UKB directamente en el importador:** carga local de archivos `.DXF.ZIP` sin extraerlos previamente. Valida directorio, nombre local, CRC32, límite de 8 MB comprimidos / 1 MB DXF y un único perfil. Deflate requiere compatibilidad del navegador; el operador podrá extraer manualmente si no está disponible.
- **Dos matrices UKB verificadas en fichas oficiales:** 25.500 V5/30° H100 y 25.621 V6/84° H150. Inventario actualizado a **27 fuentes y 21 enlaces DXF/ZIP directos**; siguen pendientes sus binarios reales y comprobación de compatibilidad de amarre.
- **Pruebas focalizadas ejecutadas:** 13/13 para DXF BLOCK/INSERT y aristas, 8/8 del lector ZIP sintético y 10/10 de procedencia de CAD. Pruebas de integridad y geometría, **no** tests industriales con un conjunto OEM real.
- **Nueva verificación automática:** `.github/workflows/ci.yml` ejecuta `npm test` con Node 22 en GitHub Actions para cambios futuros. Todavía no hay resultado completo confirmado de esa suite.
- **Límites:** un ZIP con CRC correcto no acredita la autenticidad del fabricante; la geometría sigue sin declarar ausencia física de colisiones. Persisten faltas de CAD STEP/ensamblaje en máquina Trumpf y Bystronic, datums y recorridos X/R/Z/Y1/Y2.
- **Build:** `PLEGADOX-20261116-R112` · `0.9.86`. Informe: [R112_IMPORTACION_OEM_DXF_ZIP_Y_VALIDACION.md](./R112_IMPORTACION_OEM_DXF_ZIP_Y_VALIDACION.md).

## Estado actual · R111 (v0.9.85) · 16 de noviembre de 2026

- **CAD de útiles investigado:** 25 fuentes de procedencia y **19 enlaces DXF/ZIP oficiales** entre Eurostamp, UKB, Mate y SOCLAM. Ocho nuevas fichas UKB: punzones 85° 11.151/11.200/10.170 y matrices V30° 25.406/29.351/29.353/25.501/29.552, cada una con su referencia, ángulo, altura, radio y montaje. Los binarios OEM no están descargados ni certificados en esta versión.
- **Forma correcta de pata de cabra importada:** ahora el DXF se alinea con la punta real de trabajo, no con el centro de su caja exterior. El cambio se aplica a perfil de dibujo y a comprobaciones geométricas sin deformar contornos.
- **Matrices reversibles y dobles V:** se detectan gargantas representadas en el perfil; si hay más de una, se exige elegir la V activa. Rechazo de matrices sin garganta. Vista previa con ejes de trabajo marcados y campo opcional X para declarar la referencia.
- **Corrección de biblioteca:** se repararon vértices duplicados en CONIC GN6/GN9 y el ejemplo Beyeler R. **25 punzones + 43 matrices (68/68)** pasan validación 2D de contorno; siguen siendo perfiles provisionales si falta el DXF OEM.
- **Compatibilidad con sesiones antiguas:** el eje de DXF anteriores se corrige sólo en memoria, sin modificar backups. Un útil cuyo eje no se puede inferir sigue visible pero queda excluido de la elección automática hasta recibir datum válido; se conserva la elección manual.
- **Pruebas focalizadas:** 20 casos sobre importación y apariencia, 4 sobre migración de DXF anteriores y 10 sobre procedencia y referencias, más auditoría de 68 perfiles. No está confirmada la suite completa ni la verificación de CAD de la unidad física.
- **Release:** `PLEGADOX-20261116-R111` · `0.9.85`. Informe [R111_CAD_Y_APARIENCIA_UTILES.md](./R111_CAD_Y_APARIENCIA_UTILES.md). Siguen pendientes conjuntos CAD por número de serie y recorridos reales de ejes; no hay certificación CNC.

## Estado actual · R110 (v0.9.84) · 16 de noviembre de 2026

- **Búsqueda ampliada al montaje completo:** 17 referencias de procedencia, incluidos **11 enlaces directos a archivos DXF/ZIP oficiales** y fichas de soporte/amarre sin descarga libre. Se incorporaron UKB 22.010, 50.430 y 22.308, SOCLAM 40.06/34 y WILA TSU-024; ninguno se supone montado en una máquina hasta identificarlo físicamente.
- **Importación asistida sin mezcla de referencias:** las fichas del inventario permiten preparar el importador de punzones/matrices o el de componentes de máquina. Se descarta el DXF anterior y se reinicia el amarre desconocido en vez de heredar el de otra herramienta. Descargar el archivo original y verificar datum, escala y Z sigue siendo obligatorio.
- **Origen 3D de Bystronic:** la documentación de BySoft CAM identifica modelos de máquina, topes, útiles y VrModels 3D en sus datos de sistema, una posible vía autorizada para el CAD de unidad. Los modelos propietarios NO se han extraído ni instalado.
- **Pruebas focalizadas:** 9 verificaciones de conciliación/identidad/amarres superadas tras incorporar las nuevas fuentes; las 33 verificaciones sintéticas de integración volumétrica de R109 se mantienen. No se ha confirmado todavía `npm test` completo ni ensayos en el navegador.
- **Estado pendiente:** faltan perfiles OEM descargados de las máquinas exactas, datums X/Y/Z de instalación, recorridos físicos y validación CAD de ambos conjuntos. Ni el inventario ni las equivalencias autorizan un programa CNC de producción.
- **Build** `PLEGADOX-20261116-R110` · versión `0.9.84`. Documento: [R110_CAD_COMPONENTES_Y_ACCESO_OEM.md](./R110_CAD_COMPONENTES_Y_ACCESO_OEM.md).

## Estado actual · R109 (v0.9.83) · 16 de noviembre de 2026

- **Inventario de CAD contrastado:** once enlaces directos de descarga DXF/ZIP y dieciséis fuentes OEM documentadas de **Eurostamp, UKB, Mate y SOCLAM** con referencia, altura/ángulo/V/radio cuando hay cotas publicadas, soporte y procedencia; fuentes adicionales sobre MECOS, TRUMPF V85 y Bystronic AFM. En el editor aparece qué puede descargarse y qué falta para cada unidad, sin confundir un enlace con un perfil instalado.
- **CAD de amarres y soportes:** se han añadido UKB 22.010 (portamatriz 51,5 × 60 mm), UKB 50.430 (adaptador superior H67), matriz UKB 22.308 (V8/30°), soporte SOCLAM 40.06/34 (sin URL DXF directa verificada) y WILA TSU-024 (DXF con acceso MyWILA/correo). La interfaz permite preparar la importación exacta y limpia el amarre anterior si no corresponde. La descarga binaria real está aún pendiente.
- **Vía de CAD de máquina:** BySoft CAM documenta modelos 3D y configuraciones de topes/plegadoras en sus carpetas de datos. No se han obtenido esos modelos propietarios y su uso requiere verificar unidad y licencia.
- **Biblioteca de máquina ampliada:** `machine-cad.js` admite nueve componentes: trancha, mesa, Stop, Support, mordaza superior/inferior, adaptador superior/inferior y soporte delantero. Estos cinco nuevos componentes se añaden al motor volumétrico y al barrido de ejes **sólo al importar su DXF con coordenadas y ocupación Z**.
- **Completar cotas sin mezclar útiles:** `cad-evidence.js` coteja únicamente la misma referencia/fabricante/variante/amarre; conserva las fuentes por cota y registra conflictos en vez de promediar o inventar. Los perfiles OEM parciales o de otra máquina **no se declaran certificados**.
- **Cobertura ligada a máquina y herramienta:** los CAD guardados para una revisión de máquina distinta no cuentan. El DXF de punzón/matriz sólo cuenta en la cobertura activa cuando coincide con el ID seleccionado, no con cualquier útil importado.
- **Comprobaciones:** 9 pruebas focalizadas de fuentes/conciliación y 33 verificaciones del motor volumétrico con cuerpos sintéticos, sin discrepancias. Nuevas regresiones `tests/cad-evidence-r109.test.mjs` y `tests/machine-extended-cad-r109.test.mjs`.
- **Limitaciones:** todavía **NO** están descargados e instalados por defecto los DXF de esas once referencias ni existe un conjunto CAD OEM completo de la Trumpf V85 o de la Bystronic concreta. Faltan planos por número de serie, datums, amarres, posición real de topes y trayectorias CNC. No hay validación física ni certificación de ausencia de colisiones.
- **Build:** `PLEGADOX-20261116-R109` · `v0.9.83`. Informe de fuentes, geometrías pendientes y trazabilidad: [R109_INVENTARIO_Y_RECONCILIACION_CAD.md](./R109_INVENTARIO_Y_RECONCILIACION_CAD.md).

## Estado actual · R108 (v0.9.82) · 16 de noviembre de 2026

- **Retorno X/R inteligente:** el programa ya no impone un retorno diagonal ni un orden de ejes fijo. Compara recorridos ilustrativos **R→X** y **X→R** sobre **61 poses 2D por alternativa** y elige la ruta con menos penetraciones de chapa/dedo, después geometría incompleta y avisos de holgura; si empatan mantiene R→X.
- **Omega real de regresión:** en la pieza 60/85/120/85/60 mm con Stop/Support alternos, el movimiento R→X introducía 6 muestras de penetración 2D entre G3 y G4; X→R produjo 0. En la Omega estándar se mantiene R→X. Orden de pliegues **1–2–4–3** intacto.
- **Alarmas fiables:** si ninguna alternativa evita las penetraciones 2D, se señala **ámbar por trayectoria futura X/R no válida** una vez por operación; una penetración visible sigue **roja**. El modo manual, los ángulos y la selección de tope permanecen intactos.
- **Visibilidad y auditoría:** la vista lateral y la tarjeta 2,5D identifican el eje que se está moviendo; el JSON incluye orden elegido y recuentos de problemas por alternativa. Cambiar de cota no se anuncia como retirada preventiva por choque.
- **Regresiones:** 6 pruebas focalizadas en `tests/gauge-axial-return-r108.test.mjs`, 7 en `tests/gauge-axis-route-selection-r108.test.mjs` y 8 de R107 superadas con el código actualizado. Informe [R108_PLANIFICADOR_RECORRIDO_TOPES_XR.md](./R108_PLANIFICADOR_RECORRIDO_TOPES_XR.md).
- **Build:** `PLEGADOX-20261116-R108`, `v0.9.82`.
- **Límites:** sigue pendiente comprobar `npm test` completo, render real en dispositivos y geometría/recorridos **3D físicos** OEM X/R/Z. El cribado 2D no certifica ausencia de colisiones físicas ni autoriza un programa CNC.

## Estado actual · R107 (v0.9.81) · 16 de noviembre de 2026

- **Holgura medida, no supuesta:** el detector 2D calcula la mínima separación entre la fibra media de la chapa y cada arista del tope, el umbral geométrico e/2 y el déficit resultante. El punto y segmento de chapa y la arista correspondiente del dedo quedan identificados.
- **Aviso naranja con milímetros:** vista 2D, panel de referencia, tarjeta 2,5D, revisión por golpes y diagnóstico JSON pueden mostrar la separación real y el umbral orientativo. Una penetración real de fibra media sigue siendo roja; la mera proximidad no se llama colisión física confirmada.
- **Motor inteligente sin huecos temporales:** el pronóstico ahora inspecciona también .45, .46 y .47 del ciclo; la revisión por golpe conserva 19 instantes habituales, incluyendo .46 y .48 sin perder los de cierre y reubicación final. Antes podía pasar de .44 a .48 y ocultar avisos breves que sí mostraba la animación.
- **Omega 1→2→4→3:** comprobadas holguras puntuales en los cuatro golpes, con separaciones modeladas de aproximadamente 0,018 a 0,785 mm y umbral de 1 mm (chapa 2 mm). El barrido corregido detecta también G2 y G4; no aparecen penetraciones de fibra media en esas poses muestreadas. Las geometrías del dedo siguen siendo provisionales.
- **Sin retiro automático especulativo:** una advertencia de holgura por perfil provisional no desencadena por sí sola un movimiento CNC ni modifica la secuencia manual; `minClearanceMm` y `maxDeficitMm` se conservan para auditar decisiones.
- **Regresiones:** `tests/gauge-clearance-metrics-r107.test.mjs`. Documento técnico: [R107_HOLGURAS_TOPES_OMEGA.md](./R107_HOLGURAS_TOPES_OMEGA.md). Build `PLEGADOX-20261116-R107`, versión `0.9.81`.
- **Limitaciones:** comprobar `npm test` completo, las vistas en móvil y CAD/datos reales de dedos y recorridos X/R/Z antes de declarar ausencia física de colisiones o programar máquina.

## Estado actual · R106 (v0.9.80) · 16 de noviembre de 2026

- **Proyección compartida 2D/2,5D del dedo trasero:** una nueva función `machineGaugeProjection` transforma el mismo contorno del Stop/Support, su cara frontal, contrahuella y punto de contacto. El render de la cabina, el anillo de contacto y la tarjeta de estado utilizan esa misma proyección.
- **Sin desplazamientos visuales de la cara de parada:** la extrusión decorativa de la perspectiva desplaza únicamente el fondo del cuerpo; la cara que toca la chapa se mantiene en el plano geométrico compartido con punzón, matriz y pieza.
- **Regresiones:** `tests/gauge-2d-3d-projection-r106.test.mjs`. Se ejecutaron 205 verificaciones focalizadas sobre 24 poses de Omega con Stop/Support alternos, además de coordenadas de útiles y chapa, con 0 discrepancias en el modelo.
- **Versión:** `PLEGADOX-20261116-R106`, `v0.9.80`; caché PWA actualizada. Detalles en [R106_PROYECCION_COMUN_TOPES_2D_3D.md](./R106_PROYECCION_COMUN_TOPES_2D_3D.md).
- **Pendiente:** ejecución confirmada de toda la suite `npm test`, verificación visual en el navegador y móviles, CAD real de dedo/máquina y recorridos 3D X/R/Z. No se autoriza el plegado CNC con estos ensayos orientativos.

## Estado actual · R105 (v0.9.79) · 16 de noviembre de 2026

- **Priorizar apoyo frontal sin avisos:** si el primer canto libre válido presenta holgura, el motor prueba el otro y prefiere el canto libre limpio. Con empate conserva el primero para no voltear innecesariamente la Omega.
- **Contacto conservado en Sujeción:** mientras no comience retirada, el dedo mantiene el contacto frontal. Un retroceso preventivo legítimo deja de exigir ese contacto y no se trata automáticamente como colisión.
- **Omega completa 1→2→4→3:** prueba integrada de 16 módulos geométricos, con 110 comprobaciones focalizadas correctas y ninguna discrepancia detectada entre visor y diagnóstico de posición, colores, referencia y movimiento entre golpes. En las muestras 2D estándar G2 y G4 no penetran el dedo; G1 y G3 tienen una advertencia puntual de holgura, no de penetración.
- **Pruebas nuevas:** `tests/gauge-seat-sujecion-r105.test.mjs`, `tests/omega-gauge-reconciliation-r105.test.mjs` y ampliación de `tests/automatic-folded-gauge-r104.test.mjs`.
- **Build:** `PLEGADOX-20261116-R105` / `v0.9.79`; versión y service worker sincronizados. Informe técnico [R105_VALIDACION_OMEGA_Y_TOPES.md](./R105_VALIDACION_OMEGA_Y_TOPES.md).
- **Límites:** queda pendiente la suite completa `npm test`, las pruebas reales de interfaz en navegador/teléfono y la validación CAD OEM / ejes X/R/Z. No hay certificación industrial ni validación CNC de colisiones físicas.

## Estado actual · R104 (v0.9.78) · 16 de noviembre de 2026

- **Apoyo automático ampliado:** sólo si los cantos libres no permiten un apoyo nominal 2D válido, STOP 1 comprueba caras exteriores de pestañas **previamente plegadas**. Se exige plegado anterior terminado, cara frontal vertical, solape y ausencia de penetración 2D. **Support 2** no sustituye su repisa por una pared lateral.
- **Sin falsos contactos interiores:** un vértice interior cualquiera sigue prohibido. Las alternativas manuales conservan prioridad; no se cambian orden de pliegues, signos ni referencias del operario sin una acción explícita.
- **Aviso inteligible:** el visor, el diagnóstico JSON y los botones de búsqueda distinguen `CANTO_LIBRE_2D`, `CARA_EXTERIOR_PREPLEGADA_2D` y ausencia de apoyo. Si durante el posicionamiento no se observa contacto frontal, aparece naranja por falta de contacto, no por choque. Penetración calculada: rojo.
- **Aplicación exacta:** al aceptar una recomendación de extremo de ala se elimina la antigua cota manual de ese golpe, que de otro modo cambiaría la referencia evaluada.
- **Regresiones y limitaciones:** añadidos ensayos R104 del solver, asesor de topes, preservación del modo manual y riesgo. Comprobaciones focalizadas y sintaxis de archivos modificados superadas; **aún no está confirmado el resultado de la suite completa ni un ensayo físico de la Trumpf V85/Bystronic**.
- **Build:** `PLEGADOX-20261116-R104`, `v0.9.78`. Detalles: [R104_APOYO_CARA_PREPLEGADA.md](./R104_APOYO_CARA_PREPLEGADA.md).
- **No certificación:** faltan geometrías y movimientos OEM para validar trayectorias 3D completas, colisiones físicas o producir CNC de forma segura.

## Estado actual · R103 (v0.9.77) · 16 de noviembre de 2026

- **Diagnóstico de tope sin confundir causas:** el escáner temporal conserva por separado los avisos simultáneos de penetración, holgura y geometría de apoyo incorrecta. Una holgura 2D sin penetración no se llama choque, y una penetración real de sección sigue siendo roja.
- **Semáforo informativo en vista 3D:** el naranja diferencia `referencia-interior`, `sin-borde-libre`, `cara-tope-invalida`, `chapa-detras`, `sin-asiento`, `apoyo-invalido`, `holgura-actual`, `comprobacion-incompleta` y `retirada-no-fiable`. La tarjeta muestra una explicación breve específica.
- **Planificador inteligente:** al evaluar una operación con varios motivos de apoyo inválido, no cuenta tres etiquetas como tres golpes. La prioridad sigue siendo evitar penetraciones y exigir apoyo nominal 2D. La edición manual del orden, V, punzón y referencias no se modifica.
- **Pruebas focalizadas:** 12 verificaciones directas de las funciones actualizadas han pasado; se añaden regresiones R103 para causas concurrentes, nivel de riesgo, texto de vista y recuento. **Sigue pendiente confirmar la ejecución completa de `npm test` en GitHub Actions y probar visualmente en los dispositivos reales.**
- **Versión y caché:** compilación `PLEGADOX-20261116-R103`, versión `0.9.77`, caché PWA propia, sin borrar proyectos guardados.
- **Sin certificación industrial:** la geometría CAD OEM, datums de máquina, cinemática física X/R/Z y recorridos continuos no están validados. No emitir programas CNC ni afirmar ausencia de colisión real a partir de una pantalla verde.

## Estado actual · R102 (v0.9.76) · 16 de noviembre de 2026

- **Separación de contacto y holgura:** una falta de holgura 2D ya no convierte por sí misma un asiento nominal contra la cara frontal del tope en «sin contacto». La advertencia de holgura permanece **naranja**; una penetración calculada permanece **roja**; un contacto modelado sin interferencias puede mostrarse **verde**. Ningún color certifica la máquina.
- **Plan manual independiente:** aunque coincida en útiles, orientación y orden con una propuesta automática, se inspecciona aparte. El resumen de alternativas automáticas no cuenta el plan manual dos veces.
- **Regresiones:** pruebas de separación de plan manual, rechazo sin duplicados y semáforo del tope; pruebas existentes ajustadas a la distinción entre holgura y penetración. Se añade GitHub Actions para ejecutar `npm test` en cambios a `main` y solicitudes de cambios. **No se afirma aún que la ejecución de CI haya finalizado satisfactoriamente.**
- **PWA:** versión, compilación, interfaz y caché offline sincronizadas a `PLEGADOX-20261116-R102` y `0.9.76`. Conserva datos locales al actualizar.
- **Límite técnico:** faltan perfiles CAD OEM íntegros, datums y trayectorias reales X/R/Z; la sección muestreada 2D/2.5D no certifica ausencia de colisiones ni permite emitir instrucciones CNC.

## Estado anterior · R101 (v0.9.75) · 16 de noviembre de 2026

- El optimizador diferencia ausencia de contacto nominal del tope, referencia interior inválida y penetraciones modeladas de herramientas o topes; presenta motivos de descarte y mantiene la opción manual.

## Estado actual · R97 (v0.9.71) · 15 de noviembre de 2026

- **Diagnóstico de topes exportable:** en Auditoría técnica previa a taller → Revisión de topes por golpe hay un botón «Descargar diagnóstico de movimientos del tope (JSON)». Registra la pieza y las referencias elegidas, la máquina con sus cotas configuradas y el perfil de punzón/matriz seleccionado, las coordenadas de chapa/contacto y las transiciones a 15 tiempos por cada golpe, más penetración/holgura estimada y semáforo. No cambia la pieza ni el movimiento de la simulación. Permite contrastar vídeos con la configuración exacta sin reconstruir las decisiones manuales.
- **Offline y trazabilidad:** archivo descargable localmente desde Windows/USB y navegador, versión de compilación indicada y módulo incluido en caché PWA. El informe no es un programa CNC ni una certificación de colisiones. Las distancias X/R son coordenadas del modelo de sección 2D, no ejes calibrados en máquina.
- **Conservación de R96:** no se alteran los motores de retroceso, montaje, geometrías ni vistas 2D/3D. Backup fijo R96 disponible en GitHub.

## Estado actual · R96 (v0.9.70) · 15 de noviembre de 2026

- **Avisos del tope visibles en perspectiva:** estado verde/ámbar/rojo en tarjeta compacta de dos líneas, sin tapar el dedo ni salirse del área entre paneles en móvil o PC; se dibuja por delante de los sólidos. El diagnóstico detallado permanece en el panel correspondiente.
- **Movimientos diferenciados:** la tarjeta indica retroceso preventivo, aparcamiento durante plegado y cambio de cota del siguiente golpe sin confundirlos.
- **Conservación estricta:** ningún cambio en matriz, punzón, coordenadas X/R, referencias manuales, barrido de colisiones, retroceso, orden de pasos o representación lateral 2D. R95 permanece en la rama backup/PLEGADOX-R95-2026-11-15.
- **Validación:** pruebas unitarias y navegador PC/iPhone con capturas; no implica certificación OEM ni autorización CNC.

## Estado actual · R95 (v0.9.69) · 15 de noviembre de 2026

- **Perspectiva y tope R95:** se corrige el orden de capas de máquina: bancada detrás, matriz antes del dedo trasero, y después chapa y punzón. En la perspectiva 2.5D la matriz ya no oculta el labio frontal del STOP 1 ni del SUPPORT 2, sin modificar posiciones X/R, referencias manuales, cinemática de retroceso ni detección de colisiones. La vista lateral 2D conserva el orden anterior. Se elimina el falso doble perfil traslúcido de la corrección R94 y se actualiza el rótulo a «PERSPECTIVA 2.5D · NO CAD». Pruebas R95 en G1 automático (20 mm) y G2 manual (30 mm), PC/iPhone y capturas de pantalla.

## Estado actual · R94 (v0.9.68) · 15 de noviembre de 2026

- **Topes R94:** la referencia manual sobre el ala ya plegada permite contacto en la cara exterior del Stop 1 cuando existe solape geométrico 2D y el ala fue plegada antes. El dedo retrocede en sujeción cuando se prevé penetración futura y se mantiene retirado durante el doblado; el modo 3D (perspectiva 2.5D) marca el labio frontal cuando lo tapa el relieve de la matriz. La selección manual no se sustituye y no se declara validación OEM/CNC. Pruebas del caso G2 y cuatro golpes Omega; conservar comprobación física con las medidas reales.


- **Simulación de punzón:** un solo descenso continuo por golpe; la punta permanece alta y fija durante el giro de la chapa. La altura se calcula con la misma presentación geométrica que muestra la sección técnica, incluyendo cambios de cara y de sentido de alimentación.
- **Topes traseros (R93):** alineación de perspectiva del dedo con el plano visible de la chapa, sin alterar las coordenadas X/R ni los datos manuales. Al preverse una penetración FUTURA del ala, la vista puede mostrar la retirada del dedo durante sujeción, incluso si el apoyo inicial está sin validar; en ese caso se conserva el aviso **NO APTO PARA CNC**, ya que retirar no convierte un apoyo incorrecto en válido. La retirada no se activa por simple holgura nominal. Las geometrías reales de topes requieren todavía validación OEM.
- **Windows USB:** flujo de GitHub Actions que genera `PlegadoX.exe` sin instalación, con funcionamiento local sin internet; incorpora guardado directo de copias completas en `MIS_PROYECTOS` y restauración manual en otro equipo. La app web alojada no puede guardar directamente en un pendrive.
- **Verificación:** `npm test`, pruebas de navegador para inicio/simulación/topes/datos y compilación Windows con verificación del contenido portátil.
- **Límites:** CAD de punzones, matrices, topes y máquina y cinemática de ejes siguen siendo provisionales donde faltan geometrías y calibraciones OEM. **No es un verificador de colisiones 3D ni un programa CNC certificado para producción.**


**Proyecto nuevo e independiente**. Repositorio inicializado desde cero a partir del material proporcionado por el usuario, sin reutilizar el repositorio Plegar Pro Plus.

## Abrir Plegadox

**Web:** https://warks1.github.io/Plegadox/ (depende de la publicación de GitHub Pages).

Puedes abrir el sitio en ordenador, tablet o móvil. Funciona como aplicación web estática, sin backend y sin instalar dependencias. Se guardan los datos de la pieza en el almacenamiento local del navegador.

## Adaptación automática de pantalla (v0.4)

**Plegadox se adapta sin configuración del usuario** según el ancho y la altura reales del navegador y cambia de distribución al girar el teléfono, redimensionar una ventana o utilizar PC/tablet/móvil.

- **PC (aproximadamente 1200 px o más):** conserva el boceto 2 como cabina industrial de tres columnas, con biblioteca lateral y cinco paneles inferiores.
- **Tablet (aproximadamente 700–1199 px):** secuencia y simulación aprovechan el ancho, la biblioteca pasa a una fila inferior y los resúmenes se distribuyen en dos o tres columnas.
- **Smartphone (menos de 700 px, o paisaje de poca altura):** barra de navegación desplazable, simulación primero, secuencia horizontal, herramientas y resultados apilados. Controles táctiles de al menos ~40 px y entradas de 16 px para evitar zoom automático del teclado de Safari.
- **Giro vertical/horizontal y redimensionado:** detectados por `responsive.js`; recalcula el espacio de la simulación y del dibujo. La pieza, la herramienta seleccionada y el punto de reproducción no se reinician al rotar.
- **Accesibilidad y estabilidad:** respeta zonas seguras en móviles con muesca, preferencias de movimiento reducido, pantallas de alta densidad y zoom táctil sobre las vistas de pieza/máquina.

**QA:** `tests/responsive-smoke.mjs` comprueba 13 tamaños (desde 320 × 568 hasta 2560 × 1440), móvil horizontal, tablet en ambas orientaciones, escritorio y rotación en sesión con conservación de datos. GitHub Actions guarda capturas de cada familia de pantalla. El criterio de dispositivo es **el espacio útil**, no una lista limitada de modelos o marcas.

## Interfaz aprobada: Boceto 2 · Cabina industrial (v0.2)

![Estado](https://img.shields.io/badge/estado-demostraci%C3%B3n%20funcional-147db8)

Se implementó la disposición oscura elegida: **secuencia de plegado a la izquierda, punzón/matriz/chapa en el centro, biblioteca por fabricante a la derecha y resultados, pieza 2D y pieza 3D en la parte inferior**. Es una interfaz funcional adaptada a móvil, tablet y ordenador; no es una reproducción fotográfica exacta del boceto estático.

- **Herramientas:** selector real Trumpf / Amada / Bystronic / Genéricos, búsqueda por referencia, selección sincronizada con Programación, ficha de medidas y enlace a fuente.
- **3D de utillaje:** visor orbital de modelos paramétricos; se pueden arrastrar o ampliar con gesto táctil/rueda. No se declara equivalencia con CAD de fabricante.
- **Pliegues firmados:** +90° y −90° mantienen sentidos opuestos tanto en la pieza final como en la vista lateral de máquina. Se ha eliminado una reflexión incorrecta que convertía el signo negativo en positivo. La reorientación física entre golpes todavía no está simulada.
- **QA:** pruebas unitarias automáticas y prueba end-to-end con Chromium, capturas de escritorio y teléfono disponibles en el artefacto `plegadox-capturas` de GitHub Actions.

**Auditoría obligatoria de procedencia de utillaje:** [AUDITORIA_CATALOGO.md](./AUDITORIA_CATALOGO.md). El PDF general MECOS aportado **no contiene** el inventario completo de perfiles acotados, por lo que el catálogo cargado combina referencias parcialmente documentadas con geometrías marcadas como provisionales.

## Funcionalidades de la primera versión (v0.1)

- **Programación:** crear una pieza desde una chapa plana, editar cada longitud y cada ángulo con su signo **+90° o −90°**; botón **±** para invertir el sentido, sin necesidad del teclado de símbolos; añadir y quitar alas.
- **Orden de plegado:** modificar el orden de las operaciones sin cambiar ni la geometría final ni los signos. Ejemplo omega programado **1 → 2 → 4 → 3**.
- **Simulación 2D:** animación de cada golpe en cinco etapas (posicionamiento, aproximación, plegado, retorno, reposicionamiento), punzón móvil, matriz fija, trancha, mesa, tope y chapa que comienza recta; reproducción continua, pausa, avanzar un golpe, reiniciar y regular velocidad.
- **Progreso:** representación de la chapa con los pliegues efectuados y vista separada de la pieza final.
- **Vista 3D:** extrusión proyectada de la pieza en evolución, girable y ampliable mediante ratón o pantalla táctil.
- **Herramientas:** primeras matrices V6, V10, V12, V16, V22, V24, V32, V35, V40, V50 y punzones **genéricos parametrizados** (88°, 60°, 30°, pata de cabra). No se presentan como geometrías certificadas de fabricantes.
- **Materiales:** S235, S275, S355, inoxidable AISI 304, aluminio 5754/1050, galvanizado y zincor.
- **Desarrollo:** estimación de BA, BD, radio interior y factor K editable; dos interpretaciones iniciales de cota (exterior o fibra neutra), con advertencias de precisión.
- **Máquina:** cotas de Trumpf V85 de las fotografías, trancha de 2040 mm, mesa y topes.
- **Datos:** guardar en dispositivo, importar/exportar piezas en JSON.

## Mejoras de plegado realista (v0.9)

El modelo `bend-contact.js` coordina la visualización de la chapa en V
usando una sola escala en milímetros, **dos hombros de apoyo**, un centro
que desciende con la punta del punzón y una transición redondeada en el
vértice. En la retirada se conserva la forma plegada; la chapa se separa
de la matriz mientras el punzón vuelve a subir. Se limita la profundidad
de dibujo para no atravesar el vértice de la V representada. Ambas
vistas, **cabina industrial** y **sección técnica**, comparten las mismas
posiciones de chapa/punzón/matriz.

No es un modelo de deformación plástica FEM. El radio que se visualiza es
una aproximación paramétrica, no una curva certificada. Es necesario
contar con contornos CAD completos, contactos reales, condiciones de
sujeción y datos de material calibrados para predecir colisiones y
deformación con fiabilidad industrial.

La biblioteca también incluye la referencia de **pata de cabra
50 × 100 mm, R1**, basada en la fotografía facilitada por el usuario.
El escote ha sido trazado proporcionalmente a la imagen. Solo se tratan
como datos confirmados esas tres cotas visibles. El ángulo asignado para
la representación es orientativo y debe comprobarse antes de usar el
modelo en una comprobación real.

## Configuración Trumpf V85 y V16/30° (actualización)

El módulo **Máquina** ahora permite **editar de verdad** todos los valores de
las pantallas Cybelec **30a Dimensiones máquina 1** y
**29 Configuración topes** enviados por el usuario:
- Ancho trancha y portaútil 2040 mm, orígenes 0 mm.
- Trancha L1–L10: 1340, 28, 2, 25,40, 20, 30, 125, 20, 39, 28 mm.
- Mesa L1–L7: 820, 80, 25,25, 25,25, 50, 20, 20 mm.
- Tool-Working distance: 30 mm.
- Stop L1–L6: 70, 100, 18, 25, 12, 0 mm.
- Support L1–L6: 70, 100, 8, 25, 12, 8 mm.
- Preferred distance: 80 %, y valores de límites L6, Ox y Oz fotografiados (0 mm).

Las medidas quedan guardadas en `localStorage` y se pueden restaurar a las
fotografías o exportar como JSON. La vista técnica incluye diagramas de cotas
sin inventar perfiles CAD de la máquina. La ilustración del tope Stop en la
cabina se alimenta de las medidas configuradas. El límite de ancho empleado
para advertir de una pieza demasiado ancha se recalcula cuando se cambia la
trancha.

**V16/30° disponible:** referencia real
[Rolleri TMR100.16.30](https://www.rolleri.es/utillaje-127636/soluciones-de-plegado/utillaje/tipo-r2r3-matrices/tmr1001630),
ángulo 30°, V16, R1,6, altura total 120 mm, altura útil 100 mm,
amarre R2/R3 (compatibilidad real con Trumpf V85 NO comprobada). Además
se incluye **V16/30° · perfil de ensayo**, sin marca ni cotas externas
atribuidas. El perfil de ambos elementos sigue siendo `provisional`.

La finalidad es utilizar datos reales para avanzar hacia simulación de
colisiones, pero **todavía no existen sólidos CAD verificados de la trancha,
mesa, topes y todos los útiles**. No presentar dibujos esquemáticos como una
verificación física.

## Diagnóstico preliminar chapa-herramientas y perfiles de catálogo (v0.8)

El motor `tool-collision.js` comprueba geometrías **2D** durante los golpes:
muestrea la fibra media de chapa con su espesor nominal y comprueba si
entra en el volumen representado por la **matriz** o el **punzón**. Los
puntos sospechosos aparecen en rojo en la vista técnica (▥ mm) y un aviso
indica qué herramienta y qué tramo están implicados. Las tarjetas de golpes
también muestran advertencias cuando se detectan posibles interferencias
en las posiciones muestreadas.

**No declarar 'sin colisiones' por ausencia de aviso.** Las geometrías
de herramientas siguen siendo aproximadas salvo donde se haya importado
una poligonal completa y verificada. La chapa no modela radio plástico
real, recuperación, contacto distribuido ni los seis grados de libertad
de la pieza. Los avisos son candidatos a colisión y no certifican ni
permiten trabajar sin verificación física.

Se han añadido referencias reales del **catálogo CONIC (tipo Amada)**:
- Punzones agudos 30° ACT-09-3006 y ACT-12-3006.
- Punzones de pata de cabra GN6-12-8806 y GN9-12-8806,
  distinguiendo sus escotes nominales k6/k9.
- Matrices de 30° V006-30-S, V008-30-S, V010-30-S y V012-30-S,
  con V, R, ancho exterior B y cotas publicadas.

Fuente: [CONIC, catálogo AMADA TYPE, páginas 12–15, 20–21 y 29](https://www.conic.co.jp/es/bending/pdf/amada_sbt_tooling_202206.pdf).
**Son herramientas CONIC compatibles con el sistema tipo Amada, no
herramientas fabricadas por Amada.** Los escotes y contornos todavía
contienen transiciones paramétricas no acotadas en su totalidad, por lo
que `profileAccuracy` permanece como `provisional`. La geometría 3D
extrusionada y la vista de herramientas usan la misma poligonal que
la sección 2D, evitando que la pata de cabra se dibuje como un recto.

QA: `tests/tool-collision.test.mjs`, `tests/catalog-sourced.test.mjs`
y `tests/catalog-contact-smoke.mjs` revisan intrusiones de chapa,
referencias, perfiles y selección en PC y smartphone.

## Sección técnica a escala métrica (v0.7)

En la pantalla principal, botón **▥ mm** (en el lateral de la simulación).
Este modo permite comparar en un **mismo sistema de coordenadas milimétrico**
la chapa, el punzón y la matriz seleccionados. El perfil visible se recalcula
en función de la apertura V, ángulo incluido, altura nominal, radio/punta
del punzón, espesor, orientación y el estado de cada golpe. Dispone de regla de
20 mm y etiqueta de espesor. Funciona en escritorio, tablet y móvil y no
sustituye la vista gráfica 2.5D (botón **◈ 3D**).

**Es una vista técnica orientativa, NO un simulador industrial validado.**
Los perfiles son paramétricos mientras no estén disponibles las poligonales
CAD exactas de cada referencia. El desplazamiento durante el contacto sigue
una curva visual aproximada: no modela la curvatura elástica/plástica real,
recuperación, holgura completa, tonelaje, mesa/topes de forma verificable ni
colisiones máquina-herramienta. El programa **no certifica un plegado seguro**.

**Ancho de pieza:** el programa conserva una medida indicada aunque sea
superior a los 2040 mm de la Trumpf configurada y presenta aviso de
incompatibilidad, en vez de modificar la entrada del usuario.

### Pruebas añadidas

- Apertura de V y profundidad geométrica con el mismo sistema de milímetros.
- Perfil real de puntas angulares nominales de 15°, 30°, 60° y 88°.
- Contacto visual centrado entre la punta y la fibra media de chapa.
- Pantallas de PC, tablet y móvil en el modo de sección.
- Segundo golpe negativo y pieza plana al inicio, sin perder el orden.

## Orden de plegado tocando la pieza

En **Editar pieza → Pieza final (perfil 2D)** pulsa **Asignar orden tocando pliegues**. Los vértices se resaltan en amarillo. Toca el primero, luego el segundo y así sucesivamente hasta completar todas las operaciones; los números elegidos se muestran en azul. Al completar la secuencia, se guarda y sincroniza con el simulador. El botón permite cancelar y reiniciar la selección sin modificar la pieza.

Los ángulos y cotas no cambian al reordenar. Esta función no garantiza que el orden sea físicamente viable: debe comprobarse con herramientas reales y márgenes de seguridad.

## Inspección geométrica 2D por secuencia (v0.6)

El módulo `validation.js` recorre la **secuencia real programada**, muestrea posiciones intermedias de cada golpe y advierte si dos alas no adyacentes se cruzan o quedan separadas menos que el espesor configurado. También muestra una advertencia orientativa si la relación abertura V / espesor se aleja de una guía general.

- El panel **Comprobaciones** presenta avisos vinculados a la pieza; puede marcar operaciones con advertencias.
- El análisis **no autoriza el plegado**: no calcula presión real, deformación elasto-plástica, radios por contacto, cinemática física del volteo ni interferencias con perfiles CAD exactos de máquina, punzón, matriz o topes.
- Una pantalla sin avisos sólo significa **que no se detectaron cruces en las muestras geométricas 2D**, no que la operación sea segura.

El usuario deberá verificar físicamente todas las secuencias y herramientas antes de operar la prensa.

## Referencia de dirección de pliegue

La simulación aplica un signo matemático sobre el perfil de chapa. Un **+90°** gira el tramo siguiente en sentido antihorario y **−90°** en sentido horario, en las coordenadas de la pieza. La forma final se compone con todos los pliegues; al comenzar la reproducción, las alas están rectas. No se aplican golpes fuera de secuencia.

El perfil de la pieza y el desplazamiento del punzón son geométricos. **La dinámica de presión, radio real, plegado en aire/fondo, recuperación elástica, volteo real de la pieza entre golpes y colisiones máquina-herramienta no están aún validados.** Se necesitarán los planos exactos de herramientas, parámetros reales de máquina y pruebas físicas de concordancia.

## Ejecutar y verificar localmente

Para visualizar en el navegador, servir los archivos por HTTP (los módulos JavaScript no funcionan de forma fiable con `file://`):

```bash
python3 -m http.server 8080
# abrir http://localhost:8080
```

Pruebas sin dependencias con Node.js 22:

```bash
npm test
```

Las pruebas se ejecutan automáticamente con GitHub Actions en cada subida a `main`.

## Próximos trabajos

1. Incorporar los catálogos exactos (cotas y dibujos) que se facilitarán; hacer modelos de punzones/matrices 2D y 3D orbitables.
2. Parametrizar tope X/R/Z, posición de los ejes y mecanismos de volteo/reorientación real entre golpes.
3. Modelar radios, tangencias, contacto con herramienta, deformación plástica y compensación de recuperación según tablas reales.
4. Ampliar la comprobación de colisiones y validar la secuencia con la Trumpf V85 y vídeos de referencia, caso por caso.
5. Completar las pantallas y opciones del control Cybelec 15T respetando las funcionalidades y los límites de propiedad intelectual.

**© AMS · Plegadox**. Uso de desarrollo y demostración. No utilizar como comprobador de seguridad de una plegadora física.

## Revisión preventiva de abertura angular de útiles (v0.9)

El simulador ahora compara, **para cada pliegue y con su signo conservado**, el
ángulo interior teórico (180° − |giro programado|) con los ángulos nominales de
punzón y matriz seleccionados. Si cualquiera de los útiles presenta una cuña
nominal más abierta que el interior solicitado, el programa marca la operación
y explica el conflicto. Por ejemplo, un pliegue de 120° produce un interior
de 60° y requiere revisar una combinación de útiles de 88°.

Esta comprobación **no es una simulación de fuerzas, de radio real ni de
compatibilidad mecánica certificada**: la existencia o ausencia del aviso no
sustituye la comprobación de amarre, carrera, radios, tonelaje, colisiones o
pruebas de plegado con la herramienta real.

## Retirada y reorientación entre pliegues (simulación gráfica)

Entre operaciones, Plegadox divide el reposicionamiento en tres intervalos:
**retirada de V**, **giro de presentación** y **nuevo apoyo**. En la fase
central del giro la cara inferior se dibuja, de forma orientativa, al menos
5 mm por encima del plano nominal de los hombros de la matriz. El volteo
se calcula conservando las longitudes tridimensionales de los tramos; al
proyectarlo en 2D algunas alas pueden parecer más cortas momentáneamente.

**No es una trayectoria de máquina ni una separación segura de 5 mm**. Las
mordazas, ejes, topes, mesa, radios y caminos de giro reales requieren CAD,
cinemática 3D y datos de máquina verificados antes de poder validar colisiones.

El modo de **perspectiva ilustrativa 2.5D** utiliza además la componente
Z calculada durante el cambio de cara: muestra una proyección oblicua del
volteo, en lugar de colapsar visualmente todas las alas en el plano lateral.
La proyección no equivale a un sólido cinemático verificado.

### Dibujos individuales en la biblioteca de herramientas

La pestaña **Herramientas** ofrece ahora una ficha con silueta SVG para cada
punzón y matriz, reutilizando el mismo polígono paramétrico que las vistas
de máquina, miniaturas e inspector. Se distingue el punzón recto del de pata
de cabra y se diferencian V y ángulos de apertura. Incluye referencia,
medidas nominales disponibles y marca de geometría provisional. Los dibujos
no equivalen a un catálogo CAD oficial acotado.

En la **biblioteca de cabina** las referencias agudas de 30°, las patas de
cabra GN6/GN9 y algunas matrices V de 30° se muestran en la selección
inicial, además de las herramientas ya activas. El catálogo completo
permanece disponible en el botón correspondiente o mediante filtros.

### Advertencia de apoyo mínimo en una matriz V

Para un apoyo simétrico esquemático, Plegadox compara cada ala adyacente
con la semianchura V/2. Por ejemplo, una ala de 4 mm junto a un pliegue
sobre V16 no alcanza el hombro situado a 8 mm de la línea de plegado:
se avisa en la operación correspondiente. Es un prechequeo de
**geometría nominal, NO una fórmula certificada de ala mínima**.
El radio, el utillaje especial, el método de plegado, la recuperación,
las tolerancias y las dimensiones exteriores pueden cambiar la viabilidad.

### Corrección de punta redonda y R nominal

Los perfiles paramétricos de punzón recto y pata de cabra (excepto el
trazado proporcional de fotografía) dibujan ahora **un arco de punta
circular tangente a ambos flancos**, según diámetro de punta y ángulo
incluido. En las fichas se muestra R = diámetro / 2; Ø1,2 mm es R0,6,
no R1,2. El arco es una polilínea aproximada, y el resto del cuerpo,
amarre y radios aún requieren contornos acotados del fabricante.

### Radios de hombro de matrices documentadas

Cuando el catálogo incluye expresamente radio de hombro de matriz
(por ejemplo CONIC R1/R1,5/R2/R2,5 o Rolleri R1,6), la sección
paramétrica dibuja arcos circulares tangentes al plano de apoyo y a los
flancos de la V, conservando la apertura y la profundidad **teóricas**.
Las matrices sin cota de radio se mantienen sin fillete inventado.
La forma restante y la geometría de amarre siguen siendo provisionales:
ninguna referencia pasa a ser CAD verificado por esta mejora.

## Fuerza de plegado al aire (estimación NO certificada)

En el módulo **Desarrollo** se muestra fuerza aproximada en toneladas-fuerza
y carga lineal en kN/m, usando Rm, espesor, abertura V y longitud del pliegue.
**F (kN) ≈ 1,42 × Rm (MPa) × L (mm) × t² (mm²) / [1.000 × V (mm)]**.

Rm es editable: si queda vacío se usa una resistencia **SUPUESTA** del material,
no la del certificado de colada (S235 450, S275 500, S355 550, AISI304 620,
Al5754 260, Al1050 110, galvanizado y zincor 450 MPa). El cálculo compara
la demanda estimada con las 85 t nominales configuradas para la V85.
**Una fuerza inferior a 85 t NO aprueba el plegado**: hay que revisar longitud
útil, resistencia real del lote, límites por metro, cargas concentradas,
portaherramientas, radios, método y documentación original de la máquina.
La fórmula es una referencia para **aire a aproximadamente 90°**, no
fondo, acuñado ni utillajes especiales.

Fuentes de consulta:
- [TRUMPF — tabla de fuerza de plegado](https://www.trumpf.com/filestorage/TRUMPF_Master/Products/Services/01_brochures/TRUMPF-bending-tools-brochure-EN.pdf)
- [CONIC — cálculo de fuerza y V/t](https://www.conic.co.jp/en/tech/press_brake/pdf/pb_vol4.pdf)

### Comparador V6–V50 en Desarrollo

La pestaña **Desarrollo** incluye un comparador interactivo de V genéricas
de 88° (V6, V10, V12, V16, V22, V24, V32, V35, V40 y V50) y de la matriz
seleccionada, que puede ser de 30°. Para la MISMA pieza se muestran relación
V/espesor, radio interior estimado, desarrollo calculado, diferencia respecto a
la V activa y fuerza orientativa. **Elegir** cambia la matriz de la programación
y actualiza las vistas vinculadas; no aprueba compatibilidad mecánica ni CAD.
La fórmula de fuerza solo se aproxima al plegado al aire convencional de 90°.

### Prioridad de avisos de interferencia

El detector 2D conserva ahora la **penetración de la fibra media** con mayor
prioridad que la falta de holgura debida al espesor, aunque esta última tenga
una profundidad geométrica superior. La comparación es por herramienta y
tramo de chapa; un aviso no debe ocultar a otro más grave del mismo tramo.
El cálculo sigue basado en secciones paramétricas y **no certifica** colisiones
reales con la máquina ni ausencia de interferencias 3D.

### Longitud de los segmentos y ancho del portaútiles

Cuando hay **longitud nominal de segmento** documentada, Plegadox señala
si el ancho de pieza supera la longitud de **una sola pieza** del punzón
o matriz seleccionado. Puede ser posible ensamblar varios segmentos,
pero debe verificarse su instalación, alineación, reparto de carga y
compatibilidad con las mordazas reales. También se comprueba de forma
independiente la anchura configurada de la trancha y del portaútiles.
No se simula un juego de segmentos ni se valida un montaje industrial.

Los avisos generales de montaje y anchura se muestran ahora con prioridad
sobre advertencias orientativas de baja gravedad. La cabina también indica
cuando la pieza supera la longitud nominal de un solo segmento de punzón o
matriz; **no presume** que puedan unirse herramientas sin verificar su
sistema de amarre, distribución de cargas y disponibilidad real.

El catálogo se registra directamente cuando se importa `engine.js`, por
lo que `normalized()`, `getTooling()` y las verificaciones de secuencia
reconocen también referencias comerciales fuera de la interfaz principal.
El registro es idempotente; no multiplica herramientas ni cambia la
naturaleza provisional de los modelos 2D/3D.

### Navegación a incidencias por golpe

El panel de **Comprobaciones** incorpora botones **G1, G2, G3...** que
respetan el orden programado de plegado (en la omega de ejemplo, 1–2–4–3)
y conservan el signo del ángulo. Cada botón identifica, cuando existe,
la **muestra más grave observada** de posible penetración de fibra o falta
de holgura; al pulsarlo se pausa la simulación y se sitúa en ese instante.
Los avisos geométricos sin ejemplo de herramienta llevan al punto central
del golpe. «Sin aviso muestreado» NO significa que la operación esté libre
de colisiones físicas. No se calculan instantes exactos ni movimientos CNC.

### Miniaturas de golpes según ángulo firmado

Las tarjetas de la secuencia usan la inclinación **real programada** en el
esquema (30°, 45°, 90°, 120° y sus equivalentes negativos). Ya no se
representan todos los golpes como un ángulo fijo de 90°. El esquema es un
pictograma de **dos alas**; la silueta completa de la pieza sigue en las
vistas de simulación. El sentido de plegado y el orden de operaciones se
conservan íntegros.

### Radio interior conectado al arco de chapa

La chapa de la sección técnica se dibuja con una transición **circular
paramétrica tangente** a las dos alas. Su radio de fibra media se aproxima a
`R interior + espesor/2`, utilizando el R editable en Desarrollo o el valor
aproximado del cálculo de la V. Cuando un ala es demasiado corta, el arco se
limita para mantener sus extremos sin moverlos. Esta curva sustituye la
antigua Bézier gráfica. La fibra central de validación sigue siendo
segmentada y **no se está simulando deformación plástica, recuperación ni
radio industrial real verificado**.

### Radios en la vista 3D de la pieza

El visor de pieza 3D usa ahora los mismos arcos circulares paramétricos de
la sección técnica. Los vértices plegados se redondean por su radio de fibra
media orientativo, utilizando el **R interior editable** o calculado de la V,
y el signo real de cada pliegue. La chapa inicial sigue plana. El visor
representa superficies extruidas, no espesor volumétrico CAD/FEM; las
colisiones y el desarrollo siguen siendo verificaciones separadas.

### Volumen de chapa en el visor 3D

La vista **pieza en proceso 3D** ya no es una superficie sin espesor:
se genera una malla cerrada formada por caras interior y exterior, cantos
a ambos extremos de la anchura y tapas de los dos bordes de la chapa.
La malla usa **exactamente el ancho y el espesor programados** y mantiene
los radios paramétricos y los signos de plegado. Las secciones en ángulos
extremos limitan sus uniones para que el dibujo no genere picos indefinidos.
El renderizado sigue siendo una proyección de polígonos con ordenación
de profundidad, **no un modelo B-rep/CAD**, ni un cálculo de deformación,
ni una validación de colisiones físicas. Se añaden pruebas sobre caras,
cantos, cierres, signos y cambios de espesor/ancho.

### Exportación DXF ASCII R12 (2D)

En Desarrollo hay dos botones de exportación: perfil plegado ilustrativo
(`PERFIL_APROX`) y rectángulo desarrollado calculado
(`DESARROLLO_APROX`). Utilizan entidades `LINE`, cabecera DXF R12
y unidades **milímetros**, con anotaciones en la capa `NOTAS_NO_CORTE`.
El perfil incluye segmentos para representar radios aproximados, pero
**no es un contorno CAD exacto**. El rectángulo desarrollado **no** contiene
agujeros, recortes, marcas de pliegue ni correcciones calibradas. Si el
desarrollo es negativo o inválido, no se genera un archivo. Siempre
verificar con el plano original y las probetas antes de cortar chapa.

### Posiciones de pliegue y marcas DXF de referencia

El desarrollo ahora muestra una tabla de centros estimados de los pliegues
con sus posiciones X, número de golpe, número físico de pliegue y ángulo con
signo. Con cotas exteriores se resta media deducción BD por lado; para cotas
sobre fibra neutra se añade media BA en el centro. Las posiciones se
muestran siguiendo la secuencia programada, que puede ser 1-2-4-3, pero
las marcas están ubicadas en el orden espacial de la chapa. La exportación
DXF añade por defecto líneas y notas a la capa PLEGADOS_NO_CORTE.
Se pueden excluir desmarcando la casilla, dejando un contorno de cuatro
líneas sin marcas. No son órdenes CNC ni líneas de corte; todas las
compensaciones y cotas siguen sin verificación de taller.

### Auto-interferencias de chapa durante la simulación

El perfil **PIEZA EN PROCESO** resalta en **rojo** las alas no
consecutivas que se cruzan en el alzado 2D y en **ámbar** las que
presentan una separación de fibras centrales menor que el espesor.
El análisis por golpe toma 16 posiciones orientativas, anota el
caso más grave y permite acceder a la muestra desde **REVISAR CADA GOLPE**.
Las incidencias entre chapa y utillaje permanecen independientes.
La posición de la muestra y la geometría siguen siendo aproximadas:
un muestreo sin avisos no garantiza ausencia de colisiones 3D, y no
incluye las rotaciones reales de preparación ni deformaciones.

Las pruebas de navegador abren una pieza de ensayo con alas que se cruzan,
acceden al golpe señalado y comprueban que la simulación se pausa, que
aparece el diagnóstico del cruce y que los tramos se colorean de rojo en
el lienzo. Esta pieza se usa sólo para pruebas, no como pieza fabricable.

El **perfil final** también distingue cruces entre alas en rojo y
separaciones menores al espesor en ámbar; un cruce prevalece sobre un
aviso de proximidad en el mismo tramo.

### Clasificación precisa de auto-interferencias de chapa

Antes, un simple contacto de extremos se clasificaba como «cruce». El
detector ahora distingue cuatro resultados: **cruce interior** de dos
fibras, **solapamiento colineal** con longitud compartida, **contacto
puntual** en un extremo y **proximidad** con luz inferior al espesor.
Se señalan en rojo los dos primeros y en ámbar los dos últimos, también
en el perfil final. El navegador de incidencias distingue las cuatro
etiquetas y no identifica un mero contacto como una penetración. Estos
son diagnósticos de fibra 2D con tolerancia geométrica, no una
certificación de colisión de la chapa de espesor real en 3D.

La leyenda de colores aparece junto al **perfil de programación** y a la
**pieza en proceso** y aclara explícitamente que el dibujo 2D no valida
colisiones reales de máquina ni de útiles.

### Ubicación de las interferencias 2D

Cada aviso geométrico entre alas almacena su punto representativo en mm:
intersección para un cruce, punto medio del tramo compartido si existe
solapamiento, vértice de contacto o punto medio de las dos fibras más
próximas. Para contactos cercanos se conservan también ambos puntos de
medición. **Son posiciones de fibra media en una sección 2D, no puntos
certificados de contacto de sólidos ni colisiones físicas.**

Ahora, en la vista de perfil final y de pieza en curso, el punto calculado
de la incidencia se representa con un **círculo blanco con borde rojo o
ámbar**. Para una proximidad se dibuja además la línea entre las dos
posiciones de mínima distancia. El panel de diagnóstico muestra las
coordenadas estimadas **X/Y en mm** de la fibra media, sin confundirlas
con un contacto real de la chapa deformada.

El muestreo de interferencias evita ahora asignar la posición exacta
5, 10 o 15 segundos al golpe anterior: en esos límites el motor ya ha
comenzado la operación siguiente. Las muestras finales de cada golpe
se toman justo antes de la transición y se conserva la muestra de
pieza terminada en el último golpe.

### Comparador de órdenes de plegado (chapa 2D)

Desde **Programación → Orden de plegado** se puede pulsar **Analizar órdenes
posibles**. Para hasta cuatro pliegues se examinan todas las permutaciones
(24 para 4); en piezas más largas la búsqueda se limita a 60 alternativas
por coste. Cada candidato se puntúa en cinco posiciones ilustrativas por
golpe según cruces, solapes, contacto puntual y proximidad de alas no
consecutivas. Si existe una puntuación **estrictamente menor**, muestra la
secuencia propuesta con grados firmados y las incidencias comparadas.
**«Aplicar orden sugerido» requiere una pulsación expresa** y
se desactiva si se edita la pieza. No comprueba punzones, matrices, carrera
CNC, mesa, topes ni reorientaciones reales; **NO autoriza fabricar**.

El comparador también calcula por separado las incidencias del **perfil
final**, que son independientes del orden: si ese perfil tiene cruces,
solapamientos o contactos, se advierte expresamente que reorganizar los
golpes no corrige la geometría final de la pieza.

### Segundo cribado de herramientas para el orden sugerido

La sugerencia ahora contrasta la secuencia actual y hasta **cuatro alternativas
candidatas** también con las siluetas 2D de **punzón y matriz** seleccionados,
en tres posiciones por golpe. Una alternativa que aumente el número de
operaciones con posible penetración o con holgura insuficiente respecto
al orden actual **se descarta**, incluso si mejora las incidencias entre alas.
La interfaz muestra ambos recuentos y el número de alternativas examinadas.
Esto NO analiza todas las trayectorias ni garantiza ausencia de colisiones:
perfiles paramétricos, muestreos discretos, montaje de útiles, topes, mesa,
volteos y reorientaciones reales siguen pendientes de verificación física.

La medición mínima entre la fibra de chapa y las aristas de utillaje
identifica ahora también **cruces de interior a interior** de dos
segmentos, aunque sus cuatro extremos estén alejados. Antes, la rutina
que examinaba sólo proyecciones de extremos podía informar de una
separación inexistente en ese caso. Se añaden pruebas para cruces rectos,
oblicuos, paralelos y aristas colineales. Sigue siendo comprobación de
sección 2D paramétrica, no análisis industrial de colisiones.

### Selección del tope trasero por pliegue (vídeo IMG_9031)

Se ha añadido **Tope 1 · Stop** y **Tope 2 · Support** como elección
**individual por pliegue físico**. La tabla de alas de Programación
permite seleccionar el tope de P1, P2, P3…; la vista de Simulación
incluye dos botones táctiles para cambiar el del golpe actual. La
selección se guarda en la pieza (campo `stopByBend`), se conserva al
exportar/importar JSON y al recargar, y no se intercambia cuando se
reordena la secuencia. Al añadir un pliegue se asigna por defecto
Tope 1 y al eliminar uno se borra su selección.

El alzado de máquina cambia entre las siluetas parametrizadas
`stop` y `support` definidas en Máquina (cotas L1–L6), con
identificación visual del tope activo. **No se dispone de la cinemática
calibrada de X/R/Z ni de las caras de contacto CAD completas** para
reproducir a escala real la posición de apoyo que muestra el control
del vídeo. El contorno, la distancia al pliegue y los límites de
carrera deben verificarse; no se certifican colisiones físicas.

### Visibilidad del punzón y apoyo posterior (vídeos del 31-10-2026)

En la vista de máquina el cuerpo y filo del **punzón** se vuelven a
representar en primer plano tras pintar la chapa. Se han reforzado
el brillo del acero, el contorno claro/oscuro y la punta para evitar
que desaparezcan contra la trancha, la bancada o las alas plegadas.
En **▥ mm** se repasa también su silueta por delante de la línea de
chapa. No se ha modificado la geometría paramétrica nominal del útil.

A partir del vídeo real **IMG_9033(1).mp4**, el apoyo Stop/Support
se presenta ahora **por detrás y a la derecha del borde de la chapa**
en el alzado, y no a una distancia fija desde el centro de la V.
La ubicación visual procede de los extremos del perfil de chapa del
golpe actual; el sistema distingue cuando el borde está elevado,
inclinado o no se detecta un extremo posterior presentable. La cara
del tope se dibuja en verde y el borde de contacto orientativo se
identifica cuando existe alineación visual.

Los vídeos **ScreenRecording_10-31-2026 01-17-05_1.mp4** y
**ScreenRecording_10-31-2026 01-17-39_1.mp4** muestran la vista
previa demasiado oscura y la secuencia con volteos; el arreglo de
capas protege la lectura del punzón durante acercamiento, plegado y
reposicionamiento sin alterar el signo del ángulo.

**Pendiente de calibración:** el apoyo visible no constituye una
cota X, ni el modelo permite deducir automáticamente qué dedo hace
contacto real. Para ello hacen falta caras del tope y datos de ejes
X/R/Z de la máquina y una comprobación real sobre la pieza.

### Corrección de referencia de apoyo por pliegue (vídeos IMG_9031(2) e IMG_9033(2))

**Error corregido:** antes se buscaba automáticamente el extremo más
alejado de la chapa. Eso permitía mostrar 150–250 mm de distancia en
el primer golpe cuando la referencia elegida por el operario debía
ser un ala de 50 mm. El apoyo ahora se determina por cada pliegue:

- **Ala anterior**: el tramo que precede al pliegue en el perfil y
  su longitud nominal, por ejemplo 50 mm. La presentación del perfil
  en la plegadora se invierte horizontalmente para situar esa cara
  delante del tope trasero; no se invierte el signo del pliegue.
- **Ala siguiente**: el tramo posterior al pliegue con su longitud
  nominal. Se presenta desde el lado opuesto.
- **Automático · ala corta**: escoge la menor longitud adyacente;
  **no promete evitar colisiones**.
- **Stop 1 / Support 2** continúa siendo una selección de tipo de
  dedo independiente del lado de alimentación.

Las preferencias quedan asociadas a **pliegues físicos**, no al número
de golpe. En el ejemplo omega 1-2-4-3, el G1 toma el ala anterior de
50 mm y el G3 (pliegue 4) se presenta por el lado siguiente también
con 50 mm, en lugar de colocar un tope desde la punta remota de la
pieza. Durante la deformación la referencia del tope queda **fija en
la configuración previa al golpe**; no sigue un extremo que cambia de
posición al doblarse.

La opción **Comparar ambas presentaciones frente al punzón (2D)**
comprueba posiciones muestreadas de la secuencia con los útiles
paramétricos y presenta los avisos de penetración y holgura para
cada cara, sin cambiar la programación. Es orientativa. **No verifica
la joroba real de la pata de cabra** ni perfiles CAD reales,
amarres, topes, mesa, rutas de volteo o ejes CNC X/R/Z. Si el
punto de referencia es un pliegue interior y no un extremo libre,
hay que confirmar que puede realmente actuar de tope. La distancia
nominal requiere deducción/radio/compensaciones de taller antes de
programar una posición X de máquina.


## Interfaz Titanium y uso sin conexión

La interfaz actual carga **una sola hoja de estilos** (`styles.css`) que
conserva las reglas visuales existentes y define los tokens `--px-*`.
El sistema de iconos de navegación y controles principales utiliza el
sprite SVG local `icons.svg`; las cotas emplean una pila monoespaciada.
La tipografía Inter usa fuentes disponibles en el dispositivo, con
alternativas locales: este repositorio no distribuye tipografías ajenas.

La aplicación incluye `manifest.webmanifest` y `sw.js`. Al abrirla mediante
HTTPS o localhost, el navegador puede instalarla y guardar los recursos
estáticos para trabajar sin conexión; las piezas permanecen en el
almacenamiento local del navegador y pueden exportarse como JSON.
La primera visita requiere conexión, y borrar los datos del sitio puede
eliminar las piezas no exportadas. Las fuentes de catálogos externas
siguen requiriendo red.

**Alcance industrial:** La simulación de plegado, los perfiles de herramientas,
los desarrollos y los avisos de colisión siguen siendo aproximaciones;
la etiqueta «Documentado» sólo indica disponibilidad parcial de datos
nominales, nunca validación CAD de colisiones o seguridad de máquina.


## Importación de herramientas DXF (beta)
En **Herramientas → Importar contorno DXF**, selecciona un archivo ASCII
con **una única poligonal cerrada LWPOLYLINE** (admite bulge 42) o
**un anillo de entidades LINE**. Se necesitan cotas en **mm**; si el archivo
no declara unidades se asumen milímetros y la interfaz lo advierte.
Archivos en pulgadas, entidades ARC/SPLINE/INSERT/POLYLINE clásico,
agujeros y múltiples contornos se rechazan con un error explícito.
El contorno se centra en X y se apoya en Y=0: debe traer la orientación
correcta; no se infiere cuál es el filo, ni las mordazas.
El diámetro de punta, apertura V, ángulo y longitud se anotan como datos
nominales introducidos manualmente. No se deducen del DXF.
El perfil seleccionado alimenta miniaturas, la sección técnica, el visor
3D ilustrativo y los cálculos de interferencia 2D, sin convertirlos en
colisiones físicas verificadas. Se guardan hasta 30 perfiles en el
almacenamiento local del navegador (no se suben al servidor).
El archivo original debe conservarse aparte.


## Tope trasero: perfil completo hacia la izquierda y dos contactos
La vista de taller indica que el tope completo debe tener sus escalones
hacia la **izquierda (chapa por delante)**, con el cuerpo detrás a la
derecha. Las dos posiciones NO invierten dos veces el dedo:
**Stop nº 1** apoya FRONTALMENTE contra la cara VERTICAL inferior,
mientras que **Support nº 2** sostiene la chapa ENCIMA de la primera
superficie HORIZONTAL del escalón. La meseta delante tiene longitud
orientativa L2-L1, y el punto de apoyo superior se sitúa e/2 por debajo
de la fibra media. Se conserva la posición programada X de la chapa
y la geometría del dedo se traslada para hacer contacto.
Las dimensiones L1–L6, Ox/Oz y los signos y secuencia de pliegues
no se modifican; el perfil sigue siendo esquemático, no CAD certificado.


## Actualizaciones PWA (revisión de caché móvil)
La aplicación solicita al servidor los módulos locales cuando está
conectada y usa la caché sólo cuando falla la red; además comprueba
actualizaciones del Service Worker. Una revisión activa sustituye a la
antigua en una recarga para evitar mezclar el soporte del tope de una
versión con la geometría de otra. La apertura offline sigue disponible.


## Contacto frontal y sobre primer escalón
Stop 1: chapa delante del dedo, apoyada en la cara vertical inferior.
Support 2: chapa delante, descansando en la repisa horizontal del primer
escalón, y el canto de la chapa contra la contrahuella vertical. La
geometría completa permanece con los escalones orientados a la izquierda.
Se comprueba que el extremo llegue desde delante, no desde la parte trasera;
ninguna cota ni signo de plegado cambia. Validación orientativa 2D.


## Asiento geométrico de la chapa en el primer escalón
En el modo **Support 2**, el programa comprueba también que la parte
inferior de la chapa se aproxima horizontalmente a una longitud útil de
la repisa, y no únicamente que el vértice del ala coincide con el dedo.
Si la última ala está inclinada, el aviso de **apoyo horizontal no
confirmado** sustituye al falso contacto verde. En el modo **Stop 1**
se conserva el contacto frontal contra la cara inferior del mismo
cuerpo de tope. Este control es geométrico 2D preliminar y no implica
calibración de los ejes X/R/Z ni validación física de apriete.


## Diagnóstico de versiones antiguas en PWA (iPhone)
Algunas grabaciones muestran el dibujo antiguo del tope pese a que la
rama `main` y GitHub Pages ya tienen los escalones a la izquierda.
La pantalla muestra siempre la etiqueta de compilación **TOPE-20261101-R07** bajo
el logotipo. Desde esta versión puede pulsarse el botón de **actualizar**
(ícono de flechas circulares, arriba a la derecha) para contrastar la
compilación con la publicada, limpiar únicamente los recursos de código
almacenados en CacheStorage y volver a cargar. **No borra la pieza ni la
configuración de máquina almacenadas en localStorage.** El enlace de
recuperación permite abrir el último HTML desde Safari incluso cuando
la aplicación instalada conserva una pestaña antigua:

https://warks1.github.io/Plegadox/?rev=TOPE-20261101-R07

El arranque inicial verifica una marca de compilación publicada antes
de purgar las cachés anteriores. Sin conexión conserva los recursos
locales. Una prueba nueva simula la presencia de código antiguo en caché.


## Perfil real de referencia y salto del tope entre golpes (01-11-2026)
El contorno esquemático se ha corregido usando la fotografía con el
**escalón alto a la izquierda y el cuerpo inferior hacia la derecha**.
El dibujo entero se utiliza sin reflejarlo por separado cuando se
selecciona Stop o Support. Stop toma la cara frontal izquierda del dedo;
Support toma la superficie del primer escalón ALTO, con la chapa encima.
La contrahuella inferior no se presenta como segundo tope de chapa
porque en ese plano no sobresale por encima de la repisa.

Al cambiar de golpe, el tope deja de saltar entre dos anclajes de alas:
se retira hacia X positivo, mantiene distancia durante la reorientación
y regresa suavemente a la referencia del siguiente golpe. La transición
es **ilustrativa**, sin velocidades ni límites físicos X/R calibrados.
Se desactiva el indicador de contacto mientras el tope está trasladándose.


## Corrección del movimiento de tope en cambio de pliegue (R09)
Durante el giro de la chapa, la proyección visual de la chapa puede
invertirse o comprimirse; **NO debe aplicarse ese factor al origen X/R
del tope**. Se ha fijado el anclaje al borde nominal del golpe anterior.
El dedo se retira en X+, mantiene la X fija mientras la chapa se gira y
regresa a la referencia del siguiente golpe. Las pruebas revisan toda
la trayectoria en los cambios G1→G2, G2→G4 y G4→G3, no solamente las
fronteras temporales. La geometría sigue siendo orientativa y no
representa velocidades o límites mecánicos certificados.


## Contraste con vídeo real del tope — R10
Revisión del vídeo `IMG_9033.mp4` (49 s). La punta del dedo del tope
se proyecta hacia la **izquierda** y está **por debajo** del nivel del
cuerpo posterior, que entra desde la derecha. Cuando el operario presenta
la chapa sobre el escalón, su cara inferior descansa en ese **saliente
bajo horizontal** y el canto llega hasta una **pared vertical posterior
que sube**. En el modo de apoyo frontal se utiliza la cara izquierda
más baja del dedo. El error anterior dibujaba la repisa ALTA delante
con una pared que bajaba después y, por tanto, no podía detener el
canto de la chapa. Ahora el motor, las vistas de Máquina y Simulación,
las fichas y los controles de interferencias comparten el MISMO perfil
orientativo de cara frontal y escalón.

Esto es una geometría esquemática basada en la evidencia visual,
NO dimensiones CAD exactas de los dedos Trumpf ni validación del
recorrido CNC de los ejes X/R/Z. Se conservan los números L1-L6,
la secuencia omega y la copia `01/10/27`.


## Diagnóstico del espesor de contacto del tope — R11
El apoyo frontal Stop y el apoyo sobre la pestaña baja Support ahora
comprueban el **solape vertical mínimo** entre el canto de chapa (espesor
nominal) y la cara física del tope. Si la pared es demasiado corta o no
alcanza el canto, **no** se muestra contacto confirmado, aunque la fibra
media coincida en un punto. El modo seleccionado es independiente del
estado real del contacto. La cabina distingue **CONTACTO NOMINAL 2D**,
**RETIRADO / EN MOVIMIENTO** y **SIN CONTACTO CONFIRMADO**.
Estas comprobaciones son exclusivamente geométricas 2D preliminares;
no garantizan compatibilidad real, fuerzas, tolerancias ni cinemática CNC.

## Encuadre del tope completo y trayectoria de retirada — R12
El visor de sección técnica ahora incluye el contorno real del **croquis 2D**
Stop/Support en sus límites de encuadre. Antes sólo se medían pieza, punzón
y matriz, por lo que el tope podía quedar cortado. Durante cada retirada se
reserva un contorno fijo que incluye las posiciones de partida, despeje en
X+ y destino, evitando que el visor persiga el dedo a cada fotograma.
La pieza, los signos de ángulo y los puntos de contacto no se alteran.

Pruebas de ambos apoyos y los cambios 1→2, 2→4 y 4→3, en PC e iPhone.
Continúa siendo una simulación esquemática: el encuadre NO verifica
colisiones reales ni calibra los ejes CNC X/R/Z.

## R13 · Asesor de matriz V y punzón en Programación
La recomendación aparece **automáticamente**, sin cambiar las herramientas
seleccionadas hasta pulsar **Aplicar V + punzón**. Se recalcula al modificar
material, espesor, anchura, dimensiones de alas, ángulos o radio interior.
Evalúa pares de los útiles registrados (incluidos los de catálogo o DXF).

Se descartan aperturas cuya referencia preliminar 0,7 × V no cabe en las alas
adyacentes, ángulos incluidos incompatibles, relación V/espesor fuera de 5–14,
pares de amarres conocidos distintos y fuerza de referencia que supere
las 85 toneladas nominales de la máquina. Objetivo habitual V≈8×espesor
(para 9–10 mm 10×; desde 12 mm 12×). Muestra alternativas y avisos
de longitud, radio, cuello de pata de cabra, ángulo y carga por metro.
Cuando no hay ningún par posible se **avisa y no se inventa una selección**.

El consejo es preliminar **NO CNC**: el perfil de las herramientas, sus
amarres a la Trumpf V85, carga por metro y colisiones 3D siguen sin
validarse. La comprobación definitiva requiere fabricante y ensayo real.

## R14 · Simulación 2D/3D continua con avisos (vídeo 01-11-2026)
Grabación del usuario: la reproducción se detenía al segundo pliegue,
mostrando «CHAPA / PUNZÓN · POSIBLE PENETRACIÓN 2D».
La causa era un enclavamiento obligatorio que paraba el reproductor
ante la intersección de siluetas paramétricas **no certificadas**.

Ahora la opción por defecto es **animación continua**: sigue pasando
por todos los golpes y vuelve al principio al terminar; no cambia los
ángulos, la pieza, las herramientas ni la secuencia. Las posibles
penetraciones/holguras 2D siguen apareciendo en los avisos e indicadores.

El usuario puede marcar «Pausar ante una posible penetración 2D» para
recuperar el modo de parada diagnóstica ANTES del primer cruce del punzón.
Este modo es una precaución del visor, no una protección CNC.
La reproducción continua **NO significa que el plegado real sea seguro**.
La seguridad industrial exige geometrías completas, amarres y control
CNC independientes del simulador.

## R15 · Punzones pata de cabra con cuello abierto y alturas H reales
La incidencia de la captura de pantalla de 01/11/2026 mostraba una
**pata de cabra 90°** cuya geometría se confundía con un punzón recto.
El motor de perfiles ahora genera **todos los punzones `type:'cabra'`**
con una sección asimétrica que deja un escote lateral abierto.
La sección se comparte entre catálogo, pictogramas, inspector 3D,
cabina, sección técnica y barrido de colisiones 2D.

La referencia fotográfica `ref-goose-50-100-r1` conserva:
- **H de trabajo 100 mm** desde el hombro de apoyo inferior hasta la punta;
- **alcance horizontal 50 mm**, entre los puntos de cota mostrados;
- **radio de punta R1** mediante arco de Ø2 mm nominal.

La cota inclinada `8` de la foto no se ha convertido sin más en
«ancho de punta» porque la imagen no define inequívocamente esa lectura.
GN6/GN9 conservan cuello k=6/9 mm y H120; W55/W95 tienen siluetas
ilustrativas diferenciadas, manteniendo las alturas de ficha H200/H220.
La máquina genérica `goose` conserva H130.

**IMPORTANTE:** los puntos sin cotas siguen siendo interpolaciones
provisionales; no se ha obtenido un sólido CAD de fabricante, ni se
han certificado amarres, radios reales, capacidad ni colisiones 3D.
Esta geometría sirve para visualización coherente y prechequeo
orientativo, no para aprobar una secuencia industrial.

## R16 · Corrección del origen de la cota H100 en la pata de cabra de fotografía
Al contrastar el croquis `IMG_9036.jpeg` con la R15 se detectó que
la cota de 100 mm **NO abarca toda la altura del vástago**: mide desde
el hombro inferior de apoyo hasta la punta. El vástago de la foto
sobresale por encima de ese plano. Dibujar toda la herramienta en
100 mm, como antes, falseaba su silueta y su altura ilustrada.

Sólo para `ref-goose-50-100-r1` ahora se separan:
- **H útil = 100 mm**, de la línea del hombro inferior a la punta.
- **Extensión superior ≈37 mm**, aproximación proporcional de la foto,
  **SIN respaldo de una cota del fabricante**.
- **Altura total ilustrada ≈137 mm**; no confundir con la cota H útil.
- **Alcance horizontal 50 mm** y radio inferior R1 según croquis.

El hombro está anclado a y=100 desde la punta y el vástago crece hacia
arriba. Las demás patas de cabra conservan exactamente las alturas H
indicadas en sus fichas/entradas del catálogo, sin asumir que representen
también una extensión superior. La interfaz separa H útil y longitud
ilustrada en las tarjetas e inspector. El perfil compartido por
sección, máquina, cabina y volumen del inspector mantiene las cotas.

**Sin CAD de fabricante** no hay geometría de contacto ni verificación
de colisiones 3D: esta mejora es de representación y documentación,
no una validación de fabricación o seguridad de máquina.

## R17 · Control de conformidad previo a taller y copia completa de proyecto

**Auditoría de Programa:** la programación tiene un informe técnico automático
que detecta incompatibilidades de ángulo, ala menor que ≈0,7×V, tonelaje
estimado superior a 85 t, ancho fuera de la Trumpf V85 configurada y
amarres de familias distintas. También indica límites de longitud
de segmento, ensayos pendientes, carga certificada por metro inexistente,
geometría de punzones/matrices provisional y avisos de colisiones 2D.
Puede exportarse en JSON con código y operación de cada incidencia.

Este informe **SIEMPRE conserva el estado SIN_VALIDACION_INDUSTRIAL**
hasta que se implante una comprobación completa y calibrada de los sólidos
3D de máquina, amarres, topes y herramientas. Una simulación continua o
ausencia de avisos **NO autoriza fabricar**.

**Copia completa de proyecto:** botones para descargar y restaurar un JSON
`plegadox-complete-project-v1` que incluye la pieza con ángulos firmados,
orden, topes, material, configuración V85 y los perfiles DXF locales.
La importación valida datos y contornos antes de tocar el almacenamiento,
conserva otras referencias DXF del navegador, rechaza conflictos de IDs
y revierte las escrituras si falla la cuota de almacenamiento.
La copia es local descargada: NO hay sincronización automática en la nube.

**Limitaciones de cierre v1.0:** faltan sólidos CAD industriales reales,
datos de carga por metro, compatibilidad de amarres verificada, contraste
dimensional contra plegados físicos, estudio volumétrico de colisiones y
calibración del desarrollo. Estas carencias NO quedan resueltas por la R17.

## R18 · Biblioteca de piezas local con versiones (hasta 60)
Ahora el botón `Guardar pieza` de cabecera **también guarda en la
biblioteca**, en lugar de limitarse a sobrescribir la pieza activa.
En Programación se encuentra el panel «Biblioteca de piezas y revisiones»:
cliente opcional, lista de piezas guardadas, abrir, abrir la revisión
anterior, crear nueva pieza sin sobrescribir la anterior, y eliminar con
confirmación explícita. Conserva hasta ocho revisiones anteriores por
pieza. El último identificador activo sobrevive a la recarga.

Una pieza que depende de un punzón/matriz DXF ausente NO se sustituye
silenciosamente por una referencia genérica: se pide recuperar el
backup completo con los útiles asociados (R17).

Este es **almacenamiento local del navegador**, no sincronización
multidispositivo ni una base de datos respaldada en servidor.
Para migrar piezas importantes usar «Descargar proyecto completo».
El guardado en biblioteca no autoriza cortar ni plegar físicamente.

## R19 · Contraste del desarrollo con medidas reales y registro de ensayos
En Desarrollo se añaden entradas para **longitud plana REAL medida**,
**radio interior REAL medido**, confirmación expresa de que las cotas y
ángulos corresponden al programa, y observaciones de material/lote.

El motor muestra la longitud calculada y el desvío con signo. Si los
datos de radio/cotas son completos y el factor matemático queda entre
0,15 y 0,60, **propone K** para esa geometría. Si el K requerido queda
fuera de rango NO se trunca ni se aplica; se pide revisar dimensiones,
radio, procedimiento de medición, herramienta o ángulos reales.

El factor K propuesto **NUNCA se aplica automáticamente**: primero se
guarda una medición local y después el operario debe pulsar
«Aplicar K a esta pieza», que fija también el radio medido en esa pieza.
No se extrapola a otra V, punzón, material, espesor, ancho, alas ni
ángulos: cada registro lleva la combinación exacta y una clave técnica.
El registro distingue mediciones introducidas del estado de verificación
industrial (siempre NO acreditada). Se pueden guardar 120 registros,
consultar los de la pieza y exportar un JSON.

El backup completo R17 incluye ahora el historial de mediciones, manteniendo
compatibilidad con los JSON R17/R18 que no tienen ese campo, restauración
no destructiva, rechazo de ID duplicado con contenido diferente y rollback.
El servicio PWA incluye el motor de mediciones para funcionar sin red.

**Límite técnico:** el K inferido de una muestra no modela por sí mismo la
recuperación elástica, el lote, ni valida el desarrollo de otras piezas.
Los datos de longitud/radio/ángulo son declarados por el operario y se
requieren múltiples muestras contrastadas en máquina y documentación.
Ninguna medición equivale a certificado CNC o seguridad de colisiones.


## R20 · Backup conjunto de biblioteca completa y calibración de taller

El backup descargable contiene **todos los datos de R19** (mediciones de
taller, pieza, V85 y DXF) más las **60 piezas de biblioteca y hasta ocho
revisiones históricas por pieza**, con ID activo. Se mantiene el mismo
formato JSON compatible con copias antiguas R17/R18/R19.

- Si el archivo no incluye biblioteca, se conservan todas las piezas locales.
- Si un ID existente tiene otra revisión o datos distintos, se rechaza la
  importación completa antes de escribir.
- Los DXF locales dañados se detectan; nunca se filtran silenciosamente al
  exportar ni se sustituyen con un backup incompleto.
- Se validan piezas actuales e históricas y sus referencias de utillaje.
- Fusión no destructiva de útiles, mediciones y biblioteca; rollback de todas
  las claves cuando falla una escritura, incluida la clave que falla.
- Backup local, sin nube y sin certificación de fabricación industrial.

Pruebas: `tests/project-library-backup.test.mjs`, smoke de backup en PC/móvil
y pruebas de calibración R19. El backup histórico `01/10/27` no se altera.

## R21 · Revisión temporal de topes por pliegue y retirada
Además de la comprobación puntual de la geometría 2D de los topes,
la auditoría ahora analiza cada operación en **19 instantes**, incluyendo
posicionamiento, cierre, retirada y reposicionamiento visual del dedo.
Selecciona Stop 1 o Support 2 por el **índice del pliegue realmente
programado**, nunca por el número de golpe. Identifica en cada operación
candidatos a penetración/holgura, chapa por detrás de la cara, falta de
apoyo nominal sobre el escalón y referencia sobre vértice interior.

En **Programación → Auditoría técnica → Revisión de topes por golpe**
cada tarjeta indica número de golpe, pliegue, tipo de tope y primera
muestra de aviso; el botón abre la simulación directamente en ese instante.
Las advertencias se incluyen también en el informe exportable JSON.
Si no aparecen incidencias, la tarjeta lo dice explícitamente como
«Sin interferencia detectada en N muestras 2D»: **no equivale a que
el tope sea físicamente válido** ni a ausencia de choque entre muestras.

El motor utiliza las mismas escenas paramétricas que el visor, no
cambia el perfil del tope ni invierte dibujos finales, preserva orden y
signos de pliegues. Se añaden regresiones de ambos modos, barrido
de retirada, borde de chapa por detrás y salto a muestras en PC/iPhone.

**Límite:** 2D temporal discreto sin volumen CAD real, recorridos de
ejes X/R/Z, sincronismo de control, topes/trancha/amarres físicos,
capacidad de carga ni validación industrial. No se afirma seguridad de CNC.

## R22 · El Play verde de cabecera funciona; reorientación G1→G2 por etapas
El vídeo del 02/11/2026 muestra el PLAY VERDE señalado en la cabecera.
Antes era un `span.led` SIN evento; el usuario pulsaba un indicador
decorativo. Ahora es un auténtico `button#topPlayBtn` accesible,
táctil y con alternancia **reproducir/pausar**, conectado al mismo
reproductor continuo que los mandos inferiores. Iconos, `aria-pressed`
y estado se sincronizan con las pausas, la línea de tiempo y los cambios
de pieza, también en móvil.

Para el giro del golpe 1 (+90°) al golpe 2 (−90°), cuando además
se cambia de ala anterior/siguiente, el visor ejecutaba dos proyecciones
de coseno SOBRE X e Y al mismo tiempo, aplastando la pieza en ambas
direcciones a mitad del giro. Ahora las dos etapas de visualización
se hacen secuencialmente: **primero el volteo de cara y después el giro
de alimentación**, con continuidad del perfil y del tope en el límite
de golpe. Si solo cambia una dimensión, sigue usando toda la ventana
de transición. Se preservan los signos y el orden 1–2–4–3 de omega.

Regresiones Node y Playwright en PC/iPhone sobre el Play del encabezado,
la pausa, la animación activa al pasar del primer al segundo golpe, el
perfil sin colapso y los anteriores tests de continuidad.
No se ha modelado una trayectoria de manipulador física ni validado
el volumen real de los útiles.

## R23 · Alturas del utillaje y geometría de pata de cabra auditadas
Se revisó la crítica de que las patas de cabra no respetan sus dibujos:
el motor antiguo usaba una misma cuña/escote deformados en escala para
referencias CONIC GN9/GN6 y AMADA W55/W95/H220, sin vástago acotable.
La sección se ha reconstruido con **vástago superior diferenciado, hombros,
relieve lateral cóncavo y punta redondeada**. Se conservan las H TOTALES
de las fichas oficiales CONIC (120 mm) y AMADA (200/220 mm) sin añadir
tramos ficticios al alto del perfil. La figura del cuello y el amarre aún
son PARAMÉTRICOS: **no equivalen a un contorno CAD de fabricante**.

Para la referencia fotográfica `ref-goose-50-100-r1`, la cota **100 mm**
mide desde el hombro inferior a la punta y el alcance horizontal es
50 mm. El vástago superior NO está dimensionado en el dibujo: la
aproximación visual del saliente se ha revisado de ≈37 a ≈28 mm.
**H TOTAL ≈128 mm es estimada, no una cota de fabricación.**
La geometría calculada conserva R1 en la punta (Ø2) y el hombro en
H útil100, sin inventar certificación de la altura total.

**Corrección de radio:** las 7 referencias AMADA del catálogo citan
R0,6. En el motor el parámetro `tip` representa DIÁMETRO, por lo que
se ajustaron de `tip=0.6` (dibujaba R0,3 INCORRECTO) a `tip=1.2`
(dibuja **R0,6**).

La nueva auditoría `tool-height-audit.js` compara en milímetros
la cota de ficha con el ALTO del perfil dibujado de TODOS los punzones
y matrices. Diferencia explícitamente `H total` y `H útil`; muestra
ambas en catálogo/inspector cuando procede, y emite avisos en auditoría
de fabricación si hay discrepancias o alturas sin acotar.
La matriz Rolleri H total120 / H útil100 conserva ambos datos.
El CAD real de escotes, amarres y perfiles de herramienta sigue
pendiente de aportarse y verificarse. No autoriza la fabricación.

## R24 · Programación de pieza tocando la pantalla y asesor con perfiles
A partir del vídeo real Cybelec `IMG_9031.mp4`, se incorpora un panel
**Programación táctil** en «Editar pieza». Toca el tramo de chapa para
seleccionar y escribir la longitud con un teclado numérico de botones
grandes; toca el vértice para introducir el ángulo firmado (por ejemplo
`+90` o `-90`), usa **invertir ±** y añade alas pulsando el extremo
de la pieza o el botón **Añadir ala**. El botón **Orden tocando pliegues**
permite seleccionar cada vértice en la secuencia real de máquina.
Se incluyen gestos de pellizco para zoom, arrastre del fondo, zoom con
rueda y controles de centrado y escala. No se reemplazan los controles
anteriores por tabla y las piezas se conservan en la misma biblioteca.
El motor garantiza que al añadir/eliminar alas se sincronizan también
índices de secuencia, Stop/Support y lado de apoyo.

En **Asesor de matriz V y punzón**, la pareja recomendada y cada
alternativa muestran ahora DOS DIBUJOS 2D: la sección de la matriz y
la del punzón, construidas con `sectionDie/sectionPunch` de los
mismos perfiles utilizados en la cabina y catálogo. Se indica
apertura V, ángulos, altura nominal H, radio de punta y la diferencia
entre cota útil y total cuando procede. Al tocarlos, el dibujo se abre
ampliado. Cambiar el espesor, ángulo o ala vuelve a evaluar la propuesta
y reconstruye ambos dibujos; el asesor nunca modifica las herramientas
seleccionadas sin pulsar expresamente «Aplicar».

Esta pantalla sirve para programación geométrica táctil; no reemplaza
calibración de ejes X/R/Z, sólidos CAD verificados ni aprobación real
de colisiones. Las herramientas sin contorno CAD completo se muestran
con una advertencia de perfil provisional.

## R25 · Editor gráfico adaptado a ratón y teclado del PC
El editor R24 compartía la misma lógica de punzones, cotas y pliegues,
pero mostraba un teclado táctil también en ordenadores. Ahora detecta
`pointer: fine` (ratón/trackpad) y oculta el teclado numérico visual;
mantiene el campo de medida y el teclado físico. En PC:
- **Clic** sobre un tramo o vértice para seleccionar ala/ángulo.
- **Doble clic** para enfocar y editar la medida con el teclado del PC;
  Enter confirma. Ángulos firmados +90/-90 sin sustituir el signo.
- **Arrastrar con botón izquierdo el tramo de un ala** para cambiar
  su longitud (proyección sobre el eje del tramo; funciona también
  en alas verticales y bajo zoom).
- **Arrastrar el fondo** para desplazar la vista; **rueda del ratón**
  y botones para ampliar/alejar. Se mantiene asignación de orden por
  clic sobre vértices y añadir ala por clic en el extremo.
- Se muestra una línea de previsualización amarilla durante el
  arrastre; el nuevo valor **solo se guarda al soltar** el ratón.

En iPhone/tablet, el editor conserva teclado táctil, selección por
toque, pellizco y desplazamiento. El modo también responde al tipo de
puntero utilizado, útil en equipos híbridos y portátiles convertibles.

Todos los datos se guardan en el mismo modelo de pieza, con la misma
secuencia, ángulos, tipos de tope y herramientas. La adaptación
PC no modifica geometrías industriales ni sustituye pruebas de colisión.

## R26 · Control de reproducción, medidas de utillaje y selección gráfica (2 noviembre 2026)

- El asesor de herramientas deja de ofrecer automáticamente punzones y matrices cuya **longitud comercial declarada** sea inferior al ancho de la pieza. No presupone que sea posible componer segmentos ni que la carga por segmento esté validada.
- Las herramientas sin longitud declarada conservan la condición de **preselección orientativa**, con advertencia expresa de comprobar su longitud útil, montaje y capacidad.
- Las tarjetas muestran **H útil** para la pata de cabra reconstruida a partir de la fotografía; en las demás muestran H total. Las herramientas con fichas parciales no se anuncian como geometría CAD completa.
- El editor gráfico (ratón/táctil) borra los pliegues seleccionados para ordenación cuando se cambia de pieza, con independencia del selector táctil antiguo.
- Se incorpora prueba de navegador para **Play/Pausa**, tecla de cabecera, continuidad G1 → G2 de la omega, permanencia del signo −90° y bucle continuo, tanto en PC como en móvil. Pruebas de longitud útil y selección de orden incluidas en CI.
- El modelo es una **previsualización geométrica**, no un programa CNC validado: sigue pendiente trazar contra planos acotados cada punzón/matriz y verificar cinemática de volteo, longitud real útil, cargas y colisiones tridimensionales de la Trumpf V85.


## R27 · Contornos DXF protegidos contra autotoques y geometrías 3D mal proyectadas

- La importación DXF rechaza **cruces, contactos no adyacentes, solapes colineales y retrocesos entre aristas consecutivas**. El perfil debe ser un único polígono simple y cerrado. Antes sólo se detectaban cruces interiores estrictos.
- Para LWPOLYLINE se comprueban también **cantidad declarada de vértices, elevación, normal de extrusión OCS, grosor de entidad y ancho constante**. No se crea una silueta supuestamente fiel a partir de una proyección no XY.
- Se conserva la importación local de punzones y matrices DXF ASCII en milímetros, contornos cóncavos de patas de cabra y arcos con bulge que puedan muestrearse sin solapes.
- El importador recuerda la orientación que debe tener la punta del punzón y la V superior de la matriz. La geometría de entrada se conserva sin redimensionados arbitrarios.
- Pruebas unitarias de topología y prueba real del importador en Chromium comprueban rechazos sin cambiar la herramienta activa.

**Pendiente industrial:** un DXF 2D simple no certifica el montaje, los radios reales, la dureza, la carrera, las tolerancias ni la seguridad de una trayectoria; sigue siendo necesaria la ficha del fabricante y la validación en taller.


## R27 · Orientación física del punzón montado

En Programación de pieza se puede elegir **Original / Invertido 180°**.
La orientación del punzón queda guardada en la pieza y se comparte entre
el modelo 2D de la máquina, la sección técnica, las miniaturas del montaje
y el cribado de interferencias. Se invierte **todo el perfil** (incluido el
escote de la pata de cabra), no solamente una etiqueta o icono.
La herramienta de catálogo conserva intactas sus cotas y su contorno fuente.

La orientación es **un estado de montaje global**, no una instrucción CNC
de giro del punzón entre operaciones. Para cambiarla físicamente hay que
detener la máquina, comprobar la admisibilidad de inversión del amarre,
la longitud, el centrado y los despejes. No se afirma que un golpe sea
seguro porque desaparezca un aviso 2D en la vista invertida.


## R28 · Detección de penetración y endurecimiento de publicación PWA

- En el contacto con el tope, una coincidencia nominal del canto con la cara elegida **no** permite penetrar en el interior: el cribado 2D detecta penetraciones someras, incluso inferiores a la mitad del espesor. Sigue siendo una advertencia geométrica, no una garantía de seguridad CNC.
- Identificadores de compilación y caché sincronizados a **PLEGADOX-20261102-R28 / v0.9.4**. Los módulos se importan con `?build=R28` (identificador completo codificado en la URL) y la revisión del Service Worker cambia de nombre para evitar mezclar revisiones.
- Los errores de almacenamiento local se muestran en un aviso visible y persistente; Guardar ya no confirma éxito si falla el guardado de la pieza. Si el rollback del backup también falla, se informa de las claves que requieren revisión.
- Iconos PNG de 192 y 512 px (más 180 px para iOS), generados a partir del diseño SVG PlegadoX, sin perder el favicon original. El generador reproducible es `tools/generate-pwa-icons.py`.
- El CI valida la sintaxis de **todos** los módulos JavaScript y comprueba la coherencia de build, caché, versión e iconos para evitar regresiones de publicación.

**Recuperación de una instalación antigua:** abre `https://warks1.github.io/Plegadox/?rev=PLEGADOX-20261102-R28` con conexión o usa el botón **Actualizar**. Los proyectos locales no se eliminan al renovar la caché, pero conviene exportar copia de las piezas antes de cualquier actualización mayor.


## R29 · Referencia de las dos plegadoras Cybelec y splash TITANIUM (11-11-2026)

Las fotografías facilitadas muestran **cinco caras de 50 mm**, ángulos de perfil **+90°, −90°, −90°, +90°**, espesor **2 mm**, **matriz V16/30°** y **L DIN 233,94 mm** en ambas pantallas. La pantalla antigua indica además **Ri 2,63 mm** y punzón **1-835**, mientras la otra identifica un punzón **1238_28**. No hay prueba de que ambos punzones tengan la misma geometría ni amarre.

**CARA/N en Cybelec es la numeración de la geometría**, no evidencia del orden de fabricación de los golpes. En PlegadoX distinguimos el pliegue P1…P4 del golpe G1…G4. El ejemplo anterior conserva el orden elegido por el usuario **G1→P1, G2→P2, G3→P4, G4→P3**. Este orden no está certificado libre de colisiones; debe comprobarse en máquina.

El cálculo anterior de PlegadoX con V16/88°, radio estimado 2,56 mm, K=0,36 y criterio de cotas exteriores da aproximadamente **234,13 mm**. El botón **Cargar referencia Cybelec** usa una **matriz genérica V16/30°**, punzón genérico 30° y radio 2,63 mm; propone un **K equivalente matemático** calculado para reproducir el L DIN nominal de 233,94 mm con la convención actual del motor. No se afirma que ese K sea el parámetro original del control, que el acero sea S235 real, ni que el DIN sea longitud de corte medida. No reemplaza otras piezas guardadas sin acción explícita.

La pantalla inicial **TITANIUM** incluye animación SVG de chapa plegándose entre punzón y matriz, barra de progreso vinculada a la carga efectiva de los módulos, identidad PlegadoX y aviso © A.M.S TECNOLIGICS. No se oculta hasta completar el arranque; si falla, muestra un error y permite reintentar. Se adapta a PC, tablet y móvil, con alternativa para movimiento reducido. El resto de la interfaz mantiene su diseño previo.


## R37 · Punto de contacto del tope + splash animado (15-11-2026)

- Por **cada pliegue** se conserva la selección de tope Stop 1/Support 2, ala anterior/siguiente/automática y ahora una **cota de contacto manual en mm desde la línea del pliegue**. El campo vacío vuelve al extremo del ala. El ajuste es independiente para cada pliegue, se conserva con el JSON de la pieza y se muestra en la secuencia y en la sección 2D.
- En la escena de máquina, el punto de anclaje se calcula por interpolación del tramo seleccionado y no obligatoriamente por su vértice. El desplazamiento ilustrativo del dedo entre golpes usa también ese punto manual. El resto de la pieza no se mueve para hacer parecer correcto el contacto.
- Seleccionar un punto interior **no garantiza que exista una superficie física capaz de hacer tope**. Se marca como referencia no verificada; no se declara contacto seguro sin borde libre, y continúa el chequeo de penetración del perfil 2D de chapa y dedo.
- La pantalla premium conserva la foto seleccionada y añade una animación SVG de chapa/punzón durante la carga real. Si falla la foto, ya **no se sustituye silenciosamente por la antigua pantalla TITANIUM**; el mismo diseño presenta un fallback vectorial.
- Build/cache sincronizados a `PLEGADOX-20261115-R37` / v0.9.13. La actualización de caché PWA no borra las piezas del almacenamiento local.

**Pendiente para uso industrial:** cotas y sólidos CAD aprobados de los dedos, X/R/Z del equipo real, topes en Z, transferencia segura de pieza y comprobación física continua de 3D. La selección de contacto es de previsualización, no autorización de plegado en máquina.


## R38 · Elegir cualquier ala como referencia de tope (15-11-2026)

- Ahora **cada pliegue** puede referenciar cualquiera de las alas 1…N, no sólo sus alas contiguas. El punto se determina mediante la elección de ala y una distancia editable en mm desde el extremo de esa ala más cercano al pliegue, medido en la geometría de referencia. Vacío = extremo opuesto del ala elegida.
- La representación calcula el punto sobre el perfil plegado presente en la operación, no proyectándolo a un vértice vecino. Los topes siguen detrás de la pieza; el perfil completo de cada dedo no se refleja ni gira entre golpes.
- El botón **Buscar apoyo con menos interferencias (2D)** examina los dos extremos libres con Stop 1 y Support 2 para el golpe actual, e incluye avisos de útiles. Si no aparece una propuesta sin avisos en las muestras, no cambia el programa. Se conserva siempre la selección manual.
- Los selectores por operación aparecen también en el editor de alas, y los valores permanecen al guardar y exportar/importar JSON. Pruebas añadidas a `tests/gauge-point-manual.test.mjs`.
- Build `PLEGADOX-20261115-R38`, versión 0.9.14 y nueva caché offline para evitar mezclar módulos viejos y actuales.

**Precaución:** posición visual y cribado geométrico, no preparación CNC. No usar como certificado de no colisión; aún faltan CAD íntegros, recorridos medidos y comprobación de medios físicos en la Trumpf V85.


## R39 · Comparador de presentaciones coherente y revisión de caché

- La opción de comparar ala anterior/siguiente ignora temporalmente la referencia específica previamente elegida, para comparar dos soluciones realmente distintas. No modifica la pieza.
- Al cambiar el lado de apoyo desde el simulador o la tabla, se desactiva la selección manual de ala que pudiera contradecirlo; una distancia que supere la nueva longitud se reinicia en vez de mostrar una cota imposible.
- Nueva revisión `PLEGADOX-20261115-R39` / v0.9.15, con nuevo nombre de caché PWA, conservando datos guardados en el navegador.
- Verificación realizada: sintaxis de módulos y comprobaciones en memoria del cálculo de referencia. **Sin afirmación de prueba final de navegador, CI o validación CAD de máquina real.**


## R40 · Cara de parada frontal en Stop 1 y Support 2

- En los dos dedos la chapa hace **tope contra la cara vertical delantera** de su contorno, no queda colocada automáticamente sobre la repisa de Support 2. El perfil completo del dedo y sus cotas siguen sin invertirse ni alterarse.
- La posición del punto sobre la pieza, el análisis de espesor y el control de penetración del dedo usan ahora esa cara frontal de parada.
- El apoyo para sostener el peso de la chapa sobre una repisa es una función distinta de detener su canto y requiere una decisión de montaje y una simulación verificadas; no se asume por defecto.
- Sigue siendo geometría provisional 2D: **no se certifica un plegado seguro en la V85 sin CAD completos y datos de ejes reales**.

Revisión publicada en código: `PLEGADOX-20261115-R40` / `0.9.16` (caché independiente). Se añade `tests/gauge-front-contact.test.mjs` para comprobaciones de contacto frontal.


## R42 · Bystronic 100 t × 3100 mm (2006) y retroceso del tope ANTES del pliegue

**Aviso sobre identificación.** Con “Bystronic 100 t / 3100 mm de 2006” NO se deduce el modelo exacto. En Programa y Máquina se pueden seleccionar independientemente:
- Trumpf V85, 85 t / 2040 mm. Sigue utilizando únicamente sus cotas Cybelec introducidas; no se borra.
- Beyeler PR100/3100, **ficha histórica de fabricante** (no identificación de la unidad 2006): 1000 kN, largo de plegado 3100, entre montantes 2750, escote 400, luz 500, carrera estándar 215, recorrido X 590 y R 250; dimensiones exteriores 4100×2050×2600 mm. Fuente: https://www.politesi.polimi.it/bitstream/10589/7642/4/Data%20Sheet_Beyeler%20PR150_Bystronic.pdf. Otras unidades PR100 anuncian carreras y luces distintas: depende de configuración.
- Bystronic EP II 31-100, anuncio de ejemplar **fabricado en 2006**, no ficha identificadora de esta unidad: 100 t / 3100 mm, entre montantes 2550, escote 400, mesa a 925, carrera 200, dimensiones 5200×2100×2900, control DNC 8805, topes X/R. Fuente: https://www.kitmondo.com/es/bystronic-ep-ii-31-100-p250930038/.

**Cotas pendientes:** ni el catálogo histórico ni los anuncios contienen perfiles CAD acotados de la trancha, mordazas/agarres superiores, amarres de matriz, mesa, dedos traseros con su lado de contacto, ni amarre/longitud exactos de los útiles equipados. La aplicación no los inventa como datos reales: en Bystronic se muestran **croquis visuales no medidos**, la biblioteca CAD queda disponible para importación y la evaluación de cada golpe avisa «TOPE SIN PERFIL CAD». Se necesita el modelo y número de serie o fotografías/planos acotados del equipamiento para una geometría físicamente fiel. La longitud de plegado 3100 no verifica que haya 3100 mm de amarre utilizable.

**Útiles añadidos a catálogo** desde SOCLAM edición 2017, sección tipo Bystronic/Beyeler P39–P43: punzones P2 R/RF-A (85°), P5 y P6 R/RF-A (30°), P8 R/RF-A pata de cabra (85°); matrices M6, M8, M10, M12, M16, M24, M32 (30°), M40 y M50 (60°). Las alturas/ángulos/radios consignados proceden del catálogo, pero los contornos de las muescas de amarre y 3D siguen **paramétricos y provisionales**. El catálogo describe familia compatible, NO confirma el montaje en nuestra máquina. Fuente: https://soclaform.fr/wp-content/uploads/2017/12/2017-SOCLAM-BYSTRONIC-BEYELER.pdf. Un anuncio de PR100 de 2006 documenta WILA NSCL Pro hidráulico superior y portamatrices WILA hidráulico **solo en ese ejemplar**, sin probar que lo lleve la unidad del usuario: https://activemachinery.com/equipment/7849674-bystronic-pr100-3100-brakes-press.

**Retroceso visual:** la secuencia comparte fases de sujeción, retirada del tope (.36→.44 de cada golpe), plegado (.44→.68), retorno y reposición (.84→.99). El dedo mantiene su cota mientras se presenta la chapa, se retira rígidamente hacia el lado posterior hasta fuera de la proyección X muestreada del ala y retorna a la referencia del próximo golpe sin salto. Se preserva el punto manual de contacto. Basado en el concepto *Retraction* del manual BySoft CAM 2022: https://bystronic-mediacenter.picturepark.com/v/a7szE377/. La distancia del recorrido de despeje es **orientativa**, puede exceder la carrera física y NO se debe exportar como CNC ni presentar como colisión resuelta sin comprobar los CAD, los límites, el momento real de sujeción y los ejes de la máquina. El algoritmo no garantiza ausencia de colisiones tridimensionales.

**PWA:** recargar mediante botón Actualizar para obtener la revisión; las piezas y ajustes Trumpf se mantienen en almacenamiento local. Pruebas unitarias agregadas en `tests/gauge-retract-motion.test.mjs` y `tests/machine-selection.test.mjs`. La presencia de pruebas no acredita por sí sola que se haya ejecutado una prueba en taller o navegador.


## R43 · Identificación de la Bystronic del propietario (año confirmado: 2006)

**Datos confirmados por el propietario:** fabricante Bystronic, año 2006, capacidad nominal 100 toneladas, longitud nominal de plegado 3100 mm. Estos datos NO establecen el modelo exacto; siguen como opciones comparativas PR100/3100 y EP II 31-100, ambas documentadas en unidades usadas del mismo año, pero no se asignan sus distancias entre montantes, carreras de trancha, amarres ni geometrías a la máquina del propietario por coincidencia de año.

Se añade el perfil seleccionable `bystronic-2006-100-3100` en el panel Programa y Máquina. Comparte exclusivamente los tres datos confirmados; los demás valores siguen en `null` o se identifican como croquis sin CAD, y el diagnóstico NO debe presentar seguridad verificada. Si se consigue el modelo de placa/serie y las fotos de los amarres, se podrá afinar el perfil sin alterar las piezas guardadas.


## R44 · Medidas atribuidas por petición expresa a la Bystronic de 2006

Para el perfil «Bystronic 2006 · 100 toneladas · 3100 mm», se incorporan **como referencia de trabajo** las cotas oficiales del modelo Bystronic Beyeler PR100/3100: fuerza 1000 kN, plegado 3100 mm, distancia entre montantes 2750 mm, escote 400 mm, apertura 500 mm, carrera de trancha 215 mm, campo de tope 1040 mm, recorrido X 590 mm, recorrido R 250 mm, dimensiones externas 4100 × 2050 × 2600 mm, masa nominal 9 t, potencia principal 7,5 kW y depósito hidráulico 205 l. Se muestran en el panel «Máquina», exportación JSON y configuración efectiva para fuerza y longitud de plegado.

Fuente primaria: «Dati tecnici PR Beyeler», edición 0503, tabla PR100/3100, páginas 1 y 2:
https://www.politesi.polimi.it/bitstream/10589/7642/4/Data%20Sheet_Beyeler%20PR150_Bystronic.pdf

Evidencia adicional de existencia del modelo en el mismo año: anuncio usado «2006 Bystronic PR100-3100», https://activemachinery.com/equipment/7849674-bystronic-pr100-3100-brakes-press ; **el anuncio no demuestra que sea la misma unidad**.

**Alcance de la atribución:** estos datos son válidos como referencia de la familia PR100/3100; no prueban que la unidad concreta del propietario sea una PR100 ni su equipamiento exacto. Mantener `tableHeight:null`, cotas CAD de trancha, fijación/agarres, portamatriz, mesa y geometría del dedo como no documentadas, para no validar falsamente una colisión o un recorrido CNC. Si la placa confirma EP II, cambiar a ese perfil (montantes 2550 mm, carrera 200 mm). Las piezas guardadas y las cotas de la Trumpf se conservan sin alteración.


## R45 · Modelo revisado a partir de fotografía del usuario (15-11-2026)

**Corrección de identificación importante:** la foto de la máquina del usuario presenta una carrocería blanca/gris con un gran cuadrado de logotipo Bystronic rojo a la izquierda, tapas de cilindros rojas laterales y bancada inferior azul oscuro. El frontal coincide visualmente con la familia **Bystronic AFM EP 31-100 / EP100-31**, y NO con los ejemplares fotografiados de la **Beyeler PR100** (carcasa con franja/cornisa roja superior y nombre PR100 grabado). La imagen de la máquina propia NO muestra placa con el modelo legible: identificación provisional, **no confirmada**.

Fuentes para contraste:
- Fotografía de ejemplar AFM EP 31-100 del 2008 y datos comerciales de capacidad 1000 kN, 3100 mm, carrera 200 mm, peso 9000 kg, Cybelec DNC 880S y cuatro ejes: https://www.sparxmachinetools.co.uk/products/bystronic-afm-ep-31-100-3m-x-100-ton-press-brake
- Ficha de un ejemplar EP100-31 del 2006 con Y1, Y2, X, R y Cybelec 880 (son datos de otro equipo, no prueba del control del propietario): https://www.machinio.it/annunci/43398267-pressa-piegatrice-idraulica-bystronic-ep100-31-del-2006-in-bassano-del-grappa-italia
- Presentación contemporánea de la gama AFM EP (2007) 31-100 y tope X/R: https://www.forumnarzedziowe.pl/archiwum2000-2009/pdf2007/nr04%2833%292007.pdf
- Referencia visual PR100 diferente: https://assetexchangeinc.com/equipment/7777573-bystronic-beyeler-xpert-100-x-3100-press-brakes-hydraulic-power

**Cambio de ingeniería:** el identificador de perfil guardado `bystronic-2006-100-3100` se conserva para no romper proyectos; su denominación pasa a «AFM EP 31-100 probable». Se eliminan del perfil de la máquina del usuario las cotas antes heredadas **sin justificación** de PR100/3100: entre montantes 2750, escote 400, altura libre 500, carrera 215, recorrido máximo tope 1040, X 590, R 250, medidas exteriores 4100×2050×2600 y potencia 7,5 kW. Se mantiene 100 t / 3100 mm / año 2006 confirmados; la carrera 200 mm y peso 9 t solo como **referencia de otros ejemplares** AFM EP, no como comprobación física de su unidad.

La selección PR100 y EP II permanece separada para comparar modelos, pero ninguna de sus cotas se debe usar automáticamente en la unidad fotografiada. El perfil de dicha máquina continúa sin CAD acotado de trancha, amarres, mesa y dedos traseros; la comprobación 2D/3D no certifica colisiones. Para confirmar submodelo y cinemática de ejes, hace falta una imagen legible de la placa de características o de la etiqueta de identificación del control.

## R46 · Bystronic Xpert Pro 100/3100, WILA y Promecam (15-11-2026)

El propietario confirma para su máquina Bystronic: cabezales superiores WILA, mesa con bombeo y regleta adaptadora inferior para matrices tipo Promecam; cita posteriormente el modelo «Xpert Pro 100». La referencia fotográfica de 2006 y el modelo Xpert Pro se mantienen como perfiles separados: **Bystronic presentó Xpert Pro en diciembre de 2018**, por lo que una máquina fabricada en 2006 no puede identificarse automáticamente como Xpert Pro.

Se añade el perfil de fabricante «Xpert Pro 100/3100 estándar» con fuerza 100 t, longitud 3100 mm, luz nominal de 640 mm, carrera 250 mm, entre montantes 2750 mm, escote 400 mm, mesa ancho 74 mm, exterior 4180×2000×2820 mm, X máximo 1050 mm, X recorrido 600 mm y R recorrido 250 mm. La variante Extended, distinta, tiene 840 mm de apertura y 450 mm de carrera. Fuente oficial: https://www.bystronic.com/sites/default/files/2026-03/tp007-BE-Techdaten-Xpert%20Pro_es.pdf ; presentación de 2018: https://www.bystronic.com/che/en/news/xpert-pro-bending-technology-highest-demands .

El perfil fotografiado de 2006 conserva `openHeight:null`; el rango 400–515 mm citado como orientativo para otros modelos NO es luz medida del ejemplar. El panel Máquina permite guardar por separado cuatro cotas verificables de cada Bystronic (luz real trancha/mesa, proyección superior completa WILA y punzón, altura regleta Promecam, altura matriz sobre regleta). La apertura nominal se calcula solo con las cuatro medidas y no certifica colisiones.

El asesor ahora comprueba por SEPARADO la compatibilidad de fijación superior WILA y base inferior Promecam, y usa la capacidad nominal de la plegadora activa. CAD de máquina y registros de altura son distintos entre el perfil de 2006 y el Xpert Pro. Se añaden pruebas a `tests/bystronic-fit.test.mjs`.

Pendiente: placa de modelo/año para conciliar ambas identificaciones y CAD físico de cabezales, mordazas, regleta, trancha, mesa y topes para validar cinemática y colisiones. La geometría de montaje no es certificable con las denominaciones WILA/Promecam por sí solas.

## R47 · vídeo de tope rojo, retroceso condicional, WILA/Promecam y splash original (15-11-2026)

**Máquina propia:** fecha de fabricación facilitada como **intervalo 2006–2009**; se mantiene `bystronic-2006-100-3100` como clave de compatibilidad histórica, con `year:null` y `productionPeriod:{start:2006,end:2009}`. La identificación AFM EP por fotografía sigue provisional, y la Xpert Pro (presentada a partir de 2018) sigue siendo una ficha independiente. Se conservan los montajes confirmados WILA / mesa con bombeo / regleta adaptadora Promecam.

**Vídeo 15-11-2026 01:56:** en el golpe 2 el visor presenta «TOPE 1 · REVISAR INTERFERENCIA» rojo con un ala ya formada próxima al cuerpo del dedo. Esto NO acredita contacto seguro por el mero hecho de dibujar la referencia. El modo «Automático» al pulsarlo evalúa combinaciones de borde libre y tipo de tope; si encuentra una opción sin avisos la propone, y si no existe mantiene el aviso en lugar de fingir apoyo correcto. La elección manual de lado/tope permanece disponible y no se modifica automáticamente.

**Retroceso sólo cuando hace falta:** el módulo `technical-section.js` toma la referencia antes del pliegue, muestrea varias poses del ciclo y usa `inspectGaugeProfile` sobre el dedo inmóvil. `gauge-retract-motion.js` solo retira en fase de sujeción cuando las muestras indican penetración/proximidad; sin aviso mantiene el dedo en posición durante el pliegue y solo lo recoloca suavemente hacia el siguiente apoyo tras el golpe. Se cachea el plan por pieza/orden/herramienta/montaje para no recalcular el barrido en cada frame del teléfono. No conocemos el volumen ni límites CNC reales: esta decisión sigue siendo un cribado 2D ilustrativo, no un permiso de fabricación. Tests: `tests/gauge-retraction-conditional.test.mjs`.

**Fuentes CAD investigadas y nuevas referencias de catálogo:**
- WILA BIU-021/1 28° R1 H útil 163 mm, BIU-033/1 86° R1 H útil 200 mm, BIU-053/1 28° R1 H útil 200 mm; matrices OZU-012/1 V16/86° H55 R1,5, OZU-045/1 V16/90° H55 R1,5, OZU-312/1 V16/86° H100 R3,5. Fichas oficiales con dibujo DXF disponible tras registro/solicitud: https://www.wilatooling.com/en-us/products/press-brake-tooling/new-standard-tooling/new-standard-premium/biu-021/ y páginas del fabricante de cada referencia.
- Eurostamp 1193/30° R0,6 H104 en familia Amada/Promecam; fuente externa que anuncia DXF: https://machinistsvault.com/products/1193-punch-30 .
- SOCLAM matrices Amada/Promecam de dos V reversibles 20.12/88° V6/10 y 20.15/88° V16/25 con enlaces DXF directos del catálogo SOCLAM: https://www.soclam.com/produit/matrice-amada-a-2-ves-a-88/ . Los V que se muestran en PlegadoX son la orientación activa declarada, no una validación del contorno completo.
- Interfaz «Herramientas > Importar DXF» añade fichas de estas referencias, preparación de campos y descarga/enlace de origen. **No se han insertado como sólidos CAD reales**, porque en esta revisión NO se han obtenido/verificado los bytes y coordenadas de sus DXF. Permanecen `profileAccuracy:'provisional'` hasta importar un DXF ASCII de perfil cerrado en milímetros; el sistema nunca debe marcarlos CAD certificado a partir de una ilustración de catálogo. Los amarres superiores WILA y portamatriz inferior Promecam se evalúan independientemente. Una matriz de amarre WILA no sirve en la regleta Promecam sin otro adaptador acreditado.
- Tests: `tests/catalog-wila-promecam.test.mjs`.

**Splash:** se mantiene la imagen original aprobada `plegadox-premium-selected.png` como ÚNICO arte. Se elimina la chapa SVG superpuesta y la imagen repetida como fondo; la barra única y el texto dinámico se anclan con cálculo geométrico a la ubicación en la imagen original escalada, incluso en orientación vertical, tablets, monitor panorámico o alta densidad. No duplicar controles ni añadir otra pantalla de carga.

**Pendiente para cierre industrial:** inspeccionar placa/curso de fabricación y CAD metrológico de dedos y apoyos reales, geometría 3D WILA/Promecam (originales DXF descargados e importados), límites X/R/Z y su barrido volumétrico, y prueba de interfaz en iOS/Android/PC. La advertencia roja indica posible colisión; no se silencia solo para mejorar la estética.

## R48 · Editor de útiles por cotas y nueva identidad PWA (15-11-2026)

**Creador de herramientas, pestaña Herramientas:**
- Nuevo formulario desplegable «Crear punzón o matriz introduciendo sus cotas» con vista previa 2D que se redibuja en cada edición. Funciona en ratón y táctil.
- Punzones rectos y de pata de cabra: H total, ancho del cuerpo, largo Z, ángulo incluido, ancho y altura del vástago, radio de punta; para pata de cabra, profundidad de cuello. Los perfiles son polígonos derivados de las cotas y se comprueba su cierre/autointersección, pero los radios y escotes no constituyen contornos CAD exactos de fábrica.
- Matrices V: apertura V, ángulo, H total, ancho de cuerpo, radio nominal de hombros, descentrado de V y longitud Z; se impide una garganta que atraviese la base o deje menos de 3 mm de cuerpo lateral. Los hombros se aproximan por un tramo suavizado: NO equivalen a radios OEM certificados.
- Montaje elegible WILA, Amada/Promecam, Trumpf, Bystronic/Beyeler R o desconocido.
- Guardado mediante el almacén existente de herramientas personalizadas; `customProfile:true`, `importedDxf:false`. Se utiliza el perfil generado en todos los dibujos y cálculos ilustrativos que consumen `sectionPunch`/`sectionDie`; no se etiqueta falsamente como DXF OEM. La biblioteca combinada admite hasta 50 perfiles persistidos.
- Archivos: `custom-tool-geometry.js`, `custom-tool-builder.js`, vistas de `index.html`, estilos de `styles.css`, `tests/custom-tool-geometry.test.mjs`.

**Icono industrial:** `favicon.svg` nuevo (estructura de plegadora, punzón, chapa V y matriz). Versiones PNG industriales creadas para 180, 192 y 512 px en `icon-industrial-180.png`, `icon-industrial-192.png` e `icon-industrial-512.png`; enlace de iOS `apple-touch-icon` y `manifest.webmanifest` apuntan a las nuevas rutas para evitar que Safari use la antigua imagen descargada.

**Splash original seleccionado:** se conserva exclusivamente `plegadox-premium-selected.png` como imagen principal (no se sustituye por boceto alternativo), se elimina el pseudo-fondo con la misma imagen duplicada, se desactiva la segunda animación de chapa sobrepuesta y se cubre la barra de porcentaje pintada en la foto antes de mostrar **una sola barra de progreso real** controlada por el cargador. El contenedor ocupa 100vw × 100dvh, utiliza `object-fit:cover` para llenarlo sin estirar los píxeles y un posicionamiento/recorte distinto en orientación vertical. La foto panorámica puede recortar parte de sus extremos en pantallas estrechas: es físicamente imposible llenarlas sin recortar y preservar a la vez toda la composición 16:9; si se exige todo su contenido en vertical debe crearse además una composición vertical aprobada.

Se renueva SW a `plegadox-static-0.9.24-custom-tool-icon-fullscreen-r48` para que no arrastre la versión antigua. En iOS, los accesos ya añadidos a la pantalla de inicio pueden conservar el icono instalado: retirar ese acceso y volverlo a añadir después de actualizar suele ser necesario para verlo.

**Seguridad:** las poligonales personalizadas son aproximaciones del perfil definido por el operador; no hay CAD completo verificado de fijaciones WILA/Promecam ni evaluación industrial de carga, trayectorias o colisiones CNC. Ningún resultado de simulación debe etiquetarse certificado.


## R49 · Orientación automática, aviso de autoría y centro de actualizaciones (15-11-2026)

**Orientación:** `responsive.js` calcula el modo móvil/tablet/escritorio según el viewport real, aplica `data-layout` y `data-orientation` y repinta la escena en `resize`, `orientationchange`, `screen.orientation.change`, `pageshow` y `visualViewport.resize`. Un segundo ciclo de repintado tras girar evita que iOS utilice dimensiones temporales anteriores al giro. CSS adapta los seis módulos y el apartado Acerca de en orientación vertical/horizontal. El navegador NO puede obligar a iOS/Android a girar cuando el usuario ha bloqueado la orientación; no se intenta hacer `screen.orientation.lock`.

**Footer:** se retira `PLEGADOX · Software de plegado · © AMS · Motor geométrico de demostración, sin conexión a la máquina` y `Pantalla adaptada: Smartphone · horizontal`. Se presenta de forma uniforme el aviso **© 2026 AMS Tecnologics Services. Todos los derechos reservados.** y una advertencia de derechos de autor. `responsive.js` ya no escribe texto en el pie. El HTML de la pantalla TITANIUM histórica actualiza el mismo nombre de titular.

**Acerca de PlegadoX:** nueva pestaña de navegación `tab-acerca` con ficha de producto, versión y compilación, plataforma, nombre del creador **AMS Tecnologics Services**, lista de funciones, aviso técnico y actualización en la propia aplicación. Icono `#info` añadido a `icons.svg`.

**Actualizar software:** nuevo `software-about.js`. El botón «Buscar e instalar actualizaciones» y el icono de actualización de cabecera comparten un solo flujo (se elimina el manejador duplicado antiguo). Comprueban por red `build-info.json` de su propio origen (`cache:no-store`), validan build/version mediante `software-update-policy.js`, comparan fecha y revisión o versión semántica para **no instalar una versión antigua**, confirman la publicación del nuevo `index.html` y, sólo entonces, purgan caches de *código* `plegadox-static-*` y solicitan la nueva página. Nunca borran `localStorage` con piezas, herramientas, biblioteca, ajustes ni los datos de `IndexedDB`; únicamente invalidan la marca local de build. Mantener copia de seguridad igualmente por prevención frente a pérdida de datos del navegador. Sin conexión o sin nueva versión, el panel explica el estado sin prometer instalación.

**Límites:** el botón instala las revisiones que se publiquen efectivamente en el mismo sitio web; no escribe nuevas funcionalidades por sí mismo ni controla una tienda de aplicaciones. El aviso técnico sobre las simulaciones sigue disponible dentro de Acerca de y en los controles de seguridad, aunque ya no aparezca en el pie común.

Tests de política: `tests/software-update-policy.test.mjs`. Build `PLEGADOX-20261115-R49`, versión `0.9.25`, caché `plegadox-static-0.9.25-about-updater-responsive-r49`.


## R50 · Revisión de grabaciones iPhone 02:41 y 02:44 · icono premium, carga íntegra y tope (15-11-2026)

**Evidencia visual aportada por el usuario:**
- Captura del icono de PlegadoX en la pantalla de inicio de iPhone: símbolo sencillo anterior no aceptado.
- `ScreenRecording_11-15-2026 02-41-29_1.mp4`: la imagen aprobada se mostraba tan ampliada que quedaban recortados el logotipo y el frontal de la plegadora. La barra de progreso se veía aparte.
- `ScreenRecording_11-15-2026 02-44-41_1.mp4`: varios pliegues con tope trasero avisando interferencia y referencias de ala/contacto que no resultaban físicamente coherentes.

**Corrección de splash:** `splash-foto-premium.html` deja de forzar `object-fit:cover`. Se reutiliza **una sola** instancia de la imagen elegida `plegadox-premium-selected.png` sin agrandarla ni estirarla. Se muestra la parte superior original completa (hasta aproximadamente el 76% de la altura de la imagen) dentro de un marco con proporción constante; el 24% inferior, que contiene un indicador de carga ya pintado en la fotografía, se excluye, y se construye **una sola** barra de progreso real en una zona separada. Se usa CSS `dvh` y adaptación vertical/horizontal sin segunda imagen de fondo ni superposición de la antigua chapa animada. Una imagen panorámica no puede simultáneamente ocupar una pantalla 9:19 completa y conservar todo su contenido sin franjas o remaquetación: en vertical se prioriza **no cortar** la imagen y se rellena el resto con fondo técnico, barra y copyright.

**Icono de inicio:** `favicon.svg` rehace la marca con una P cromada, arco eléctrico azul y prensa/matriz V en un marco de acero. Se añaden iconos PNG originales industriales `icon-premium-180.png`, `icon-premium-192.png` e `icon-premium-512.png`, con URL nuevas, para Safari/iOS y manifest Android/PWA; `sw.js` precarga dichos archivos y el index ya apunta al nuevo `apple-touch-icon`. Un icono de pantalla de inicio ya instalado puede quedar congelado por iOS hasta borrar ese acceso y añadirlo de nuevo.

**Tope trasero:**
- La referencia automática ya no se limita a un ala corta interior; `gauge-contact-solver.js` contrasta los **dos extremos libres** de la pieza contra la cara frontal vertical del dedo y comprueba con el espesor nominal si la chapa invade el contorno **antes del pliegue**.
- Si un usuario ha elegido manualmente lado/ala/punto, la selección manual no se cambia sin su intervención.
- Se añade botón **«Corregir apoyo del tope · buscar cara frontal libre»**, que puede aplicar expresamente una opción automática con un extremo accesible, preservando ángulos, orden de plegado y elección de herramienta.
- Si **no existe un apoyo inicial válido** en este cribado 2D, se mantiene el aviso y se **bloquea el retroceso como falsa solución**. La retirada condicional se calcula sólo **tras encontrar apoyo válido** y detectar interferencia posterior del dedo fijo con la chapa durante el plegado.
- La fase temporal se llama «Sujeción», no «Sujeción · retroceso tope» si no es necesario. La referencia prevista para el golpe siguiente utiliza el mismo extremo libre del solucionador y no el antiguo segmento local, para evitar saltos visuales del tope.
- Se mantienen diferenciadas las comprobaciones nominales 2D y la validación física 3D. **Sin CAD real de topes/amarres, origen X/R/Z, movimientos y geometrías de chapa, no se declara colisión certificada ni se controla CNC.**

Pruebas añadidas en `tests/gauge-contact-solver.test.mjs`. Build `PLEGADOX-20261115-R50`, versión `0.9.26`, caché PWA `plegadox-static-0.9.26-gauge-contact-icon-splash-r50`. Revisar el vídeo original y las pruebas de interfaz tras instalar la versión y actualizar el acceso directo del iPhone.

### R50b · Reparación de referencias de muestras ya guardadas

La inspección de ejecución de `EXAMPLE` detectó que sus `gaugeSideByBend` originales estaban fijadas a `['before','before','before','after']`: en los golpes 2 y 4 de Omega 1-2-4-3 referían vértices **interiores**, no un borde libre. Esto impedía corregir el apoyo pese a disponer de nuevo solucionador automático. Se cambia la Omega de ejemplo y la referencia Cybelec a `['auto','auto','auto','auto']`. Prueba lógica ejecutada con las funciones del proyecto: en los cuatro golpes se obtuvo `valid:true`, `freeEdge:true`, y sin interferencia 2D en la presentación inicial para Trumpf V85; **esto no demuestra una solución certificada en la máquina real**.

El módulo `sample-gauge-migration.js` sólo migra referencias almacenadas que coincidan EXACTAMENTE con la antigua muestra Omega (nombre, alas, signos, orden, cuatro banderas antiguas y ningún segmento/punto manual personalizado). No modifica piezas del cliente ni muestras editadas. La selección manual sigue prevaleciendo. Nuevos tests `tests/sample-gauge-migration.test.mjs`.


## R52 · Carga industrial con punzón y matriz MONTADOS y revisión de apoyo (15-11-2026)

La captura facilitada por el propietario confirmó un fallo visual grave de la pantalla anterior: el punzón figuraba desplazado lateralmente y la matriz aparecía delante de la mesa, como si fuese un bloque flotante. **No basta con acercar ambos dibujos; sus amarres también deben estar representados y los elementos movibles conectados a la máquina.**

**Nueva escena adaptativa** `splash-machine-assembly.svg`:
- Marco de máquina y montantes laterales estáticos; conjunto superior `#upperMachine` que integra **trancha, amarre WILA, vástago y punzón**, animados en la misma transformación vertical.
- Mesa inferior, bombeo conceptual, regleta adaptadora **PROMECAM** y matriz V16 fijos, apilados en ese orden (el grupo inferior no se mueve con la trancha).
- Eje geométrico compartido **X=459 unidades SVG** entre punzón y ranura V16; chapa azul animada desde estado plano a perfil doblado durante el acercamiento del punzón y retorno. La escala vectorial es ARTÍSTICA y no está calibrada contra un conjunto WILA específico.
- `splash-foto-premium.html` ahora es interfaz responsive, con marca PlegadoX y seis fichas de funciones a la izquierda / arriba según orientación, **una única barra de progreso real HTML** y pie con derechos de autor. Ya no reproduce imágenes fotográficas con punzón fuera de su amarre ni porcentajes pregrabados.
- En móvil vertical el contenido se apila y en horizontal la máquina ocupa una columna; no se usa `object-fit:cover` ni una fotografía recortada del 78 %. Se conserva `titanium-loading-original.html` como activo histórico de referencia.
- Se añaden comprobaciones de pantalla, montaje y progreso en `tests/titanium-selected-splash-r32-smoke.mjs` y `tests/splash-viewport-r35-smoke.mjs`, y se migran las pruebas antiguas que presuponían el PNG estático.

**Tope trasero:**
- `gauge-contact-solver.js` examina los extremos libres, se niega a declarar apoyo válido sobre un vértice interior y distingue referencia manual de automática.
- En `technical-section.js` se valida el contacto ANTES de la sujeción; solo se programa retroceso del dedo cuando el punto de apoyo inicial es correcto y un muestreo posterior detecta posible interferencia 2D.
- El botón «Corregir apoyo del tope» prueba primero el dedo/ala seleccionado y, SOLO tras clic del usuario, puede probar el otro dedo. Conserva el orden de plegado y los ángulos.
- `backgauge-placement.js` y `machine-visual.js` distinguen **rojo = apoyo incorrecto/interferencia detectada**, **ámbar = contacto 2D posible pero CAD pendiente** y **verde = contacto modelado con geometría documentada**. El color no certifica máquina real.
- `gauge-sequence-review.js` ya no suma «faltan planos CAD» como si fuese una colisión física. Quedan separadas las dudas documentales de la detección 2D.

**Herramientas:** ampliación de fuentes WILA/Promecam y corrección de un error físico de dibujo de V32/30° H55, cuyo perfil 30° no debe alargar automáticamente la altura de la matriz: las profundidades de garganta de herramientas de 30° pueden diferir del triángulo ideal (en catálogo Bystronic comparable se publica D=33,6 mm para V32/30° H55). Las cotas usadas para un perfil SOCLAM siguen marcadas como referenciales y pendiente el DXF del fabricante.

**No certificado:** no se han obtenido los sólidos CAD completos de la unidad de 2006–2009 ni los perfiles exactos del dedo, trancha, base, regleta, cabezal, fijaciones y útiles montados. Las simulaciones actuales no certifican ni garantizan la ausencia de colisiones físicas; validar en el CNC y con personal autorizado antes de realizar cualquier operación.


## R52–R54 · Montaje de útiles, apoyo de tope y diagnóstico de colisiones (15-11-2026)

**Pantalla de carga nueva** (`splash-foto-premium.html`, `splash-machine-assembly.svg`):
- Se elimina de la pantalla activa la antigua fotografía con herramientas montadas en posiciones incorrectas y con un porcentaje fijo dibujado. El archivo histórico `plegadox-premium-selected.png` se mantiene como respaldo y no se utiliza en el nuevo visor.
- Se representa la trancha con el amarre WILA y el punzón **dentro del mismo conjunto animado**; la matriz V16 se monta sobre la regleta adaptadora tipo Promecam, apoyada en la mesa de la plegadora, de forma estática. Eje de punzón = eje central de la V.
- En la animación, la punta y la chapa se aproximan a la garganta V16 sin atravesarla gráficamente. La sección se dibuja en SVG, **es ilustrativa y NO constituye un CAD validado de Bystronic, Trumpf, WILA ni Promecam**.
- Una sola barra real `role=progressbar` y estado del arranque enlazado a `PlegadoXLoading.setProgress`. Diseño adaptado en vertical y horizontal mediante CSS, sin duplicar fondos ni barras pintadas.
- Pruebas: `tests/splash-assembly-r53.test.mjs`, `tests/splash-mounted-tooling.test.mjs`, `tests/splash-viewport-r35-smoke.mjs`, `tests/titanium-selected-splash-r32-smoke.mjs`.

**Tope con retroceso únicamente por necesidad de interferencia 2D**:
- `resolveGaugeSetup` conserva las elecciones manuales y, en automático, descarta vértices interiores y examina cantos libres. `correctGaugeSetup` prueba explícitamente ambos dedos si el operador pulsa «Corregir apoyo»; no modifica silenciosamente orden, signo, cota o herramientas.
- `gaugeAnchor` es la referencia física nominal anterior al golpe y permanece estable durante ese golpe. Se distinguen el retroceso de prevención `retroceso-antes-plegado` y el traslado normal a la cota del golpe siguiente `reubicacion-siguiente-golpe`. Durante la vuelta, `gaugeRetractionPath.from` permanece anclado a la referencia original; `movementStart` identifica el punto de aparcamiento.
- La reubicación tiene un destino propuesto aun si la referencia siguiente es inválida: evita que el dedo se teletransporte de una posición a otra al cambiar de golpe. **Alcanzar ese destino no constituye autorización de contacto; el apoyo inválido sigue marcado como inválido.**
- Se calcula la necesidad de retirada a partir de las muestras de la misma sección de chapa que se representa, **incluyendo los radios de pliegues previos**. Antes el motor estimaba un perfil simplificado distinto al visualizado, de modo que una interferencia podía aparecer roja durante el plegado sin haberse previsto.
- Se distingue `rojo` = error de apoyo o penetración/holgura detectada en la sección y `ámbar` = 2D nominalmente aceptable pero geometría CAD del dedo/ejes aún sin verificar. Sin CAD nunca se muestra certificado verde.
- En el Support 2 se admite un contacto normal únicamente sobre la **repisa baja horizontal**, con la chapa horizontal apoyada y detenida contra la **pared vertical que asciende**; el detector no debe confundir esa superficie específica con una interferencia. La excepción no permite ocultar una chapa que penetra la pared o el resto del cuerpo del dedo.
- Pruebas: `tests/gauge-retraction-conditional.test.mjs`, `tests/gauge-contact-solver.test.mjs`, `tests/gauge-support-shelf-interference.test.mjs`, `tests/reposition-continuity.test.mjs`, `tests/stop-support-contact.test.mjs`, `tests/gauge-sequence-review.test.mjs`.

**Biblioteca CAD por fabricante**:
- Al seleccionar un punzón o matriz en «Herramientas», `toolCadSourceLinks` muestra su estado de perfil y un enlace de consulta de DXF OEM cuando el catálogo incluye `cadSourceUrl`. Los enlaces se crean por DOM con `target=_blank` y `rel=noopener noreferrer` fuera de los botones para elegir útil.
- WILA BIU-021: H útil 163 mm, α=28°, R1 mm, máx. 70 t/m; OZU-012: V16/86°, R1,5, H útil 55 mm. Fuentes fabricante: https://www.wilatooling.com/es-us/productos/herramientas-para-prensas-dobladoras/herramientas-new-standard/new-standard-premium/biu-021/ y https://www.wilatooling.com/en-us/products/press-brake-tooling/new-standard-tooling/new-standard-premium/ozu-012/
- WILA facilita enlaces a contornos DXF después de proporcionar correo o identificarse en MyWILA; **no se ha descargado ni inventado ningún DXF**. Cuando el operario obtenga el archivo, puede utilizar el importador existente de la aplicación para registrar el contorno y revisarlo.

**Límites físicos explícitos:** toda validación de chapa-dedo es por muestras discretas 2D, sin geometría volumétrica contrastada del cuerpo de máquina, punzón, matriz, amarre WILA, regleta Promecam ni cinemática X/R/Z; tampoco hay sincronización CNC. No usar como garantía de ausencia de colisiones en una plegadora real.

## R55 · Carga por metro de utillaje en la recomendación automática (15-11-2026)

El asesor `tooling-advisor.js` ahora calcula `forceTonnesPerMetre = force.tonneForce × 1000 / ancho_mm` para cada combinación de punzón y matriz, utilizando el modelo existente de fuerza de plegado al aire. Si la ficha de algún útil proporciona `maxTPerMetre` documentado y el cálculo lo supera, **no recomienda esa combinación**, aunque el tonelaje total de la plegadora alcance. La capacidad de punzón y matriz se comprueba por separado; si el límite de uno o ambos es desconocido, **se indica como pendiente**, no se supone permitido. Mantiene los avisos de montaje, reparto de carga entre segmentos, longitud Z de utillaje y ausencia de certificación industrial. Pruebas nuevas: `tests/tooling-load-capacity-r55.test.mjs` con rechazo por punzón, rechazo por matriz, aceptación nominal condicionada y advertencia de datos ausentes.

Referencias WILA: BIU-021 H útil 163 mm, α=28°, R1 y carga 70 t/m; OZU-012 V16/86°, R1,5 y carga 120 t/m. Datos nominales en páginas oficiales WILA citadas en la sección R54. El modelo no valida de manera independiente la fuerza de plegado, el montaje WILA/Promecam, la capacidad real de mordazas o la distribución de presiones en una pieza segmentada.


## R56 · Calcular la fuerza de cada V candidata, sin reutilizar la matriz activa (15-11-2026)

Antes `recommendTooling` podía calcular `estimateAirBendForce` buscando la referencia de una matriz candidata por ID en la biblioteca global: si una matriz recién creada o inyectada todavía no estaba registrada, el cálculo recuperaba la V de la pieza activa y falseaba la carga del candidato. `estimateAirBendForce(piece, {opening,dieAngle})` admite ahora una geometría candidata explícita **manteniendo compatible su firma anterior**; `tooling-advisor.js` pasa siempre la apertura y el ángulo de la matriz que se está evaluando. Esto hace que el filtro de fuerza total de máquina y de carga máxima por metro trabaje sobre la V correcta.

Prueba: `tests/tooling-load-capacity-r55.test.mjs`, caso V32/88° de 3 mm no registrada frente a V16 activa. La estimación sigue siendo la fórmula orientativa de plegado al aire y no una homologación del fabricante.

## R57 · Avisos de apoyo industrial coherentes, actualización segura e iconos premium (15-11-2026)

- **No dar por certificado un croquis:** `normalizeV85()` indica `gaugeGeometryDocumented:false`, `holderGeometryDocumented:false`, `verified:false` porque las cotas L1…L10 de Cybelec y las fotos disponibles no son un sólido CAD completo del dedo ni del amarre. Las medidas reales se conservan; no se inventan contornos mecánicos. Ambas plegadoras quedan bajo el mismo criterio de procedencia.
- **Colores coherentes en los dos visores:** el módulo `technical-section.js` usa rojo para interferencia 2D / apoyo inicial inválido y ámbar cuando hay apoyo nominal pero CAD del dedo/ejes pendiente. `machine-visual.js` ya diferencia esos estados en la escena de máquina. *No se presenta verde de seguridad industrial sin geometría documentada.*
- **Botón de actualización:** el botón `forceUpdateBtn` consulta el mismo `build-info.json` que `software-about.js`. Si el build remoto es igual al instalado, mantiene piezas y biblioteca sin recargar ni eliminar cachés: se actualizó `tests/pwa-version-recovery-smoke.mjs` para comprobar esa política de seguridad, en vez de exigir un `?refresh=` heredado.
- **Icono que abre la app:** `tools/generate-pwa-icons.py` ahora **verifica** los iconos PNG premium industriales 180, 192, 512 del repositorio y, solo para compatibilidad, los copia a rutas legadas. Ya no fabrica el símbolo básico rechazado. `.github/workflows/icons.yml` verifica arte y manifest sin commits automáticos que provoquen ejecuciones canceladas del resto de CI.
- **Pruebas nuevas:** `tests/industrial-status-and-icons-r57.test.mjs` comprueba bandera de CAD, imágenes PNG a tamaños reales, enlaces del manifest/iOS y estados no verificados del tope. El archivo no supone certificación volumétrica.
- **Distribución:** build `PLEGADOX-20261115-R57`, versión `0.9.33`, caché `plegadox-static-0.9.33-cad-status-icon-update-r57`. Al actualizar desde un acceso iOS instalado antes, puede ser necesario recrear ese acceso para que iOS cambie el icono de pantalla de inicio.

**Límites reales:** el retroceso condicional, el contacto con el tope y la matriz/punzón en pantalla son evaluaciones geométricas y animaciones orientativas; faltan CAD físico contrastado de los útiles, amarre, regleta, trancha, mesa, topes y recorridos X/R/Z y pruebas CNC/industriales. Por seguridad, no se certifican colisiones ni trayectorias en máquina.


## R58 · Diagnóstico explícito de apoyos y CI visual paralela (15-11-2026)

**Apoyo del dedo/retroceso:** `gauge-sequence-review.js` añade el aviso `apoyo-invalido` cuando el motor de preparación rechaza la cara de apoyo, **aunque no exista una penetración 2D**. Registra `setupReason` para explicar al plegador por qué debe cambiar orientación, segmento o dedo. La advertencia queda en `workshop-audit.js` mediante su mapeo genérico `gauge-<kind>`. No se declara automáticamente que todo aviso rojo implique colisión volumétrica. Prueba de regresión `tests/gauge-sequence-review.test.mjs`.

**Aviso en simulación:** `machine-visual.js` muestra de forma distinguible `CORREGIR CANTO DE APOYO`, `CHAPA INVADE EL DEDO` o `REVISAR HOLGURA / APOYO`. Las letras de esas advertencias son rojas; apoyo nominal 2D sin CAD acreditado se muestra ámbar. La elección manual y el orden de plegado permanecen inalterados.

**Pruebas de navegador:** `.github/workflows/check.yml` distribuye los **42 tests de navegador** en cuatro grupos independientes `inicio`, `simulacion`, `topes`, `datos`; no cancela los demás al fallar uno, y sube capturas con el nombre de su grupo. Cada script tiene un tiempo máximo y registra su nombre en el log. Esto hace más fácil detectar una pantalla cortada en un iPhone sin confundirla con errores del cálculo de herramienta. La batería de pruebas unitarias sigue ejecutándose por separado.

**Publicación:** build `PLEGADOX-20261115-R58`, versión `0.9.34`, caché `plegadox-static-0.9.34-gauge-diagnostics-browser-shards-r58`. Los colores no equivalen a una verificación industrial: se sigue necesitando la CAD real de los dedos y del conjunto máquina, más validación del recorrido CNC y pruebas físicas antes de plegar.


## R59 · Más matrices Promecam con DXF del fabricante identificados (15-11-2026)

Fuentes revisadas directamente en las fichas de SOCLAM:
- Matrices en T invertida tipo **Amada/Promecam 2041–2047/88°**, V6, V8, V10, V12, V16, V20 y V25, cada una con dos alturas **H80/H120** y segmento inicial de 415 mm; son **14 nuevas referencias**. Fuente fabricante: https://www.soclam.com/produit/matrice-amada-en-te-renverse-a-88-ou-85/ . Cada ficha del programa enlaza el DXF publicado (2041_88H80.dxf hasta 2047_88H120.dxf).
- Matrices reversibles **2013/88° V8/V12** y **2014/88° V12/V20**, H26 mm, con portamatriz **40.06 o 40.07**, 2 nuevas referencias. Fuente fabricante: https://www.soclam.com/produit/matrice-amada-a-2-ves-a-88/ .
- Total **16 referencias** adicionales, todas con `cadDownloadUrl` y `cadSourceUrl` publicados y comprobados en la ficha oficial.
- WILA BIU-021 y OZU-012 siguen disponibles como referencias de catálogo; los contornos DXF de WILA requieren facilitar correo o entrar en MyWILA. No se simula acceso a esos ficheros.

**Limitación importante:** el sitio de SOCLAM permite descargar DXF, pero el entorno de búsqueda utilizado no admite leer su contenido de tipo `image/vnd.dxf`. Por tanto, `profileAccuracy:'provisional'` y `cadStatus:'descarga-DXF-publica-importacion-pendiente'` se mantienen hasta que cada archivo se importe mediante el editor y pase los controles del contorno. No se convierten fichas de referencia en sólidos 3D certificados. Los perfiles a 85° existen **bajo demanda** según SOCLAM, pero no se inventa una variante CAD 85° a partir del DXF de 88°.

Las referencias se registran en `catalog.js` y pueden seleccionarse/consultarse desde «Herramientas» y el importador DXF. `tests/soclam-promecam-cad-r59.test.mjs` comprueba las 16 fichas, montajes WILA arriba/Promecam abajo sin asumir un segundo adaptador, y enlaces oficiales. Build `PLEGADOX-20261115-R59`, versión `0.9.35`, caché `plegadox-static-0.9.35-promecam-cad-links-r59`.


## R60 · DXF de útiles con familia de amarre declarada por operador (15-11-2026)

El importador de contornos DXF de «Herramientas» incorpora ahora el selector **Sistema de amarre/fijación** (WILA, Amada/Promecam, Trumpf, Bystronic/Beyeler R o desconocido). Al preparar una referencia del catálogo, propone únicamente su familia nominal; el operario puede corregirla antes de guardar. Antes, la importación descartaba `mount` y las herramientas WILA/Promecam no conservaban la interfaz de montaje declarada, a pesar de la existencia de adaptador Promecam en la Bystronic del usuario.

`tool-dxf.js` guarda `mount`, `mountVerified:false` y `mountDeclaration:'familia-declarada-en-formulario-sin-contraste'`; la ausencia de información produce una cadena vacía, **no una supuesta compatibilidad**. No deduce anclaje de un contorno ni acredita mordaza, adaptador, tonelaje por metro, alturas o colisiones. `tests/tool-dxf.test.mjs` comprueba WILA, Promecam, no identificado y el rechazo de valores desconocidos.

Los 16 perfiles SOCLAM de R59 enlazan DXF oficiales, pero **su contenido todavía necesita importación real** para sustituir las formas provisionales. WILA puede exigir registro para descargar sus contornos.

Build `PLEGADOX-20261115-R60`, versión `0.9.36`, caché `plegadox-static-0.9.36-dxf-mount-r60`. El motor conserva sin modificación las piezas y herramientas locales ya guardadas; en herramientas importadas antiguas sin `mount`, el sistema no presume conocerlo.

## R61 · Exportación de DXF paramétrico y copias completas de herramientas (15-11-2026)

- El constructor por cotas de punzones rectos, de pata de cabra y matrices V permite **Descargar DXF 2D (mm)**. La salida es un archivo CAD ASCII con `$INSUNITS=4` y una polilínea 2D cerrada que se puede volver a importar. Las unidades y dimensiones del contorno se contrastan en pruebas de ida/vuelta mediante el propio importador.
- El nombre descargado incluye el sufijo **`NO-CERTIFICADO.dxf`**. La geometría es paramétrica y no debe confundirse con un plano CAD suministrado por WILA/Promecam, ni con una representación volumétrica de sus amarres ni con un programa CNC.
- `project-backup.js` conserva ya `customProfile`, `customDimensions`, `profilePoints`, tipo de amarre nominal, longitud y referencia. Las copias admiten **hasta 50 perfiles** en total, alineadas con el límite real del editor y el almacenamiento local; las copias DXF históricas siguen siendo compatibles.
- La restauración rechaza dimensiones desconocidas, contornos inválidos y conflictos de ID **sin reescribir parcialmente la pieza ni perder los datos locales anteriores**. `verifiedSpecs` siempre queda en `false` al importar un dibujo por cotas desde una copia.
- El panel de copias ahora menciona expresamente los útiles DXF **y los creados por cotas**, y el formulario de herramientas muestra la opción de descarga junto al botón de guardar.
- Pruebas añadidas: `tests/project-backup-custom-tools.test.mjs` y `tests/tool-dxf-export.test.mjs`. Además, `tests/custom-tool-export-browser-smoke.mjs` verifica la descarga/guardado en PC y móvil a través del grupo de pruebas visuales «datos».

Versionado: `PLEGADOX-20261115-R61`, `0.9.37`, caché `plegadox-static-0.9.37-custom-backup-dxf-r61`. La salida DXF no elimina ningún parámetro de la pieza ni modifica la secuencia manual.

## R62 · Reabrir y modificar las cotas de herramientas ya guardadas (15-11-2026)

- En **Herramientas → Crear punzón o matriz introduciendo sus cotas** aparece un selector de herramientas personalizadas almacenadas. El botón **Cargar sus cotas para editar** recupera su forma, altura, longitud, ancho, ángulo, amarre declarado, radio, vástago, cuello y abertura/descentrado V, según el tipo de útil.
- El formulario recalcula y vuelve a visualizar el perfil. Se puede descargar un nuevo DXF ASCII 2D en milímetros desde la pantalla y guardar los cambios.
- **No modifica el ID ni el contorno de la herramienta original:** guardar una versión editada crea otro registro con nueva ID. Así no se alteran silenciosamente las piezas existentes que utilizan la referencia anterior.
- La lista de útiles guardados se renueva después de crear cada referencia. El panel utiliza una disposición de tres columnas en PC y una sola en móvil.
- La prueba `tests/custom-tool-export-browser-smoke.mjs` comprueba en escritorio/iPhone: crear matriz V16, exportar/importar DXF, guardar, volver a cargar cotas, cambiar la anchura, crear una segunda referencia y verificar que la primera sigue intacta.
- Build `PLEGADOX-20261115-R62`, versión `0.9.38`, caché `plegadox-static-0.9.38-tool-revisions-r62`.

**Advertencia:** los dibujos por cotas siguen siendo perfiles 2D paramétricos, sin certificación de radios/amarres/volumetría; no garantizan que un útil diseñado se pueda montar ni que su uso quede libre de colisiones.

## R63 · Actualizaciones sin reinicio sorpresa de la simulación (15-11-2026)

El cambio de controlador del service worker `pwa.js` ya **no invoca `location.reload()`** mientras el operario está programando, reproduciendo un plegado o editando cotas. En su lugar envía el evento `plegadox:cacheControllerChanged`. La pestaña «Acerca de» muestra que se han renovado archivos en caché y remite al botón «Buscar e instalar actualizaciones». El botón verifica que exista una versión más nueva publicada antes de instalarla; conserva las piezas, herramientas y ajustes almacenados.

La prueba `tests/pwa-controller-no-reload.test.mjs` simula la sustitución de un controlador PWA e impide cualquier recarga automática. No altera el chequeo offline, la caché de recursos estáticos ni la capacidad del operador de actualizar deliberadamente.

Build `PLEGADOX-20261115-R63`, `0.9.39`, caché `plegadox-static-0.9.39-safe-sw-r63`.
