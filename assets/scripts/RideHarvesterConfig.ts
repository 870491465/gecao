import { V03 } from './V03Motion';
const fieldWidth=460,bunchWidth=fieldWidth/3;
// Keep the complete supplied canvas. Its author anchor is below the rear tires,
// so ground the visible tires at source y=575 rather than the transparent padding.
export const RIDE={width:768,height:640,frames:24,fps:20,scale:.8,anchorX:.5,anchorY:.94,groundSourceY:575,groundY:V03.feetY,reelSourceY:257,frontSourceY:180,fieldWidth,bunchWidth,grassCanvas:V03.grassCanvas[0]*bunchWidth/V03.widths[0],rowSpace:46};
export function rideWorldY(sourceY:number){return RIDE.groundY+(RIDE.groundSourceY-sourceY)*RIDE.scale;}
export function rideCutY(){return rideWorldY(RIDE.reelSourceY);}
export function rideFrame(rows:number,speed:number){return Math.floor(Math.max(0,rows)/speed*RIDE.fps+1e-7)%RIDE.frames;}
export function rideBunch(col:number,cols:number){const slices=cols/3,bunch=Math.floor(col/slices);return {bunch,slices,slice:col%slices,center:(bunch-1)*RIDE.bunchWidth};}
