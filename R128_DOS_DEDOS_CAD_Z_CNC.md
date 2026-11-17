# PlegadoX · R128 · Dos dedos físicos Z1 y Z2 y barrido CNC por separado

Fecha: **17/11/2026** · Versión **0.9.102** · Rama `feature/r128-dual-gauge-cad-z-axes`

## Motivo
En R127 el modelo volumétrico seguía teniendo un único sólido de tope, incluso cuando la cinemática del control dispone de **dos dedos traseros independientes**. Las referencias «Stop 1» y «Support 2» describen el tipo de contorno, no la cantidad de dedos ni el eje transversal correspondiente. Extruir un único tope a lo ancho de toda la chapa daba **avisos falsos de colisión volumétrica** y podía esconder trayectorias independientes.

## Funcionamiento R128
- Nuevo panel en configuración CAD: selección de sección DXF `Stop` o `Support`, extremos Z mínimos y máximos medidos de **Z1** y de **Z2** en milímetros, referencia de la pose de la simulación, origen documental y confirmación explícita de que la sección de ambos dedos es idéntica.
- La calibración queda vinculada mediante `machineConfigurationKey` a la revisión concreta de máquina. Las cotas de otro montaje no se aplican.
- Se rechazan anchos nulos, ausencias, intervalos solapados, origen documental ausente y perfiles Stop/Support equivocados.
- Si consta CAD DXF del tipo activo **y** ambas bandas Z están declaradas **y** coincide exactamente el tiempo de referencia, aparecen dos prismas diferenciados `gaugeZ1` y `gaugeZ2`, cada uno en su banda real declarada. El antiguo prisma que ocupaba todo el ancho de chapa **no se dibuja ni se comprueba como colisión** en esa pose.
- El diagnóstico de apoyo Z separa Z1 y Z2 y solo concede coincidencia transversal cuando al menos uno cae dentro del ancho de chapa; si ambos están fuera del ancho se muestra naranja por imposibilidad de apoyo.
- `inspectVolumeFrame` revisa por separado interferencias con ambos dedos, `scanVolumeTrajectory` informa los hallazgos por `gaugeZ1` y `gaugeZ2` y `scanAxisCADMovement` desplaza cada sólido con su **propio eje Z1 o Z2** al revisar trazas CAD X/R/Z en intervalos que tienen la chapa inmóvil.
- El visor prismático muestra ambos dedos a la vez, con semáforo y ocultación de capa compartida; sus recorridos relativos de ejes usan el centro real declarado de cada dedo.
- Los barridos CNC modelados también comprueban **Z1 contra Z2** durante desplazamientos simultáneos: puede detectarse un cruce entre los dedos incluso si las posiciones extremas no coinciden. Sigue siendo un análisis geométrico de dos prismas con trayectoria lineal, sin certificación física.
- Las cotas declaradas quedan asociadas a una **huella local del DXF, sus offsets, referencia y montaje**; al sustituir o modificar el archivo se bloquea su aplicación hasta cotejarlo de nuevo.
- Los cambios manuales de golpe/pose fuerzan el redibujado inmediato, sin quedar atrapados por el límite de refresco de Chrome Galaxy.
- Si cambia el golpe o la pose temporal, el montaje Z **no se extrapola** por adivinación. Vuelve el modelo conservador de información insuficiente hasta contar con la traza completa para ese instante.

## Tests
- `tests/machine-gauge-fingers-r128.test.mjs`: comprobación de bandas Z y dependencia de perfil/máquina/pose, persistencia, recuperación, dibujo e interacción con el motor de colisión.
- `tests/machine-gauge-fingers-r128-browser-smoke.mjs`: Chrome Galaxy emulado, creación de perfiles de prueba exclusivos de tests, registro de medidas, comprobación de dos dedos, vuelta a estado desconocido fuera de la pose y recuperación de caché.

## Límites y requisitos para CAD real
Los contornos proceden de DXF importados y su colocación/anchura transversal Z es **declarada** por el operador; la aplicación no conoce ni confirma su montaje OEM físico. El conjunto de dedos puede diferir entre ambos lados: el modo R128 **exige igualdad declarada de sección** para compartir un perfil, en otro caso no fabrica geometría falsa. Tampoco se han introducido centros Z ficticios, inclinaciones, cotas OEM de mordaza ni movimientos CNC no registrados.

El barrido relativo no incorpora interacción con el PLC/relés, aceleración CNC real, sincronización de giro/volteo de chapa o deformación continua ni medida de tolerancias físicas. **No constituye certificación industrial de ausencia de colisiones ni autorización de producción.**
