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


## Orientación del tope trasero Support (corrección visual)
La **vista de perfil del Tope Support nº 2** se muestra espejada
horizontalmente respecto al croquis original, según la referencia
aportada por el operario. Stop nº 1 conserva su orientación previa.
La inversión se calcula una sola vez en `gaugeOutline(values,2)`,
y la utilizan la pantalla **Máquina**, la presentación de la plegadora
y el contacto esquemático con la chapa. Las cotas L1–L6, Ox/Oz,
referencias y configuración almacenada **no cambian**.
Los perfiles siguen siendo esquemáticos, no CAD certificado.


## Diagnóstico de contacto realista del tope (revisión de vídeo 01-11-2026)
El perfil del **Stop 1 / Support 2** se compara ahora con la chapa durante
la secuencia usando un **cribado de interferencia en sección 2D**. Si la
silueta del dedo invade la fibra de chapa o no queda holgura suficiente
por espesor, el programa desactiva el indicador verde de apoyo, colorea
el tope en advertencia y explica la posible interferencia. El contacto
legítimo del extremo de chapa con la cara definida se trata aparte.
La barra trasera se dibuja a partir del extremo posterior del dedo;
ya no empieza atravesando su propio cuerpo desde la cara de contacto.
El cálculo NO incorpora movimientos reales de ejes ni asegura holgura 3D.
En todos los golpes se mantienen las cotas nominales y la referencia X
original, sin desplazar automáticamente el dedo para esconder avisos.
