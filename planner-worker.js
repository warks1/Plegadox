// Each request gets an isolated worker: cached machine selection and CAD
// can never leak from a previous job. Nothing is written back to storage.
export async function evaluatePlannerSnapshot({piece,options,dies,punches,storage={}}){
 Object.defineProperty(globalThis,'localStorage',{configurable:true,value:{
  getItem:key=>Object.hasOwn(storage,key)?storage[key]:null
 }});
 const engine=await import('./engine.js');
 engine.DIES.splice(0,engine.DIES.length,...dies);
 engine.PUNCHES.splice(0,engine.PUNCHES.length,...punches);
 const {optimizeBendPlan}=await import('./integrated-bend-planner.js');
 return optimizeBendPlan(piece,{...options,dies:engine.DIES,punches:engine.PUNCHES});
}
if(typeof self!=='undefined'&&typeof document==='undefined')self.onmessage=async event=>{
 try{self.postMessage({ok:true,report:await evaluatePlannerSnapshot(event.data)});}
 catch(error){self.postMessage({ok:false,error:String(error?.message||error)});}
};
