# PlegadoX R109 · Inventario CAD y conciliación de cotas
**Fecha:** 16 de noviembre de 2026

## Objetivo
Buscar contornos DXF/3D y dimensiones de fabricantes para los componentes
que pueden interceptar chapa en una plegadora hidráulica, y construir una
biblioteca utilizable por el motor 2,5D sin confundir planos de otra versión
de máquina con el montaje del propietario.

## Descargas CAD directas localizadas
Estos enlaces son páginas y archivos publicados por los respectivos
fabricantes. La biblioteca registra ahora **11 enlaces directos a archivos CAD
DXF/ZIP y 16 fuentes identificadas** (5 adicionales incluyen soportes,
adaptadores, matrices y fichas que exigen acceso o descarga manual).
**PERO NINGÚN DXF DE ESTOS ENLACES ESTÁ INTEGRADO POR DEFECTO NI
CERTIFICADO PARA LAS DOS MÁQUINAS**. Los ZIP deben descomprimirse y los DXF necesitan
revisión de escala, referencia, topología, posición Z y montaje.

| Fabricante y referencia | Útil | Archivo o página CAD | Advertencia de compatibilidad |
|---|---|---|---|
| Eurostamp 1015 | Punzón pata de cabra 88°, H88,5 | https://eurostampsrl.it/dxf/1015.dxf | Verificar amarre y pieza exacta |
| Eurostamp 1322 | Punzón pata de cabra 85°, H120 | https://eurostampsrl.it/dxf/1322.dxf | **No** confundir con Eurostamp 1015 |
| Eurostamp 3041 | Matriz de aplastado V8/30°, H105 | https://eurostampsrl.it/dxf/3041.dxf | Herramienta de aplastado, no V simple |
| UKB 22.316 | Matriz V16/30° H60 | https://daten.ukb-gmbh.de/dxf/zip/22316.DXF.zip | Soporte de UKB; ZIP |
| UKB 26.221 | Matriz V60/78° H90 | https://daten.ukb-gmbh.de/dxf/zip/26221.DXF.zip | Amarre **LVD**, no Promecam |
| Mate 010.153 | Punzón 88° H66,5 | https://www.mate.com/downloads/PBT_DXF/BTS/010.153FA.dxf | Equivalencias de referencia no son cotas idénticas |
| SOCLAM 2012_88 | Matriz reversible V6/V10 | https://www.soclam.com/wp-content/uploads/2026/05/2012_88.dxf | Soporte 40.06/40.07 |
| SOCLAM 2015_88 | Matriz reversible V16/V25 | https://www.soclam.com/wp-content/uploads/2026/05/2015_88.dxf | Soporte 40.06/40.07 |

### Ampliación de referencias de adaptadores y soportes

- **UKB 22.010** · portamatriz de 1-V, H51,5 mm y ancho 60 mm,
  1000 kN/m; descarga del fabricante:
  https://daten.ukb-gmbh.de/dxf/zip/22010.DXF.zip
- **UKB 50.430** · adaptador superior tipo Amada hacia Trumpf/WILA/LVD I,
  H67 mm, 1000 kN/m; descarga:
  https://daten.ukb-gmbh.de/dxf/zip/50430.DXF.zip
- **UKB 22.308** · matriz V8/30° H60, R0,8 y 350 kN/m; descarga:
  https://daten.ukb-gmbh.de/dxf/zip/22308.DXF.zip
- **SOCLAM 40.06/34** · soporte bajo reversible de 34 mm, 100 T/m,
  DXF ofrecido desde https://www.soclam.com/produit/support-matrice-amada-ref-40-06/
  (sin enlazar un archivo concreto cuya dirección no esté verificada)
- **WILA TSU-024** · adaptador H73 y ancho 49,5 mm, hasta 100 t/m;
  plano DXF solicitado por correo o en MyWILA:
  https://www.wilatooling.com/products/press-brake-tooling/tooling-options/tool-extenders-and-adapters/tsu-024/

Esta lista NO acredita que ninguno de esos adaptadores esté instalado
en la Trumpf V85 o la Bystronic del taller. La existencia de un CAD OEM
de otra variante sólo demuestra la geometría de ESA variante.

### Vía de recuperación de modelos de máquina existentes

La guía de BySoft CAM de Bystronic describe las carpetas de datos
`BackStopModels`, `BendingMachineConfigs`, `BendingMachines`,
`UpperTools`, `LowerTools` y `VrModels` (modelos 3D). Si existe una
instalación de BySoft CAM con modelos licenciados de la máquina concreta,
es preferible obtener de allí los datos autorizados antes que reconstruir
la trancha y los topes desde cotas históricas. No se han obtenido estos
ficheros internos, y los datos de terceros pueden estar sujetos a licencia.

El fichero `cad-evidence.js` registra 16 fuentes: las 11 descargas
directas, el catálogo Bystronic/Beyeler SOCLAM, dos fichas históricas
de máquina y dos adaptadores/soportes que exigen paso manual. La biblioteca `catalog.js` ya contiene **otras** referencias
WILA, SOCLAM, AMADA, MECOS, CONIC, etc.; se mantienen, sin inventar DXF
no descargados. Algunas descargas WILA requieren acceso a MyWILA.

### Fuentes de montaje y datos de máquina
- TRUMPF TrumaBend serie V (ficha): https://www.mteg-maschinen.de/fileadmin/mteg_Upload/03_TRUMPF_Prospekte_mteg/TrumaBend-V-Series_TRUMPF_Brochure.pdf
- WILA, diferencias entre vástagos New Standard, American y Promecam:
  https://www.wilatooling.com/knowledge-innovation/knowledge-articles/tool-tang/
- SOCLAM, matrices con soporte 40.06/40.07:
  https://www.soclam.com/produit/matrice-amada-a-2-ves-a-88/
- SOCLAM Bystronic/Beyeler 2017:
  https://soclaform.fr/wp-content/uploads/2017/12/2017-SOCLAM-BYSTRONIC-BEYELER.pdf
- Bystronic AFM EP 31-100, ficha de unidad usada 2007 (NO confirma el
  modelo exacto del propietario):
  https://zebramachinery.com/product/bystronic-ep-31-100/

Los 2050 mm nominales de la ficha V85 de fabricante no sustituyen
los 2040 mm introducidos para la unidad del taller, ni las cotas
históricas de 2007 hacen identificable la máquina Bystronic sin placa.

## Reconciliar medidas parciales
`reconcileCadDimensions` combina sólo datos del mismo **fabricante +
referencia + variante + tipo + amarre**; conserva fuente por cota:
- Si dos documentos distintos publican medidas distintas del mismo campo
  fuera de la tolerancia seleccionada, se retira ese campo de la geometría
  conciliada y se registra el conflicto. **No se promedia.**
- No se infiere un radio faltante a partir de una referencia equivalente.
- La conciliación de **contornos** requiere además un datum igual y
  explícito para ambas fuentes, no solamente que la forma parezca igual.
- Una ficha puede tener cotas completas de catálogo y seguir sin
  profundidad Z, montajes, retenidas, tolerancias y recorrido de ejes.

El resultado se marca `COTAS_PARCIALES`,
`COTAS_CONTRADICTORIAS` o `COTAS_RECOPILADAS_NO_CERTIFICADAS`.
**Nunca** `canApproveForMachine=true`.

## Categorías que deben identificarse por máquina (13 posibles)
1. Trancha o viga superior (ram)
2. Mesa inferior
3. Dedo posterior STOP 1
4. Dedo posterior SUPPORT 2
5. Mordaza superior
6. Mordaza inferior
7. Adaptador superior
8. Adaptador inferior/portamatriz (incluida regleta Promecam en Bystronic)
9. Soportes delanteros de chapa
10. Contorno del punzón concreto elegido
11. Contorno de la matriz concreta elegida
12. Desplazamientos X/R/Z/Y con sus límites y velocidades
13. Datums y sistemas de amarre, fijación y posición Z medidos

**Estado:** ninguna de las dos máquinas dispone todavía de un conjunto
CAD OEM completo de montaje acreditado públicamente. La librería guarda
perfiles de máquina por configuración y no los aplica a otra. Útiles CAD
actuales del usuario sólo se cuentan como activos si su ID coincide con
el punzón/matriz realmente elegidos.

## Implementado en R109
- `machine-cad.js` admite ahora 9 tipos de cuerpos (antes 4).
- `volume-engine.js` registra amarres/adaptadores/soportes con **sus
  contornos DXF y Z importados**, sin dibujarlos de la nada.
- `volume-trajectory-review.js` evalúa intersección de la chapa con
  esos cuerpos al disponer de CAD.
- `machine-axis-geometry.js` traslada los amarres superiores con el
  grupo móvil Y y deja los inferiores fijos; conserva límites de
  calibración real y no certifica trayectorias.
- En Ajustes → Geometría CAD aparece el **inventario de fuentes y
  cobertura** y se pueden importar los nuevos tipos de cuerpo.
- `cad-evidence.js` y `cad-evidence-ui.js` muestran las descargas
  y faltas sin confundir enlace web con archivo instalado.

## Verificación y límites
- 6 comprobaciones de reconciliación/documentos ejecutadas y aprobadas.
- 33 comprobaciones focalizadas de integración de 5 cuerpos CAD
  adicionales, posición de amarre, falta de sólidos y choque volumétrico
  con geometría **sintética**; ninguna discrepancia.
- Pruebas de integración en el repositorio:
  `tests/cad-evidence-r109.test.mjs` y
  `tests/machine-extended-cad-r109.test.mjs`.
- **No consta** ejecución exitosa de `npm test` en todo el repositorio,
  ni renderizado real en móvil, ni aprobación de archivos STEP/OEM.
- Faltan los dibujos OEM de trancha, amarres, topes y mesa **de las
  unidades concretas** y la medición/validación de Y1/Y2/X/R/Z1/Z2.
  La web pública no permite completar con certeza esas posiciones
  sólo desde una ficha comercial; solicitar plano OEM por número de
  máquina o tomar medidas reales con la máquina fuera de producción
  y personal cualificado es imprescindible para una certificación.

Ninguna salida R109 autoriza ejecutar un ciclo físico ni generar un
programa CNC certificado sin comprobación de taller.
