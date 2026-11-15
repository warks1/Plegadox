# R74 · Prueba funcional tras giro de móvil

La prueba responsive recorre 13 resoluciones y comprueba también el cambio
horizontal/vertical de una misma sesión sin recargar ni perder la
herramienta elegida. La comprobación anterior de Play suponía que
el reloj del navegador avanzaría en exactamente 350 ms incluso cuando
el sistema debía recomponer lienzos tras la rotación.

Ahora la prueba espera un progreso comprobable del timeline con
un timeout explícito de 5 s. Si Play no avanza, sigue fallando y
adjunta información útil de tiempo, fase, estado de reproducción y
orientación para localizar la causa real.

No se cambian secuencias, geometría, utillaje ni se relaja la comprobación
de funcionamiento efectivo de Play.
