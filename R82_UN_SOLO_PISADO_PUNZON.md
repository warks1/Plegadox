# R82 · Un único descenso y ascenso de punzón en cada golpe

El vídeo del usuario muestra que el punzón baja, se eleva y vuelve a bajar a pisar en el mismo golpe.

Causa: `engine.stage` tiene fase "Sujeción" con press=.45, pero `contactKinematics` no disponía de caso para esa fase. La rama por defecto hacía `tipHeight=setupTip` (punzón elevado), y al comenzar "Plegado" volvía a `tipHeight=contactTip`.

Corrección: durante "Sujeción" mantener `tipHeight=contactTip`; no elevar de nuevo el punzón. La fase "Plegado" continúa el descenso, y la fase "Retorno" vuelve a elevarlo. Orden manual, ángulos y herramientas no cambian.

Pruebas: test de continuidad en los cuatro golpes de la Omega (1-2-4-3), y prueba real en navegador PC/móvil. La geometría sigue siendo un modelo cinemático 2D provisional: no acredita carrera CNC real.