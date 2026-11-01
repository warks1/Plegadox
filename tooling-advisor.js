/**
 * Asesor orientativo de punzón/matriz para plegado al aire.
 * No es selección CNC ni validación de colisiones, montaje o carga admisible
 * de cada referencia. Usa las herramientas realmente registradas en PlegadoX.
 */
import {DIES,PUNCHES,MACHINE,normalized,estimateAirBendForce} from './engine.js';
import {selectionCompatibility} from './catalog.js';

const finitePositive=n=>Number.isFinite(Number(n))&&Number(n)>0;
const close=(a,b)=>Math.abs(a-b)<1e-8;

/** Regla de taller configurable en el futuro. Base x8, x10 para 9-10 mm,
 * x12 para chapa gruesa (tablas de aire orientativas).
 * Para chapa fina también puede ser razonable x6, según material/radio.
 */
export function targetVRatio(thickness){
 const t=Number(thickness);
 return t>=12?12:t>=9?10:8;
}
function pairData(p,die,punch,minimumInterior,minimumFlange,requiresClearance){
 const opening=Number(die.opening),included=Number(die.angle),punchAngle=Number(punch.angle);
 if(!finitePositive(opening)||!finitePositive(included)||!finitePositive(punchAngle))
  return null;
 const ratio=opening/p.thickness;
 const flangeLimit=opening*.7;
 // El 0,7×V sólo es una cota de PREselección; la geometría real del ala,
 // los hombros, ángulo y el radio pueden exigir más.
 if(ratio<5-1e-8||ratio>14+1e-8||
  minimumFlange+1e-8<flangeLimit||
  included>minimumInterior+1e-8||punchAngle>minimumInterior+1e-8)return null;
 const mount=selectionCompatibility(punch,die);
 if(mount.compatible===false)return null;
 const force=estimateAirBendForce({...p,die:die.id});
 if(!force.estimated||!Number.isFinite(force.tonneForce)||
  force.tonneForce>MACHINE.tonnage+1e-8)return null;
 const target=targetVRatio(p.thickness);
 const isGoose=punch.type==='cabra';
 const needsAcute=minimumInterior<85;
 const margin=minimumFlange/flangeLimit;
 const radiusEstimate=opening*(p.material.startsWith('alu')?.18:.16);
 const angleBias=needsAcute?Math.abs(punchAngle-Math.min(minimumInterior,30))*0.06:
   Math.abs(punchAngle-88)*.05;
 let score=Math.abs(Math.log(ratio/target))*34+angleBias;
 score+=Math.max(0,1.25-margin)*12;
 if(requiresClearance)score+=isGoose?-9:8;
 else if(isGoose)score+=4;
 if(p.radius!=null)score+=Math.abs(radiusEstimate-p.radius)/Math.max(1,p.radius)*4;
 if(die.importedDxf||punch.importedDxf)score+=4;
 if(die.profileAccuracy==='provisional'||punch.profileAccuracy==='provisional')score+=2;
 if(die.verifiedSpecs===false||punch.verifiedSpecs===false)score+=1;
 if(die.mount&&punch.mount&&die.mount===punch.mount)score-=2;
 const warnings=[];
 if(margin<1.2)warnings.push('Ala cerca del límite orientativo de apoyo (0,7 × V)');
 if(p.radius!=null)warnings.push('Radio interior solicitado: contrastar con prueba real de plegado');
 if(requiresClearance)warnings.push('Alas cerradas o signos alternos: verificar cuello del punzón y colisiones 3D');
 if(mount.compatible!==true)warnings.push(mount.reason);
 if(die.mount||punch.mount)warnings.push('Confirmar adaptación de los amarres a la Trumpf V85');
 if(die.length&&die.length<p.width||punch.length&&punch.length<p.width)
  warnings.push('Comprobar longitud útil, segmentación y carga por segmento');
 if(p.angles.some(a=>Math.abs(Math.abs(a)-90)>5))
  warnings.push('Ángulo fuera de aire típico 90°: comprobar ala mínima, radio y fuerza en tablas reales');
 warnings.push('Carga admisible por metro de útiles y mordazas NO comprobada');
 return {dieId:die.id,punchId:punch.id,dieName:die.name,punchName:punch.name,
  dieOpening:opening,dieAngle:included,punchAngle,ratio,minimumFlange,
  flangeLimit,forceTonnes:force.tonneForce,forceKNm:force.kNPerMetre,
  radiusEstimate,goose:isGoose,score,warnings,
  mountStatus:mount.reason,verified:false};
}
/**
 * La pieza se mide por las alas adyacentes de CADA pliegue, nunca sólo
 * por la más corta del programa. Una pieza sin combinación admisible
 * devuelve choice=null; no sustituir por útiles incompatibles.
 */
export function recommendTooling(input,options={}){
 const p=normalized(input),dies=options.dies||DIES,punches=options.punches||PUNCHES;
 const minimumFlange=Math.min(...p.angles.map((_,i)=>Math.min(p.flanges[i],p.flanges[i+1])));
 const minimumInterior=Math.min(...p.angles.map(angle=>180-Math.abs(angle)));
 const requiresClearance=p.angles.length>=3||
  p.angles.some((angle,i)=>i>0&&Math.sign(angle)!==Math.sign(p.angles[i-1]));
 const candidates=[];
 for(const die of dies)for(const punch of punches){
  const pair=pairData(p,die,punch,minimumInterior,minimumFlange,requiresClearance);
  if(pair)candidates.push(pair);
 }
 candidates.sort((a,b)=>a.score-b.score||
  a.dieOpening-b.dieOpening||a.dieId.localeCompare(b.dieId)||
  a.punchId.localeCompare(b.punchId));
 const choice=candidates[0]||null;
 // Ofrecer matrices V distintas: una lista de tres punzones casi iguales
 // no aporta una alternativa útil para elegir apertura.
 const alternatives=[],seen=new Set(choice?[choice.dieId]:[]);
 for(const pair of candidates.slice(1)){
  if(seen.has(pair.dieId))continue;
  seen.add(pair.dieId);alternatives.push(pair);
  if(alternatives.length>=3)break;
 }
 if(alternatives.length===0&&candidates.length>1)alternatives.push(candidates[1]);
 const reasons=[];
 if(!choice){
  reasons.push('No hay una pareja de matriz y punzón que cumpla a la vez el apoyo mínimo estimado, el ángulo incluido, la relación V/e y el tonelaje nominal.');
  if(!dies.length||!punches.length)reasons.push('Catálogo vacío: importar herramientas compatibles.');
 }else{
  reasons.push('Guía de apertura objetivo: '+targetVRatio(p.thickness)+' × espesor; ajustada según alas, ángulo y fuerza.');
  reasons.push('Ala más corta adyacente: '+minimumFlange.toFixed(1)+' mm; mínimo orientativo con V'+choice.dieOpening+': '+choice.flangeLimit.toFixed(1)+' mm.');
 }
 return {choice,alternatives,candidateCount:candidates.length,
  minimumFlange,minimumInterior,requiresClearance,
  targetOpening:p.thickness*targetVRatio(p.thickness),reasons,verified:false};
}
