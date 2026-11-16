# PlegadoX R105 · 16 de noviembre de 2026
## Motivo
Continuación de R104 para el caso Omega con golpes 1→2→4→3 y referencias
de tope trasero; evitar avisos que mezclan holgura, ausencia de contacto y
penetración sin empeorar la geometría de taller.

## Cambios
1. El optimizador del apoyo automático mantiene la cara de alimentación
   original cuando es válida y sin holgura. Si el primer canto es nominalmente
   válido pero produce advertencia de holgura, **prefiere otro canto libre
   válido sin advertencia** cuando existe. Si ambas alternativas presentan
   igual aviso, conserva la primera para no voltear la Omega sin mejora.
2. La vista 2D/2,5D conserva contacto de chapa con la cara frontal del
   dedo durante **Sujeción** si todavía no se ordenó retirada. No fuerza
   contacto cuando el retroceso está activo.
3. El semáforo distingue sujeción sin contacto (naranja) de sujeción con
   retroceso legítimo, sin convertir la retirada preventiva en una colisión.
4. Nuevos ensayos de regresión:
   - `tests/automatic-folded-gauge-r104.test.mjs` (preferencia de apoyo R105)
   - `tests/gauge-seat-sujecion-r105.test.mjs`
   - `tests/omega-gauge-reconciliation-r105.test.mjs`
5. El informe de diagnóstico y el visor usan el mismo origen de referencia,
   posición de dedo, semáforo y secuencia física **ilustrativa**.

## Comprobación con el motor real
Se cargaron los 16 módulos de geometría y se comprobaron 110 invariantes
en las cuatro operaciones, tiempos de preparación, sujeción, plegado,
retorno y posicionamiento. Resultado de la verificación focalizada:
**110 comprobaciones correctas, 0 discrepancias observadas**.
Los cuatro golpes mantuvieron apoyo en la fase de sujeción sin retirada
programada. No se observó salto del tope entre referencias consecutivas
en los tiempos examinados.

En la pieza Omega estándar del código, G2 y G4 **no muestran penetración
del tope en las muestras 2D verificadas**. En un momento temprano de G1 y
G3 se observa un aviso naranja de holgura, no penetración. Esto no demuestra
que las trayectorias reales estén libres de colisiones; puede faltar geometría
volumétrica, CAD OEM y recorridos de ejes de máquina.

## Alcance y riesgos
Se trata de comprobaciones internas del modelo. No certifican la plegadora
Trumpf V85 ni Bystronic, ni un barrido continuo 3D de punzón, matriz, alas,
trancha o dedos X/R/Z; tampoco reemplazan las grabaciones del operario.
La suite completa `npm test` y una verificación de navegador/móvil no están
confirmadas aún. No utilizar este código como permiso para fabricar ni
como generador de instrucciones CNC certificadas.
