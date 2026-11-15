/**
 * Búsqueda de referencias de tope accesibles en la sección 2D.
 * Examina dos extremos libres x Stop/Support, sin alterar el programa
 * hasta que el operario pulse aplicar. NO certifica CNC ni el CAD.
 */
import {normalized,stage} from './engine.js';
import {inspectGaugeOperation} from './gauge-sequence-review.js';
import {inspectToolContact} from './tool-collision.js';

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
 const optionsList=[];
 for(const segment of segments)for(const stop of [1,2]){
  const gaugeSegmentByBend=[...p.gaugeSegmentByBend];
  const stopByBend=[...p.stopByBend];
  const gaugePointByBend=[...p.gaugePointByBend];
  gaugeSegmentByBend[st.activeBend]=segment;
  stopByBend[st.activeBend]=stop;
  gaugePointByBend[st.activeBend]=null;
  const candidate=normalized({...p,gaugeSegmentByBend,stopByBend,gaugePointByBend});
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
   optionsList.push({segment,stop,score,plausible,
    contactObserved:!!gauge.contactObserved,
    gaugeWarnings:gauge.warnings||0,toolPenetrations,
    findings:(gauge.findings||[]).map(f=>f.kind)});
  }catch(error){
   optionsList.push({segment,stop,score:Infinity,plausible:false,
    contactObserved:false,gaugeWarnings:0,toolPenetrations:0,
    error:error instanceof Error?error.message:String(error)});
  }
 }
 optionsList.sort((a,b)=>a.score-b.score||a.segment-b.segment||a.stop-b.stop);
 return {operation:st.activeOperation,bend:st.activeBend,
  options:optionsList,best:optionsList.find(o=>o.plausible)||null,
  verified:false,
  limitations:'Sólo bordes libres, contornos provisionales y posiciones temporales 2D. Comprobar topes reales, ejes X/R/Z, herramientas y pieza en la Trumpf.'};
}
