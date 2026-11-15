# R76 · Corregir retiradas automáticas injustificadas

**Fallo real reproducido en Omega (orden 1–2–4–3) antes del cambio:**
G1 se retiraba 224 mm y G3 otros 174 mm, pese a que el predictor
solo informó una **holgura**, no una penetración del cuerpo del dedo.
G2 y G4 no recomendaban retirada durante el plegado.

**Cambio funcional:** el dedo sólo recibe una orden de retroceso durante
sujeción/plegado cuando se pronostica **penetración** 2D en el contorno
del tope con un apoyo inicial válido. Un mero aviso de proximidad no
provoca desplazamiento. La advertencia de holgura sigue visible.

**Cambio de visualización:** un traslado al tope de la operación siguiente
es una reubicación de referencia, diferente del retroceso anticolisión.
Si la siguiente referencia X/R es idéntica, no se anima un movimiento
ficticio y el atributo `moving` refleja movimiento real.

Pruebas Node y navegador para los cuatro golpes de Omega y dos posiciones
del ciclo, además de casos inyectados de holgura y penetración.
La vista sigue siendo 2D ilustrativa; no está certificada contra CAD
real de los topes, carreras de ejes ni volúmenes 3D de la plegadora.
