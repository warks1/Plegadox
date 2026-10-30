# Auditoría del utillaje · Plegadox

Fecha: 30 de octubre de 2026.

## 1. Documento enviado: MECOS Ibérica 2025/2026 (24 páginas)

El archivo aportado **es un catálogo general de deformación del metal**, no un catálogo de matrices y punzones con referencias y polígonos dimensionados. La **página 3**, titulada *Utillajes de precisión para plegadoras*, nombra la compatibilidad con **Amada, Trumpf, Wila, Promecam, Axial, Mebusa, Bystronic y Ajial** y muestra fotografías de herramientas. El catálogo no publica en esa página un inventario completo de punzones y matrices por referencia, cotas de cada cuerpo, ángulo de apertura V, radio de punta, altura de amarre, tipo de fijación o planos 3D. El resto de páginas presenta otras familias de maquinaria y accesorios.

**Por tanto, NO es correcto afirmar que se ha extraído de este PDF el catálogo completo de los tres fabricantes.** El archivo sirve para acreditar las familias, no para fabricar perfiles exactos.

## 2. Fuentes técnicas adicionales consultadas

- MECOS, *Catálogo general de utillaje 2022* (documentación geométrica de familias Amada/Promecam, Trumpf/Wila y Bystronic/Beyeler):
  https://www.mecos.es/files/productos/utillaje-plegadora/MECOS-Catalogo-General-de-Utillaje-2022.pdf
- TRUMPF, *Catálogo de útiles de plegado 2025 ES* (matrices EV001 y EV001/H de V6, apertura 30°, alturas 100/150 mm):
  https://www.trumpf.com/filestorage/TRUMPF_ES/user_upload/2025_Catalogo_Utiles_plegado_ES.pdf
- TRUMPF, *TruBend 2100 Technical Quote*, herramientas incluidas OW200/K y EVW10/84 / EVW20/84:
  https://www.trumpf.com/filestorage/TRUMPF_US/Landingpages/TruBend_2100/TRUMPF_Inc_TruBend_2100_Technical_Quote_3_11_2025.pdf
- AMADA, catálogo de herramientas semiestándar: punzones 831, 841 W55, 841 W95, 846 W110, 804, 846 W55/H220 y 846 W95/H220:
  https://cdn.amada.eu/fileadmin/Repository/Amada_Tooling_price_list_2021_BENDING1.pdf
- Bystronic, sistemas RF-A y XPT (familias y opciones de amarre; no geometría completa de los perfiles):
  https://www.bystronic.com/usa/en-us/lp/press-brakes-tooling

## 3. Estado real del catálogo cargado

- **TRUMPF:** referencias documentadas OW200/K, EV001, EV001/H, EVW10/84 y EVW20/84.
- **AMADA:** siete variantes de punzón con dimensiones parciales documentadas; dos plantillas de matriz identificadas como provisionales.
- **BYSTRONIC:** cuatro plantillas de demostración del sistema RF-A / Beyeler; no se presentan como artículos con cotas verificadas.
- **GENÉRICAS:** primeras matrices V6, V10, V12, V16, V22, V24, V32, V35, V40 y V50 y punzones recto/agudo/pata de cabra, sin afirmar que correspondan a una referencia comercial.

La base de datos está en `catalog.js`. Los selectores en la cabina sí modifican `die` y `punch` en el modelo de pieza; la altura y abertura ya se consumen en la geometría de demostración. Los polígonos visibles son parametrizados y se etiquetan como **provisionales** incluso cuando se han verificado parcialmente sus dimensiones. No representan CAD fiel, ni garantizan colisiones, tonelaje o amarre en una máquina física.

## 4. Criterio técnico para ampliar el catálogo

Cada referencia nueva debe almacenar, como mínimo, código exacto, fabricante, familia de amarre, altura total y de trabajo, perfil transversal acotado (vértices/arcos/radios), ángulo, diámetro de punta o V de matriz, longitudes de segmentos, capacidad de carga y fuente/página. El programa debe distinguir la marca del utillaje del **sistema de amarre que monta la Trumpf V85 real**.

No se marcará una herramienta como 'geometría verificada' por disponer únicamente de una foto o una silueta inventada.

## 5. Regresión y publicación

- UI aplicada a partir del **boceto 2** elegido: oscuro, azul eléctrico, biblioteca por marca en el lateral derecho, lista de plegados a la izquierda, simulación central.
- Pruebas automáticas: inicio con chapa plana, ángulos positivos y negativos, secuencia, catálogo, y verificación de navegador Chromium con capturas de escritorio y móvil.
- GitHub Pages: https://warks1.github.io/Plegadox/
