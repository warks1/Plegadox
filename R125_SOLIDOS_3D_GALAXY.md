# PlegadoX · R125 · visor volumétrico y rendimiento Galaxy

**Fecha:** 17/11/2026  
**Versión:** 0.9.99  
**Rama:** feature/r125-galaxy-3d-solids

## Cambios realizados
- Botón «◈ Sólidos 3D» en el visor de máquina. Conmutación reversible a la vista 2,5D; sin cambiar piezas, orden ni motor de colisiones.
- Escena tridimensional orbital a partir de los prismas x/y/z existentes en el motor volumétrico. Incluye chapa, punzón, matriz, trancha, mesa y tope, más amarres/adaptadores cuando hay CAD DXF instalado y alineado. Cada contorno se triangula y extruye entre sus posiciones Z, con tapas y caras laterales.
- Cámara orbital táctil: arrastrar, pellizcar, rueda y reiniciar cámara. Los avisos de seguridad existentes no se desactivan.
- Cuando existen poses registradas/programadas Y1/Y2/X/R/Z1/Z2 y mapeo de signos se muestran trayectorias de DESPLAZAMIENTO RELATIVO respecto a la primera pose, nunca ceros CNC inventados.
- Calidad gráfica Automática / Económica / Equilibrada / Alta. Android Chrome con pantalla densa o RAM/hilos limitados usa ratio de lienzo de hasta 1 y menor frecuencia de repintado. iPhone no queda limitado por ser un móvil.
- Se reducen redibujados idénticos producidos por ResizeObserver, y se evita avanzar la simulación mientras la pestaña está oculta.
- Pruebas unitarias sobre mallas, Z, trazas relativas, cadencia gráfica y control offline.

## Cotas y procedencia
Se mantienen las cotas Cybelec que proporcionó el operador. Las longitudes L1–L10 no son por sí solas un contorno CAD. Las cotas de familia disponibles son:
- [Catálogo TRUMPF V Series](https://www.mteg-maschinen.de/fileadmin/mteg_Upload/03_TRUMPF_Prospekte_mteg/TrumaBend-V-Series_TRUMPF_Brochure.pdf): 850 kN, 2050 mm de plegado, 1750 mm entre marcos, garganta 410 mm, carrera 215 mm (365 mm en versiones extendidas).
- [V85 de 2006, Vanto](https://www.vantomachines.com/en/trumpf/trumpf-trumabend-v85-cnc-bending-machine-2006-id10857): anuncio de unidad de 2680 × 2100 × 2375 mm y carrera 215 mm. No es certificado OEM.
- [Catálogo de herramientas TRUMPF](https://www.trumpf.com/en_US/products/services/services-machines-amp-systems-and-lasers/tools/bending-tools/): catálogo y datos de útiles, sujeto a cotejo de referencias y amarres reales.
- [Juego de STEP no oficial EV/EVS/OW](https://cults3d.com/en/3d-model/tool/trumpf-bending-tools-ow-and-ev-evs): recurso de tercero, NO acreditado como OEM, geometría no descargada ni integrada.

## Límites de ingeniería
No se certifican colisiones con esta edición. El visor es una malla de prismas nominales o DXF declarados; no es un ensamblaje STEP completo, usa ordenación de caras en vez de un z-buffer industrial y no hace barrido continuo durante las maniobras de volteo/deformación de chapa.

Para certificar se necesitan perfiles OEM completos y cotas de los amarres, referencias de montaje y altura de útiles, posiciones Z verdaderas, datos de ejes vinculados a cada golpe, ceros CNC, tolerancias, recorridos calibrados y validación de máquina por técnico competente.

Los perfiles de fabricantes distintos nunca se combinan bajo la etiqueta de «certificados». Si se interpolan datos compatibles, la pieza resultante sigue marcada como hipotética.
