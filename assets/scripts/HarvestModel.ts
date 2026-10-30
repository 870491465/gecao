import { LEVELS, RULES, LevelConfig, hitPhase } from './Config';
export type State='Ready'|'Harvesting'|'Transition'|'Upgrading'|'Paused'|'Suspended';
export interface Snapshot { version:number; equipmentRevision?:number; coins:number; level:number; round:number; lane:number; row:number; distance:number; phase:number; mask:number; totalIncome:number; totalCut:number; started:boolean; settings:{sfx:boolean;music:boolean;vibration:boolean;sfxRevision?:number}; celebrated:boolean; debug:boolean; activeSeconds:number; transitionSeconds:number; resume:State; remaining:number; afterUpgrade:State; animationProfile?:string; }
export interface Cut { id:string; row:number; col:number; value:number; }
export class HarvestModel {
 s:Snapshot; state:State='Ready'; speedScale=1; rhythm=1; logs:any[]=[];
 manualAnimation:{id:string;hitPhase:(col:number)=>number;approach:(phase:number)=>number}=null;
 onCut:(e:Cut)=>void=()=>{}; onNotice:(s:string)=>void=()=>{}; onSave:()=>void=()=>{};
 constructor(snapshot?:Snapshot) { this.s=HarvestModel.fresh(); if(snapshot) {snapshot=HarvestModel.migrate(snapshot);HarvestModel.validate(snapshot); this.s=JSON.parse(JSON.stringify(snapshot)); this.state=this.s.started?'Paused':'Ready'; if(this.s.resume==='Upgrading'){this.s.resume=this.s.afterUpgrade;this.s.remaining=0;} } if(this.s.settings.sfxRevision===undefined){this.s.settings.sfx=false;this.s.settings.sfxRevision=1;} }
 static fresh():Snapshot { return {version:2,equipmentRevision:3,coins:0,level:1,round:1,lane:0,row:0,distance:0,phase:0,mask:0,totalIncome:0,totalCut:0,started:false,settings:{sfx:false,music:true,vibration:false,sfxRevision:1},celebrated:false,debug:false,activeSeconds:0,transitionSeconds:0,resume:'Harvesting',remaining:0,afterUpgrade:'Harvesting'}; }
 static migrate(snapshot:Snapshot):Snapshot {
  if(!snapshot||snapshot.version!==RULES.version||snapshot.equipmentRevision===3)return snapshot;
  if(snapshot.equipmentRevision!==undefined&&snapshot.equipmentRevision!==2)throw Error('装备存档版本不兼容');
  const s:Snapshot=JSON.parse(JSON.stringify(snapshot));
  if(!Number.isInteger(s.level)||s.level<1||s.level>(s.equipmentRevision===2?4:5))throw Error('非法等级');
  // Former long-sickle owners continue with the push harvester on a fresh field.
  if(s.equipmentRevision===undefined){
   if(s.level===2){s.round=1;s.lane=0;s.row=0;s.distance=0;s.phase=0;s.mask=0;s.remaining=0;s.resume='Harvesting';s.afterUpgrade='Harvesting';delete s.animationProfile;}
   else if(s.level>2)s.level--;
  }
  // The former third pass moves to the next round while keeping settled cells.
  if(s.level===2&&s.lane===2){s.lane=0;s.round++;}
  s.equipmentRevision=3;
  return s;
 }
 static validate(s:Snapshot) {
  if(!s||s.version!==RULES.version)throw Error('存档版本不兼容，已保留备份');
  if(s.animationProfile!==undefined&&(typeof s.animationProfile!=='string'||s.animationProfile.length>120))throw Error('非法动画配置标识');
  const cfg=LEVELS[s.level-1]; if(!cfg)throw Error('非法等级');
  for(const k of ['coins','round','lane','row','distance','phase','mask','totalIncome','totalCut','activeSeconds','transitionSeconds','remaining'])if(!Number.isFinite(s[k])||s[k]<0)throw Error('损坏字段 '+k);
  if(!Number.isInteger(s.coins)||!Number.isInteger(s.mask)||s.mask>=(1<<cfg.cols)||s.lane>=cfg.lanes||s.row>cfg.rows||s.phase>1.00001||s.distance>cfg.rows+0.001||!s.settings)throw Error('存档进度越界');
 }
 get cfg():LevelConfig{return LEVELS[this.s.level-1];}
 get total(){return this.cfg.cols*this.cfg.rows*this.cfg.lanes;}
 get progress(){return (this.s.lane*this.cfg.rows+this.s.row)*this.cfg.cols+this.bits(this.s.mask);}
 bits(n:number){let b=0;while(n){b+=n&1;n>>=1;}return b;}
 record(type:string,data:any={}){this.logs.push({type,...data,level:this.s.level,time:this.s.activeSeconds,debug:this.s.debug}); if(this.logs.length>400)this.logs.shift();}
 start(){if(this.state==='Ready'){this.s.started=true;this.state='Harvesting';}else if(this.state==='Paused'){this.state=this.s.resume==='Transition'&&this.s.remaining>0?'Transition':this.s.resume==='Upgrading'&&this.s.remaining>0?'Upgrading':'Harvesting';} }
 pause(){if(['Harvesting','Transition','Upgrading'].includes(this.state)){this.s.resume=this.state;this.state='Paused';this.onSave();}}
 suspend(){if(this.state!=='Suspended'){if(this.state!=='Paused'&&this.state!=='Ready')this.s.resume=this.state;this.state='Suspended';this.onSave();}}
 foreground(){if(this.state==='Suspended')this.state=this.s.started?'Paused':'Ready';}
 snapshot():Snapshot { const s=JSON.parse(JSON.stringify(this.s)); if(['Harvesting','Transition','Upgrading'].includes(this.state))s.resume=this.state;return s; }
 cut(col:number) {
  const s=this.s,c=this.cfg; if(this.state!=='Harvesting'||s.row>=c.rows||col<0||col>=c.cols||(s.mask&(1<<col)))return false;
  s.mask|=1<<col;s.coins+=c.price;s.totalIncome+=c.price;s.totalCut++;
  const e={id:`${s.level}:${s.round}:${s.lane}:${s.row}:${col}`,row:s.row,col,value:c.price};this.onCut(e);return true;
 }
 purchase(){
  const s=this.s,c=this.cfg;if(['Upgrading','Transition','Suspended'].includes(this.state)||(this.state==='Paused'&&s.resume==='Upgrading'&&s.remaining>0)||c.next===0)return false;
  if(s.coins<c.next){this.onNotice(`还差 ${c.next-s.coins} 金币`);return false;}
  const previous=this.state==='Paused'?'Paused':this.state==='Ready'?'Ready':'Harvesting';
  this.state='Upgrading';s.coins-=c.next;s.level++;s.round=1;s.lane=0;s.row=0;s.distance=0;s.phase=0;s.mask=0;s.remaining=RULES.upgrade;s.afterUpgrade=previous;s.resume='Upgrading';delete s.animationProfile;this.manualAnimation=null;
  s.celebrated=false;
  this.record('purchase',{price:c.next,coins:s.coins});this.onSave();this.onNotice(`${this.cfg.tool} · ${this.cfg.crop}`);return true;
 }
 debugLevel(level:number){delete this.s.animationProfile;this.manualAnimation=null;this.s.debug=true;this.s.level=level;this.s.round=1;this.s.lane=0;this.s.row=0;this.s.mask=0;this.s.phase=0;this.s.distance=0;this.s.remaining=0;this.s.resume='Harvesting';this.state='Paused';this.record('debug-level');}
 update(dt:number) { // No wall clock or offline compensation. Every distance crossing is substepped.
  if(!Number.isFinite(dt)||dt<=0)return;
  while(dt>1e-9){const h=Math.min(dt,RULES.maxSubstep);this.step(h);dt-=h;}
 }
 private step(dt:number){
  const s=this.s,c=this.cfg;
  if(this.state==='Transition'||this.state==='Upgrading'){
   s.transitionSeconds+=dt;s.remaining-=dt;if(s.remaining<=1e-8){s.remaining=0;
    if(this.state==='Upgrading'){this.state=s.afterUpgrade;s.resume=this.state==='Paused'?'Harvesting':this.state;}
    else {s.lane++;if(s.lane>=c.lanes){s.lane=0;s.round++;if(s.level===LEVELS.length&&!s.celebrated){s.celebrated=true;this.onNotice('最高级首田完成！继续快乐收割');}else this.onNotice(`第 ${s.round} 轮 · 继续收割`);}s.row=0;s.distance=0;s.phase=0;s.mask=0;this.state='Harvesting';s.resume='Harvesting';}
    this.onSave();
   }return;
  }
  if(this.state!=='Harvesting')return;
  s.activeSeconds+=dt;
  if(c.level===1){
   const previous=s.phase,target=Math.min(1,s.phase+dt*this.rhythm*this.speedScale);
   const events=Array.from({length:c.cols},(_,col)=>({col,hit:this.manualAnimation?this.manualAnimation.hitPhase(col):hitPhase(c,col)})).sort((a,b)=>a.hit-b.hit);
   for(const {col,hit} of events){if(target+1e-9>=hit&&!(s.mask&(1<<col))){s.phase=Math.max(previous,hit);this.cut(col);}}
   s.phase=target;
   s.distance=s.row+(this.manualAnimation?this.manualAnimation.approach(s.phase):s.phase);
   if(s.phase>=1-1e-9)this.nextRow();
  }else{
   s.distance+=dt*c.speed*this.speedScale;
   while(s.row<c.rows&&s.distance+1e-9>=s.row+1){for(let col=0;col<c.cols;col++)this.cut(col);this.nextRow();if(this.state!=='Harvesting')break;}
  }
 }
 private nextRow(){
  if(this.s.mask!==((1<<this.cfg.cols)-1))throw Error('禁止越过未切断作物');
  this.s.row++;this.s.mask=0;this.s.phase=0;
  if(this.cfg.level===1)this.s.distance=this.s.row;
  if(this.s.row>=this.cfg.rows){this.state='Transition';this.s.resume='Transition';this.s.remaining=RULES.transition;this.record('lane-complete',{round:this.s.round,lane:this.s.lane});this.onSave();}
 }
}
