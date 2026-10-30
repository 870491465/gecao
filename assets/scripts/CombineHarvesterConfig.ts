import { V03 } from './V03Motion';
const fieldWidth=500,bunchWidth=fieldWidth/4;
// The opaque rear tire soles are at source y=590; preserve the full frame canvas.
export const COMBINE={width:768,height:640,frames:24,fps:20,scale:.85,headerScaleX:1,groundSourceY:590,groundY:V03.feetY,reelSourceY:180,fieldWidth,bunches:4,bunchWidth,grassCanvas:V03.grassCanvas[0]*bunchWidth/V03.widths[0],rowSpace:46};
// The visible outer rings span source x=65..703. Leave about 18px at both screen edges.
export const FULLSCREEN_COMBINE={...COMBINE,headerScaleX:1.26,fieldWidth:720,bunches:6,bunchWidth:120,grassCanvas:V03.grassCanvas[0]*120/V03.widths[0]};
export function combineConfig(level=4){return level>=5?FULLSCREEN_COMBINE:COMBINE;}
export function combineWorldY(sourceY:number,level=4){const c=combineConfig(level);return c.groundY+(c.groundSourceY-sourceY)*c.scale;}
export function combineCutY(level=4){return combineWorldY(COMBINE.reelSourceY,level);}
// Center of the dark discharge opening; the pipe stays at body scale in levels 5/6.
export function combineOutlet(level=4){const c=combineConfig(level);return {x:(706-c.width/2)*c.scale,y:combineWorldY(316,level)};}
export function combineFrame(rows:number,speed:number){return Math.floor(Math.max(0,rows)/speed*COMBINE.fps+1e-7)%COMBINE.frames;}
export function combineBunch(col:number,cols:number,level=4){const c=combineConfig(level),slices=cols/c.bunches,bunch=Math.floor(col/slices);return {bunch,slices,slice:col%slices,center:(bunch-(c.bunches-1)/2)*c.bunchWidth};}
