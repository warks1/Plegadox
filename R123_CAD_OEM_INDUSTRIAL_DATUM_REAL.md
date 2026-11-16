# PlegadoX R123 · Biblioteca OEM ampliada y sección industrial sincronizada
**Versión:** 0.9.97 · **Fecha:** 2026-11-16 · **Estado:** geometría OEM rastreada y parcialmente analizada, máquina NO certificada.

## Cambios integrados
1. **Fuentes oficiales**: diez fichas adicionales de punzones 85° (UKB) y 88° (EUROSTAMP), incluidas patas de cabra normales y altas 1017/1031; URL de artículo y DXF del fabricante, radios, alturas y capacidades documentadas. No se supone escote cuando la ficha no identifica expresamente una pata de cabra.
2. **ALTURA FÍSICA vs ALTURA ÚTIL**: fichas UKB 25.502, 25.403 y 25.504 (30°, V8, V10 y V12) tienen H nominal 100 mm, mientras su plano acotado recoge 120 mm de contorno total con 20 mm de zanco de fijación. El importador coteja 120 con esa evidencia exacta; conserva nominal 100 y zanco 20. No extrapola otros punzones/matrices con 20 o 30 mm de diferencia ni da por validado el datum, la altura sobre máquina o la ocupación del eje Z.
3. **Importador CAD**: lectura de DXF OEM en ZIP y descarte de metadatos macOS; elección manual del DXF, capa y circuito cerrado real; los contornos abiertos y las cotas auxiliares no se convierten artificialmente en piezas de metal. La ficha y la revisión nominal quedan asociadas al perfil importado. Aun con cotas concordantes, montaje y origen OEM no autenticados.
4. **Visualización industrial**: el mismo perfil 2D de matriz/punzón (incluido DXF seleccionado) alimenta sección técnica y simulación de máquina. Acero mecanizado, cantos y sombras, sin modificar polígonos de colisión ni dibujar una V ficticia encima del DXF.
5. **Auditoría remota reproducible**: GitHub Actions recupera DXF públicos y registra SHA-256, capas, circuitos cerrados, cotas extraídas y conflictos; no redistribuye archivos OEM de terceros.

## Resultado comprobado de auditoría CAD (2026-11-16)
**45 enlaces DXF públicos** examinados, **35 circuitos 2D distintos** recuperables, **6 con altura del contorno cotejada** (incluidos tres con zanco inferior documentado) y **0 herramientas montadas verificadas**. Se trata de perfiles 2D, no 45 sólidos 3D instalados. Algunos enlaces requieren acceso o permiten más de un perfil. Los circuitos coincidentes en capas diferentes se deduplican mediante huella geométrica.

Fuente principal para H100/H120/zanco20: catálogo técnico UKB (distribuido por ProgTools), sección de matrices sistema B:
https://www.progtools.se/wp16/wp-content/uploads/2016/09/ukb-progtools-9.pdf
Producto UKB 25.502: https://www.ukb-gmbh.de/en/25502.html
EUROSTAMP 1017: https://eurostampsrl.it/en/10582/punches-88-amada/1017-punches-88
EUROSTAMP 1031: https://eurostampsrl.it/en/25415/punches-88/1031-punch-88

Informe ejecutado: https://github.com/warks1/Plegadox/actions/runs/43965783620

## Lo que NO se puede certificar todavía
- CAD sólido OEM y modelo medido de los dedos de tope, la mesa, la trancha, las mordazas y los portamatrices de las unidades Trumpf V85 y Bystronic concretas.
- Datums de montaje arriba/abajo y cero cinemático X/R/Z/Y; las dimensiones comerciales de catálogo no acreditan cómo está montada una referencia.
- Segmentación longitudinal exacta, salientes de montaje, punzones especiales y recorridos físicos de cada operación.
- Simulación 3D del conjunto con todos los componentes y barridos CNC verificados. La perspectiva de taller continúa siendo 2,5D ilustrativa; los análisis se identifican como modelados y no homologados.

No etiquetar una herramienta como libre de colisión real si alguno de esos datos esenciales no está contrastado. El motor conserva las opciones de orden y utillaje manual.
