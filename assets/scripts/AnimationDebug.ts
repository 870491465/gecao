import { Node,Label,UITransform,BlockInputEvents } from 'cc';
import { node,ink,box,text } from './Art';
import { manualHit } from './ManualSickle';
export class AnimationDebug {
 panel:Node;label:Label;slashLabel:Label;singleKey='';slash=true;
 constructor(public host:any,open=false){const g=host;g.button(g.ui,'AnimationInspectorToggle','动画',283,425,70,35,()=>{this.panel.active=!this.panel.active;});
  this.panel=node('AnimationInspector',g.ui,0,460);this.panel.getComponent(UITransform).setContentSize(680,310);this.panel.addComponent(BlockInputEvents);box(ink(this.panel),-340,-150,680,310,18,'#f8f0d8');text(this.panel,'Title','动画检查 · V02 握刀关节 / 序列接入',-10,133,18,555,32);g.button(this.panel,'CloseInspector','×',303,133,38,28,()=>{this.panel.active=false;});
  const b=(name:string,label:string,x:number,y:number,fn:()=>void)=>g.button(this.panel,name,label,x,y,145,37,fn);
  b('OneSwing','单次挥刀',-246,91,()=>{g.cheat();this.singleKey=this.key();g.model.start();});
  b('LoopPreview','循环预览',-82,91,()=>{g.cheat();this.singleKey='';g.model.start();});
  b('PausePreview','暂停 / 继续',82,91,()=>{if(g.model.state==='Paused')g.model.start();else g.model.pause();});
  b('NextFrame','下一帧',246,91,()=>{g.cheat();this.singleKey='';const h=g.actor.hybrid,c=g.model.cfg,hits=c.level===1?Array.from({length:c.cols},(_,col)=>manualHit(c.level,c.cols,col)).sort((a,b)=>a-b):[.3,.4],partial=hits[0]+Math.min(1/120,(hits[1]-hits[0])/2),ends=h?.active?.plan.ends||[.2,partial,.4,.55,.72,1],p=g.model.s.phase,next=ends.find(t=>t>p+1e-6)||1;g.model.pause();g.model.start();g.advance((next-p)/(g.model.rhythm*g.model.speedScale));g.model.pause();if(!h?.active)g.showNotice('V02 握刀动作：按关键相位单步');});
  this.slashLabel=b('SlashToggle','刀光：开',-246,44,()=>{this.slash=!this.slash;this.slashLabel.string='刀光：'+(this.slash?'开':'关');}).l;
  b('DebrisToggle','草屑 开 / 关',-82,44,()=>{g.field.debrisEnabled=!g.field.debrisEnabled;if(!g.field.debrisEnabled)g.field.skin.clearFeedback();});
  b('AnchorsToggle','锚点 / 命中区',82,44,()=>{g.field.debug=!g.field.debug;if(g.actor.hybrid)g.actor.hybrid.debug=g.field.debug;});
  b('LowFrame','.5秒跨帧',246,44,()=>{g.cheat();this.singleKey='';g.model.pause();g.model.start();g.advance(.5);g.model.pause();});
  this.label=text(this.panel,'FrameAndIncome','',0,-52,17,650,130);this.panel.active=open;
 }
 key(){const s=this.host.model.s;return `${s.level}:${s.round}:${s.lane}:${s.row}`;}
 limit(dt:number){const g=this.host;if(this.singleKey&&g.model.cfg.level===1&&g.model.state==='Harvesting')return Math.min(dt,(1-g.model.s.phase)/(g.model.rhythm*g.model.speedScale));return dt;}
 after(){const g=this.host,h=g.actor.hybrid;if(this.singleKey&&this.key()!==this.singleKey){g.model.pause();this.singleKey='';}if(h){h.slashEnabled=this.slash;const s=h.stroke;this.label.string=`${h.status}\n阶段 ${h.stage} · ${h.active?(h.frame>=0?'帧 '+(h.frame+1)+'/'+h.active.frames.length:'WalkVisual'):'V02 握刀关键相位'} · p=${g.model.s.phase.toFixed(3)}\n本刀 ${s.ids.size} 单元 / +${s.income} 金币 · 上刀 ${s.last.units} / +${s.last.income}\n刀光 ${this.slash?'开':'关'} · 草屑 ${g.field.debrisEnabled?'开':'关'} · 脚底 (${h.root.position.x},${h.root.position.y})`;}else this.label.string='当前为机械等级；请在 DEV 中切到一级';}
}
