/**
 * Eurostamp · referencias consultadas en fichas oficiales en noviembre 2026.
 * IMPORTANTE: son fichas de catálogo, NO contornos CAD incrustados.
 * El DXF ORIGINAL sólo puede utilizarse tras importación explícita del usuario
 * y comprobación dimensional. Ningún croquis paramétrico equivale a perfil OEM.
 *
 * "tip" es DIÁMETRO nominal, no radio; 2 × R de la ficha.
 * No se inventan cotas, longitudes de segmentación ni escotes.
 */
export const EUROSTAMP_REFERENCES=Object.freeze({
 official:'https://eurostampsrl.it/en/punches-30',
 historical2017:'https://www.bendis-eng.com/kataloglar/Eurostamp_Catalogue_2017.pdf'
});
const punch=(ref,angle,height,radius,type,productUrl,extra={})=>({
 id:'eurostamp-p'+ref,
 manufacturer:'Eurostamp',reference:String(ref),name:
  (type==='cabra'?'Pata de cabra':'Recto')+' '+angle+'° · '+ref+
  ' · H'+height+' · R'+String(radius).replace('.',','),
 angle,height,tip:radius*2,type,productUrl:productUrl||null,
 source:productUrl?'eurostampOfficial':'eurostampCatalogue2017',
 mount:'',verifiedSpecs:true,profileAccuracy:'provisional',
 cadStatus:'pendiente-DXF-original',cadVerified:false,
 ...extra
});
const die=(ref,angle,opening,height,productUrl,extra={})=>({
 id:'eurostamp-d'+ref,manufacturer:'Eurostamp',reference:String(ref),
 name:'Matriz '+angle+'° · '+ref+' · V'+opening+' · H'+height,
 angle,opening,height,type:'die',
 productUrl,source:'eurostampOfficial',
 mount:'',verifiedSpecs:true,profileAccuracy:'provisional',
 cadStatus:'pendiente-DXF-original',cadVerified:false,...extra
});
export const EUROSTAMP_PUNCHES=[
 // Catálogo actual 30°: no atribuir escote a un punzón recto.
 punch(1193,30,104,.6,'recto','https://eurostampsrl.it/en/10780/punches-30/1193-punch-30'),
 punch(1289,30,104,3,'recto','https://eurostampsrl.it/en/10784/punches-30/1289-punch-30'),
 punch(1194,30,104,5,'recto','https://eurostampsrl.it/en/10791/punches-30/1194-punch-30'),
 punch(1056,30,80,.5,'recto','https://eurostampsrl.it/en/10803/punches-30/1056-punch-30'),
 punch(1086,30,140,.6,'recto','https://eurostampsrl.it/en/10824/punches-30/1086-punch-30'),
 punch(1052,30,135,.5,'recto','https://eurostampsrl.it/en/10828/punches-30/1052-punch-30'),
 punch(1292,30,200,.5,'recto','https://eurostampsrl.it/en/10814/punches-30/1292-punch-30'),
 // Catálogo actual 88°: pata de cabra normal y de gran altura.
 punch(1063,88,104.65,.8,'recto','https://eurostampsrl.it/en/9775/punches-88-amada/1063-punches-88',{mount:'Amada/Promecam'}),
 punch(1014,88,89.65,.8,'cabra','https://eurostampsrl.it/en/10547/punches-88-amada/1014-punches-88',{mount:'Amada/Promecam'}),
 punch(1015,88,88.5,3,'cabra','https://eurostampsrl.it/en/10556/punches-88-amada/1015-punches-88',{mount:'Amada/Promecam',cadDownloadUrl:'https://eurostampsrl.it/dxf/1015.dxf'}),
 punch(1017,88,104.65,.8,'cabra','https://eurostampsrl.it/en/10582/punches-88-amada/1017-punches-88',{mount:'Amada/Promecam'}),
 punch(1031,88,165,.8,'cabra','https://eurostampsrl.it/en/25415/punches-88-amada/1031-punches-88',{mount:'Amada/Promecam'}),
 punch(1291,88,200,.8,'cabra','https://eurostampsrl.it/9760/punzoni-88-amada/1291-punches-88',{mount:'Amada/Promecam'}),
 // Referencias 90° del catálogo Eurostamp 2017: CAD vigente no localizado.
 punch(1010,90,66.65,.8,'recto',null),
 punch(1021,90,86,.8,'recto',null),
 punch(1013,90,89.65,.8,'cabra',null),
 punch(1016,90,104.65,.8,'cabra',null),
 punch(1060,90,120,.8,'cabra',null),
 punch(1174,90,104.88,.25,'cabra',null)
];
export const EUROSTAMP_DIES=[
 // Serie 1V de 30°; no confundir el alojamiento WILA con la Trumpf V85.
 die(3262,30,10,55,'https://eurostampsrl.it/en/11281/1v-dies-30/3262-wila-1v-dies-30',{mount:'Wila'}),
 die(3265,30,20,55,'https://eurostampsrl.it/en/11252/1v-dies-30/3265-wila-1v-dies-30',{mount:'Wila'}),
 die(3280,30,6,100,'https://eurostampsrl.it/en/36705/1v-dies-30/3280-1v-die-30'),
 // 85°: matriz 1V y T diferenciadas; sólo abertura publicitada.
 die(3111,85,32,55,'https://eurostampsrl.it/en/13212/1v-dies-85/3111-1v-die-85'),
 die(3112,85,40,55,'https://eurostampsrl.it/en/13203/1v-dies-85/3112-1v-die-85'),
 die(3091,85,20,80,'https://eurostampsrl.it/en/11663/t-dies-85-amada/3091-t-dies-85',{mount:'Amada/Promecam'}),
 // 88°: insertos 1V autocentrantes y matrices T.
 die(3163,88,16,60,'https://eurostampsrl.it/en/11184/1v-self-centering-dies-88-amada/3163-1v-dies-self-centering-dies-88',{mount:'Amada/Promecam'}),
 die(3165,88,25,60,'https://eurostampsrl.it/en/11198/1v-self-centering-dies-88-amada/3165-1v-dies-self-centering-dies-88',{mount:'Amada/Promecam'}),
 die(3057,88,20,120,'https://eurostampsrl.it/en/11562/t-dies-88/3057-t-die-88'),
 die(3058,88,25,120,'https://eurostampsrl.it/en/11584/t-dies-88/3058-t-dies-88')
];
export const EUROSTAMP_ALL=[...EUROSTAMP_PUNCHES,...EUROSTAMP_DIES];
export function eurostampById(id){return EUROSTAMP_ALL.find(tool=>tool.id===id)||null;}
