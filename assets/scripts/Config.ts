import { MANUAL,manualColumn,manualHit,manualTarget } from './ManualSickle';
import { PUSH,pushCutY } from './PushHarvesterConfig';
import { sickleContact } from './SickleWalkConfig';
import { RIDE,rideCutY } from './RideHarvesterConfig';
import { COMBINE,FULLSCREEN_COMBINE,combineCutY } from './CombineHarvesterConfig';
import { RICE } from './RiceConfig';
export interface LevelConfig { level:number; tool:string; crop:string; price:number; cols:number; rows:number; lanes:number; speed:number; next:number; color:string; width:number; height:number }
export const LEVELS:LevelConfig[] = [
 {level:1,tool:'小镰刀',crop:'嫩青草',price:1,cols:2,rows:40,lanes:1,speed:1,next:120,color:'#73bd54',width:168,height:30},
 {level:2,tool:'手推收割机',crop:'青草',price:3,cols:4,rows:60,lanes:2,speed:1.5,next:3240,color:'#7da85b',width:PUSH.fieldWidth,height:33},
 {level:3,tool:'骑乘收割车',crop:'青草',price:5,cols:6,rows:75,lanes:4,speed:2,next:14400,color:'#7da85b',width:RIDE.fieldWidth,height:49},
 {level:4,tool:'联合收割机',crop:'青草',price:8,cols:8,rows:90,lanes:5,speed:2.5,next:38400,color:'#7da85b',width:COMBINE.fieldWidth,height:44},
 {level:5,tool:'全屏联合收割机',crop:'青草',price:12,cols:12,rows:100,lanes:1,speed:3,next:103680,color:'#7da85b',width:FULLSCREEN_COMBINE.fieldWidth,height:44},
 {level:6,tool:'水稻联合收割机',crop:'水稻',price:20,cols:12,rows:110,lanes:1,speed:3.2,next:0,color:'#e5b548',width:FULLSCREEN_COMBINE.fieldWidth,height:48}
];
export const RULES = { version:2, rowSpace:46, transition:0.65, upgrade:0.58, saveInterval:5, charge:0.2, swing:0.2, follow:0.15, recover:0.45, shoulderX:30, shoulderY:-225, bladeRadius:170, machineLine:-105, maxSubstep:1/120 };
export function columnX(c:LevelConfig,col:number) { return c.level===1?manualColumn(c.level,c.cols,col):(col-(c.cols-1)/2)*(c.level===2?PUSH.harvestWidth:c.width)/c.cols; }
export function cutY(c:LevelConfig,col:number) { return c.level===1?sickleContact(c.cols,col).fieldY:c.level===2?pushCutY():c.level===3?rideCutY():combineCutY(c.level); }
export function hitPhase(c:LevelConfig,col:number) { return c.level===1?sickleContact(c.cols,col).phase:manualHit(c.level,c.cols,col); }
export function fieldCenter(c:LevelConfig){return c.level===1?MANUAL.laneCenter:0;}
export function fieldWidth(c:LevelConfig){return c.level===1?MANUAL.widths[c.level-1]:c.width;}
export function rowSpacing(c:LevelConfig){return c.level>=6?RICE.rowSpace:c.level===1?MANUAL.rowSpace:c.level===2?PUSH.rowSpace:c.level===3?RIDE.rowSpace:COMBINE.rowSpace;}
export function continuousRows(c:LevelConfig,round:number,lane:number,distance:number){return ((round-1)*c.lanes+lane)*c.rows+distance;}
