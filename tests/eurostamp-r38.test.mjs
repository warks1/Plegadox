import test from 'node:test';
import assert from 'node:assert/strict';
import {EUROSTAMP_PUNCHES,EUROSTAMP_DIES,EUROSTAMP_ALL,eurostampById}
 from '../eurostamp-catalog.js';
import {CATALOG_SOURCES,registerCatalogue,toolMatchesBrand}
 from '../catalog.js';
import {DIES,PUNCHES,EXAMPLE} from '../engine.js';
import {sectionPunch,sectionDie} from '../tool-profiles.js';
import {recommendTooling} from '../tooling-advisor.js';
import {parseEurostampProfile,applyEurostampProfile,hydrateEurostampProfiles,
 persistEurostampProfile,listEurostampProfiles,EUROSTAMP_CAD_STORAGE_KEY,
 pendingEurostampCount} from '../eurostamp-cad.js';

const dxf=points=>{
 const lines=['0','SECTION','2','HEADER','9','$INSUNITS','70','4',
  '0','ENDSEC','0','SECTION','2','ENTITIES',
  '0','LWPOLYLINE','8','TOOL', '90',String(points.length),'70','1'];
 for(const [x,y] of points)lines.push('10',String(x),'20',String(y));
 lines.push('0','ENDSEC','0','EOF');
 return lines.join('\n')+'\n';
};
const memory=()=>{
 const m=new Map();
 return {getItem:k=>m.get(k)||null,setItem:(k,v)=>m.set(k,v)};
};
const rectangle=(height,width=35)=>dxf([
 [-width/2,height],[width/2,height],[width/2,0],[-width/2,0]
]);

test('R38: 29 referencias Eurostamp no duplicadas cubren todos los ángulos solicitados',()=>{
 assert.equal(EUROSTAMP_PUNCHES.length,19);
 assert.equal(EUROSTAMP_DIES.length,10);
 assert.equal(EUROSTAMP_ALL.length,29);
 assert.equal(new Set(EUROSTAMP_ALL.map(x=>x.id)).size,29);
 assert.deepEqual([...new Set(EUROSTAMP_PUNCHES.map(x=>x.angle))].sort((a,b)=>a-b),[30,88,90]);
 assert.deepEqual([...new Set(EUROSTAMP_DIES.map(x=>x.angle))].sort((a,b)=>a-b),[30,85,88]);
 for(const t of EUROSTAMP_ALL){
  assert.equal(t.manufacturer,'Eurostamp');
  assert.equal(t.importedDxf,undefined,'no falsificar CAD incluido');
  assert.equal(t.cadStatus,'pendiente-DXF-original');
  assert.equal(t.profileAccuracy,'provisional');
  assert.equal(t.cadVerified,false);
  assert.ok(t.verifiedSpecs);
  assert.ok(t.height>0);
  assert.equal(CATALOG_SOURCES[t.source]?.url?.startsWith('https://'),true);
  if(t.productUrl)assert.match(t.productUrl,/^https:\/\/eurostampsrl\.it\//);
  else assert.equal(t.source,'eurostampCatalogue2017');
 }
});

test('R38: punzones de 30° normales y altos, patas de cabra 88° altas y normales, históricos 90°',()=>{
 const names=['eurostamp-p1056','eurostamp-p1193','eurostamp-p1292',
  'eurostamp-p1014','eurostamp-p1031','eurostamp-p1291',
  'eurostamp-p1013','eurostamp-p1016'];
 const tools=names.map(eurostampById);
 assert.ok(tools.every(Boolean));
 assert.equal(tools[0].angle,30);assert.equal(tools[0].height,80);
 assert.equal(tools[2].height,200);
 assert.equal(tools[3].type,'cabra');
 assert.equal(tools[4].height,165);
 assert.equal(tools[5].height,200);
 assert.equal(tools[5].tip,1.6,'R0.8 se declara Ø1.6');
 assert.equal(tools[6].angle,90);
 assert.equal(tools[6].productUrl,null,'90° en PDF histórico, no inventar página DXF');
 assert.equal(tools[7].type,'cabra');
});

test('R38: la matriz V de 30/85/88 mantiene la abertura y ángulo sin equiparar amarres',()=>{
 assert.equal(eurostampById('eurostamp-d3262').opening,10);
 assert.equal(eurostampById('eurostamp-d3262').mount,'Wila');
 assert.equal(eurostampById('eurostamp-d3111').opening,32);
 assert.equal(eurostampById('eurostamp-d3111').angle,85);
 assert.equal(eurostampById('eurostamp-d3163').angle,88);
 assert.equal(eurostampById('eurostamp-d3163').opening,16);
 assert.equal(eurostampById('eurostamp-d3058').opening,25);
 for(const t of EUROSTAMP_DIES)assert.equal(t.profileAccuracy,'provisional');
});

test('R38: catálogo idempotente con los 29 Eurostamp; filtro por marca y escote',()=>{
 const dies=[],punches=[];
 registerCatalogue(dies,punches);
 registerCatalogue(dies,punches);
 assert.equal(dies.filter(x=>x.manufacturer==='Eurostamp').length,10);
 assert.equal(punches.filter(x=>x.manufacturer==='Eurostamp').length,19);
 assert.ok(toolMatchesBrand(punches.find(x=>x.id==='eurostamp-p1291'),'Eurostamp'));
 const tall=PUNCHES.find(x=>x.id==='eurostamp-p1291');
 const regular=PUNCHES.find(x=>x.id==='eurostamp-p1014');
 assert.ok(sectionPunch(tall).points.length>=10);
 assert.notDeepEqual(sectionPunch(tall).points,sectionPunch(regular).points);
 assert.equal(sectionPunch(tall).provisional,true);
});

test('R38: vincular DXF ASCII milimétrico a SKU existente sin crear herramienta ficticia',()=>{
 const model=parseEurostampProfile(rectangle(104),{
  id:'eurostamp-p1193',fileName:'1193.dxf'
 });
 assert.equal(model.reference,'1193');
 assert.equal(model.profilePoints.length,4);
 assert.equal(model.importedDxf,true);
 assert.equal(model.cadVerified,false);
 const dies=EUROSTAMP_DIES.map(x=>({...x}));
 const punches=EUROSTAMP_PUNCHES.map(x=>({...x}));
 const selected=applyEurostampProfile(dies,punches,model);
 assert.equal(selected.id,'eurostamp-p1193');
 assert.deepEqual(sectionPunch(selected).points,model.profilePoints);
 assert.equal(sectionPunch(selected).importedDxf,true);
 assert.equal(selected.cadVerified,false);
 assert.equal(pendingEurostampCount(dies,punches),28);
});

test('R38: matriz 85° utiliza perfil DXF real importado en sección 2D',()=>{
 const contour=[[-25,55],[-16,55],[0,40],[16,55],[25,55],[25,0],[-25,0]];
 const loaded=parseEurostampProfile(dxf(contour),{
  id:'eurostamp-d3111',fileName:'3111.dxf'
 });
 const dies=EUROSTAMP_DIES.map(x=>({...x}));
 const item=applyEurostampProfile(dies,[],loaded);
 assert.equal(item.angle,85);assert.equal(item.opening,32);
 assert.equal(sectionDie(item).importedDxf,true);
 assert.deepEqual(sectionDie(item).points,loaded.profilePoints);
});

test('R38: rechaza DXF con referencia distinta, unidades inciertas y altura equivocada',()=>{
 assert.throws(()=>parseEurostampProfile(rectangle(104),
  {id:'eurostamp-p1193',fileName:'1292.dxf'}),/referencia/);
 assert.throws(()=>parseEurostampProfile(rectangle(120),
  {id:'eurostamp-p1193',fileName:'1193.dxf'}),/Altura CAD/);
 assert.throws(()=>parseEurostampProfile(rectangle(104),
  {id:'falso-eurostamp',fileName:'1193.dxf'}),/desconocida/);
 const missingUnits=rectangle(104).replace(/9\n\$INSUNITS\n70\n4\n/,'');
 assert.throws(()=>parseEurostampProfile(missingUnits,{
  id:'eurostamp-p1193',fileName:'1193.dxf'}),/unidades mm/);
});

test('R38: persiste CAD ligado al SKU y lo restaura en nuevo arranque sin duplicar',()=>{
 const storage=memory();
 const profile=parseEurostampProfile(rectangle(104),{
  id:'eurostamp-p1193',fileName:'1193.dxf'});
 assert.equal(persistEurostampProfile(storage,profile),1);
 assert.match(storage.getItem(EUROSTAMP_CAD_STORAGE_KEY),/eurostamp-p1193/);
 assert.equal(persistEurostampProfile(storage,profile),1,'actualizar mismo SKU, no duplicar');
 assert.equal(listEurostampProfiles(storage).length,1);
 const dies=EUROSTAMP_DIES.map(x=>({...x}));
 const punches=EUROSTAMP_PUNCHES.map(x=>({...x}));
 assert.equal(hydrateEurostampProfiles(dies,punches,storage),1);
 assert.equal(punches.find(t=>t.reference==='1193').importedDxf,true);
 assert.equal(hydrateEurostampProfiles(dies,punches,storage),1,'idempotente');
});

test('R38: las referencias Eurostamp SIN CAD no se recomiendan automáticamente',()=>{
 const punches=[eurostampById('eurostamp-p1193')];
 const dies=[eurostampById('eurostamp-d3262')];
 const result=recommendTooling({...EXAMPLE,width:500},{
  punches,dies});
 assert.equal(result.choice,null);
 assert.equal(result.candidates.length,0);
 assert.equal(punches[0].importedDxf,undefined);
});
