/**
 * Referencias adicionales transcritas del índice ORIGINAL impreso
 * TECNOSTAMP ED22 distribuido en MECOS (2022).
 *
 * https://www.mecos.es/files/productos/utillaje-plegadora/MECOS-Catalogo-General-de-Utillaje-2022.pdf
 *
 * Los códigos / ángulos / páginas se copian del índice del fabricante.
 * NO se suponen alturas, radios, longitudes, V, perfiles CAD, disponibilidad
 * real de taller, adaptadores o compatibilidad con la V85.
 * Por eso estos elementos son SOLO INVENTARIO, nunca herramientas
 * elegibles automáticamente hasta completar su ficha física y CAD.
 */
export const MECOS_ED22_CATALOG_URL=
 'https://www.mecos.es/files/productos/utillaje-plegadora/MECOS-Catalogo-General-de-Utillaje-2022.pdf';
const group=(kind,style,angle,page,codes)=>codes.trim().split(/\s+/).map(reference=>({
 kind,style,reference,angle,page,source:'MECOS / TECNOSTAMP ED22',
 geometry:'CONTORNO_CAD_FALTANTE',selectable:false,
 height:null,profilePoints:null,mount:null,verifiedCollision:false
}));
export const MECOS_ED22_REFERENCES=Object.freeze([
 ...group('punch','AMADA / PROMECAM',85,14,'10.170 10.672 11.200 11.201 11.230 11.231 11.232 11.270 11.650 11.853 11.855 11.857 11.865 11.868'),
 ...group('punch','AMADA / PROMECAM',85,15,'11.151 11.660 11.670 11.680 11.820 11.835 11.848 11.849 11.863 11.864 11.866 11.867 11.869'),
 ...group('punch','AMADA / PROMECAM',85,16,'11.800 11.840 11.850'),
 ...group('punch','AMADA / PROMECAM',30,19,'11.158 11.258 11.528 11.530 11.780 11.810 11.880'),
 ...group('punch','AMADA / PROMECAM',30,20,'11.904 11.911 11.914 11.916'),
 ...group('punch','AMADA / PROMECAM',60,17,'10.142 10.143 10.500 10.506 10.510 10.516 10.517 10.520 11.750 11.831'),
 ...group('punch','AMADA / PROMECAM',35,18,'11.103 11.104 11.600'),
 ...group('punch','TRUMPF',86,47,'15.330 15.335 15.370 15.380'),
 ...group('punch','TRUMPF',86,48,'15.700 15.710 15.800'),
 ...group('punch','TRUMPF',80,47,'15.480'),
 ...group('punch','TRUMPF',60,47,'15.310'),
 ...group('punch','TRUMPF',28,49,'15.320 15.450 15.620'),
 ...group('punch','TRUMPF',28,50,'15.720 15.750'),
 ...group('punch','TRUMPF',60,49,'15.730'),
 ...group('punch','TRUMPF',84,48,'15.790'),
 ...group('punch','BYSTRONIC / BEYELER',60,73,'14.010'),
 ...group('punch','BYSTRONIC / BEYELER',80,73,'14.020 14.060'),
 ...group('punch','BYSTRONIC / BEYELER',28,73,'14.030 14.050'),
 ...group('punch','BYSTRONIC / BEYELER',86,73,'14.040'),
 ...group('punch','BYSTRONIC / BEYELER',85,75,'14.150 14.151 14.152 14.156'),
 ...group('punch','BYSTRONIC / BEYELER',30,75,'14.153 14.154 14.155 14.167'),
 ...group('punch','BYSTRONIC / BEYELER',85,76,'14.158 14.159 14.160 14.166 14.168'),
 ...group('punch','BYSTRONIC / BEYELER',60,76,'14.165'),
 ...group('punch','BYSTRONIC / BEYELER',30,77,'14.161 14.162 14.163 14.169'),
 ...group('die','AMADA / PROMECAM',85,29,'20.210 20.211 20.212'),
 ...group('die','AMADA / PROMECAM',85,30,'20.213 20.214 20.215'),
 ...group('die','AMADA / PROMECAM',80,30,'20.216 20.217'),
 ...group('die','AMADA / PROMECAM',60,32,'20.297 20.298 20.299 20.300 20.301 20.308 20.311'),
 ...group('die','AMADA / PROMECAM',30,32,'20.317 20.318 20.319 20.320 20.321 20.322 20.323'),
 ...group('die','AMADA / PROMECAM',85,35,'20.344 20.345 20.346 20.347 20.348 20.349'),
 ...group('die','AMADA / PROMECAM',30,33,'20.351 20.352 20.353 20.354 20.401 20.402 20.403'),
 ...group('die','AMADA / PROMECAM',60,33,'20.386 20.387 20.388 20.389 20.390 20.391 20.392'),
 ...group('die','AMADA / PROMECAM',35,32,'20.406 20.408 20.410 20.412 20.416 20.420 20.425'),
 ...group('die','AMADA / PROMECAM',85,32,'20.506 20.508 20.510 20.512 20.516 20.520 20.525'),
 ...group('die','AMADA / PROMECAM',30,40,'20.450'),
 ...group('die','AMADA / PROMECAM',85,28,'20.820'),
 ...group('die','AMADA / PROMECAM',30,28,'20.830'),
 ...group('die','TRUMPF',86,53,'25.100 25.101 25.102 25.103 25.104 25.105 25.106 25.107 25.108 25.109 25.110 25.350'),
 ...group('die','TRUMPF',80,53,'25.111 25.112 25.113 25.114 25.115 25.207 25.208 25.209 25.210'),
 ...group('die','TRUMPF',60,53,'25.116'),
 ...group('die','TRUMPF',84,53,'25.200 25.201 25.202 25.203 25.204 25.205 25.206 25.300 25.301 25.302 25.303 25.304'),
 ...group('die','TRUMPF',30,53,'25.400 25.401 25.402 25.403 25.404 25.405 25.406 25.407 25.408 25.409 25.410 25.421 25.422 25.423'),
 ...group('die','BYSTRONIC / BEYELER',85,80,'24.403 24.404 24.405 24.406 24.407 24.408 24.409 24.410 24.411'),
 ...group('die','BYSTRONIC / BEYELER',30,80,'24.017 24.018 24.320'),
 ...group('die','BYSTRONIC / BEYELER',85,81,'24.503 24.504 24.505 24.506 24.507 24.508 24.509 24.510 24.511 24.512 24.513 24.514 24.515'),
 ...group('die','BYSTRONIC / BEYELER',30,81,'24.553 24.554 24.555 24.556 24.557 24.558 24.559 24.560 24.561 24.562 24.563 24.564 24.565')
]);
