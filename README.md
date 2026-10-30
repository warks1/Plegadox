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
