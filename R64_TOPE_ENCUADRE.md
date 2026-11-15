# R64 · Encuadre sin salto del tope trasero

El recorrido completo visible del dedo se calcula con la misma función de
retroceso condicional de la simulación. La sección reserva desde el comienzo
del golpe las posiciones de contacto, aparcamiento, llegada al siguiente golpe
y margen de seguridad de encuadre; por tanto el marco no aparece ni desaparece
repentinamente cuando la retirada comienza al 36 % del ciclo.

Esto **no** invierte el tope, no modifica la orientación ni el programa manual,
ni ordena retroceder por defecto: la retirada sigue siendo condicional a la
interferencia 2D prevista. También se mantiene el apoyo frontal del Stop y la
repisa inferior con contrahuella del Support.

El ajuste es de **representación y continuidad de cámara**. No valida
cinemática CNC, CAD real del dedo ni colisiones 3D de la Trumpf/Bystronic.
La nueva prueba verifica los cuatro golpes de la pieza Omega con ambos dedos
en la fase inicial, antes del retroceso, durante y al final de cada operación.
