# R38 · Eurostamp · Biblioteca de herramientas y CAD original

Fecha de revisión: 15-11-2026. Este documento registra datos de fichas públicas de Eurostamp, **no incorpora al repositorio archivos CAD propietarios ni inventa contornos**.

## Disponibilidad en PlegadoX

- **19 punzones**: 7 de 30° (rectos, H80 a H200), 6 de 88° (recto + patas de cabra de H88,5 a H200), 6 de 90° (catálogo histórico 2017, rectos y patas de cabra).
- **10 matrices**: 3 de 30° (V6, V10, V20), 3 de 85° (V20, V32, V40), 4 de 88° (V16, V20, V25).
- En el catálogo de la cabina aparece **Eurostamp** como filtro; cada ficha ofrece el enlace de fuente y botón **Vincular CAD**.
- Todas las fichas tienen `profileAccuracy: 'provisional'`, `cadStatus: 'pendiente-DXF-original'` y `cadVerified:false` hasta importar el CAD por referencia. El croquis paramétrico visible **NO** es el útil de fabricante.
- La aplicación no puede obtener por su cuenta el CAD publicado en el sitio sin una copia accesible. El usuario debe entrar en la ficha Eurostamp y descargar su **DXF**, luego importarlo en **Herramientas → EUROSTAMP · Vincular CAD DXF ORIGINAL**. Para referencias 90° sólo hemos comprobado el catálogo histórico; no hay enlace CAD vigente confirmado.
- La geometría DXF importada se registra por **SKU**; no crea herramientas aleatorias ni reemplaza otros fabricantes. La vista 2D/3D y el detector de interferencias 2,5D consumen el contorno real importado a través del motor actual `sectionPunch/sectionDie`. Se guardan los DXF dentro del almacenamiento local **de ese navegador** y no en la nube. Conservar el original fuera del navegador para respaldo.
- Un perfil LINE/ARC/LWPOLYLINE debe ser DXF ASCII 2D de **un solo contorno simple** y `$INSUNITS=4`, en mm. Se rechazan sólidos, SPLINE, BLOCK, contornos múltiples, autointersecciones, elevación/OCS no plana y alturas incompatibles con la ficha. Los DXF oficiales con varias entidades o planos requieren limpieza/exportación a un contorno cerrado, sin reinterpretar su forma.
- Un DXF visual **no acredita** topes, montaje, longitud segmentada, recorrido CNC ni ausencia de colisiones reales. Los punzones Eurostamp sin CAD importado se excluyen de recomendaciones automáticas; siguen disponibles para elección manual como ficha no certificada.

## Referencias

| Herramienta | Ángulo | Referencias incluidas | Geometría |
|---|---|---|---|
| Rectos | 30° | 1056 (H80), 1193/1289/1194 (H104), 1052 (H135), 1086 (H140), 1292 (H200) | DXF en ficha Eurostamp, importar |
| Recto | 88° | 1063 (H104,65) | DXF en ficha, importar |
| Patas de cabra | 88° | 1015 (H88,5), 1014 (H89,65), 1017 (H104,65), 1031 (H165), 1291 (H200) | DXF en ficha, importar |
| Rectos históricos | 90° | 1010 (H66,65), 1021 (H86) | Fuente: catálogo 2017, CAD actual no comprobado |
| Patas de cabra históricas | 90° | 1013 (H89,65), 1016 (H104,65), 1060 (H120), 1174 (H104,88) | Fuente: catálogo 2017, CAD actual no comprobado |
| Matrices | 30° | 3280 (V6 H100), 3262 (V10 H55 Wila), 3265 (V20 H55 Wila) | DXF en ficha, importar |
| Matrices | 85° | 3091 (T/V20 H80), 3111 (1V/V32 H55), 3112 (1V/V40 H55) | DXF en ficha, importar |
| Matrices | 88° | 3163 (autocentrante V16 H60), 3057 (T/V20 H120), 3165 (autocentrante V25 H60), 3058 (T/V25 H120) | DXF en ficha, importar |

En las fichas catalogadas sólo se codifican cotas publicadas. **No se inventan** radios de hombros, ángulos de cuello, anchura exterior, profundidad de garganta, anclajes ni longitudes no acreditadas. El campo `tip` guarda diámetro: radio R0,8 equivale a Ø1,6.

## Fuentes de fabricante y archivo

- Catálogo oficial Eurostamp de punzones 30°: https://eurostampsrl.it/en/punches-30
- Ficha 1193 (30°, H104): https://eurostampsrl.it/en/10780/punches-30/1193-punch-30
- Ficha 1292 (30°, H200): https://eurostampsrl.it/en/10814/punches-30/1292-punch-30
- Ficha 1014 (88°, pata de cabra H89,65): https://eurostampsrl.it/en/10547/punches-88-amada/1014-punches-88
- Ficha 1015 (88°, pata de cabra H88,5): https://eurostampsrl.it/en/10556/punches-88-amada/1015-punches-88
- Ficha 1031 (88°, pata de cabra H165): https://eurostampsrl.it/en/25415/punches-88-amada/1031-punches-88
- Ficha 1291 (88°, pata de cabra H200): https://eurostampsrl.it/9760/punzoni-88-amada/1291-punches-88
- Ficha 3262 (30°, Wila V10): https://eurostampsrl.it/en/11281/1v-dies-30/3262-wila-1v-dies-30
- Ficha 3111 (85°, V32): https://eurostampsrl.it/en/13212/1v-dies-85/3111-1v-die-85
- Ficha 3163 (88°, V16): https://eurostampsrl.it/en/11184/1v-self-centering-dies-88-amada/3163-1v-dies-self-centering-dies-88
- Eurostamp 2017 archivado: https://www.bendis-eng.com/kataloglar/Eurostamp_Catalogue_2017.pdf

### Compatibilidad TRUMPF V85

Aunque las herramientas estén en el catálogo Eurostamp, muchas corresponden a **Amada/Promecam o Wila**. No se afirma intercambiabilidad directa con la Trumpf TrumaBend V85. Deben comprobarse mordazas, adaptadores, hombros de montaje, segmentación en Z, carrera Y y referencia de alturas, así como recorrido y volumen completo de los topes. Las alarmas de ausencia de colisión 2D/2,5D no autorizan fabricación.
