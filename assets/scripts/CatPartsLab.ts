import { _decorator,Component,Node,UITransform,Graphics,Label,Vec3,view,ResolutionPolicy,profiler,Game,game } from 'cc';
import { node,ink,box,text,color,line,ellipse } from './Art';
import { CatPartsActor } from './CatPartsActor';
import { catArmAngle,approachFraction,CAT_MOTION } from './CatMotion';
import { WALK,advanceWalkPhase,amplitudeForRow,gaitPhase } from './CatWalk';
const {ccclass}=_decorator;
@ccclass('CatPartsLab')
export class CatPartsLab extends Component {
 rig:CatPartsActor;phase=0;playing=false;staticPose=true;speed=1;dark=false;debug=false;clock=0;cycles=0;mode:'combined'|'walk'='combined';walkOnlyPhase=0;
 stage:Node;bg:Graphics;guides:Graphics;label:ReturnType<typeof text>;
 onLoad(){
  view.setDesignResolutionSize(720,1280,ResolutionPolicy.SHOW_ALL);profiler.hideStats();
  this.bg=ink(node('Background',this.node));this.paintBackground();
  text(this.node,'Title','橘猫 V02 · 分腿走路与挥割',0,548,29);
  text(this.node,'Spec','固定地面根节点 · 按推进距离迈步 · 60° 挥刀',0,496,19);
  this.button('Mode','切换：仅走路 / 走割',0,423,()=>{this.mode=this.mode==='combined'?'walk':'combined';this.staticPose=false;this.pose();},350);
  this.stage=node('AssemblyStage',this.node);this.rig=new CatPartsActor(this.stage);this.rig.root.setPosition(-65,-205);this.rig.root.setScale(.55,.55,1);this.guides=ink(node('PivotGuides',this.node));
  this.label=text(this.node,'Phase','加载素材…',0,-352,23);
  this.button('Static','静态拼装',-220,-430,()=>{this.playing=false;this.staticPose=true;this.phase=0;this.cycles=0;this.walkOnlyPhase=0;this.pose();});
  this.button('Play','播放 / 暂停',0,-430,()=>{this.staticPose=false;this.playing=!this.playing;});
  this.button('Step','单步 1/60',220,-430,()=>{this.staticPose=false;this.playing=false;this.tick(1/60);this.pose();});
  this.button('Background','浅 / 深背景',-220,-511,()=>{this.dark=!this.dark;this.paintBackground();});
  this.button('Slow','慢速 / 正常',0,-511,()=>this.speed=this.speed===1?.25:1);
  this.button('Guides','支点 / 刀刃',220,-511,()=>{this.debug=!this.debug;this.pose();});
  text(this.node,'Limitation','检查入口不读取或写入游戏存档，不产生金币',0,-588,18);
  (globalThis as any).__CAT_PARTS_LAB__=this;this.pose();game.on(Game.EVENT_HIDE,this.hide,this);
 }
 onDestroy(){game.off(Game.EVENT_HIDE,this.hide,this);if((globalThis as any).__CAT_PARTS_LAB__===this)delete (globalThis as any).__CAT_PARTS_LAB__;}
 hide(){this.playing=false;}
 button(name:string,label:string,x:number,y:number,fn:()=>void,width=203){const n=node(name,this.node,x,y);n.getComponent(UITransform).setContentSize(width,58);box(ink(n),-width/2,-29,width,58,14,'#fff0cf');text(n,'Label',label,0,0,22,width-4);n.on(Node.EventType.TOUCH_END,fn);}
 paintBackground(){this.bg.clear();box(this.bg,-360,-640,720,1280,0,this.dark?'#26332f':'#e1e5da');for(const n of this.node.children){const l=n.getComponent(Label);if(l)l.color=color(this.dark?'#fff1d0':'#4b5336');}}
 pose(){
  if(!this.rig)return;const amplitude=this.mode==='walk'?12:amplitudeForRow(CAT_MOTION.rowSpace,CAT_MOTION.scale);const walk=this.mode==='walk'?this.walkOnlyPhase:gaitPhase((this.cycles+approachFraction(this.phase))*CAT_MOTION.rowSpace,CAT_MOTION.scale,amplitude);this.rig.pose(this.phase,this.staticPose,walk,amplitude,this.mode==='walk');
  const phases=this.phase<.2?'蓄力':this.phase<.4?'挥出 / 有效切断':this.phase<.55?'余势':'收回（不结算）';
  if(this.label)this.label.string=this.rig.error?'加载失败：'+this.rig.error:!this.rig.ready?'加载素材…':this.staticPose?'静态拼装 · V02 六层原图':this.mode==='walk'?`仅走路 · 参考步幅 12 · 周期 1.2s`:`${phases} · ${(this.phase*1000).toFixed(0)}ms · 步态 ${walk.toFixed(2)}`;
  const g=this.guides;g.clear();if(this.debug){ellipse(g,-65,-205,6,6,'#f35b52');line(g,[[-300,-205],[300,-205]],'#a5bba8',2);for(const part of this.rig.parts.values()){const p=this.guides.node.getComponent(UITransform).convertToNodeSpaceAR(part.worldPosition);ellipse(g,p.x,p.y,5,5,'#ff645b');}
   const edge=[[179,131],[220,103],[275,91],[330,99],[391,131],[430,177],[443,207],[430,246],[421,252]].map(p=>{const world=this.rig.arm.getComponent(UITransform).convertToWorldSpaceAR(new Vec3(p[0]-137,480-p[1],0));const local=this.guides.node.getComponent(UITransform).convertToNodeSpaceAR(world);return [local.x,local.y];});line(g,edge,'#f35b52',2);
  }
 }
 tick(dt:number){const t=this.phase+dt*this.speed;this.cycles+=Math.floor(t);this.phase=t%1;this.walkOnlyPhase=advanceWalkPhase(this.walkOnlyPhase,dt*this.speed*48/WALK.previewSeconds);this.clock+=dt*this.speed;}
 update(dt:number){if(this.playing&&this.rig.ready)this.tick(dt);this.pose();}
}
