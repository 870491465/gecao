import { Node,Sprite,UITransform,UIOpacity,Graphics } from 'cc';
import { node,ink,line,ellipse } from './Art';
import { CatPartsActor } from './CatPartsActor';
import { MANUAL as WIDE,manualAngle,manualHit,manualTarget } from './ManualSickle';
import { V03Actor } from './V03Actor';
import { v03Contact } from './V03Motion';
import { WALK,amplitudeForRow,gaitPhase } from './CatWalk';
import { SwingStroke } from './SwingSequence';
import { LoadedSwing,loadSwingLibrary,imageFrame } from './SwingAssets';
import { HarvestModel,Cut } from './HarvestModel';
import { SickleWalkActor } from './SickleWalkActor';
export class HybridCatActor {
 sickle:SickleWalkActor=null;
 root:Node;walkVisual:Node;swingVisual:Node;slashFX:Node;upgradeHint:Node;debugInk:Graphics;parts:CatPartsActor;v03:V03Actor;sequenceSprite:Sprite;slash:Sprite;slashAlpha:UIOpacity;
 library=new Map<number,LoadedSwing>();issues:string[]=[];loaded=false;active:LoadedSwing=null;frame=-1;stage='idle';status='序列配置加载中';stroke=new SwingStroke();slashEnabled=true;debug=false;slashAt=-100;slashStroke='';model:HarvestModel;lastProfile='';
 get ready(){return this.sickle?this.sickle.ready:this.loaded&&this.parts.ready&&this.v03.ready;}
 bridgeKey='';bridge:HarvestModel['manualAnimation']=null;
 constructor(parent:Node,public level:number){
  this.root=node('CatRoot',parent,0,WIDE.feetY);this.walkVisual=node('WalkVisual',this.root);this.swingVisual=node('SwingVisual',this.root);this.slashFX=node('SlashFX',this.root);this.upgradeHint=node('UpgradeHint',this.root,0,325);
  if(level===1){this.sickle=new SickleWalkActor(this.root);this.walkVisual.active=false;this.swingVisual.active=false;this.slashFX.active=false;this.debugInk=ink(node('AnimationAnchorsAndTrack',this.root));return;}
  this.parts=new CatPartsActor(this.walkVisual);this.parts.root.name='LayeredCatParts';this.parts.root.setScale(WIDE.scale,WIDE.scale,1);this.parts.arm.active=false;this.v03=new V03Actor(this.walkVisual,this.parts,level);
  this.sequenceSprite=this.swingVisual.addComponent(Sprite);this.sequenceSprite.sizeMode=Sprite.SizeMode.CUSTOM;this.sequenceSprite.trim=false;this.swingVisual.active=false;
  this.slash=this.slashFX.addComponent(Sprite);this.slash.sizeMode=Sprite.SizeMode.CUSTOM;this.slashAlpha=this.slashFX.addComponent(UIOpacity);this.slashFX.active=false;
  this.debugInk=ink(node('AnimationAnchorsAndTrack',this.root));
  loadSwingLibrary().then(result=>{if(!this.root.isValid)return;this.library=result.clips;this.issues=result.issues;this.loaded=true;this.status=this.library.has(level)?'正式序列已加载，等待行边界':result.issues.length?'序列校验失败，使用 V02 握刀动作':'V02 合体握刀（非序列帧）';});
  imageFrame('sickle-slash/fx_sickle_slash').then(f=>{if(this.root.isValid)this.slash.spriteFrame=f;}).catch(e=>this.issues.push('刀光加载失败: '+String(e)));
 }
 prepare(m:HarvestModel){
  if(this.sickle){this.model=m;this.sickle.prepare(m);this.stroke.sync(m.s,m.cfg.price);return;}
  this.model=m;if(!this.loaded){this.stroke.sync(m.s,m.cfg.price);return;}const candidate=this.library.get(m.s.level);
  if(candidate&&(m.s.animationProfile===candidate.plan.clip.id||m.s.phase<.2&&m.s.mask===0&&Math.abs(m.s.distance-m.s.row)<1e-8)){
   this.active=candidate;const plan=candidate.plan;m.manualAnimation={id:plan.clip.id,hitPhase:col=>plan.hits[col],approach:p=>plan.approach(p)};m.s.animationProfile=plan.clip.id;this.status='正式序列：'+plan.clip.id;
  }else{this.active=null;const key=`${m.s.level}:${m.s.round}:${m.s.lane}:${m.s.row}`;m.manualAnimation=key===this.bridgeKey?this.bridge:null;if(m.s.animationProfile&&key!==this.bridgeKey){
    // An unavailable profile must never rewind an already advanced map on resume.
    const base=m.s.distance-m.s.row,phase=m.s.phase;if(base>0&&phase<1){this.bridgeKey=key;m.manualAnimation=this.bridge={id:'missing-profile-bridge',hitPhase:col=>manualHit(m.s.level,m.cfg.cols,col),approach:p=>{const t=Math.max(0,Math.min(1,(p-phase)/(1-phase)));return base+(1-base)*t*t*(3-2*t);}};m.s.animationProfile='missing-profile-bridge';}else delete m.s.animationProfile;
   }}
  this.stroke.sync(m.s,m.cfg.price);
  // Restored settled crops do not respawn feedback or issue hit callbacks.
  if(!this.slashStroke&&m.s.mask)this.slashStroke=this.stroke.key;
 }
 onCut(e:Cut,m:HarvestModel){if(this.sickle){this.sickle.onCut(e,m);return;}this.stroke.sync(m.s,m.cfg.price);if(this.slashStroke===this.stroke.key)return;this.slashStroke=this.stroke.key;this.slashAt=m.s.activeSeconds;const target=manualTarget(m.s.level,m.cfg.cols,e.col),p=this.active?this.active.plan.bladeAt(m.s.phase):{x:target.x,y:target.y-WIDE.feetY};this.slashFX.setPosition(p.x,p.y+12);const w=Math.min(60,WIDE.widths[m.s.level-1]*.7);this.slashFX.getComponent(UITransform).setContentSize(w,w*180/544);}
 pose(phase:number,continuousRows:number){
  if(this.sickle){this.walkVisual.active=false;this.swingVisual.active=false;this.slashFX.active=false;this.sickle.slashEnabled=this.slashEnabled;this.sickle.pose(phase);this.frame=this.sickle.frame;this.stage=phase<.15?'charge':phase<.6?'swing':'recover';this.status='V02 边走边挥镰刀 · 24 帧';return;}
  const m=this.model,plan=this.active?.plan;const active=m?m.state==='Harvesting'||m.state==='Paused'||m.state==='Suspended':false;
  const swinging=!!plan&&active&&!!m?.s.started&&phase<plan.duration;
  this.walkVisual.active=!swinging;this.swingVisual.active=swinging;
  const amplitude=amplitudeForRow(WIDE.rowSpace,WIDE.scale),gait=gaitPhase(continuousRows*WIDE.rowSpace,WIDE.scale,amplitude);
  this.parts.pose(phase,false,gait,amplitude,true);this.parts.arm.active=false;this.parts.body.active=false;this.v03.pose(plan?1:phase,this.parts.upper.position.y*WIDE.scale,gait);
  if(swinging){const sample=plan.sample(phase),c=plan.clip;this.frame=sample.index;this.stage=sample.stage;const t=this.swingVisual.getComponent(UITransform);t.setAnchorPoint(c.feetTopLeft[0]/c.canvas[0],1-c.feetTopLeft[1]/c.canvas[1]);t.setContentSize(c.canvas[0],c.canvas[1]);this.swingVisual.setScale(c.displayScale,c.displayScale,1);this.sequenceSprite.spriteFrame=this.active.frames[sample.index];}
  else{this.frame=-1;this.stage=m?.state==='Ready'?'idle':phase<.2?'charge':phase<.4?'swing':phase<.55?'follow':phase>.92?'settle':'recover / step';}
  const age=m?m.s.activeSeconds-this.slashAt:1;this.slashFX.active=this.slashEnabled&&!!this.slash.spriteFrame&&age>=0&&age<.12;this.slashAlpha.opacity=Math.round(255*(age<.02?age/.02:age<.05?1:Math.max(0,(.12-age)/.07)));
  this.paintDebug(phase);
 }
 paintDebug(phase:number){const g=this.debugInk;g.clear();if(!this.debug)return;line(g,[[-14,0],[14,0]],'#ff5d60',2);line(g,[[0,-14],[0,14]],'#ff5d60',2);ellipse(g,0,0,4,4,'#ffed7e');
  if(this.active){line(g,this.active.plan.track.map(p=>[p.x,p.y]),'#ffcc61',2);const p=this.active.plan.bladeAt(phase);ellipse(g,p.x,p.y,4,4,'#ff5d60');}
  else{const points=Array.from({length:65},(_,i)=>{const p=v03Contact(.2+i/64*.2,this.level);return [p.x,p.y-WIDE.feetY];});line(g,points,'#ffcc61',2);const p=v03Contact(phase,this.level);ellipse(g,p.x,p.y-WIDE.feetY,4,4,'#ff5d60');const bones=this.v03.lastPose;line(g,[[bones.attachment.x,bones.attachment.y],[bones.grip.x,bones.grip.y]],'#ef8bd9',1);}
  this.debugInk.node.setSiblingIndex(this.root.children.length-1);
 }
 cancelFeedback(){this.sickle?.cancelFeedback();this.slashAt=-100;this.slashFX.active=false;}
}
