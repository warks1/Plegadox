import test from 'node:test';
import assert from 'node:assert/strict';
import {stagedGaugeAxes,gaugeRetractionPath,planGaugeRetraction}
 from '../gauge-retract-motion.js';
import {EXAMPLE,normalized,stage} from '../engine.js';
import {technicalScene} from '../technical-section.js';
import {gaugePlacement} from '../backgauge-placement.js';
import {buildGaugeMotionDiagnostic} from '../gauge-motion-diagnostic.js';
import {gaugeMovementLabel,gaugeStatusCardLayout} from '../machine-visual.js';

const anchor={x:55,y:1},target={x:80,y:31};
const opts={anchor,target,maxSheetX:125,fingerReach:45,opening:16};
const epsilon=1e-7;
const noDiagonal=frames=>{
 for(let i=1;i<frames.length;i++){
  const a=frames[i-1].point,b=frames[i].point;
  assert.ok(Math.abs(b.x-a.x)<=epsilon||Math.abs(b.y-a.y)<=epsilon,
   'Los ejes X/R no deben avanzar simultáneamente');
 }
};

test('R108: interpolación ortogonal por R y X, con extremos exactos',()=>{
 const before=JSON.stringify({anchor,target});
 const start=stagedGaugeAxes(anchor,target,0);
 const midR=stagedGaugeAxes(anchor,target,.2);
 const change=stagedGaugeAxes(anchor,target,.42);
 const midX=stagedGaugeAxes(anchor,target,.8);
 const end=stagedGaugeAxes(anchor,target,1);
 assert.deepEqual(start.point,anchor);
 assert.equal(start.axisPhase,'R');
 assert.equal(midR.point.x,anchor.x);
 assert.equal(midR.axisPhase,'R');
 assert.deepEqual(change.point,{x:anchor.x,y:target.y});
 assert.equal(midX.point.y,target.y);
 assert.equal(midX.axisPhase,'X');
 assert.deepEqual(end.point,target);
 assert.equal(end.verified,false);
 noDiagonal(Array.from({length:101},(_,i)=>
  stagedGaugeAxes(anchor,target,i/100)));
 assert.equal(JSON.stringify({anchor,target}),before,
  'Nunca modificar puntos de cota persistentes');
});

test('R108: cambiar sólo X o sólo R no introduce una carrera fantasma',()=>{
 const onlyX=stagedGaugeAxes({x:10,y:5},{x:50,y:5},.4);
 const onlyR=stagedGaugeAxes({x:10,y:5},{x:10,y:15},.4);
 assert.equal(onlyX.axisPhase,'X');
 assert.equal(onlyX.point.y,5);
 assert.equal(onlyR.axisPhase,'R');
 assert.equal(onlyR.point.x,10);
 assert.equal(stagedGaugeAxes(anchor,anchor,.7).axisPhase,'sin-cambio');
 assert.throws(()=>stagedGaugeAxes(anchor,{x:NaN,y:3},.5),/coordenadas/);
});

test('R108: retirada real 2D continúa en X, espera aparcada y vuelve por R→X',()=>{
 const during=Array.from({length:21},(_,i)=>.84+.15*i/20).map(sub=>
  gaugeRetractionPath({...opts,sub,enabled:true}));
 const start=gaugeRetractionPath({...opts,sub:.36,enabled:true});
 const moving=gaugeRetractionPath({...opts,sub:.4,enabled:true});
 const park=gaugeRetractionPath({...opts,sub:.44,enabled:true});
 assert.equal(start.phase,'retroceso-antes-plegado');
 assert.equal(start.axisPhase,'X');
 assert.equal(start.point.x,anchor.x);
 assert.ok(moving.point.x>anchor.x);
 assert.equal(park.axisPhase,'aparcado');
 assert.deepEqual(park.point,during[0].point);
 assert.equal(during[0].axisPhase,'R');
 assert.ok(during[3].point.x===park.point.x);
 assert.equal(during.at(-1).axisPhase,'X');
 assert.deepEqual(during.at(-1).point,target);
 noDiagonal(during);
 for(const frame of during)assert.equal(frame.verified,false);
 assert.equal(park.verified,false,'La retirada NO se considera CNC verificado');
});

test('R108: simple cambio de referencia no se presenta como retirada por colisión',()=>{
 const before=gaugeRetractionPath({...opts,enabled:false,sub:.4});
 assert.equal(before,null);
 const frames=Array.from({length:31},(_,i)=>.84+.15*i/30).map(sub=>
  gaugeRetractionPath({...opts,enabled:false,sub}));
 assert.ok(frames.every(x=>x.phase==='reubicacion-siguiente-golpe'));
 assert.ok(frames.every(x=>x.withdrawn===false&&x.plannedRetraction===0));
 assert.equal(frames[0].axisPhase,'R');
 assert.deepEqual(frames.at(-1).point,target);
 noDiagonal(frames);
 const label=gaugeMovementLabel({stopNumber:1,gaugeTransition:frames[3]});
 assert.match(label,/CAMBIO DE COTA/);
 assert.match(label,/EJE R/);
 assert.doesNotMatch(label,/PENETRACIÓN/);
 const hud=gaugeStatusCardLayout(470,330,220,130,1,'green',1,
  frames[3].phase,null,null,null,null,frames[3].axisPhase);
 assert.match(hud.subline,/EJE R/);
});

test('R108: el aviso de penetración conserva prioridad roja en movimiento',()=>{
 const polys=[{x:10,y:-5},{x:40,y:-5},{x:40,y:5},{x:10,y:5}];
 const future=[{at:.5,sheet:[{x:0,y:0},{x:25,y:0}]}];
 const result=planGaugeRetraction({polygon:polys,sheetSamples:future,
  thickness:2,contact:{x:10,y:0}});
 assert.equal(result.enabled,true);
 assert.ok(result.penetrationCount>0);
 assert.equal(result.verified,false);
 const r=gaugeRetractionPath({...opts,enabled:result.enabled,sub:.4});
 assert.equal(r.phase,'retroceso-antes-plegado');
 assert.equal(r.axisPhase,'X');
});

test('R108: Omega 1→2→4→3 coincide entre movimiento del visor y JSON',()=>{
 const piece=normalized(EXAMPLE),original=JSON.stringify(piece);
 const samples=[.84,.88,.90,.92,.95,.98,.995];
 const report=buildGaugeMotionDiagnostic(piece,{build:'QA-R108',samples});
 assert.deepEqual(piece.order,[0,1,3,2]);
 for(let op=0;op<3;op++){
  const bend=piece.order[op],frames=[];
  for(const sub of samples){
   const scene=technicalScene(piece,5*(op+sub));
   const movement=scene.gaugeTransition;
   const stop=piece.stopByBend[bend];
   const placement=gaugePlacement(scene,stop);
   const frame=report.operations[op].frames[samples.indexOf(sub)];
   if(movement){
    frames.push(movement);
    assert.deepEqual(movement.point,placement.point);
    assert.deepEqual(frame.motion.point,movement.point);
    assert.equal(frame.motion.axisPhase,movement.axisPhase);
    assert.equal(frame.motion.verified,false);
   }
  }
  if(frames.length>1)noDiagonal(frames);
  const end=technicalScene(piece,5*(op+.995));
  const next=technicalScene(piece,5*(op+1+.05));
  if(end.gaugeTransition?.to)
   assert.ok(Math.hypot(end.gaugeTransition.point.x-next.gaugeAnchor.x,
    end.gaugeTransition.point.y-next.gaugeAnchor.y)<1e-4);
 }
 assert.equal(JSON.stringify(piece),original);
});
