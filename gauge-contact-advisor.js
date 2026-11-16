/**
 * Búsqueda de referencias de tope accesibles en la sección 2D.
 * Examina primero los dos extremos libres x Stop/Support. Sólo si
 * ninguno es plausible, estudia caras exteriores YA plegadas con STOP 1
 * y con soporte frontal 2D confirmado. No altera el programa hasta que
 * el operario pulse aplicar. NO certifica CNC ni el CAD.
 */
import {normalized,stage} from './engine.js';
import {inspectGaugeOperation} from './gauge-sequence-review.js';
import {inspectToolContact} from './tool-collision.js';
import {resolveGaugeSetup} from './gauge-contact-solver.js';
import {getActiveMachineConfig} from './machine-config.js';

const PENALTY={penetracion:400,holgura:220,'chapa-detras':150,
 'sin-asiento':120,'referencia-interior':100};

export function suggestGaugeContact(input,time=0,options={}){
 const p=normalized(input),st=stage(p,time);
 const segments=[...new Set([0,p.flanges.length-1])];
 const gaugeCheck=options.gaugeCheck||
  (candidate=>inspectGaugeOperation(candidate,st.activeOperation,{samples:12}));
 const toolCheck=options.toolCheck||
  (candidate=>[.24,.48,.68].map(f=>
   inspectToolContact(candidate,5*(st.activeOperation+f))));
 const setupCheck=options.setupCheck||
  (candidate=>resolveGaugeSetup(candidate,st,getActiveMachineConfig()));
 const optionsList=[];
 const evaluate=(segment,stop,foldedOnly=false)=>{
  const gaugeSegmentByBend=[...p.gaugeSegmentByBend];
  const stopByBend=[...p.stopByBend];
  const gaugePointByBend=[...p.gaugePointByBend];
  gaugeSegmentByBend[st.activeBend]=segment;
  stopByBend[st.activeBend]=stop;
  gaugePointByBend[st.activeBend]=null;
  const candidate=normalized({...p,gaugeSegmentByBend,stopByBend,gaugePointByBend});
  // No ensayar una esquina interior cualquiera: el mismo solver de
  // contacto debe confirmar una PESTAÑA PREPLEGADA sin penetración.
  if(foldedOnly){
   const setup=setupCheck(candidate);
   if(!setup?.valid||setup.foldedWingContact!==true)return;
  }
  const supportKind=foldedOnly?'CARA_EXTERIOR_PREPLEGADA_2D':'CANTO_LIBRE_2D';
  try{
   const gauge=gaugeCheck(candidate);
   const tool=toolCheck(candidate);
   const toolPenetrations=tool.filter(t=>t.hasPenetration).length;
   const gaugePenalty=(gauge.findings||[]).reduce((sum,f)=>
    sum+(PENALTY[f.kind]||30),0);
   const score=gaugePenalty+toolPenetrations*1000+
    (gauge.contactObserved?0:700)+(gauge.warnings||0)*3;
   const plausible=!!gauge.contactObserved&&!gauge.possibleInterference&&
    toolPenetrations===0;
   optionsList.push({segment,stop,score,plausible,supportKind,
    requiresPhysicalReview:foldedOnly,
    contactObserved:!!gauge.contactObserved,
    gaugeWarnings:gauge.warnings||0,toolPenetrations,
    findings:(gauge.findings||[]).map(f=>f.kind)});
  }catch(error){
   optionsList.push({segment,stop,score:Infinity,plausible:false,
    supportKind,requiresPhysicalReview:foldedOnly,
    contactObserved:false,gaugeWarnings:0,toolPenetrations:0,
    error:error instanceof Error?error.message:String(error)});
  }
 };
 for(const segment of segments)for(const stop of [1,2])
  evaluate(segment,stop);
 // El botón de búsqueda puede proponer una cara de pestaña formada
 // cuando las cuatro combinaciones libres no dan un apoyo sin avisos.
 // Sólo se considera STOP 1, sin asumir repisa física de SUPPORT 2.
 if(!optionsList.some(x=>x.plausible))
  for(let segment=1;segment<p.flanges.length-1;segment++)
   evaluate(segment,1,true);
 optionsList.sort((a,b)=>a.score-b.score||a.segment-b.segment||a.stop-b.stop);
 return {operation:st.activeOperation,bend:st.activeBend,
  options:optionsList,best:optionsList.find(o=>o.plausible)||null,
  verified:false,
  limitations:'Cantos libres y, sólo si fallan, caras exteriores ya plegadas con STOP 1. Poses de sección 2D y útiles provisionales. Sin aprobación X/R/Z, CAD OEM ni CNC.'};
}
