import { SICKLE } from './SickleWalkConfig';
import { V03 } from './V03Motion';
import { GRASS_ASSETS } from './GrassAssetConfig';
// The pushing pose is slimmer than stage one; a modest uniform increase matches its visual weight.
const catHeight=SICKLE.bodySourceHeight*SICKLE.scale*1.12;
const scale=catHeight/(674-375),harvestWidth=242*scale;
// Color V03 is one complete sprite: cat, grips, sleeves and machine share one scale.
export const PUSH={width:512,height:768,frames:24,fps:20,scale,catHeight,catTopY:375,feetY:SICKLE.feetY,feetSourceY:674,reelSourceY:121,cuttingSpan:[138,380],rowCenters:[198.5,319.5],bunchSpacing:120,fieldWidth:240,harvestWidth,grassCanvas:V03.grassCanvas[0],rowSpace:SICKLE.rowSpace};
export function pushCutY(){return PUSH.feetY+(PUSH.feetSourceY-PUSH.reelSourceY)*PUSH.scale;}
export function pushFrame(rows:number,speed:number){return Math.floor(Math.max(0,rows)/speed*PUSH.fps+1e-7)%PUSH.frames;}
// Visual grass may overhang the machine; its spacing is independent of actor scale.
export function pushBunch(col:number,cols:number){const slices=cols/2,bunch=Math.floor(col/slices);return {bunch,slices,slice:col%slices,center:(bunch-.5)*PUSH.bunchSpacing};}
const STUBBLE_WIDTHS=new Map<string,number>(GRASS_ASSETS.crop_assets.filter(a=>a.state==='stubble').map(a=>[a.pair,a.visual_root_width_px] as [string,number]));
// Keep every stump compact at a fixed ground scale, including the wider C art.
export function pushStubbleScale(variant:string){return .82*STUBBLE_WIDTHS.get('A')/(STUBBLE_WIDTHS.get(variant)||STUBBLE_WIDTHS.get('A'));}

// White sole positions measured from the supplied, unmodified 24 frames.
export const PUSH_FEET=[[[213.19,664],[298.8,661]],[[213.19,666],[298.99,659]],[[212.65,668],[299.04,657]],[[212.55,669],[298.99,655]],[[212.13,671],[299.58,654]],[[211.92,671],[299.42,653]],[[211.04,673],[300.74,653]],[[211.06,671],[300.64,653]],[[210.61,671],[301.07,654]],[[210.23,669],[301.24,655]],[[210.13,668],[301.89,657]],[[210.19,666],[300.96,658]],[[210.19,664],[301.8,661]],[[210.19,662],[301.8,663]],[[210.13,660],[301.89,665]],[[210.64,658],[300.97,666]],[[210.65,657],[301.57,668]],[[211.19,656],[300.28,668]],[[211.04,657],[300.74,669]],[[211.65,656],[299.55,668]],[[212.13,657],[299.69,668]],[[212.64,658],[298.82,666]],[[212.65,660],[299.04,665]],[[213.19,662],[298.98,663]]];
const FOOT_GROUND=[0,1].map(i=>Math.max(...PUSH_FEET.map(f=>f[i][1])));
export function pushFootContacts(frame:number){return PUSH_FEET[frame].map(([x,y],i)=>({x:(x-PUSH.width/2)*PUSH.scale,y:PUSH.feetY+(PUSH.feetSourceY-y)*PUSH.scale-2,opacity:Math.round(70-Math.min(30,(FOOT_GROUND[i]-y)*PUSH.scale*5))}));}
