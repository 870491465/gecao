import { sampleWalk,WALK } from './CatWalk';
// Measured inner cutting edge in the original right-arm PNG; coordinates use top-left pixels.
// Alpha-overlap review: keep the blade at or outside its supplied static pose (<= 0 degrees).
export const CAT_MOTION = {
 rootX:0, feetY:-305, scale:0.26,
 rightPivot:[137,480], rightPosition:[302,410], rightScale:0.8,
 bladePixel:[430,177], laneCenter:123, laneWidths:[84,93], rowSpace:28,
 rest:-14,windup:-60, strike:-2, follow:0,
 charge:0.2,swing:0.2,overshoot:0.15,recover:0.45
};
const smooth=(t:number)=>t*t*(3-2*t);
export function approachFraction(p:number){return smooth(Math.max(0,Math.min(1,(p-.55)/.45)));}
export function catArmAngle(p:number){
 const m=CAT_MOTION;
 if(p<=m.charge)return m.rest+(m.windup-m.rest)*smooth(p/m.charge);
 if(p<=m.charge+m.swing)return m.windup+(m.strike-m.windup)*(p-m.charge)/m.swing;
 if(p<=.55)return m.strike+(m.follow-m.strike)*smooth((p-.4)/m.overshoot);
 return m.follow+(m.rest-m.follow)*smooth(Math.min(1,(p-.55)/m.recover));
}
export function bladePixelFor(cols:number,col:number):number[]{return col===cols-1?[430,177]:col===0?[179,131]:[275,91];}
export function bladeContact(angle:number,pixel:readonly number[]=CAT_MOTION.bladePixel){
 const m=CAT_MOTION,s=m.scale*m.rightScale,a=angle*Math.PI/180;
 const dx=(pixel[0]-m.rightPivot[0])*s,dy=(m.rightPivot[1]-pixel[1])*s;
 return {x:m.rootX+m.rightPosition[0]*m.scale+dx*Math.cos(a)-dy*Math.sin(a),y:m.feetY+(m.rightPosition[1]+sampleWalk(WALK.stancePhase).upperBodyYOffset)*m.scale+dx*Math.sin(a)+dy*Math.cos(a)};
}
export function manualColumnX(level:number,cols:number,col:number){return CAT_MOTION.laneCenter+(col-(cols-1)/2)*CAT_MOTION.laneWidths[level-1]/cols;}
export function contactPhase(x:number,pixel:readonly number[]=CAT_MOTION.bladePixel){ // Monotonic strike path, never the returning stroke.
 let low=.2,high=.4;for(let i=0;i<40;i++){const p=(low+high)/2;if(bladeContact(catArmAngle(p),pixel).x>x)low=p;else high=p;}return (low+high)/2;
}
