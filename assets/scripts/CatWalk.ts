import { sampleWalk,advanceWalkPhase } from './CatWalkSource';
export { sampleWalk,advanceWalkPhase } from './CatWalkSource';
export const WALK = { sourceAmplitude:12,lift:5,bob:3,stancePhase:.25,previewSeconds:1.2 };
const wrap=(p:number)=>((p%1)+1)%1;
/** Match stride to one crop row without changing map speed or harvest income. */
export function amplitudeForRow(rowPixels:number,rootScale:number){return rowPixels/(4*rootScale);}
export function gaitPhase(distanceScreenPixels:number,rootScale:number,amplitude:number){return wrap(WALK.stancePhase+distanceScreenPixels/(rootScale*4*amplitude));}
export function sampleGait(phase:number,amplitude=12){
 const p=wrap(phase),sample=sampleWalk(p);
 const foreAft=(t:number)=>t<.5?1-4*t:4*t-3;
 return {leftFootYOffset:sample.leftFootYOffset+(amplitude-12)*foreAft(p),rightFootYOffset:sample.rightFootYOffset+(amplitude-12)*foreAft(wrap(p+.5)),upperBodyYOffset:sample.upperBodyYOffset};
}
