# R69 · Mantener pantalla elegida y completar batería de pruebas

**Sin modificar imagen, estilo, colores, disposición o componentes del Boceto 1.**

Se corrigen dos pruebas heredadas de R52 que todavía exigían
`#machineArt` y la escena SVG, pese a la restauración del PNG aprobado.
Ahora verifican `#photo`, su archivo y dimensiones originales sin alterar
la pantalla que ve el usuario.

La configuración Trumpf V85 evita avisos falsos en el entorno Node al no
disponer de `localStorage`: utilizará los valores de fábrica sin confundir
un test sin navegador con un error real de almacenamiento.

El 2D y 3D, el control de topes, el orden manual y la lógica de plegado no se
han modificado en esta revisión.

Comprobar en GitHub Actions antes de dar esta revisión por verificada.
