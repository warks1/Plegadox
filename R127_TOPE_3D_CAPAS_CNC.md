# PlegadoX R127 — Tope tridimensional coherente, capas y captura orbital

Fecha: **17 de noviembre de 2026** · Versión: **0.9.101**

## Implementado

- **Color 3D real del tope:** deja de dibujarse siempre naranja. Respeta el semáforo 2D: verde cuando la sección no detecta interferencias y el apoyo está evaluado; naranja cuando faltan datos, hay holgura o apoyo inválido; rojo cuando hay penetración detectada en 2D.
- **Dedo sin Z OEM:** se representa con **envolvente semitransparente y línea discontinua**. El ancho de la chapa NO se presenta como el ancho físico del dedo. El mensaje visible recuerda que la ocupación Z no está medida.
- **Contraste Z de perfiles CAD importados:** si la Z declarada para un dedo queda completamente fuera de la banda transversal de la chapa, el indicador volumétrico pasa a naranja por **apoyo imposible** (aunque el cálculo XY produzca una coincidencia). No se declara una colisión 3D entre prismas que no se encuentran en Z. La alerta 2D original se conserva como evidencia independiente. Si ambos intervalos Z se cruzan, se informa la longitud compartida sin afirmar certificación.
- **Capas compartidas:** mostrar/ocultar chapa, tope, punzón, matriz o trancha en las opciones de la máquina afecta ahora también al visor volumétrico. La ocultación es meramente gráfica: ningún aviso ni colisión deja de calcularse.
- **Captura PNG del modo activo:** «Guardar captura» exporta la imagen del lienzo 3D cuando se está orbitando en 3D y la vista 2,5D cuando se ha vuelto a ella. Etiqueta el nombre de forma inequívoca.

## Ensayos

- `tests/gauge-volume-r127.test.mjs`: profundidad Z declarada, no solape, colores, transparencia, filtros visuales, actualización y compatibilidad.
- `tests/gauge-volume-r127-browser-smoke.mjs`: Galaxy Chrome emulado, ocultación de tope con recompuesto de la malla, permanencia de avisos, captura de PNG volumétrico.
- Regresión geométrica y suites generales en GitHub Actions.

## Pendiente de CNC / geometría de máquina real

La Trumpf V85 y el utillaje importado sólo pueden validarse de manera industrial cuando existan dimensiones de ubicación transversal Z y anchura de los **dos dedos**, planos CAD definitivos de trancha, mesa, abrazaderas y soportes, cotas reales de amarre y calibración de ejes X/R/Z1/Z2/Y1/Y2, y recorridos CNC medidos (incluido volteo/sujeción). Los modelos son prismáticos 3D a partir de perfiles 2D, **NO** constituyen sólidos STEP OEM comprobados ni aprobación de seguridad para operar.
