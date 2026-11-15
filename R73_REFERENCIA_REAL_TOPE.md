# R73 · Texto de apoyo sincronizado con la referencia resuelta

El asesor del tope puede descartar una referencia automática imposible y
escoger el otro borde libre de la chapa para la simulación. Antes,
`renderSimulationText` mostraba el resultado directo de
`stopAtStage().reference`, aun cuando `technicalScene` había resuelto
un apoyo distinto. Así podían contradecirse el rótulo y la chapa dibujada.

Ahora el texto (ala, distancia, sentido y borde libre) usa
`technicalScene.gaugeReference`; los selectores conservan el valor
almacenado por el usuario y no cambian a un modo manual ficticio.
Cuando el motor cambia de referencia, se indica explícitamente
«apoyo alternativo automático del motor».

La prueba de navegador comprueba en todos los golpes explorados que
el rótulo coincide con la referencia efectiva y que su modo
automático no se confunde con una intervención manual. Como todo el
módulo, es un modelo 2D no certificado de la V85.
