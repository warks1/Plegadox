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
