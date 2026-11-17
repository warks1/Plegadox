/**
 * PlegadoX · auditoría de procedencia CAD R109.
 *
 * Un enlace del fabricante a DXF NO equivale al archivo descargado,
 * parseado, registrado en máquina o certificado. Los modelos de
 * fabricantes distintos sólo son EQUIVALENCIAS COMERCIALES y NO aportan
 * cotas que puedan soldarse a otra herramienta sin identidad exacta.
 *
 * Fecha de consulta de fuentes: 2026-11-17.
 */
export const CAD_REQUIREMENTS=Object.freeze({
 'trumpf-v85':[
  'ram','bed','stop','support','upperClamp','lowerClamp',
  'upperAdapter','lowerAdapter','frontSupport','punch','die',
  'axesXYZ','mountDatums'
 ],
 'bystronic-2006-100-3100':[
  'ram','bed','stop','support','upperClamp','lowerClamp',
  'upperAdapter','lowerAdapter','frontSupport','punch','die',
  'axesXYZ','mountDatums'
 ]
});
const freezeEntry=x=>Object.freeze({...x,
 dimensions:Object.freeze({...x.dimensions})});
export const CAD_EVIDENCE_SOURCES=Object.freeze([
 // R132: fichas OEM y botones Download DXF comprobados en Eurostamp.
 // El fichero NO está importado ni se conoce el cero de montaje real.
 freezeEntry({
  id:'eurostamp-3163',kind:'die',maker:'EUROSTAMP',reference:'3163',
  variant:'SELF-CENTERING-1V-88-V16-H60',mount:'Amada/Promecam',
  datum:'OEM_REFERENCE_UNCONFIRMED',
  title:'EUROSTAMP 3163 · matriz autocentrante V16/88° H60',
  sourceUrl:'https://eurostampsrl.it/en/11184/1v-self-centering-dies-88-amada/3163-1v-dies-self-centering-dies-88',
  cadUrl:'https://eurostampsrl.it/dxf/3163.dxf',
  format:'DXF',access:'PUBLIC_DIRECT_DXF',status:'ENLACE_CONFIRMADO_NO_IMPORTADO',
  dimensions:{heightMm:60,angleDeg:88,vOpeningMm:16,
   maxTonnesPerMetre:100},
  note:'Ficha OEM 1V autocentrante: V16, 88°, H60, 100 t/m. Revisar base, ceros, longitud Z y geometría del propio DXF antes de registrar el útil.'
 }),
 freezeEntry({
  id:'eurostamp-3165',kind:'die',maker:'EUROSTAMP',reference:'3165',
  variant:'SELF-CENTERING-1V-88-V25-H60',mount:'Amada/Promecam',
  datum:'OEM_REFERENCE_UNCONFIRMED',
  title:'EUROSTAMP 3165 · matriz autocentrante V25/88° H60',
  sourceUrl:'https://eurostampsrl.it/en/11198/1v-self-centering-dies-88/3165-die-88',
  cadUrl:'https://eurostampsrl.it/dxf/3165.dxf',
  format:'DXF',access:'PUBLIC_DIRECT_DXF',status:'ENLACE_CONFIRMADO_NO_IMPORTADO',
  dimensions:{heightMm:60,angleDeg:88,vOpeningMm:25,
   maxTonnesPerMetre:100},
  note:'Ficha OEM 1V autocentrante: V25, 88°, H60, 100 t/m. El DXF se ofrece desde la web; amarre y ocupación Z sin certificar.'
 }),
 freezeEntry({
  id:'eurostamp-1063',kind:'punch',maker:'EUROSTAMP',reference:'1063',
  variant:'STRAIGHT-88',mount:'Desconocido',datum:'OEM_REFERENCE_UNCONFIRMED',
  title:'EUROSTAMP 1063 · punzón recto 88° R0.8 H104.65',
  sourceUrl:'https://eurostampsrl.it/en/9775/punches-88-amada/1063-punches-88',
  cadUrl:'https://eurostampsrl.it/dxf/1063.dxf',
  format:'DXF',access:'PUBLIC_DIRECT_DXF',status:'ENLACE_CONFIRMADO_NO_IMPORTADO',
  dimensions:{heightMm:104.65,angleDeg:88,tipRadiusMm:0.8,
   maxTonnesPerMetre:100},
  note:'DXF enlazado directamente en la ficha oficial Eurostamp. Confirmar amarre, punta y dimensiones sobre el fichero real. Enlace confirmado no equivale a perfil importado/certificado.'
 }),
 freezeEntry({
  id:'eurostamp-1017',kind:'punch',maker:'EUROSTAMP',reference:'1017',
  variant:'GOOSENECK-88',mount:'Amada/Promecam',datum:'OEM_REFERENCE_UNCONFIRMED',
  title:'EUROSTAMP 1017 · pata de cabra 88° R0.8 H104.65',
  sourceUrl:'https://eurostampsrl.it/en/10582/punches-88-amada/1017-punches-88',cadUrl:'https://eurostampsrl.it/dxf/1017.dxf',
  format:'DXF',
  access:'PUBLIC_DIRECT_DXF',
  status:'ENLACE_CONFIRMADO_NO_IMPORTADO',
  dimensions:{heightMm:104.65,angleDeg:88,tipRadiusMm:0.8,
   maxTonnesPerMetre:50},
  note:'Pata de cabra 88° confirmada por fabricante. H104,65, R0,8; CAD enlazado. El posible sobrealto/amarre del contorno descargado no se altera sin datum.'
 }),
 freezeEntry({
  id:'eurostamp-1031',kind:'punch',maker:'EUROSTAMP',reference:'1031',
  variant:'GOOSENECK-HIGH-88',mount:'Amada/Promecam',datum:'OEM_REFERENCE_UNCONFIRMED',
  title:'EUROSTAMP 1031 · pata de cabra 88° R0.8 H165',
  sourceUrl:'https://eurostampsrl.it/en/25415/punches-88/1031-punch-88',cadUrl:'https://eurostampsrl.it/dxf/1031.dxf',
  format:'DXF',
  access:'PUBLIC_DIRECT_DXF',
  status:'ENLACE_CONFIRMADO_NO_IMPORTADO',
  dimensions:{heightMm:165,angleDeg:88,tipRadiusMm:0.8,
   maxTonnesPerMetre:60},
  note:'Pata de cabra alta 88°: H165 y R0,8, 60 t/m publicados. Comprobar hueco interior y joroba con el DXF verdadero.'
 }),
 freezeEntry({
  id:'ukb-11850',kind:'punch',maker:'UKB',reference:'11.850',
  variant:'85deg-R1-H185',mount:'Amada/Promecam',datum:'OEM_REFERENCE_UNCONFIRMED',
  title:'UKB 11.850 · punzón 85° R1 H185',
  sourceUrl:'https://www.ukb-gmbh.de/en/11850.html',cadUrl:'https://daten.ukb-gmbh.de/dxf/zip/11850.DXF.zip',
  format:'DXF_ZIP',
  access:'PUBLIC_DIRECT_ZIP',
  status:'ENLACE_CONFIRMADO_NO_IMPORTADO',
  dimensions:{heightMm:185,angleDeg:85,tipRadiusMm:1,
   maxLoadKNPerMetre:400},
  note:'Punzón UKB sistema Amada. Cota H declarada de fabricante; identificar contorno, altura total e interfaz de montaje antes de planificar; escote y capacidad en el golpe pendientes de cotejo.'
 }),
 freezeEntry({
  id:'ukb-11849',kind:'punch',maker:'UKB',reference:'11.849',
  variant:'85deg-R0.8-H165',mount:'Amada/Promecam',datum:'OEM_REFERENCE_UNCONFIRMED',
  title:'UKB 11.849 · punzón 85° R0.8 H165',
  sourceUrl:'https://www.ukb-gmbh.de/en/11849.html',cadUrl:'https://daten.ukb-gmbh.de/dxf/zip/11849.DXF.zip',
  format:'DXF_ZIP',
  access:'PUBLIC_DIRECT_ZIP',
  status:'ENLACE_CONFIRMADO_NO_IMPORTADO',
  dimensions:{heightMm:165,angleDeg:85,tipRadiusMm:0.8,
   maxLoadKNPerMetre:600},
  note:'Punzón UKB sistema Amada. Cota H declarada de fabricante; identificar contorno, altura total e interfaz de montaje antes de planificar; escote y capacidad en el golpe pendientes de cotejo.'
 }),
 freezeEntry({
  id:'ukb-11831',kind:'punch',maker:'UKB',reference:'11.831',
  variant:'85deg-R0.6-H85',mount:'Amada/Promecam',datum:'OEM_REFERENCE_UNCONFIRMED',
  title:'UKB 11.831 · punzón 85° R0.6 H85',
  sourceUrl:'https://www.ukb-gmbh.de/en/11831.html',cadUrl:'https://daten.ukb-gmbh.de/dxf/zip/11831.DXF.zip',
  format:'DXF_ZIP',
  access:'PUBLIC_DIRECT_ZIP',
  status:'ENLACE_CONFIRMADO_NO_IMPORTADO',
  dimensions:{heightMm:85,angleDeg:85,tipRadiusMm:0.6,
   maxLoadKNPerMetre:120},
  note:'Punzón UKB sistema Amada. Cota H declarada de fabricante; identificar contorno, altura total e interfaz de montaje antes de planificar; escote y capacidad en el golpe pendientes de cotejo.'
 }),
 freezeEntry({
  id:'ukb-11670',kind:'punch',maker:'UKB',reference:'11.670',
  variant:'85deg-R0.8-H145',mount:'Amada/Promecam',datum:'OEM_REFERENCE_UNCONFIRMED',
  title:'UKB 11.670 · punzón 85° R0.8 H145',
  sourceUrl:'https://www.ukb-gmbh.de/en/11670.html',cadUrl:'https://daten.ukb-gmbh.de/dxf/zip/11670.DXF.zip',
  format:'DXF_ZIP',
  access:'PUBLIC_DIRECT_ZIP',
  status:'ENLACE_CONFIRMADO_NO_IMPORTADO',
  dimensions:{heightMm:145,angleDeg:85,tipRadiusMm:0.8,
   maxLoadKNPerMetre:600},
  note:'Punzón UKB sistema Amada. Cota H declarada de fabricante; identificar contorno, altura total e interfaz de montaje antes de planificar; escote y capacidad en el golpe pendientes de cotejo.'
 }),
 freezeEntry({
  id:'ukb-11835',kind:'punch',maker:'UKB',reference:'11.835',
  variant:'85deg-R0.8-H120',mount:'Amada/Promecam',datum:'OEM_REFERENCE_UNCONFIRMED',
  title:'UKB 11.835 · punzón 85° R0.8 H120',
  sourceUrl:'https://www.ukb-gmbh.de/en/11835.html',cadUrl:'https://daten.ukb-gmbh.de/dxf/zip/11835.DXF.zip',
  format:'DXF_ZIP',
  access:'PUBLIC_DIRECT_ZIP',
  status:'ENLACE_CONFIRMADO_NO_IMPORTADO',
  dimensions:{heightMm:120,angleDeg:85,tipRadiusMm:0.8,
   maxLoadKNPerMetre:500},
  note:'Punzón UKB sistema Amada. Cota H declarada de fabricante; identificar contorno, altura total e interfaz de montaje antes de planificar; escote y capacidad en el golpe pendientes de cotejo.'
 }),
 freezeEntry({
  id:'ukb-11800',kind:'punch',maker:'UKB',reference:'11.800',
  variant:'85deg-R1-H200',mount:'Amada/Promecam',datum:'OEM_REFERENCE_UNCONFIRMED',
  title:'UKB 11.800 · punzón 85° R1 H200',
  sourceUrl:'https://www.ukb-gmbh.de/en/11800.html',cadUrl:'https://daten.ukb-gmbh.de/dxf/zip/11800.DXF.zip',
  format:'DXF_ZIP',
  access:'PUBLIC_DIRECT_ZIP',
  status:'ENLACE_CONFIRMADO_NO_IMPORTADO',
  dimensions:{heightMm:200,angleDeg:85,tipRadiusMm:1,
   maxLoadKNPerMetre:700},
  note:'Punzón UKB sistema Amada. Cota H declarada de fabricante; identificar contorno, altura total e interfaz de montaje antes de planificar; escote y capacidad en el golpe pendientes de cotejo.'
 }),
 freezeEntry({
  id:'ukb-11840',kind:'punch',maker:'UKB',reference:'11.840',
  variant:'85deg-R1-H185',mount:'Amada/Promecam',datum:'OEM_REFERENCE_UNCONFIRMED',
  title:'UKB 11.840 · punzón 85° R1 H185',
  sourceUrl:'https://www.ukb-gmbh.de/en/11840.html',cadUrl:'https://daten.ukb-gmbh.de/dxf/zip/11840.DXF.zip',
  format:'DXF_ZIP',
  access:'PUBLIC_DIRECT_ZIP',
  status:'ENLACE_CONFIRMADO_NO_IMPORTADO',
  dimensions:{heightMm:185,angleDeg:85,tipRadiusMm:1,
   maxLoadKNPerMetre:600},
  note:'Punzón UKB sistema Amada. Cota H declarada de fabricante; identificar contorno, altura total e interfaz de montaje antes de planificar; escote y capacidad en el golpe pendientes de cotejo.'
 }),
 freezeEntry({
  id:'ukb-11232',kind:'punch',maker:'UKB',reference:'11.232',
  variant:'85deg-R0.8-H135',mount:'Amada/Promecam',datum:'OEM_REFERENCE_UNCONFIRMED',
  title:'UKB 11.232 · punzón 85° R0.8 H135',
  sourceUrl:'https://www.ukb-gmbh.de/en/11232.html',cadUrl:'https://daten.ukb-gmbh.de/dxf/zip/11232.DXF.zip',
  format:'DXF_ZIP',
  access:'PUBLIC_DIRECT_ZIP',
  status:'ENLACE_CONFIRMADO_NO_IMPORTADO',
  dimensions:{heightMm:135,angleDeg:85,tipRadiusMm:0.8,
   maxLoadKNPerMetre:1000},
  note:'Punzón UKB sistema Amada. Cota H declarada de fabricante; identificar contorno, altura total e interfaz de montaje antes de planificar; escote y capacidad en el golpe pendientes de cotejo.'
 }),
 freezeEntry({
  id:'ukb-25203',kind:'die',maker:'UKB',reference:'25.203',
  variant:'84deg-V10-H100',mount:'UKB TRUMPF/WILA/BYSTRONIC',
  datum:'OEM_REFERENCE_UNCONFIRMED',
  title:'UKB 25.203 · matriz V10/84° H100',
  sourceUrl:'https://www.ukb-gmbh.de/en/25203.html',
  cadUrl:'https://daten.ukb-gmbh.de/dxf/zip/25203.DXF.zip',
  format:'DXF_ZIP',access:'PUBLIC_DIRECT_ZIP',
  status:'ENLACE_CONFIRMADO_NO_IMPORTADO',
  dimensions:{heightMm:100,angleDeg:84,vOpeningMm:10,
   shoulderRadiusMm:1,maxLoadKNPerMetre:1000},
  note:'Ficha OEM con DXF ZIP publicado. No asimilar ángulo 84° a 85°/88°, ni montar en V85 sin verificar mordaza y longitud Z.'
 }),
 freezeEntry({
  id:'ukb-25304',kind:'die',maker:'UKB',reference:'25.304',
  variant:'84deg-V12-H100',mount:'UKB TRUMPF/WILA/BYSTRONIC',
  datum:'OEM_REFERENCE_UNCONFIRMED',
  title:'UKB 25.304 · matriz V12/84° H100',
  sourceUrl:'https://www.ukb-gmbh.de/en/25304.html',
  cadUrl:'https://daten.ukb-gmbh.de/dxf/zip/25304.DXF.zip',
  format:'DXF_ZIP',access:'PUBLIC_DIRECT_ZIP',
  status:'ENLACE_CONFIRMADO_NO_IMPORTADO',
  dimensions:{heightMm:100,angleDeg:84,vOpeningMm:12,
   shoulderRadiusMm:1,maxLoadKNPerMetre:400},
  note:'Ficha OEM con DXF ZIP publicado. No asimilar ángulo 84° a 85°/88°, ni montar en V85 sin verificar mordaza y longitud Z.'
 }),
 freezeEntry({
  id:'ukb-25205',kind:'die',maker:'UKB',reference:'25.205',
  variant:'84deg-V16-H100',mount:'UKB TRUMPF/WILA/BYSTRONIC',
  datum:'OEM_REFERENCE_UNCONFIRMED',
  title:'UKB 25.205 · matriz V16/84° H100',
  sourceUrl:'https://www.ukb-gmbh.de/en/25205.html',
  cadUrl:'https://daten.ukb-gmbh.de/dxf/zip/25205.DXF.zip',
  format:'DXF_ZIP',access:'PUBLIC_DIRECT_ZIP',
  status:'ENLACE_CONFIRMADO_NO_IMPORTADO',
  dimensions:{heightMm:100,angleDeg:84,vOpeningMm:16,
   shoulderRadiusMm:1.6,maxLoadKNPerMetre:1000},
  note:'Ficha OEM con DXF ZIP publicado. No asimilar ángulo 84° a 85°/88°, ni montar en V85 sin verificar mordaza y longitud Z.'
 }),
 freezeEntry({
  id:'ukb-11780',kind:'punch',maker:'UKB',reference:'11.780',
  variant:'30deg-R0.5-H135',
  mount:'Amada/Promecam',datum:'OEM_REFERENCE_UNCONFIRMED',
  title:'UKB 11.780 · punzón 30° R0.5 H135',
  sourceUrl:'https://www.ukb-gmbh.de/en/11780.html',
  cadUrl:'https://daten.ukb-gmbh.de/dxf/zip/11780.DXF.zip',
  format:'DXF_ZIP',access:'PUBLIC_DIRECT_ZIP',
  status:'ENLACE_CONFIRMADO_NO_IMPORTADO',
  dimensions:{heightMm:135,angleDeg:30,tipRadiusMm:0.5,
   maxLoadKNPerMetre:800},
  note:'Punzón Amada 30°, longitud segmentada o continua por escoger; no extrapolar amarre. El DXF no equivale a un perfil homologado en la máquina.'
 }),
 freezeEntry({
  id:'ukb-11880',kind:'punch',maker:'UKB',reference:'11.880',
  variant:'30deg-R0.8-H150',
  mount:'Amada/Promecam',datum:'OEM_REFERENCE_UNCONFIRMED',
  title:'UKB 11.880 · punzón 30° R0.8 H150',
  sourceUrl:'https://www.ukb-gmbh.de/en/11880.html',
  cadUrl:'https://daten.ukb-gmbh.de/dxf/zip/11880.DXF.zip',
  format:'DXF_ZIP',access:'PUBLIC_DIRECT_ZIP',
  status:'ENLACE_CONFIRMADO_NO_IMPORTADO',
  dimensions:{heightMm:150,angleDeg:30,tipRadiusMm:0.8,
   maxLoadKNPerMetre:400},
  note:'Punzón de 30° H150, comprobar montaje real y posible escote OEM. El DXF no equivale a un perfil homologado en la máquina.'
 }),
 freezeEntry({
  id:'ukb-11810',kind:'punch',maker:'UKB',reference:'11.810',
  variant:'30deg-R1-H200',
  mount:'Amada/Promecam',datum:'OEM_REFERENCE_UNCONFIRMED',
  title:'UKB 11.810 · punzón 30° R1 H200',
  sourceUrl:'https://www.ukb-gmbh.de/en/11810.html',
  cadUrl:'https://daten.ukb-gmbh.de/dxf/zip/11810.DXF.zip',
  format:'DXF_ZIP',access:'PUBLIC_DIRECT_ZIP',
  status:'ENLACE_CONFIRMADO_NO_IMPORTADO',
  dimensions:{heightMm:200,angleDeg:30,tipRadiusMm:1,
   maxLoadKNPerMetre:500},
  note:'Punzón H200, confirmar altura disponible y colisión con trancha. El DXF no equivale a un perfil homologado en la máquina.'
 }),
 freezeEntry({
  id:'ukb-14153',kind:'punch',maker:'UKB',reference:'14.153',
  variant:'30deg-R1-H175',
  mount:'UKB BYSTRONIC (MONTAJE REAL PENDIENTE)',datum:'OEM_REFERENCE_UNCONFIRMED',
  title:'UKB 14.153 · punzón 30° R1 H175',
  sourceUrl:'https://www.ukb-gmbh.de/en/14153.html',
  cadUrl:'https://daten.ukb-gmbh.de/dxf/zip/14153.DXF.zip',
  format:'DXF_ZIP',access:'PUBLIC_DIRECT_ZIP',
  status:'ENLACE_CONFIRMADO_NO_IMPORTADO',
  dimensions:{heightMm:175,angleDeg:30,tipRadiusMm:1,
   maxLoadKNPerMetre:1000},
  note:'Ficha inglesa tiene error tipográfico de unidad H=175 m; título fabricante y familia establecen H175 mm. Pendiente de confirmar montaje Bystronic real. El DXF no equivale a un perfil homologado en la máquina.'
 }),
 freezeEntry({
  id:'ukb-14169',kind:'punch',maker:'UKB',reference:'14.169',
  variant:'30deg-R3-H250',
  mount:'UKB BYSTRONIC (MONTAJE REAL PENDIENTE)',datum:'OEM_REFERENCE_UNCONFIRMED',
  title:'UKB 14.169 · punzón 30° R3 H250',
  sourceUrl:'https://www.ukb-gmbh.de/en/14169.html',
  cadUrl:'https://daten.ukb-gmbh.de/dxf/zip/14169.DXF.zip',
  format:'DXF_ZIP',access:'PUBLIC_DIRECT_ZIP',
  status:'ENLACE_CONFIRMADO_NO_IMPORTADO',
  dimensions:{heightMm:250,angleDeg:30,tipRadiusMm:3,
   maxLoadKNPerMetre:1000},
  note:'Punzón Bystronic H250; no asumir que los 250 mm caben con amarre y matriz montados. El DXF no equivale a un perfil homologado en la máquina.'
 }),
 freezeEntry({
  id:'ukb-25502',kind:'die',maker:'UKB',reference:'25.502',
  variant:'30deg-V8-H100',mount:'UKB TRUMPF/WILA/BYSTRONIC',
  datum:'OEM_REFERENCE_UNCONFIRMED',
  heightEvidence:Object.freeze({
   reference:'25.502',kind:'DIE_PROFILE_INCLUDING_MOUNTING_TANG',
   nominalHeightMm:100,drawingOverallMm:120,mountingTangMm:20,
   sourceUrl:'https://www.progtools.se/wp16/wp-content/uploads/2016/09/ukb-progtools-9.pdf',
   note:'UKB catálogo técnico 2015, sección matrices Trumpf 30°: dibujo acotado H100, H total120, zanco20. El datum en la V85 concreta sigue pendiente.'
  }),
  title:'UKB 25.502 · matriz V8/30° H100',
  sourceUrl:'https://www.ukb-gmbh.de/en/25502.html',
  cadUrl:'https://daten.ukb-gmbh.de/dxf/zip/25502.DXF.zip',
  format:'DXF_ZIP',access:'PUBLIC_DIRECT_ZIP',
  status:'ENLACE_CONFIRMADO_NO_IMPORTADO',
  dimensions:{heightMm:100,angleDeg:30,vOpeningMm:8,
   shoulderRadiusMm:1,maxLoadKNPerMetre:200},
  note:'Cotas nominales de ficha UKB (V, H, R y capacidad). DXF OEM publicado pero NO descargado ni instalado aquí. Verificar base y plano Z del segmento físico.'
 }),
 freezeEntry({
  id:'ukb-25403',kind:'die',maker:'UKB',reference:'25.403',
  variant:'30deg-V10-H100',mount:'UKB TRUMPF/WILA/BYSTRONIC',
  datum:'OEM_REFERENCE_UNCONFIRMED',
  heightEvidence:Object.freeze({
   reference:'25.403',kind:'DIE_PROFILE_INCLUDING_MOUNTING_TANG',
   nominalHeightMm:100,drawingOverallMm:120,mountingTangMm:20,
   sourceUrl:'https://www.progtools.se/wp16/wp-content/uploads/2016/09/ukb-progtools-9.pdf',
   note:'UKB catálogo técnico 2015, sección matrices Trumpf 30°: dibujo acotado H100, H total120, zanco20. El datum en la V85 concreta sigue pendiente.'
  }),
  title:'UKB 25.403 · matriz V10/30° H100',
  sourceUrl:'https://www.ukb-gmbh.de/en/25403.html',
  cadUrl:'https://daten.ukb-gmbh.de/dxf/zip/25403.DXF.zip',
  format:'DXF_ZIP',access:'PUBLIC_DIRECT_ZIP',
  status:'ENLACE_CONFIRMADO_NO_IMPORTADO',
  dimensions:{heightMm:100,angleDeg:30,vOpeningMm:10,
   shoulderRadiusMm:1,maxLoadKNPerMetre:400},
  note:'Cotas nominales de ficha UKB (V, H, R y capacidad). DXF OEM publicado pero NO descargado ni instalado aquí. Verificar base y plano Z del segmento físico.'
 }),
 freezeEntry({
  id:'ukb-25504',kind:'die',maker:'UKB',reference:'25.504',
  variant:'30deg-V12-H100',mount:'UKB TRUMPF/WILA/BYSTRONIC',
  datum:'OEM_REFERENCE_UNCONFIRMED',
  heightEvidence:Object.freeze({
   reference:'25.504',kind:'DIE_PROFILE_INCLUDING_MOUNTING_TANG',
   nominalHeightMm:100,drawingOverallMm:120,mountingTangMm:20,
   sourceUrl:'https://www.progtools.se/wp16/wp-content/uploads/2016/09/ukb-progtools-9.pdf',
   note:'UKB catálogo técnico 2015, sección matrices Trumpf 30°: dibujo acotado H100, H total120, zanco20. El datum en la V85 concreta sigue pendiente.'
  }),
  title:'UKB 25.504 · matriz V12/30° H100',
  sourceUrl:'https://www.ukb-gmbh.de/en/25504.html',
  cadUrl:'https://daten.ukb-gmbh.de/dxf/zip/25504.DXF.zip',
  format:'DXF_ZIP',access:'PUBLIC_DIRECT_ZIP',
  status:'ENLACE_CONFIRMADO_NO_IMPORTADO',
  dimensions:{heightMm:100,angleDeg:30,vOpeningMm:12,
   shoulderRadiusMm:1,maxLoadKNPerMetre:250},
  note:'Cotas nominales de ficha UKB (V, H, R y capacidad). DXF OEM publicado pero NO descargado ni instalado aquí. Verificar base y plano Z del segmento físico.'
 }),
 freezeEntry({
  id:'ukb-25405',kind:'die',maker:'UKB',reference:'25.405',
  variant:'30deg-V16-H100',mount:'UKB TRUMPF/WILA/BYSTRONIC',
  datum:'OEM_REFERENCE_UNCONFIRMED',
  title:'UKB 25.405 · matriz V16/30° H100',
  sourceUrl:'https://www.ukb-gmbh.de/en/25405.html',
  cadUrl:'https://daten.ukb-gmbh.de/dxf/zip/25405.DXF.zip',
  format:'DXF_ZIP',access:'PUBLIC_DIRECT_ZIP',
  status:'ENLACE_CONFIRMADO_NO_IMPORTADO',
  dimensions:{heightMm:100,angleDeg:30,vOpeningMm:16,
   shoulderRadiusMm:1.6,maxLoadKNPerMetre:500},
  note:'Cotas nominales de ficha UKB (V, H, R y capacidad). DXF OEM publicado pero NO descargado ni instalado aquí. Verificar base y plano Z del segmento físico.'
 }),
 freezeEntry({
  id:'ukb-25407',kind:'die',maker:'UKB',reference:'25.407',
  variant:'30deg-V24-H100',mount:'UKB TRUMPF/WILA/BYSTRONIC',
  datum:'OEM_REFERENCE_UNCONFIRMED',
  title:'UKB 25.407 · matriz V24/30° H100',
  sourceUrl:'https://www.ukb-gmbh.de/en/25407.html',
  cadUrl:'https://daten.ukb-gmbh.de/dxf/zip/25407.DXF.zip',
  format:'DXF_ZIP',access:'PUBLIC_DIRECT_ZIP',
  status:'ENLACE_CONFIRMADO_NO_IMPORTADO',
  dimensions:{heightMm:100,angleDeg:30,vOpeningMm:24,
   shoulderRadiusMm:2.5,maxLoadKNPerMetre:650},
  note:'Cotas nominales de ficha UKB (V, H, R y capacidad). DXF OEM publicado pero NO descargado ni instalado aquí. Verificar base y plano Z del segmento físico.'
 }),
 freezeEntry({
  id:'ukb-25408',kind:'die',maker:'UKB',reference:'25.408',
  variant:'30deg-V30-H100',mount:'UKB TRUMPF/WILA/BYSTRONIC',
  datum:'OEM_REFERENCE_UNCONFIRMED',
  title:'UKB 25.408 · matriz V30/30° H100',
  sourceUrl:'https://www.ukb-gmbh.de/en/25408.html',
  cadUrl:'https://daten.ukb-gmbh.de/dxf/zip/25408.DXF.zip',
  format:'DXF_ZIP',access:'PUBLIC_DIRECT_ZIP',
  status:'ENLACE_CONFIRMADO_NO_IMPORTADO',
  dimensions:{heightMm:100,angleDeg:30,vOpeningMm:30,
   shoulderRadiusMm:3,maxLoadKNPerMetre:900},
  note:'Cotas nominales de ficha UKB (V, H, R y capacidad). DXF OEM publicado pero NO descargado ni instalado aquí. Verificar base y plano Z del segmento físico.'
 }),
 freezeEntry({
  id:'ukb-24035',kind:'die',maker:'UKB',reference:'24.035',
  variant:'30deg-V32-H60',mount:'UKB BYSTRONIC (MONTAJE REAL PENDIENTE)',
  datum:'OEM_REFERENCE_UNCONFIRMED',
  title:'UKB 24.035 · matriz V32/30° H60',
  sourceUrl:'https://www.ukb-gmbh.de/en/24035.html',
  cadUrl:'https://daten.ukb-gmbh.de/dxf/zip/24035.DXF.zip',
  format:'DXF_ZIP',access:'PUBLIC_DIRECT_ZIP',
  status:'ENLACE_CONFIRMADO_NO_IMPORTADO',
  dimensions:{heightMm:60,angleDeg:30,vOpeningMm:32,
   shoulderRadiusMm:4,maxLoadKNPerMetre:500},
  note:'Cotas nominales de ficha UKB (V, H, R y capacidad). DXF OEM publicado pero NO descargado ni instalado aquí. Verificar base y plano Z del segmento físico.'
 }),
 freezeEntry({
  id:'eurostamp-1015',kind:'punch',maker:'EUROSTAMP',reference:'1015',
  variant:'88deg',mount:'Amada/Promecam',datum:'OEM_REFERENCE_UNCONFIRMED',
  title:'Pata de cabra 1015 · 88°',
  sourceUrl:'https://eurostampsrl.it/en/10556/punches-88/1015-punch-88',
  cadUrl:'https://eurostampsrl.it/dxf/1015.dxf',format:'DXF',
  access:'PUBLIC_DIRECT_DXF',status:'ENLACE_CONFIRMADO_NO_IMPORTADO',
  dimensions:{heightMm:88.5,angleDeg:88,tipRadiusMm:3,maxTonnesPerMetre:60},
  note:'Altura nominal 88,5. Posición/contorno del amarre requiere cotejo.'
 }),
 freezeEntry({
  id:'eurostamp-1322',kind:'punch',maker:'EUROSTAMP',reference:'1322',
  variant:'85deg',mount:'MONTAJE_PENDIENTE',datum:'OEM_REFERENCE_UNCONFIRMED',
  title:'Pata de cabra 1322 · 85°',
  sourceUrl:'https://eurostampsrl.it/en/10651/punches-85/1322-punches-85',
  cadUrl:'https://eurostampsrl.it/dxf/1322.dxf',format:'DXF',
  access:'PUBLIC_DIRECT_DXF',status:'ENLACE_CONFIRMADO_NO_IMPORTADO',
  dimensions:{heightMm:120,angleDeg:85,tipRadiusMm:1.5,maxTonnesPerMetre:100},
  note:'No asumir que el amarre coincide con el 1015.'
 }),
 freezeEntry({
  id:'eurostamp-3041',kind:'die',maker:'EUROSTAMP',reference:'3041',
  variant:'30deg-V8',mount:'Amada/Promecam',datum:'OEM_REFERENCE_UNCONFIRMED',
  title:'Matriz de aplastado 3041 · V8/30°',
  sourceUrl:'https://eurostampsrl.it/en/13588/amadapromecam-dies/3041-flattening-hemming-tools-30',
  cadUrl:'https://eurostampsrl.it/dxf/3041.dxf',format:'DXF',
  access:'PUBLIC_DIRECT_DXF',status:'ENLACE_CONFIRMADO_NO_IMPORTADO',
  dimensions:{heightMm:105,angleDeg:30,vOpeningMm:8,maxTonnesPerMetre:80},
  note:'Matriz de aplastado; geometría/no 1-V convencional por defecto.'
 }),
 freezeEntry({
  id:'ukb-22316',kind:'die',maker:'UKB',reference:'22.316',
  variant:'30deg-V16-H60',mount:'Amada/Promecam',datum:'OEM_REFERENCE_UNCONFIRMED',
  title:'Matriz UKB 22.316 · V16/30° H60',
  sourceUrl:'https://www.ukb-gmbh.de/en/22316.html',
  cadUrl:'https://daten.ukb-gmbh.de/dxf/zip/22316.DXF.zip',format:'DXF_ZIP',
  access:'PUBLIC_DIRECT_ZIP',status:'ENLACE_CONFIRMADO_NO_IMPORTADO',
  dimensions:{heightMm:60,angleDeg:30,vOpeningMm:16,shoulderRadiusMm:2,maxLoadKNPerMetre:450},
  note:'Requiere portamatriz 22.010 de UKB o montaje equivalente acreditado.'
 }),
 freezeEntry({
  id:'ukb-26221',kind:'die',maker:'UKB',reference:'26.221',
  variant:'78deg-V60-H90',mount:'LVD',datum:'OEM_REFERENCE_UNCONFIRMED',
  title:'Matriz UKB 26.221 · V60/78° H90',
  sourceUrl:'https://www.ukb-gmbh.de/en/26221.html',
  cadUrl:'https://daten.ukb-gmbh.de/dxf/zip/26221.DXF.zip',format:'DXF_ZIP',
  access:'PUBLIC_DIRECT_ZIP',status:'ENLACE_CONFIRMADO_NO_IMPORTADO',
  dimensions:{heightMm:90,angleDeg:78,vOpeningMm:60,shoulderRadiusMm:5,maxLoadKNPerMetre:2000},
  note:'Amarre LVD, NO sustituir por una matriz Promecam.'
 }),
 freezeEntry({
  id:'mate-bts-010153',kind:'punch',maker:'MATE',reference:'010.153',
  variant:'BTS-88deg',mount:'BTS_SISTEMA_POR_VERIFICAR',
  datum:'OEM_REFERENCE_UNCONFIRMED',
  title:'Punzón Mate 010.153 · 88°',
  sourceUrl:'https://www.mate.com/technical-resources/press-brake-tooling/press-brake-files/bts-punches/',
  cadUrl:'https://www.mate.com/downloads/PBT_DXF/BTS/010.153FA.dxf',
  format:'DXF',access:'PUBLIC_DIRECT_DXF',
  status:'ENLACE_CONFIRMADO_NO_IMPORTADO',
  dimensions:{angleDeg:88,tipRadiusMm:.25,heightMm:66.5},
  note:'La tabla Mate lo cruza con Amada 60.402 (R0,20/H66,90): son referencias EQUIVALENTES, NO idénticas. Verificar contorno DXF y datum.'
 }),
 freezeEntry({
  id:'soclam-2012-88',kind:'die',maker:'SOCLAM',
  reference:'2012_88',variant:'88deg-DOBLE-V6-V10',
  mount:'Amada/Promecam',datum:'OEM_REFERENCE_UNCONFIRMED',
  title:'SOCLAM 20.12 · matriz reversible V6/V10/88°',
  sourceUrl:'https://www.soclam.com/produit/matrice-amada-a-2-ves-a-88/',
  cadUrl:'https://www.soclam.com/wp-content/uploads/2026/05/2012_88.dxf',
  format:'DXF',access:'OEM_PRODUCT_PAGE_WITH_DXF',
  status:'ENLACE_FABRICANTE_NO_IMPORTADO',
  dimensions:{heightMm:26,bodyWidthMm:55,angleDeg:88,vOpeningMm:6},
  note:'Matriz reversible V6/V10. Necesita soporte SOCLAM 40.06 o 40.07; el DXF del perfil no define el soporte ni el montaje real.'
 }),
 freezeEntry({
  id:'soclam-2015-88',kind:'die',maker:'SOCLAM',
  reference:'2015_88',variant:'88deg-DOBLE-V16-V25',
  mount:'Amada/Promecam',datum:'OEM_REFERENCE_UNCONFIRMED',
  title:'SOCLAM 20.15 · matriz reversible V16/V25/88°',
  sourceUrl:'https://www.soclam.com/produit/matrice-amada-a-2-ves-a-88/',
  cadUrl:'https://www.soclam.com/wp-content/uploads/2026/05/2015_88.dxf',
  format:'DXF',access:'OEM_PRODUCT_PAGE_WITH_DXF',
  status:'ENLACE_FABRICANTE_NO_IMPORTADO',
  dimensions:{heightMm:26,bodyWidthMm:55,angleDeg:88,vOpeningMm:16},
  note:'Se puede orientar para V16 o V25, no equivale a una monovía. Requiere soporte 40.06/40.07 y eje/amarre verificado.'
 }),

 freezeEntry({
  id:'ukb-22010',kind:'lowerAdapter',maker:'UKB',reference:'22.010',
  variant:'PORTAMATRIZ-1V-AMADA',mount:'Amada/Promecam',
  datum:'OEM_REFERENCE_UNCONFIRMED',
  title:'UKB 22.010 · portamatriz para una V',
  sourceUrl:'https://www.ukb-gmbh.de/en/22010.html',
  cadUrl:'https://daten.ukb-gmbh.de/dxf/zip/22010.DXF.zip',
  format:'DXF_ZIP',access:'PUBLIC_DIRECT_ZIP',
  status:'ENLACE_CONFIRMADO_NO_IMPORTADO',
  dimensions:{heightMm:51.5,bodyWidthMm:60,maxLoadKNPerMetre:1000},
  note:'Portamatriz que requiere montaje Amada. Incluye apriete; no sustituye al soporte SOCLAM 40.06/40.07.'
 }),
 freezeEntry({
  id:'ukb-50430',kind:'upperAdapter',maker:'UKB',reference:'50.430',
  variant:'AMADA-A-TRUMPF-WILA-LVD-1',mount:'ADAPTADOR_AMADA_A_TRUMPF_WILA_LVD_TIPO_I',
  datum:'OEM_REFERENCE_UNCONFIRMED',
  title:'UKB 50.430 · adaptador superior Amada a Trumpf/WILA/LVD I',
  sourceUrl:'https://www.ukb-gmbh.de/en/50430.html',
  cadUrl:'https://daten.ukb-gmbh.de/dxf/zip/50430.DXF.zip',
  format:'DXF_ZIP',access:'PUBLIC_DIRECT_ZIP',
  status:'ENLACE_CONFIRMADO_NO_IMPORTADO',
  dimensions:{heightMm:67,maxLoadKNPerMetre:1000},
  note:'La dirección de conversión del amarre importa. No asumir que encaja en la V85 ni en los cabezales WILA Bystronic.'
 }),
 freezeEntry({
  id:'ukb-22308',kind:'die',maker:'UKB',reference:'22.308',
  variant:'30deg-V8-H60',mount:'Amada/Promecam',
  datum:'OEM_REFERENCE_UNCONFIRMED',
  title:'UKB 22.308 · matriz V8/30° H60',
  sourceUrl:'https://www.ukb-gmbh.de/en/22308.html',
  cadUrl:'https://daten.ukb-gmbh.de/dxf/zip/22308.DXF.zip',
  format:'DXF_ZIP',access:'PUBLIC_DIRECT_ZIP',
  status:'ENLACE_CONFIRMADO_NO_IMPORTADO',
  dimensions:{heightMm:60,angleDeg:30,vOpeningMm:8,
   shoulderRadiusMm:.8,maxLoadKNPerMetre:350},
  note:'Necesita portamatriz 22.010 y orientación correcta; no equivale a las matrices V8/30 de otro sistema.'
 }),
 freezeEntry({
  id:'soclam-4006-34',kind:'lowerAdapter',maker:'SOCLAM',
  reference:'40.06/34',variant:'H34-PORTAMATRIZ-DOBLE-V',
  mount:'Amada/Promecam',datum:'OEM_REFERENCE_UNCONFIRMED',
  title:'SOCLAM 40.06/34 · soporte de matrices reversibles',
  sourceUrl:'https://www.soclam.com/produit/support-matrice-amada-ref-40-06/',
  cadUrl:null,format:'DXF_EN_FICHA',access:'OEM_PRODUCT_PAGE_WITH_DXF',
  status:'FICHA_DXF_REQUIERE_DESCARGA_MANUAL',
  dimensions:{heightMm:34,maxTonnesPerMetre:100},
  note:'Familia 40.06/40.07 con alturas 34, 39, 55, 75 mm. Esta entrada se limita a 40.06/34; no combinar alturas de otras variantes.'
 }),
 freezeEntry({
  id:'wila-tsu-024',kind:'upperAdapter',maker:'WILA',reference:'TSU-024',
  variant:'NEW-STANDARD-A-EUROPEAN-STYLE-I',
  mount:'WILA_NEW_STANDARD',datum:'OEM_REFERENCE_UNCONFIRMED',
  title:'WILA TSU-024 · adaptador New Standard a europeo I',
  sourceUrl:'https://www.wilatooling.com/products/press-brake-tooling/tooling-options/tool-extenders-and-adapters/tsu-024/',
  cadUrl:null,format:'DXF_CON_REGISTRO',access:'MYWILA_O_EMAIL',
  status:'DXF_DISPONIBLE_REQUIERE_SOLICITUD',
  dimensions:{heightMm:73,bodyWidthMm:49.5,maxTonnesPerMetre:100},
  note:'Plano DXF de WILA disponible mediante correo o MyWILA. Se suministra con TK-031; comprobar todas las fijaciones reales.'
 }),
 freezeEntry({"id":"ukb-11151","kind":"punch","maker":"UKB","reference":"11.151","variant":"85deg-R0.8-H104.5","mount":"Amada/Promecam","datum":"OEM_REFERENCE_UNCONFIRMED","title":"UKB 11.151 · punzón 85° R0,8 H104,5","sourceUrl":"https://www.ukb-gmbh.de/en/11151.html","cadUrl":"https://daten.ukb-gmbh.de/dxf/zip/11151.DXF.zip","format":"DXF_ZIP","access":"PUBLIC_DIRECT_ZIP","status":"ENLACE_CONFIRMADO_NO_IMPORTADO","dimensions":{"heightMm":104.5,"angleDeg":85,"tipRadiusMm":0.8,"maxLoadKNPerMetre":500},"note":"Comprobar cuello, X de punta y tang OEM; la silueta 2D del fabricante manda sobre cualquier dibujo paramétrico."}),
 freezeEntry({"id":"ukb-11200","kind":"punch","maker":"UKB","reference":"11.200","variant":"85deg-R0.8-H66.5","mount":"Amada/Promecam","datum":"OEM_REFERENCE_UNCONFIRMED","title":"UKB 11.200 · punzón 85° R0,8 H66,5","sourceUrl":"https://www.ukb-gmbh.de/en/11200.html","cadUrl":"https://daten.ukb-gmbh.de/dxf/zip/11200.DXF.zip","format":"DXF_ZIP","access":"PUBLIC_DIRECT_ZIP","status":"ENLACE_CONFIRMADO_NO_IMPORTADO","dimensions":{"heightMm":66.5,"angleDeg":85,"tipRadiusMm":0.8,"maxLoadKNPerMetre":1000},"note":"H de trabajo publicada; no sustituir por 11.151 aunque tengan 85° y R0,8."}),
 freezeEntry({"id":"ukb-10170","kind":"punch","maker":"UKB","reference":"10.170","variant":"85deg-R0.6-H66.74","mount":"Amada/Promecam","datum":"OEM_REFERENCE_UNCONFIRMED","title":"UKB 10.170 · punzón 85° R0,6 H66,74","sourceUrl":"https://www.ukb-gmbh.de/en/10170.html","cadUrl":"https://daten.ukb-gmbh.de/dxf/zip/10170.DXF.zip","format":"DXF_ZIP","access":"PUBLIC_DIRECT_ZIP","status":"ENLACE_CONFIRMADO_NO_IMPORTADO","dimensions":{"heightMm":66.74,"angleDeg":85,"tipRadiusMm":0.6,"maxLoadKNPerMetre":350},"note":"Geometría de perfil distinta de 11.200; no fusionar ni modificar H."}),
 freezeEntry({"id":"ukb-25406","kind":"die","maker":"UKB","reference":"25.406","variant":"30deg-V20-H100","mount":"UKB TRUMPF/WILA/BYSTRONIC","datum":"OEM_REFERENCE_UNCONFIRMED","title":"UKB 25.406 · matriz V20/30° H100","sourceUrl":"https://www.ukb-gmbh.de/en/25406.html","cadUrl":"https://daten.ukb-gmbh.de/dxf/zip/25406.DXF.zip","format":"DXF_ZIP","access":"PUBLIC_DIRECT_ZIP","status":"ENLACE_CONFIRMADO_NO_IMPORTADO","dimensions":{"heightMm":100,"angleDeg":30,"vOpeningMm":20,"shoulderRadiusMm":2,"maxLoadKNPerMetre":600},"note":"Familia UKB-System Trumpf; comprobar asiento WILA/Bystronic real y posición de V."}),
 freezeEntry({"id":"ukb-29351","kind":"die","maker":"UKB","reference":"29.351","variant":"30deg-V8-H100","mount":"WILA","datum":"OEM_REFERENCE_UNCONFIRMED","title":"UKB 29.351 · matriz V8/30° H100","sourceUrl":"https://www.ukb-gmbh.de/en/29351.html","cadUrl":"https://daten.ukb-gmbh.de/dxf/zip/29351.DXF.zip","format":"DXF_ZIP","access":"PUBLIC_DIRECT_ZIP","status":"ENLACE_CONFIRMADO_NO_IMPORTADO","dimensions":{"heightMm":100,"angleDeg":30,"vOpeningMm":8,"shoulderRadiusMm":2.5,"maxLoadKNPerMetre":800},"note":"WILA, no intercambiar con base Promecam; carga máxima publicada para plegado a 90°."}),
 freezeEntry({"id":"ukb-29353","kind":"die","maker":"UKB","reference":"29.353","variant":"30deg-V16-H100","mount":"WILA","datum":"OEM_REFERENCE_UNCONFIRMED","title":"UKB 29.353 · matriz V16/30° H100","sourceUrl":"https://www.ukb-gmbh.de/en/29353.html","cadUrl":"https://daten.ukb-gmbh.de/dxf/zip/29353.DXF.zip","format":"DXF_ZIP","access":"PUBLIC_DIRECT_ZIP","status":"ENLACE_CONFIRMADO_NO_IMPORTADO","dimensions":{"heightMm":100,"angleDeg":30,"vOpeningMm":16,"shoulderRadiusMm":3.5,"maxLoadKNPerMetre":800},"note":"WILA R3,5, distinta de 22.316 R2; no mezclar radios ni hombros."}),
 freezeEntry({"id":"ukb-25501","kind":"die","maker":"UKB","reference":"25.501","variant":"30deg-V6-H100","mount":"UKB TRUMPF/WILA/BYSTRONIC","datum":"OEM_REFERENCE_UNCONFIRMED","title":"UKB 25.501 · matriz V6/30° H100","sourceUrl":"https://www.ukb-gmbh.de/en/25501.html","cadUrl":"https://daten.ukb-gmbh.de/dxf/zip/25501.DXF.zip","format":"DXF_ZIP","access":"PUBLIC_DIRECT_ZIP","status":"ENLACE_CONFIRMADO_NO_IMPORTADO","dimensions":{"heightMm":100,"angleDeg":30,"vOpeningMm":6,"shoulderRadiusMm":0.6,"maxLoadKNPerMetre":170},"note":"Sección de 30° y carga 170 kN/m; verificar geometría de portamatriz."}),
 freezeEntry({"id":"ukb-29552","kind":"die","maker":"UKB","reference":"29.552","variant":"30deg-V12-H55","mount":"WILA","datum":"OEM_REFERENCE_UNCONFIRMED","title":"UKB 29.552 · matriz V12/30° H55","sourceUrl":"https://www.ukb-gmbh.de/en/29552.html","cadUrl":"https://daten.ukb-gmbh.de/dxf/zip/29552.DXF.zip","format":"DXF_ZIP","access":"PUBLIC_DIRECT_ZIP","status":"ENLACE_CONFIRMADO_NO_IMPORTADO","dimensions":{"heightMm":55,"angleDeg":30,"vOpeningMm":12,"shoulderRadiusMm":1,"maxLoadKNPerMetre":800},"note":"Carga nominal indicada para plegado a 90°; sección WILA, no Amada."}),
 freezeEntry({"id":"ukb-25500","kind":"die","maker":"UKB","reference":"25.500","variant":"30deg-V5-H100","mount":"UKB TRUMPF/WILA/BYSTRONIC","datum":"OEM_REFERENCE_UNCONFIRMED","title":"UKB 25.500 · matriz V5/30° H100","sourceUrl":"https://www.ukb-gmbh.de/en/25500.html","cadUrl":"https://daten.ukb-gmbh.de/dxf/zip/25500.DXF.zip","format":"DXF_ZIP","access":"PUBLIC_DIRECT_ZIP","status":"ENLACE_CONFIRMADO_NO_IMPORTADO","dimensions":{"heightMm":100,"angleDeg":30,"vOpeningMm":5,"shoulderRadiusMm":0.6,"maxLoadKNPerMetre":150},"note":"Matricería UKB-System Trumpf/Wila/Bystronic; puede configurarse con agujero adicional 70.800. Descargar y verificar contorno/montaje antes de usar."}),
 freezeEntry({
  id:'ukb-25202',kind:'die',maker:'UKB',reference:'25.202',
  variant:'84deg-V8-H100',mount:'UKB TRUMPF/WILA/BYSTRONIC',
  datum:'OEM_REFERENCE_UNCONFIRMED',
  title:'UKB 25.202 · matriz V8/84° H100',
  sourceUrl:'https://www.ukb-gmbh.de/en/25202.html',
  cadUrl:'https://daten.ukb-gmbh.de/dxf/zip/25202.DXF.zip',
  format:'DXF_ZIP',access:'PUBLIC_DIRECT_ZIP',
  status:'ENLACE_CONFIRMADO_NO_IMPORTADO',
  dimensions:{heightMm:100,angleDeg:84,vOpeningMm:8,
   shoulderRadiusMm:.8,maxLoadKNPerMetre:1000},
  note:'Ficha UKB y enlace DXF publicados; contenido ZIP no descargado. No confundir 84° con 85° u 88° y no asumir montaje en V85.'
 }),
 freezeEntry({"id":"ukb-25621","kind":"die","maker":"UKB","reference":"25.621","variant":"84deg-V6-H150","mount":"UKB TRUMPF/WILA/BYSTRONIC","datum":"OEM_REFERENCE_UNCONFIRMED","title":"UKB 25.621 · matriz V6/84° H150","sourceUrl":"https://www.ukb-gmbh.de/en/25621.html","cadUrl":"https://daten.ukb-gmbh.de/dxf/zip/25621.DXF.zip","format":"DXF_ZIP","access":"PUBLIC_DIRECT_ZIP","status":"ENLACE_CONFIRMADO_NO_IMPORTADO","dimensions":{"heightMm":150,"angleDeg":84,"vOpeningMm":6,"shoulderRadiusMm":0.6,"maxLoadKNPerMetre":1000},"note":"Serie 84°, H150. Existe una variante 86° 25.601 bajo pedido; NO convertir 25.621 automáticamente a 86°/88°."}),
 freezeEntry({
  id:'soclam-bystronic-m16-30',kind:'die',maker:'SOCLAM',
  reference:'M16/30°',variant:'BYSTRONIC_BEYELER',
  mount:'Bystronic/Beyeler R',datum:'CATALOGUE_UNSPECIFIED',
  title:'SOCLAM matriz tipo Bystronic/Beyeler V16/30°',
  sourceUrl:'https://soclaform.fr/wp-content/uploads/2017/12/2017-SOCLAM-BYSTRONIC-BEYELER.pdf',
  cadUrl:null,format:'PDF_ACOTADO',access:'PUBLIC_CATALOGUE',
  status:'COTAS_PARCIALES_SIN_DXF',
  dimensions:{angleDeg:30,vOpeningMm:16,shoulderRadiusMm:2,heightMm:55},
  note:'SOCLAM catálogo 2017, página impresa 42. No confundir perfil Beyeler con Promecam.'
 }),
 freezeEntry({
  id:'trumpf-v85-family',kind:'machine',maker:'TRUMPF',
  reference:'TrumaBend V85',variant:'V85_SERIE_HISTORICA',
  mount:'MONTAJE_PENDIENTE',datum:'FAMILY_ONLY',
  title:'TrumaBend V85 · dimensiones históricas de la familia',
  sourceUrl:'https://www.mteg-maschinen.de/fileadmin/mteg_Upload/03_TRUMPF_Prospekte_mteg/TrumaBend-V-Series_TRUMPF_Brochure.pdf',
  cadUrl:null,format:'CATALOGO_TECNICO',access:'PUBLIC_CATALOGUE',
  status:'FICHA_FAMILIA_SIN_CAD_DE_UNIDAD',
  dimensions:{nominalBendingLengthMm:2050,nominalTonnageKN:850,
   nominalBedWidthMm:120,nominalThroatMm:410,strokeStandardMm:215,
   strokeExtendedOptionalMm:365,openStandardMm:385,openExtendedOptionalMm:535,
   travelXMm:600,travelRMm:250},
  note:'V85 histórica con 2050 nominal; la unidad PlegadoX está declarada 2040. No sobreescribir datos del control ni deducir versión de carrera.'
 }),
 freezeEntry({
  id:'bystronic-bysoft-model-library',kind:'machine',maker:'BYSTRONIC',
  reference:'BySoft CAM System Data',variant:'VERSION_CON_LICENCIA',
  mount:'SIN_MONTAJE_VERIFICADO',datum:'NO_MACHINE_UNIT_DATUM',
  title:'Bystronic BySoft CAM · modelos internos de máquina, tope y utillaje',
  sourceUrl:'https://bystronic-mediacenter.picturepark.com/v/uSPrfoiG/',
  cadUrl:null,format:'MODELOS_3D_EN_SISTEMA',
  access:'DATOS_LOCALES_SOFTWARE_CON_LICENCIA',
  status:'MODELOS_NO_EXPORTADOS',
  dimensions:{},
  note:'La documentación enumera BackStopModels, BendingMachineConfigs, BendingMachines, UpperTools, LowerTools y VrModels 3D. No hay archivos de la unidad del propietario descargados aquí; solicitar exportación autorizada del software instalado.'
 }),
 freezeEntry({
  id:'bystronic-afm-ep31-100-family',kind:'machine',maker:'BYSTRONIC',
  reference:'AFM EP 31-100',variant:'AFM_EP_FAMILIA_2007',
  mount:'MONTAJE_PENDIENTE',datum:'FAMILY_ONLY',
  title:'Bystronic AFM EP 31-100 · ficha modelo de ocasión 2007',
  sourceUrl:'https://zebramachinery.com/product/bystronic-ep-31-100/',
  cadUrl:null,format:'FICHA_MODELO',access:'PUBLIC_PRODUCT_PAGE',
  status:'FICHA_FAMILIA_SIN_CAD_DE_UNIDAD',
  dimensions:{nominalBendingLengthMm:3100,nominalTonnageKN:1000,
   strokeStandardMm:200},
  note:'Vinculación a la máquina del usuario todavía provisional; no copiar cotas de Xpert 100.'
 })
]);

const ID=s=>String(s??'').normalize('NFKC').trim().toUpperCase().replace(/\s+/g,'');
const components=['kind','maker','reference','variant','mount'];
const numericKeys=new Set([
 'heightMm','bodyWidthMm','angleDeg','tipRadiusMm','shoulderRadiusMm','vOpeningMm',
 'maxTonnesPerMetre','maxLoadKNPerMetre','nominalBendingLengthMm',
 'nominalTonnageKN','nominalBedWidthMm','nominalThroatMm',
 'strokeStandardMm','strokeExtendedOptionalMm','openStandardMm',
 'openExtendedOptionalMm','travelXMm','travelRMm'
]);
const componentKeys=new Set(['heightMm','bodyWidthMm',
 'maxTonnesPerMetre','maxLoadKNPerMetre']);
const allowedByKind={
 lowerAdapter:componentKeys,upperAdapter:componentKeys,
 upperClamp:componentKeys,lowerClamp:componentKeys,
 frontSupport:componentKeys,
 punch:new Set(['heightMm','bodyWidthMm','angleDeg','tipRadiusMm',
  'maxTonnesPerMetre','maxLoadKNPerMetre']),
 die:new Set(['heightMm','bodyWidthMm','angleDeg','shoulderRadiusMm',
  'vOpeningMm','maxTonnesPerMetre','maxLoadKNPerMetre']),
 machine:new Set(['nominalBendingLengthMm','nominalTonnageKN',
  'nominalBedWidthMm','nominalThroatMm','strokeStandardMm',
  'strokeExtendedOptionalMm','openStandardMm','openExtendedOptionalMm',
  'travelXMm','travelRMm'])
};
/** Metadatos complementarios sin inventar un CONTORNO.
 * Sólo se unen cotas de EXACTAMENTE el mismo fabricante, referencia,
 * variante, sistema de amarre y clase de componente.
 * Valores incompatibles generan CONFLICTO, nunca se promedian.
 */
export function reconcileCadDimensions(entries,{toleranceMm=.05,required=[]}={}){
 if(!Array.isArray(entries)||!entries.length)
  throw Error('Hace falta una fuente CAD acotada');
 if(!Number.isFinite(toleranceMm)||toleranceMm<0||toleranceMm>1)
  throw Error('Tolerancia de comparación inválida');
 const first=entries[0],dims={},evidence={},conflicts=[];
 for(const source of entries){
  if(!source||typeof source!=='object'||!source.sourceUrl)
   throw Error('Falta procedencia del dato CAD');
  for(const key of components)
   if(ID(source[key])!==ID(first[key]))
    throw Error('No se pueden mezclar referencias, variantes o amarres distintos: '+key);
  for(const [key,val] of Object.entries(source.dimensions||{})){
   if(!numericKeys.has(key)||!allowedByKind[source.kind]?.has(key)||
    !Number.isFinite(val)||val<0)
    throw Error('Cota no válida o unidad desconocida: '+key);
   if(!(key in dims)){dims[key]=val;evidence[key]=[source.id||source.sourceUrl];}
   else if(Math.abs(dims[key]-val)>toleranceMm){
    if(!conflicts.some(x=>x.field===key))
     conflicts.push({field:key,a:dims[key],b:val,
      sources:[...evidence[key],source.id||source.sourceUrl]});
   }else evidence[key].push(source.id||source.sourceUrl);
  }
 }
 // Una contradicción no habilita una cota "promediada" peligrosa.
 for(const c of conflicts){delete dims[c.field];delete evidence[c.field];}
 const minimum=required.length?required:first.kind==='punch'?
  ['heightMm','angleDeg','tipRadiusMm']:
  first.kind==='die'?
   ['heightMm','angleDeg','vOpeningMm']:
   first.kind==='machine'?
    ['nominalBendingLengthMm','nominalTonnageKN','strokeStandardMm']:
   componentKeys===allowedByKind[first.kind]?['heightMm','bodyWidthMm']:[];
 const missing=minimum.filter(key=>!Object.prototype.hasOwnProperty.call(dims,key));
 const sameDatum=entries.every(x=>x.datum===first.datum&&
  x.datum&&x.datum!=='OEM_REFERENCE_UNCONFIRMED'&&
  x.datum!=='CATALOGUE_UNSPECIFIED'&&x.datum!=='FAMILY_ONLY');
 return {identity:Object.fromEntries(components.map(k=>[k,first[k]])),
  dimensions:dims,evidence,conflicts,missing,
  geometryMergeAllowed:sameDatum&&conflicts.length===0,
  status:conflicts.length?'COTAS_CONTRADICTORIAS':
   missing.length?'COTAS_PARCIALES':
   'COTAS_RECOPILADAS_NO_CERTIFICADAS',
  cadImported:false,verified:false,canApproveForMachine:false};
}
export function cadSourceFor(kind,maker,reference){
 return CAD_EVIDENCE_SOURCES.filter(item=>
  ID(item.kind)===ID(kind)&&ID(item.maker)===ID(maker)&&
  ID(item.reference)===ID(reference));
}
export function cadCoverage(machineId,imports={}){
 const required=CAD_REQUIREMENTS[machineId];
 if(!required)throw Error('Plegadora sin inventario CAD disponible');
 const local=imports&&typeof imports==='object'?imports:{};
 const has=kind=>Array.isArray(local[kind]?.points)&&
  local[kind].points.length>0;
 const sources=kind=>{
  if(has(kind))return [kind];
  if(['stop','support'].includes(kind)&&has(kind+'Z1')&&has(kind+'Z2'))
   return [kind+'Z1',kind+'Z2'];
  return [];
 };
 // R133: dos DXF Z1+Z2 sustituye la sección genérica del dedo
 // en el inventario, pero UN SOLO dedo nunca cubre la pareja.
 const statuses=required.map(kind=>{
  const coveredBy=sources(kind),imported=coveredBy.length>0;
  return {kind,imported,coveredBy,verified:false,
   status:imported?'CONTORNO_IMPORTADO_MONTAJE_NO_VERIFICADO':'CAD_PENDIENTE'};
 });
 return {machineId,requiredCount:statuses.length,
  importedCount:statuses.filter(x=>x.imported).length,
  missing:statuses.filter(x=>!x.imported).map(x=>x.kind),
  statuses,verified:false,canApproveForMachine:false};
}
