# Plegadox — control y simulador de plegado

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


## R30 · Planificación automática multi-interferencia con control manual (11-11-2026)

**Objetivo:** no obligar al operario a ordenar cada pliegue a mano. Tras editar la pieza, el asesor compara automáticamente secuencias completas y, en modo **Automático**, aplica **solo mejoras detectadas** en los barridos geométricos 2D que no incrementen los riesgos graves de la pieza. Cuando se ha guardado ya una pieza, el primer arranque solo **analiza y propone**: no la reordena silenciosamente al abrir la aplicación. Se puede pulsar **Recalcular colisiones y orden** o activar de nuevo Automático.

- **4 golpes o menos:** se enumeran y examinan **todas las permutaciones** con el mismo muestreo de chapa, punzón/matriz y tope; para 4 son 24. A partir de 5 se usa una búsqueda limitada (con informe de cobertura) para evitar bloquear móviles.
- **Chapa:** inspección de cruces, solapes, contactos y holguras entre alas a lo largo de cada secuencia. Los cruces del perfil final se indican como **no corregibles solo con otro orden**.
- **Punzón y matriz:** se emplea `inspectSequenceTools` sobre los perfiles de herramienta disponibles y la orientación seleccionada, no dibujos sueltos. Las penetraciones se priorizan por delante de avisos leves.
- **Tope trasero:** se usa `scanGaugeSequence` para detectar posibles penetraciones, chapa por detrás del tope, falta de asiento, referencia interior y holgura insuficiente.
- **Automático/Manual:** los botones para subir/bajar operaciones y los puntos de orden del editor táctil/ratón **siguen disponibles**. Cualquier reordenación explícita pone **Manual**, persistente en este dispositivo; ningún cálculo posterior puede sobreescribirla. Se conserva un botón para aplicar expresamente una alternativa.
- **Progreso y cancelación:** la búsqueda libera el hilo de la interfaz entre secuencias. Si cambian ala, ángulo, herramientas, topes o la propia secuencia mientras calcula, el resultado obsoleto se descarta.
- **Conservación de proyecto:** se mantiene el formato de piezas, ángulos, signos, material, herramientas y posiciones de tope. La elección automática cambia solamente `order`. La librería de piezas guardadas no se sobrescribe hasta que el operario guarde su revisión.

**Alcance industrial pendiente:** el cribado es **DISCRETO y 2D**, y varias geometrías siguen siendo provisionales. No se puede afirmar que un orden esté libre de colisiones físicas en una TruBend V85 (falta CAD acotado de todos los útiles, amarres y dedos, detección 3D del volteo, trayectorias reales X/R/Z, piezas con recortes, límites de carga y validación de máquina). Una secuencia con cero avisos 2D es una **preselección**, no un programa CNC seguro ni autorización de fabricación.

La omega 50/50/50/50/50 conserva la posibilidad de 1→2→4→3. La numeración P1…P4 describe los pliegues sobre el perfil; G1…G4 indica su orden temporal. El programa no fuerza ninguna secuencia específica por tratarse de una omega: usa el mismo cribado que con cualquier pieza.
