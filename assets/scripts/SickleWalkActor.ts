import { Node,Sprite,SpriteFrame,UITransform,JsonAsset,resources,UIOpacity } from 'cc';
import { node } from './Art';
import { imageFrame } from './SwingAssets';
import { SICKLE,sickleFrame,sickleContact,sickleBlade } from './SickleWalkConfig';
import { HarvestModel,Cut } from './HarvestModel';
let shared:Promise<SpriteFrame[]>;
function loadFrames(){
 if(!shared)shared=new Promise<any>((resolve,reject)=>resources.load('cat-sickle-walk-v02/animation',JsonAsset,(error,asset)=>error?reject(error):resolve(asset.json))).then(config=>{
  if(config.frames?.length!==SICKLE.frames||config.fps!==SICKLE.fps||config.canvas?.some(n=>n!==SICKLE.canvas)||config.root_anchor_px?.[0]!==SICKLE.anchorX||config.root_anchor_px?.[1]!==SICKLE.anchorY)throw Error('Sickle walk V02 configuration mismatch');
  return Promise.all(Array.from({length:SICKLE.frames},(_,i)=>imageFrame('cat-sickle-walk-v02/frames/swing_'+String(i).padStart(2,'0'))));
 }).then(frames=>{if(frames.some(f=>f.width!==SICKLE.canvas||f.height!==SICKLE.canvas))throw Error('Sickle walk V02 frame canvas mismatch');return frames;});
 return shared;
}
export class SickleWalkActor {
 root:Node;sprite:Sprite;frames:SpriteFrame[]=[];ready=false;error='';frame=0;bridgeKey='';
 slashNode:Node;slash:Sprite;slashAlpha:UIOpacity;slashEnabled=true;slashAt=-100;slashStroke='';slashCount=0;model:HarvestModel;
 constructor(parent:Node){
  this.root=node('SickleWalkV02',parent);const transform=this.root.getComponent(UITransform);transform.setAnchorPoint(SICKLE.anchorX/SICKLE.canvas,1-SICKLE.anchorY/SICKLE.canvas);transform.setContentSize(SICKLE.canvas*SICKLE.scale,SICKLE.canvas*SICKLE.scale);
  this.sprite=this.root.addComponent(Sprite);this.sprite.sizeMode=Sprite.SizeMode.CUSTOM;this.sprite.trim=false;
  this.slashNode=node('SickleSlashFX',parent);this.slashNode.getComponent(UITransform).setContentSize(120,120*180/544);
  this.slash=this.slashNode.addComponent(Sprite);this.slash.sizeMode=Sprite.SizeMode.CUSTOM;this.slash.trim=false;this.slashAlpha=this.slashNode.addComponent(UIOpacity);this.slashNode.active=false;
  Promise.all([loadFrames(),imageFrame('sickle-slash/fx_sickle_slash')]).then(([frames,slash])=>{if(!this.root.isValid)return;if(slash.width!==544||slash.height!==180)throw Error('Sickle slash canvas mismatch');this.frames=frames;this.slash.spriteFrame=slash;this.ready=true;this.sprite.spriteFrame=frames[this.frame];}).catch(error=>{this.error=String(error);console.error('Sickle walk V02',error);});
 }
 prepare(m:HarvestModel){
  this.model=m;
  let profile=m.s.animationProfile,anchor=0,base=0;
  const key=`${m.s.round}:${m.s.lane}:${m.s.row}`;
  if(!this.slashStroke&&m.s.mask)this.slashStroke=`${m.s.level}:${key}`;
  if(profile?.startsWith(SICKLE.id+'@')){if(this.bridgeKey&&this.bridgeKey!==key)profile=SICKLE.id;else this.bridgeKey=key;}
  if(profile?.startsWith(SICKLE.id+'@')){[anchor,base]=profile.slice(SICKLE.id.length+1).split(',').map(Number);}
  else if(profile!==SICKLE.id&&m.s.phase>1e-8&&m.s.phase<1){anchor=m.s.phase;base=m.s.distance-m.s.row;profile=SICKLE.id+'@'+anchor+','+base;this.bridgeKey=key;}
  else profile=SICKLE.id;
  m.s.animationProfile=profile;
  m.manualAnimation={id:profile,hitPhase:col=>sickleContact(m.cfg.cols,col).phase,approach:p=>anchor&&`${m.s.round}:${m.s.lane}:${m.s.row}`===key?base+(1-base)*Math.max(0,Math.min(1,(p-anchor)/(1-anchor))):p};
 }
 onCut(e:Cut,m:HarvestModel){
  const key=e.id.slice(0,e.id.lastIndexOf(':'));if(this.slashStroke===key)return;
  this.slashStroke=key;if(!this.slashEnabled)return;
  this.model=m;this.slashAt=m.s.activeSeconds;this.slashCount++;
  const a=sickleBlade(m.s.phase),b=sickleBlade(Math.min(.64,m.s.phase+.025));
  // This stroke travels right to left. Mirror the bright tip and align once to its tangent.
  this.slashNode.angle=Math.max(-35,Math.min(0,Math.atan2(b.y-a.y,b.x-a.x)*180/Math.PI-180));
 }
 cancelFeedback(){this.slashAt=-100;this.slashNode.active=false;this.slashAlpha.opacity=0;this.slashNode.setScale(-.8,1,1);}
 pose(phase:number){
  this.frame=sickleFrame(phase);if(this.ready)this.sprite.spriteFrame=this.frames[this.frame];
  const m=this.model;if(!m||m.state!=='Harvesting'||!this.slashEnabled){this.cancelFeedback();return;}
  const age=m.s.activeSeconds-this.slashAt;
  this.slashNode.active=this.ready&&age>=0&&age<.12;
  if(!this.slashNode.active)return;
  const p=sickleBlade(phase);this.slashNode.setPosition(p.x,p.y+12);this.slashNode.setScale(-(.8+.2*age/.12),1,1);
  this.slashAlpha.opacity=Math.round(255*(age<.02?age/.02:age<.05?1:Math.max(0,(.12-age)/.07)));
 }
}
