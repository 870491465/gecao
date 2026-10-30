import { MANUAL as WIDE,manualColumn,manualTarget } from './ManualSickle';
export type SwingStage='charge'|'swing'|'follow'|'recover';
export interface BladePoint { at:number;x:number;y:number; }
export interface SwingFrame { file:string;duration:number;stage:SwingStage;bladeTrack?:BladePoint[];canvas?:number[];feetTopLeft?:number[]; }
export interface SwingClip { id:string;level:number;enabled:boolean;approved:boolean;reviewedBy:string;facing:'up';hand:'right';canvas:number[];feetTopLeft:number[];displayScale:number;bodyHeight:number;hitWindow:number[];frames:SwingFrame[]; }
export interface TrackPoint { time:number;x:number;y:number; }
const near=(a:number,b:number)=>Math.abs(a-b)<1e-6;
export class SwingPlan {
 ends:number[]=[];track:TrackPoint[]=[];hits:number[]=[];duration=0;
 constructor(public clip:SwingClip){
  if(!clip.enabled||!clip.approved||!clip.reviewedBy?.trim())throw Error('序列未启用或未经过人工美术验收');
  if(![1,2].includes(clip.level)||clip.facing!=='up'||clip.hand!=='right')throw Error('只支持朝上、右手持刀的一二级序列');
  if(!clip.id||!clip.frames?.length||clip.frames.length<5)throw Error('缺少完整短序列');
  if(clip.canvas?.length!==2||clip.canvas.some(n=>!Number.isFinite(n)||n<=0)||clip.feetTopLeft?.length!==2||clip.feetTopLeft.some((n,i)=>!Number.isFinite(n)||n<0||n>clip.canvas[i]))throw Error('非法画布/脚底锚点');
  if(!Number.isFinite(clip.displayScale)||!Number.isFinite(clip.bodyHeight)||!(clip.displayScale>0)||Math.abs(clip.bodyHeight*clip.displayScale-WIDE.visualHeight)>2)throw Error('角色尺寸与 WalkVisual 不一致');
  if(clip.hitWindow?.length!==2||clip.hitWindow[0]<.2||clip.hitWindow[1]>.4||clip.hitWindow[0]>=clip.hitWindow[1])throw Error('命中窗必须位于有效挥割 .20–.40');
  const stages=['charge','swing','follow','recover'];let lastStage=-1;
  for(const f of clip.frames){
   if(!f.file||!/^cat-swing-sequence\/frames\/[\w/-]+$/.test(f.file)||!(f.duration>0)||!Number.isFinite(f.duration))throw Error('非法帧路径/持续时间');
   const stage=stages.indexOf(f.stage);if(stage<lastStage||stage<0)throw Error('动作阶段顺序错误');lastStage=stage;
   if(f.canvas&&(f.canvas.length!==2||f.canvas.some((v,i)=>v!==clip.canvas[i]))||f.feetTopLeft&&(f.feetTopLeft.length!==2||f.feetTopLeft.some((v,i)=>v!==clip.feetTopLeft[i])))throw Error('各帧画布或脚底锚点不统一');
   for(const p of f.bladeTrack||[]){if(![p.at,p.x,p.y].every(Number.isFinite)||p.at<0||p.at>f.duration)throw Error('刀刃点越出当前帧时间');const t=this.duration+p.at;if(f.stage==='swing'&&t>=clip.hitWindow[0]-1e-8&&t<=clip.hitWindow[1]+1e-8)this.track.push({time:t,x:p.x*clip.displayScale,y:p.y*clip.displayScale});}
   this.duration+=f.duration;this.ends.push(this.duration);
  }
  if(stages.some(s=>!clip.frames.some(f=>f.stage===s))||this.duration<.55||this.duration>.9)throw Error('短序列须含完整蓄力、挥割、余势和回收，并在 .55–.90 秒内接回步态');
  this.track.sort((a,b)=>a.time-b.time);this.track=this.track.filter((p,i,a)=>!i||!near(p.time,a[i-1].time)||!near(p.x,a[i-1].x)||!near(p.y,a[i-1].y));
  if(this.track.length<2)throw Error('缺少显式有效刀刃轨迹，不能按帧号猜测命中');
  for(let i=1;i<this.track.length;i++)if(this.track[i].time<=this.track[i-1].time)throw Error('刀刃轨迹时间重复或倒序');
  const cols=clip.level===1?2:3;
  for(let col=0;col<cols;col++){
   const x=manualColumn(clip.level,cols,col),expected=manualTarget(clip.level,cols,col).y-WIDE.feetY;let found:number;
   for(let i=1;i<this.track.length;i++){const a=this.track[i-1],b=this.track[i];if((x-a.x)*(x-b.x)>0||near(a.x,b.x))continue;const k=(x-a.x)/(b.x-a.x),y=a.y+(b.y-a.y)*k;if(Math.abs(y-expected)<=8){found=a.time+(b.time-a.time)*k;break;}}
   if(found===undefined)throw Error(`轨迹未覆盖第 ${col+1} 列收割区域`);this.hits.push(found);
  }
 }
 sample(time:number){const t=Math.max(0,Math.min(this.duration,time));let index=this.ends.findIndex(end=>t<end-1e-9);if(index<0)index=this.ends.length-1;const from=index?this.ends[index-1]:0;return {index,stage:this.clip.frames[index].stage,time:t,local:t-from,finished:time>=this.duration};}
 approach(phase:number){const t=Math.max(0,Math.min(1,(phase-this.duration)/(1-this.duration)));return t*t*(3-2*t);}
 bladeAt(time:number){if(time<=this.track[0].time)return this.track[0];for(let i=1;i<this.track.length;i++){const a=this.track[i-1],b=this.track[i];if(time<=b.time){const k=(time-a.time)/(b.time-a.time);return {time,x:a.x+(b.x-a.x)*k,y:a.y+(b.y-a.y)*k};}}return this.track[this.track.length-1];}
 /** Pure interval query; it cannot mutate crops or money. Model mask remains authoritative. */
 crossed(from:number,to:number,settled:Set<number>=new Set()){return this.hits.map((time,col)=>({time,col})).filter(e=>e.time>from-1e-9&&e.time<=to+1e-9&&!settled.has(e.col)).sort((a,b)=>a.time-b.time);}
}

export class SwingStroke {
 key='';ids=new Set<string>();income=0;last={units:0,income:0};
 sync(s:{level:number;round:number;lane:number;row:number;mask:number},price:number){const key=`${s.level}:${s.round}:${s.lane}:${s.row}`;if(key!==this.key){if(this.ids.size)this.last={units:this.ids.size,income:this.income};this.key=key;this.ids.clear();}for(let col=0;col<8;col++)if(s.mask&(1<<col))this.ids.add(`${key}:${col}`);this.income=this.ids.size*price;}
}
