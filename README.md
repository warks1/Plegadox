# Plegadox — control y simulador de plegado

**Proyecto nuevo e independiente**. Repositorio inicializado desde cero a partir del material proporcionado por el usuario, sin reutilizar el repositorio Plegar Pro Plus.

## Abrir Plegadox

**Web:** https://warks1.github.io/Plegadox/ (depende de la publicación de GitHub Pages).

Puedes abrir el sitio en ordenador, tablet o móvil. Funciona como aplicación web estática, sin backend y sin instalar dependencias. Se guardan los datos de la pieza en el almacenamiento local del navegador.

## Interfaz aprobada: Boceto 2 · Cabina industrial (v0.2)

![Estado](https://img.shields.io/badge/estado-demostraci%C3%B3n%20funcional-147db8)

Se implementó la disposición oscura elegida: **secuencia de plegado a la izquierda, punzón/matriz/chapa en el centro, biblioteca por fabricante a la derecha y resultados, pieza 2D y pieza 3D en la parte inferior**. Es una interfaz funcional adaptada a móvil, tablet y ordenador; no es una reproducción fotográfica exacta del boceto estático.

- **Herramientas:** selector real Trumpf / Amada / Bystronic / Genéricos, búsqueda por referencia, selección sincronizada con Programación, ficha de medidas y enlace a fuente.
- **3D de utillaje:** visor orbital de modelos paramétricos; se pueden arrastrar o ampliar con gesto táctil/rueda. No se declara equivalencia con CAD de fabricante.
- **Pliegues firmados:** +90° y −90° mantienen sentidos opuestos en la pieza final, y la vista de máquina invierte la presentación de la chapa para los negativos (aún sin simulación física completa del volteo).
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
