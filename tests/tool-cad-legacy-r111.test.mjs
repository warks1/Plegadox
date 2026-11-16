import test from 'node:test';
import assert from 'node:assert/strict';
import {importedTool,parseToolDxf,normalizeStoredToolDatum,
 registerImportedTools,loadImportedTools,TOOL_DXF_STORAGE_KEY}
 from '../tool-dxf.js';
import {alignToolSectionToWorkingAxis} from '../tool-cad-datum.js';

const poly=a=>[
 '0','SECTION','2','HEADER','9','$INSUNITS','70','4','0','ENDSEC',
 '0','SECTION','2','ENTITIES','0','LWPOLYLINE',
 '90',String(a.length),'70','1',
 ...a.flatMap(([x,y])=>['10',String(x),'20',String(y)]),
 '0','ENDSEC','0','EOF',''
].join('\n');
const goose=[[-30,110],[20,110],[20,95],[31,95],[31,60],
 [26,44],[25,12],[20,0],[0,38],[-12,57],[-5,84],
 [0,84],[0,95],[-30,95]];
const multi=[[-50,80],[-28,80],[-20,62],[-12,80],[12,80],
 [20,62],[28,80],[50,80],[50,0],[-50,0]];
test('R111: DXF antiguo de pata de cabra migra sólo en memoria',()=>{
 const raw=parseToolDxf(poly(goose));
 const current=importedTool(raw,{kind:'punch',name:'pata antigua',
  angle:88,length:415,tip:2});
 const legacy={...current,workingAxisX:undefined,axisSource:undefined,
  profilePoints:raw.points};
 const before=JSON.stringify(legacy);
 const fixed=normalizeStoredToolDatum(legacy);
 assert.equal(fixed.workingAxisX,0);
 assert.equal(fixed.datumPending,false);
 assert.equal(fixed.datumVerified,false);
 assert.equal(fixed.axisSource,'legacy-eje-inferido-en-memoria');
 assert.deepEqual(fixed.profilePoints,current.profilePoints);
 assert.equal(JSON.stringify(legacy),before);
});

test('R111: matriz multivía de versión antigua no recibe eje arbitrario',()=>{
 const raw=parseToolDxf(poly(multi));
 const legacy={id:'user-dxf-die-legacy',importedDxf:true,
  angle:88,height:raw.height,length:415,opening:16,
  profilePoints:raw.points};
 const out=normalizeStoredToolDatum(legacy);
 assert.equal(out.datumPending,true);
 assert.equal(out.workingAxisX,undefined);
 assert.match(out.datumWarning,/MULTIPLE_V/);
 assert.deepEqual(out.profilePoints,legacy.profilePoints);
 const dies=[],punches=[];
 registerImportedTools(dies,punches,[legacy]);
 assert.equal(dies.length,1);
 assert.equal(dies[0].datumPending,true);
});

test('R111: leer biblioteca antigua mantiene datos originales en almacenamiento',()=>{
 const p=parseToolDxf(poly(goose)),tool=importedTool(p,
  {kind:'punch',name:'DXF anterior',angle:88,length:415,tip:2});
 const old={...tool,workingAxisX:undefined,profilePoints:p.points};
 let bytes=JSON.stringify([old]);
 const storage={getItem:k=>k===TOOL_DXF_STORAGE_KEY?bytes:null,
  setItem:()=>{throw Error('No debe modificar disco')}};
 const loaded=loadImportedTools(storage);
 assert.equal(loaded.length,1);
 assert.deepEqual(loaded[0].profilePoints,tool.profilePoints);
 assert.deepEqual(JSON.parse(bytes)[0].profilePoints,p.points);
 assert.equal(loaded[0].datumVerified,false);
});

test('R111: nuevos perfiles no se realinean por segunda vez',()=>{
 const p=parseToolDxf(poly(goose));
 const tool=importedTool(p,{kind:'punch',name:'Actual',
  angle:88,length:415,tip:2});
 assert.strictEqual(normalizeStoredToolDatum(tool),tool);
 assert.equal(tool.workingAxisX,0);
 assert.equal(tool.datumPending,undefined);
});
