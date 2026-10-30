// Main-game composition. Original PNG assembly remains available in CatPartsLab.
export const WIDE={scale:.17,feetY:-205,shoulderX:51,shoulderY:-130,rowSpace:42,widths:[360,390],reach:[210,235]};
const smooth=(t:number)=>t*t*(3-2*t);
export function wideAngle(p:number){if(p<=.2)return 12+48*smooth(p/.2);if(p<=.4)return 60-110*(p-.2)/.2;if(p<=.55)return -50-5*smooth((p-.4)/.15);return -55+67*smooth(Math.min(1,(p-.55)/.45));}
export function wideContact(level:number,angle:number){const a=angle*Math.PI/180,r=WIDE.reach[level-1];return {x:WIDE.shoulderX-Math.sin(a)*r,y:WIDE.shoulderY+Math.cos(a)*r};}
export function wideColumn(level:number,cols:number,col:number){return (col-(cols-1)/2)*WIDE.widths[level-1]/cols;}
export function wideHit(level:number,x:number){const angle=Math.asin((WIDE.shoulderX-x)/WIDE.reach[level-1])*180/Math.PI;return .2+(60-angle)/110*.2;}
