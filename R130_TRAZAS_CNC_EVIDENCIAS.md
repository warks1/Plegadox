# PlegadoX R130 — integridad de trazas y evidencia de colisiones CNC

Fecha: **17/11/2026** · Versión **0.9.104** · Base R129.

## Problemas identificados

1. Una traza guardada para la misma geometría nominal podía seguir aplicándose tras cambiar **Stop/Support**, la referencia del punto de apoyo, el segmento de apoyo, el radio, el factor K o las deducciones de plegado. El CNC podría tener otra maniobra X/R/Z aunque los ángulos y el orden no cambiasen.
2. El analizador de barrido exigía el antiguo perfil `stop` / `support` común incluso si ya existían los DXF independientes `stopZ1` y `stopZ2`. Esto inflaba la cobertura pendiente y podía etiquetar un cruce de dos perfiles CAD como una envolvente provisional.
3. El informe decía «colisiones en barrido CAD» también para contactos entre dos cuerpos **esquemáticos**, lo que confundía un solape calculado con una colisión real certificada.

## Actualizaciones R130

- `motionPieceKey` incluye selección Stop/Support, lado/segmento y posición de apoyo, radio interior, factor K, deducciones, herramienta y orientación. **Las trazas antiguas con clave incompleta quedan sin autorización automática y deben importarse/vincularse de nuevo**.
- `scanAxisCADMovement` rechaza cualquier programa cuya identidad `machineId` no sea la máquina seleccionada. Comprueba también que el datum corresponde a su configuración geométrica.
- Se distinguen tres evidencias por evento en `machine-axis-evidence.js`:
  - **DOS_PERFILES_CAD:** intersección del modelo entre dos perfiles DXF de máquina aportados.
  - **CAD_Y_MODELO:** un perfil DXF aportado contra chapa, punzón, matriz o envolvente paramétrica.
  - **GEOMETRIA_PROVISIONAL:** solo cuerpos ilustrativos sin sus CAD.
- Cada incidencia indica cuerpo móvil, cuerpo afectado, intervalo de segundos del registro, procedencia, nivel de evidencia y `physicalCollisionCertified=false`; el resultado no representa un impacto físico demostrado.
- El modelo permite reconocer como cobertura CAD de dedos los `stopZ1`+`stopZ2` o `supportZ1`+`supportZ2`, sin exigir indebidamente un DXF común.
- El panel **Recorridos físicos de ejes** ofrece detalle de las incidencias, tiempos y CAD ausente, además de **exportar JSON** con todas las pruebas.
- Los informes volumétricos agregan contadores de incidentes por clase y documentan las limitaciones CNC.

## Verificación

Pruebas unitarias en `tests/machine-axis-evidence-r130.test.mjs`: vinculación de traza a configuración, protección contra otra máquina, clasificación y resumen de evidencias, modelos independientes Z1/Z2, y continuidad del informe volumétrico.

Prueba Chrome con perfil Galaxy: `tests/machine-axis-evidence-r130-browser-smoke.mjs`: importación sintética de dos dedos declarados y trazas, detección de interferencia modelada, descarga del JSON, rechazo al modificar Stop/Support. Se conservan los tests de R125–R129.

## Límite industrial

**Ni siquiera DOS_PERFILES_CAD es certificación.** El modelo usa extrusiones 2,5D de DXF en la pose de referencia y trayectorias X/R/Z lineales declaradas; las referencias y la sincronización PLC/CNC se deben verificar físicamente. No contempla aceleración real, giro/deformación continua, amarre completo, contornos 3D OEM STEP ni tolerancias/flexión. Los límites de carrera se toman exclusivamente de datos aportados; la aplicación jamás envía órdenes a la plegadora.
