import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {auditToolCAD} from '../tool-cad-audit.js';
import {CATALOG_PUNCHES,CATALOG_DIES} from '../catalog.js';
import {MECOS_ED22_REFERENCES} from '../catalog-mecos-ed22-index.js';
import {EXAMPLE,normalized} from '../engine.js';
import {motionPieceKey} from '../machine-axis-motion.js';
import {buildProjectBackup,parseProjectBackup} from '../project-backup.js';
import {V85_FACTORY} from '../machine-config.js';

test('MECOS ED22: ampliación documental con referencias originales, sin geometría ni falsa disponibilidad',()=>{
 assert.ok(MECOS_ED22_REFERENCES.length>=160);
 const ids=new Set(MECOS_ED22_REFERENCES.map(x=>x.kind+'|'+x.reference));
 assert.equal(ids.size,MECOS_ED22_REFERENCES.length,'No duplicar códigos de punzón/matriz');
 assert.ok(MECOS_ED22_REFERENCES.some(x=>x.reference==='11.820'&&x.angle===85));
 assert.ok(MECOS_ED22_REFERENCES.some(x=>x.reference==='15.330'&&x.style==='TRUMPF'));
 assert.ok(MECOS_ED22_REFERENCES.some(x=>x.reference==='25.100'&&x.kind==='die'));
 assert.ok(MECOS_ED22_REFERENCES.every(x=>x.profilePoints===null&&x.selectable===false&&x.verifiedCollision===false));
});
test('inventario CAD: detalla TODAS las referencias de catálogo, no confunde silueta paramétrica con DXF OEM',()=>{
 const report=auditToolCAD({punches:CATALOG_PUNCHES,dies:CATALOG_DIES});
 assert.equal(report.catalogTotal,CATALOG_DIES.length+CATALOG_PUNCHES.length);
 assert.equal(report.catalogCADMissing,report.catalogTotal);
 assert.equal(report.catalogCADAvailable,0);
 assert.equal(report.verified,false);
 assert.ok(report.punches.items.every(x=>x.verifiedCollision===false));
 assert.ok(report.dies.items.every(x=>x.verifiedCollision===false));
});
test('auditoría CAD: si existe perfil importado, se indica DXF sin proclamar certificado',()=>{
 const p=CATALOG_PUNCHES[0],d=CATALOG_DIES[0];
 const profiles=[{...p,importedDxf:true,profilePoints:[[0,0],[20,0],[20,90],[0,90]]}];
 const report=auditToolCAD({punches:profiles,dies:[]});
 assert.equal(report.catalogCADAvailable,1);
 assert.equal(report.catalogCADMissing,report.catalogTotal-1);
 assert.equal(report.verified,false);
});
test('tipo de contacto frontal/superior cambia la identidad de traza CNC, no el orden de golpes',()=>{
 const a=normalized(EXAMPLE);
 const b=normalized({...EXAMPLE,gaugeContactByBend:['front','shelf','front','front']});
 assert.notEqual(motionPieceKey(a),motionPieceKey(b));
 assert.deepEqual(a.order,b.order);
 assert.ok(a.gaugeContactByBend.every(m=>m==='front'));
});
test('backup preserva contacto por pliegue y rechaza selección superior corrupta',()=>{
 const piece=normalized({...EXAMPLE,gaugeContactByBend:['front','shelf','front','front']});
 const backup=buildProjectBackup({piece,machine:V85_FACTORY,tools:[]});
 assert.deepEqual(parseProjectBackup(backup).piece.gaugeContactByBend,piece.gaugeContactByBend);
 const bad={...backup,piece:{...piece,gaugeContactByBend:['shelf','bogus']}};
 assert.throws(()=>parseProjectBackup(bad),/Contacto frontal o superior/);
});
test('R37: inventario, modos frontales y pantalla de carga premium con animación móvil están en la UI',()=>{
 const html=readFileSync(new URL('../index.html',import.meta.url),'utf8');
 const splash=readFileSync(new URL('../splash-foto-premium.html',import.meta.url),'utf8');
 const sw=readFileSync(new URL('../sw.js',import.meta.url),'utf8');
 for(const id of ['toolCADAuditStatus','toolCADAuditItems','chooseContactFront','chooseContactShelf'])
  assert.ok(html.includes('id="'+id+'"'),id);
 assert.ok(splash.includes('id="photo"'));
 assert.ok(splash.includes('id="foldLive"'));
 assert.ok(splash.includes('id="animatedSheet"'));
 assert.ok(splash.includes('plegadox-premium-selected.png'));
 assert.ok(sw.includes('"./gauge-retract-planner.js"'));
 assert.ok(sw.includes('"./tool-cad-audit.js"'));
});
