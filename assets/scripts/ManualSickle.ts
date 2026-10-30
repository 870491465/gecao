import { V03,v03Pose,v03Contact } from './V03Motion';
export const MANUAL={scale:V03.legacyScale,feetY:V03.feetY,rowSpace:V03.rowSpace,laneCenter:0,widths:V03.widths,visualHeight:V03.visualHeight};
export function manualAngle(p:number){return v03Pose(p).toolAngle;}
export function manualColumn(level:number,cols:number,col:number){return (col-(cols-1)/2)*MANUAL.widths[level-1]/cols;}
const contacts=new Map<string,{phase:number;point:{x:number;y:number}}>();
function contact(level:number,cols:number,col:number){const key=`${level}:${cols}:${col}`;let value=contacts.get(key);if(!value){const x=manualColumn(level,cols,col);let lo=.2,hi=.4;for(let i=0;i<40;i++){const p=(lo+hi)/2;if(v03Contact(p,level).x>x)lo=p;else hi=p;}const phase=(lo+hi)/2;value={phase,point:v03Contact(phase,level)};contacts.set(key,value);}return value;}
export function manualHit(level:number,cols:number,col:number){return contact(level,cols,col).phase;}
export function manualTarget(level:number,cols:number,col:number){return contact(level,cols,col).point;}
