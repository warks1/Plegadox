# PlegadoX R144 · actualización inmediata del comparador tras cambiar BD

**17/11/2026 · v0.9.118 · R144**

La R143 añadió una validación matemática para detectar alas de desarrollo con tramos útiles no positivos después de BA/BD. Una prueba heredada seguía esperando el texto genérico del fallo: se actualiza para aceptar también la explicación específica.

Además, la caché de la tabla Comparador de V omitía `bendDeductionByBend`. Al introducir una BD de taller, el desarrollo principal se recalculaba, pero las filas de alternativas de V podían quedarse con resultados antiguos. La clave incluye ahora las BD por pliegue y la tabla vuelve a calcular longitudes y advertencias cuando cambian. La selección manual de herramientas no se desactiva.

Se conserva la base de fórmulas y no se sustituyen valores medidos por estimaciones inventadas. La validez matemática del desarrollo **no certifica** la seguridad física del plegado ni las trayectorias CNC.
