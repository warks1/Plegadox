# PlegadoX R37 · Contacto frontal real del tope de TrumaBend V85

Revisión del 15/11/2026 · Rama R37 en revisión. **Software de simulación: NO sustituye el programa CNC ni autoriza plegar una pieza sin comprobar el montaje real.**

## Investigación documental

1. TRUMPF, *TrumaBend V-Series / Increased Profitability in Bending*: https://cdn.vantomachines.com/brands/TRUMPF/TrumaBend-V-Series_TRUMPF_Brochure.pdf. El fabricante explica que la pieza permanece a la altura de trabajo y se presenta frente al tope trasero. Los dedos traseros tienen **tres niveles** y son ajustables mediante X (profundidad) y R (altura). El contacto contra una cara de parada y el apoyo superior de un escalón son dos métodos distintos, no se deben confundir.
2. TRUMPF, *Operating Manual TrumaBend*, en https://www.scribd.com/document/761106573/Operating-Manual-TrumaBend. Apartado **SHIFT GAUGE**: programar un dedo «to lie on» o «to be stopped at». Confirma que apoyo horizontal y parada frontal son **modos diferenciados**, programables según la pieza; no viene impuesto por el dedo seleccionado. Hay ejemplos de ROTATE para resolver colisiones por presentación. Este manual consultado no acredita la exactitud de la fotografía de los dedos de la V85 individual.
3. TRUMPF, *Operator's manual TruBend Series 2000 (B35), Safety 1-14*: https://www.trumpf.com/filestorage/TRUMPF_US/user_upload/PIM_TruBend_Serie_2000_B35_us_V3.pdf. Advierte que un posicionamiento erróneo puede causar **colisión entre la pieza y el dedo**. Es un modelo TRUMPF posterior, referencia de seguridad, no ficha geométrica de la V85 de 2006.
4. Ficha V85S 1998 de segunda mano: https://www.tbm-maschinen.de/gallery/TrumaBend%20V85%2C%20Bj.1998%20technische%20Daten%20engl.pdf. Confirma ejes traseros X/R y ajuste seguro de dedos desde el frontal; **no se transfieren límites de carrera ni contornos CAD de esta otra máquina** a la V85 real del usuario.

## Diagnóstico reproducido: omega de demostración

Chapa S235, e=2 mm; alas de 50 mm; cuatro ángulos [90, -90, -90, 90]; orden de golpe **1, 2, 4, 3**. NO se alteran estas cotas ni el orden.

| Golpe físico | Pliegue | Apoyo previo antes de R37 | Defecto | Cara correcta R37 |
|---|---|---|---|---|
| 1 | P1 | Extremo libre, X=50 | Sin incidencia nominal | Cara frontal en X=50 |
| 2 | P2 | Vértice interior sobre fibra X=50 | Se solapaba aproximadamente e/2 con el dedo | **Cara exterior del ala vertical, X=51** |
| 3 | P4 | Extremo libre, X=50 | Sin incidencia nominal | Cara frontal en X=50 |
| 4 | P3 | Vértice interior sobre fibra X=50 | Se solapaba aproximadamente e/2 con el dedo | **Cara exterior del ala vertical, X=51** |

El desplazamiento **e/2** corresponde al espesor NOMINAL de la chapa en la sección ilustrativa y a un lado frontal accesible (+X), **no** es una corrección de X CNC universal. Cambian el plano de parada y el registro geométrico, no la longitud nominal BL de 50 mm ni el desarrollo plano. Los radios/bulging reales podrían modificar la distancia de contacto: medir y calibrar en taller.

## Cambios del código

- `machine-config.js`: Stop 1 y Support 2 conservan contornos de escalones en su orientación completa, pero ambos actúan como **parada frontal vertical** al seleccionarlos en la simulación. La repisa de Support NO se activa automáticamente como asiento horizontal.
- `backgauge-placement.js`: `gaugeFoldedFlangeFace` reconoce un vértice unido a un ala vertical y un tramo que sale hacia la izquierda. Si el perfil es accesible, el tope se sitúa sobre la **cara exterior de la chapa**, `X=fibra+e/2`. El comprobador distingue apoyo de canto libre, cara exterior de ala plegada y vértice interior no accesible. Comprueba solape de cara frontal y altura útil.
- `technical-section.js`: los objetivos y transiciones de X/R de los golpes 2 y 4 se calculan de forma coherente desde el estado anterior al plegado, sin perseguir el ala en movimiento ni teletransportar el tope.
- `gauge-sequence-review.js`, `app.js`: el aviso y la interfaz reconocen el contacto frontal de alas plegadas y no vuelven a mostrar «chapa sobre primer escalón» como si fuera parada de contacto.
- Pruebas: `tests/v85-gauge-r37.test.mjs`, regresiones de contactos frontal, contorno completo, retirada, orden, selección manual y navegador PC/móvil.

## Limitaciones abiertas

El contorno sigue siendo un **croquis parametrizado de las cotas Cybelec**, no una medición CAD OEM de los dedos de esta V85. Se requiere el dibujo original completo y el montaje real para verificar colisiones en volumen 3D con toda la máquina; revisar también radios, huelgos, orientación de la pieza, X/R/Z y retirada CNC. Si una operación necesita realmente apoyar sobre repisa, debe programarse como **modo horizontal distinto**, con apoyo y colisiones evaluados; nunca inferirse únicamente al elegir el dedo Support.

**Seguridad:** una detección sin aviso en el visor 2D no equivale a autorización física ni a garantía de ausencia de colisiones.
