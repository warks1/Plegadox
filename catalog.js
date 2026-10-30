// Catálogo de trabajo v0.2: separar valores publicados de geometría provisional.
// IMPORTANTE: que un artículo exista en un catálogo no implica que su amarre
// sea compatible con la Trumpf V85 concreta. Validar mordazas reales.
export const CATALOG_SOURCES = {
  mecosGeneral2025: {title:"MECOS — Catálogo general 2025/26, página 3", url:"", scope:"familias de utillaje; sin referencias ni perfiles acotados"},
  mecosTooling2022: {title:"MECOS — Catálogo técnico de utillaje 2022",url:"https://www.mecos.es/files/productos/utillaje-plegadora/MECOS-Catalogo-General-de-Utillaje-2022.pdf",scope:"familias Bystronic / Beyeler, Amada / Promecam y Trumpf / Wila"},
  trumpfES2025: {title:"TRUMPF — Catálogo útiles plegado 2025 ES",url:"https://www.trumpf.com/filestorage/TRUMPF_ES/user_upload/2025_Catalogo_Utiles_plegado_ES.pdf",scope:"EV001 V6, EV001/H V6"},
  trumpfTechnical: {title:"TRUMPF — TruBend 2100, herramientas iniciales",url:"https://www.trumpf.com/filestorage/TRUMPF_US/Landingpages/TruBend_2100/TRUMPF_Inc_TruBend_2100_Technical_Quote_3_11_2025.pdf",scope:"OW200/K, EVW10/84 y EVW20/84"},
  amada2025: {title:"AMADA — Semi-standard tooling",url:"https://cdn.amada.eu/fileadmin/Repository/Amada_Tooling_price_list_2021_BENDING1.pdf",scope:"punzones 831, 841 W55/W95, 846 W110 y 804"},
  bystronic: {title:"Bystronic — sistemas RF-A / XPT",url:"https://www.bystronic.com/usa/en-us/lp/press-brakes-tooling",scope:"sistema y compatibilidad, no cotas del perfil"}
};

// verifiedSpecs significa que las dimensiones indicadas están respaldadas,
// no que el perfil 2D/3D provisional esté validado.
export const CATALOG_PUNCHES = [
 {id:"trumpf-ow200-k",manufacturer:"Trumpf",reference:"OW200/K",name:"OW200/K · 86°",angle:86,tip:1,height:120,length:415,type:"recto",mount:"TRUMPF",verifiedSpecs:true,source:"trumpfTechnical",profileAccuracy:"provisional"},
 {id:"amada-831",manufacturer:"Amada",reference:"831",name:"831 · 30° H200",angle:30,tip:.6,height:200,length:415,type:"recto",mount:"Amada/Promecam",verifiedSpecs:true,source:"amada2025",profileAccuracy:"provisional"},
 {id:"amada-841-w55",manufacturer:"Amada",reference:"841 W55",name:"841 W55 · 60°",angle:60,tip:.6,height:200,length:415,type:"cabra",mount:"Amada/Promecam",verifiedSpecs:true,source:"amada2025",profileAccuracy:"provisional"},
 {id:"amada-841-w95",manufacturer:"Amada",reference:"841 W95",name:"841 W95 · 60°",angle:60,tip:.6,height:200,length:415,type:"cabra",mount:"Amada/Promecam",verifiedSpecs:true,source:"amada2025",profileAccuracy:"provisional"},
 {id:"amada-846-w110",manufacturer:"Amada",reference:"846 W110",name:"846 W110 · 86°",angle:86,tip:.6,height:200,length:415,type:"cabra",mount:"Amada/Promecam",verifiedSpecs:true,source:"amada2025",profileAccuracy:"provisional"},
 {id:"amada-804",manufacturer:"Amada",reference:"804",name:"804 · 86° H220",angle:86,tip:.6,height:220,length:415,type:"recto",mount:"Amada/Promecam",verifiedSpecs:true,source:"amada2025",profileAccuracy:"provisional"},
 {id:"amada-846-w55-h220",manufacturer:"Amada",reference:"846 W55 H220",name:"846 W55 · 86°",angle:86,tip:.6,height:220,length:415,type:"cabra",mount:"Amada/Promecam",verifiedSpecs:true,source:"amada2025",profileAccuracy:"provisional"},
 {id:"amada-846-w95-h220",manufacturer:"Amada",reference:"846 W95 H220",name:"846 W95 · 86°",angle:86,tip:.6,height:220,length:415,type:"cabra",mount:"Amada/Promecam",verifiedSpecs:true,source:"amada2025",profileAccuracy:"provisional"},
 {id:"bystronic-rfa-demo",manufacturer:"Bystronic",reference:"RF-A (ejemplo)",name:"RF-A · PERFIL PROVISIONAL",angle:88,tip:1,height:120,length:415,type:"recto",mount:"Bystronic RF-A",verifiedSpecs:false,source:"bystronic",profileAccuracy:"provisional"},
 {id:"bystronic-r-demo",manufacturer:"Bystronic",reference:"Beyeler R (ejemplo)",name:"Beyeler R · PROVISIONAL",angle:30,tip:.8,height:120,length:415,type:"cabra",mount:"Bystronic R",verifiedSpecs:false,source:"mecosTooling2022",profileAccuracy:"provisional"}
];
export const CATALOG_DIES = [
 {id:"trumpf-ev001",manufacturer:"Trumpf",reference:"EV001",name:"EV001 · V6 30°",opening:6,angle:30,height:100,length:2050,mount:"TRUMPF",verifiedSpecs:true,source:"trumpfES2025",profileAccuracy:"provisional"},
 {id:"trumpf-ev001-h",manufacturer:"Trumpf",reference:"EV001/H",name:"EV001/H · V6 30°",opening:6,angle:30,height:150,length:2050,mount:"TRUMPF",verifiedSpecs:true,source:"trumpfES2025",profileAccuracy:"provisional"},
 {id:"trumpf-evw10-84",manufacturer:"Trumpf",reference:"EVW10/84",name:"EVW10/84 · V10",opening:10,angle:84,height:100,length:3050,mount:"TRUMPF",verifiedSpecs:true,source:"trumpfTechnical",profileAccuracy:"provisional"},
 {id:"trumpf-evw20-84",manufacturer:"Trumpf",reference:"EVW20/84",name:"EVW20/84 · V20",opening:20,angle:84,height:100,length:3050,mount:"TRUMPF",verifiedSpecs:true,source:"trumpfTechnical",profileAccuracy:"provisional"},
 {id:"amada-1v88-template",manufacturer:"Amada",reference:"1-V/88 (plantilla)",name:"1-V/88° · V16 (provisional)",opening:16,angle:88,height:60,length:415,mount:"Amada/Promecam",verifiedSpecs:false,source:"amada2025",profileAccuracy:"provisional"},
 {id:"amada-1v30-template",manufacturer:"Amada",reference:"1-V/30 (plantilla)",name:"1-V/30° · V12 (provisional)",opening:12,angle:30,height:60,length:415,mount:"Amada/Promecam",verifiedSpecs:false,source:"amada2025",profileAccuracy:"provisional"},
 {id:"bystronic-rfa-v16-demo",manufacturer:"Bystronic",reference:"RF-A V16 (ejemplo)",name:"RF-A · V16 PROVISIONAL",opening:16,angle:88,height:65,length:550,mount:"Bystronic RF-A",verifiedSpecs:false,source:"bystronic",profileAccuracy:"provisional"},
 {id:"bystronic-r-v24-demo",manufacturer:"Bystronic",reference:"Beyeler R V24 (ejemplo)",name:"Beyeler R · V24 PROVISIONAL",opening:24,angle:88,height:85,length:550,mount:"Bystronic R",verifiedSpecs:false,source:"mecosTooling2022",profileAccuracy:"provisional"}
];
export function registerCatalogue(dies,punches){
 for(const item of CATALOG_DIES)if(!dies.some(d=>d.id===item.id))dies.push({...item});
 for(const item of CATALOG_PUNCHES)if(!punches.some(p=>p.id===item.id))punches.push({...item});
}
export function toolMatchesBrand(tool,brand){
 return brand==="Todos" || (brand==="Genéricos"?!tool.manufacturer:tool.manufacturer===brand);
}
export function selectionCompatibility(punch,die){
 if(!punch||!die)return {compatible:false,reason:"Falta herramienta"};
 if(!punch.mount || !die.mount)return {compatible:null,reason:"Amarre sin verificar; selección genérica"};
 if(punch.mount===die.mount)return {compatible:null,reason:"Misma familia; verificar amarre real en la máquina"};
 return {compatible:false,reason:"Familias de amarre distintas; revisar adaptadores"};
}
