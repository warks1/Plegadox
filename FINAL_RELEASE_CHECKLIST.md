# PlegadoX · Criterios para versión final industrial

**Fecha:** 17/11/2026. **Estado:** candidato funcional R142, no software CNC certificado.

## Completado o automatizado
- [x] Validaciones unitarias de geometría, datos, copia completa, topes y simulación (GitHub Actions).
- [x] Pantalla premium y barra sincronizadas con pruebas simuladas de arranque lento.
- [x] Paquete USB portable Windows offline; EXE real probado.
- [x] Instalador Windows per-user (Inno Setup) con prueba de instalación, arranque, desinstalación y hashes SHA256.
- [x] PWA con manifiesto, iconos, cache versionada e instalación desde navegador para iOS/Android.
- [x] Datos exportados del instalador fuera de la carpeta que se desinstala.

## Bloqueadores antes de certificar uso productivo en plegadora
- [ ] CAD OEM verificable de máquina, trancha/mesa, amarres, punzones, matrices y topes, con origen común de cotas.
- [ ] Trayectorias reales X/R/Z1/Z2/Y1/Y2 medidas y cotejadas con la máquina concreta, límites y recorridos.
- [ ] Colisiones volumétricas validadas contra pruebas físicas, incluyendo giro/volteo de chapa y geometría deformada.
- [ ] Verificar orden automático y elección de herramienta contra piezas de taller reales (Omega y nuevos DXF), y permitir orden manual con advertencia explicable.
- [ ] Pruebas de montaje, rendimiento y persistencia en Samsung Galaxy real, iPhone/iPad real y Windows de taller.
- [ ] Prueba de varias jornadas, manejo de errores, recuperación tras corte de energía y restauración completa de proyectos.
- [ ] Firma Authenticode del instalador Windows para distribución comercial.

## Bloqueadores para tiendas
- [ ] iOS: proyecto nativo/Capacitor o Swift, identificador, equipo de firma, TestFlight, App Store Connect y revisión Apple.
- [ ] Android: proyecto Android/TWA, firma de AAB, control de raíz HTTPS para `assetlinks.json`, Play Console y pruebas cerradas.
- [ ] Declaración de privacidad, permisos y material gráfico de fichas, más capturas reales.

**Política:** no mostrar `SIN COLISIÓN VERIFICADA`, `APTO PARA PRODUCCIÓN` ni `CERTIFICADO OEM` por haber pasado solo las pruebas automáticas. Los diagnósticos CAD/CNC de R142 siguen teniendo incertidumbre explícita.
