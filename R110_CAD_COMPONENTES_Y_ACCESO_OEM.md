# PlegadoX R110 · Fuentes CAD de útiles, amarres y máquina
**Revisión: 16/11/2026 · 0.9.84**

## Qué existe y qué no

La biblioteca de procedencia registra **17 fichas** y **11 enlaces directos
DXF/ZIP verificados desde páginas de sus fabricantes**. También contiene
fuentes que requieren correo/registro, catálogos de familia y datos
posiblemente accesibles dentro de una instalación licenciada de
BySoft CAM. Los enlaces no equivalen a haber descargado/importado bytes;
la búsqueda directa de archivos binarios desde esta sesión no ha
permitido recuperar y analizar sus contornos.

PlegadoX NO tiene todavía:
- CAD de trancha, mesa, mordazas, dedos, adaptadores y soportes exactos
  de las dos máquinas, con datums de montaje completos y ocupación Z.
- Una conversión validada de las referencias históricas de máquina a
  modelos CAD de su número de serie.
- Modelos de los recorridos CNC reales Y1/Y2/X/R/Z1/Z2 o ciclos de
  flip de chapa en coordenadas de máquina.
- Autorización técnica para certificar colisiones y ejecutar piezas.

## Cinco referencias adicionales del inventario
- UKB 22.010 · portamatriz H51,5 mm, ancho 60 mm,
  1000 kN/m: https://daten.ukb-gmbh.de/dxf/zip/22010.DXF.zip
- UKB 50.430 · adaptador superior Amada → Trumpf/WILA/LVD I,
  H67 mm, 1000 kN/m:
  https://daten.ukb-gmbh.de/dxf/zip/50430.DXF.zip
- UKB 22.308 · matriz V8/30°, H60, R0,8, 350 kN/m:
  https://daten.ukb-gmbh.de/dxf/zip/22308.DXF.zip
- SOCLAM 40.06/34 · portamatriz de doble V,
  H34 mm, de una familia con variantes H39/H55/H75,
  DXF accesible desde ficha:
  https://www.soclam.com/produit/support-matrice-amada-ref-40-06/
- WILA TSU-024 · adaptador H73, ancho 49,5 mm,
  New Standard → European Style I, DXF requiere MyWILA/correo:
  https://www.wilatooling.com/products/press-brake-tooling/tooling-options/tool-extenders-and-adapters/tsu-024/

**No copiar la cota H55 del 40.07 a la referencia 40.06/34.**
**No aplicar el adaptador UKB 50.430 como si fuera la propia
mordaza de la Bystronic del usuario.**

## Posible fuente interna de CAD de máquina

BySoft CAM documenta modelos `BackStopModels`,
`BendingMachineConfigs`, `BendingMachines`, `UpperTools`,
`LowerTools` y `VrModels` (3D). Fuente:
https://bystronic-mediacenter.picturepark.com/v/uSPrfoiG/

Es una vía para recuperar contornos reales SI los modelos corresponden
a la máquina y están disponibles legalmente en el sistema licenciado;
no confirma que estén instalados ni que puedan exportarse a STEP/DXF
desde cualquier versión. Pedir al fabricante/servicio técnico el
ensamblaje por identificación exacta de máquina sigue siendo necesario.

TRUMPF también declara disponibilidad de datos de herramientas
digitalizados y, en el caso de útiles rectificados, entrega de datos
3D actualizados:
https://www.trumpf.com/en_INT/products/services/services-machines-systems-and-lasers/tools/bending-tools/

WILA proporciona dibujos de perfiles DXF mediante MyWILA o
descarga solicitada:
https://www.wilatooling.com/products/press-brake-tooling/tooling-options/tool-extenders-and-adapters/tsu-024/

## Nuevas reglas en el software

1. Inventario de 17 fuentes en `cad-evidence.js`, con fabricante,
   modelo exacto, amarre, URL oficial y disponibilidad real.
2. Selector **Preparar importación CAD**: orienta el fichero
   correcto al formulario de punzón/matriz o máquina, borra el archivo
   anterior y reinicia el amarre incompatible. NO importa ni aplica
   un CAD sin que se seleccione el archivo OEM.
3. El verificador documental combina cotas de la **misma** referencia
   (tipo, fabricante, código, variante, amarre); desestima conflictos
   e impide sustituir un contorno por otro que sólo tenga el mismo
   radio o altura.
4. Los importadores guardan perfiles DXF bajo revisión de configuración
   de máquina, pero los datums X/Y/Z siguen siendo declarados.
5. Amarre/portamatriz y adaptadores se inspeccionan como objetos
   independientes en el motor volumétrico cuando existe un CAD real.

## Pruebas

`tests/cad-evidence-r109.test.mjs`: **9/9 pruebas focalizadas**
comprobadas tras ampliar a 17 fuentes.

La sesión R109 anterior también comprobó 33 invariantes del motor
geométrico sobre sólidos sintéticos de amarres/adaptadores (33/33).
Estos ensayos son verificaciones internas, no `npm test` completo ni
simulación 3D de un ciclo real.

## Criterios para completar de verdad cada pieza
- Referencia fabricante e identificación de variante de montaje.
- DXF/STEP/OEM o geometría reconstruida a partir de dibujo
  **totalmente** acotado y cerrado; origen y orientación contrastados.
- Longitud/posicionamiento Z; amarre y adaptador exactos.
- Medidas de ejes e identificación de máquina concreta.
- Registro de cada cota usada, procedencia y conflictos.
- Comprobación del CAD en sección, en volumen y en una prueba física
  controlada; hasta entonces, `verified=false`.

**Conclusión:** el inventario y los importadores se han ampliado,
pero sería incorrecto afirmar que todo el CAD ya está conseguido.
