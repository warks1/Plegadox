# PlegadoX · R116 · diagnóstico 3D y fases críticas de topes

**16/11/2026 · v0.9.90 · main**

## 1. Diagnóstico volumétrico visible aunque no exista alternativa viable

La batería de navegación de R115 localizó un error de integración: `tests/volume-r31-browser-smoke.mjs` esperaba información de envolventes 3D en el estado del planificador, pero cuando ninguna combinación de matriz, punzón y orden superaba los bloqueos físicos el panel mostraba sólo el motivo general de descarte.

Se ha corregido en `app.js`: **también en la rama «sin plan»** se informa cuántos programas han recibido revisión volumétrica 2,5D y se aclara que los perfiles OEM y recorridos CNC siguen sin verificar. **No se ha forzado la selección de un plan rechazado** ni cambiado la secuencia manual.

La prueba visual espera ahora explícitamente el estado ya resuelto y la información de los análisis 3D, en ambos casos (recomendación o descarte); se ha corregido la firma del timeout de Playwright, para evitar esperas engañosas.

## 2. No perder una penetración breve del tope con ocho muestras

El planificador puede calcular con `gaugeSamples:8`. Antes, la distribución de nueve instantes interpolados no garantizaba muestrear exactamente **.46 y .48 de cada golpe**, momentos próximos al cierre y principio de deformación. Podía, por tanto, omitir una interferencia breve con el dedo en la aproximación al pliegue.

`gauge-sequence-review.js` reserva ahora, con 8–17 muestras, los instantes de ciclo **0, .36, .40, .44, .46, .48, .84 y .92**, además del final del golpe. Las muestras adicionales conservan fases intermedias y la malla habitual de 18 o más no cambia. Esta mejora sigue siendo un **muestreo**, no un barrido continuo.

Nueva batería `tests/gauge-critical-timing-r116.test.mjs`: cuatro regresiones que verifican fases, detección de penetración en .46, las cuatro operaciones de la omega y el mensaje 3D incluso sin alternativa recomendada.

## 3. Comprobación automática y límites

- CI de la nueva lógica: **732 de 732 pruebas aprobadas**, 0 fallos.
- Versión visible, `build-info.json`, `package.json` y caché del `sw.js` sincronizados a **R116 / 0.9.90**.
- El semáforo de topes permanece orientativo: **rojo** para penetración detectada en el modelo, **naranja** para apoyo/holgura o revisión pendiente, **verde** para ausencia de interferencia detectada en la pose 2D. Ninguno valida la máquina física.
- El orden **manual** permanece editable; el motor automático no modifica la pieza sin una acción explícita.

**Pendiente:** obtener y contrastar CAD OEM exacto de la trancha, mesa, amarres, dedos y utillaje efectivamente instalado, datum de montaje, longitud y posición Z, además de los recorridos reales Y1/Y2/X/R/Z1/Z2 para contrastar con vídeos del taller. La ficha histórica del fabricante V85 no identifica por sí sola los componentes instalados en esta unidad.

## Referencias externas comprobadas, sin extrapolar a la máquina real

- Ficha de la matriz **UKB 25.202**, V8 / 84° / H100 / R0,8, con enlace de descarga DXF: https://www.ukb-gmbh.de/en/25202.html. Enlaces documentados, **sin convertir automáticamente este archivo en sólido CAD certificado de una configuración montada**.
- Ficha histórica **TRUMPF TrumaBend V-Series** (V85 nominal 2050 mm, distancia entre montantes 1750 mm, carrera X 600 mm y R 250 mm): https://www.mteg-maschinen.de/fileadmin/mteg_Upload/03_TRUMPF_Prospekte_mteg/TrumaBend-V-Series_TRUMPF_Brochure.pdf. Sólo referencia de familia, no cotas medidas ni geometría OEM de la unidad del usuario.

La aprobación CNC industrial permanece deshabilitada.
