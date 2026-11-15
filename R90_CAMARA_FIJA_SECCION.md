# R90 · Cámara fija de sección técnica durante el plegado y volteo

Causa: el visor calculaba escala y centro según los extremos de chapa de CADA fotograma. Una chapa que gira mueve esos límites y el punzón podía aparentar oscilar aunque su cota cinemática permaneciera constante.

Corrección:
- Muestrear y almacenar una **única envolvente métrica** para la pieza completa, incluidos los golpes, retorno y giros de chapa, e invalidarla si cambia la pieza, los útiles, la selección manual de dedos o la máquina.
- Aplicar el mismo encuadre fijo a la sección 2D y a los marcadores visuales de advertencia; los topes no cambian su posición real.
- Conservar zoom/pan manuales, selección del orden y fases de carrera.
- Añadir pruebas de alcance del encuadre con Omega y caja, y estabilidad en píxeles de la cota de punzón durante cada volteo.

**Alcance**: solo estabiliza la visualización. No valida CAD, recorridos físicos ni colisiones reales para CNC.
