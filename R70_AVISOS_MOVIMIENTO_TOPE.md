# R70 · Diagnóstico de interferencias durante el movimiento del tope

Separar los incidentes de la preparación (apoyo sobre cara frontal STOP
o repisa del SUPPORT) de las penetraciones que aparecen **cuando el dedo
completo se está trasladando** a otra referencia.

El barrido temporal sigue compartiendo el modelo 2D con el visor y no
mueve automáticamente las piezas ni cambia el orden manual. Se añaden:
`movingFinger`, `motionPhase`, `movementWarnings`,
`movementInterference`, `movementFirstTime` y suma por operaciones.

La auditoría presenta un aviso identificable para cada operación con
interferencias durante la retirada o reubicación, especialmente importante
para G2/G4; conserva todas las advertencias anteriores.

Este filtro NO tiene suficientes datos para garantizar una ruta segura en
X/R/Z ni constituye certificación CNC/3D: ante interferencia, comprobar
recorrido y dimensiones en la plegadora real. Ningún cambio al Boceto 1,
su imagen de carga, icono o interfaz aprobada.
