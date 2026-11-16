# PlegadoX R124 · Perspectivas avanzadas y controles de simulación
**Versión:** 0.9.98 · **16/11/2026** · **Rama:** main

## Nuevos controles funcionales
En el visor de máquina, botón **«⚙ Opc.»** y desplegable **«Perspectivas y opciones de simulación»**. El panel permanece fuera del lienzo para no tapar el punzón, la matriz o el apoyo del dedo.

### Vistas predefinidas
1. Perfil lateral 2D.
2. Industrial 2,5D.
3. Perspectiva suave.
4. Perspectiva profunda.
5. Perspectiva elevada 2,5D.
6. Sección técnica en milímetros.

La profundidad y la inclinación ajustables afectan exclusivamente la **extrusión decorativa** del cuerpo de punzón, matriz, chapa y tope. La cara frontal de contacto no cambia ni un milímetro; el cálculo de colisiones, la secuencia y la geometría física no utilizan este vector de cámara. **No es una cámara CAD 3D libre.** La pieza tiene su visor orbital 3D independiente.

### Capas y aspecto
Nueve selectores de visibilidad: chapa, punzón, matriz, trancha, dedo de tope, punto de apoyo, cuadrícula métrica, referencias de ejes y rótulos. Tres ambientes: taller industrial, plano técnico oscuro, contraste elevado. La rejilla y la cruz visual de V son **ayudas ilustrativas**, NO los ejes calibrados X/R/Z1/Z2 ni datums CNC.

### Cámara y operación
- Zoom variable entre 0,4 y 5,0; profundidad entre 0,4 y 2,1; inclinación entre 0,45 y 1,9.
- Desplazamiento de cámara arriba, abajo, izquierda y derecha; centrar, resetear y recordar las preferencias al recargar. Modo de preferencias local «plegadox:visual-options:r124».
- Selección directa de fase del ciclo: posicionar, aproximación, trabajo, retorno y cambio de golpe.
- Avanzar / retroceder entre operaciones sin reordenar pliegues ni cambiar el signo. Cada salto pausa Play para evitar movimientos inesperados.
- Captura PNG con la vista actual; sin enviar datos al servidor.
- Botón **⛶ Pant.** en el propio visor: pantalla completa nativa donde esté disponible; en iPhone y dispositivos que no la ofrezcan, modo inmersivo CSS con salida desde el mismo botón o Escape. Mantiene controles dentro de pantalla y repinta la escena después de redimensionar.
- El módulo nuevo se incluye en la caché offline del PWA para evitar pantalla en blanco cuando no hay conexión.

### Seguridad y límites
Los avisos de colisión de punzón, matriz y tope permanecen activos incluso con sus capas ocultas. La etiqueta **«PERSPECTIVA 2,5D · CAD SIN VERIFICAR»** permanece dentro de la imagen también al desmarcar «Rótulos». La perspectiva, el acabado industrial y la captura no homologan utillaje, parámetros CNC ni recorridos reales de la máquina.

## Pruebas
- `tests/machine-perspective-options-r124.test.mjs`: presets, vectores de proyección, tolerancia de preferencias, ejes ilustrativos, controles y módulo offline.
- `tests/machine-perspective-r124-browser-smoke.mjs`: ejecución Playwright en iPhone 390px, tablet 768px y PC 1440px. Comprueba que la perspectiva y las capas sí modifican los píxeles, que se generan PNG, que el salto de fase conserva la pieza y que no hay desbordamiento horizontal.
- `.github/workflows/perspective-options-r124.yml`: genera capturas reproducibles de vistas profundas, capas e inmersivo y las adjunta como artefactos.

**Prueba visual independiente confirmada:** https://github.com/warks1/Plegadox/actions/runs/43969455208

## Próximas necesidades de ingeniería
El simulador en perspectiva sigue siendo 2,5D ilustrativo. Para convertir la máquina completa en un gemelo CAD 3D real hace falta una escena volumétrica con piezas STEP/DXF OEM completas, orientación y posicionamiento Z de la herramienta montada, topes y amarres reales y cinemática CNC de la plegadora concreta. **No etiquetar como libre de colisiones de máquina sin estas comprobaciones.**
