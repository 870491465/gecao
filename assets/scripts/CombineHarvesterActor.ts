import { Node,Sprite,SpriteFrame,UITransform,JsonAsset,resources,UIOpacity,Material,EffectAsset,Vec4 } from 'cc';
import { node,ink,ellipse } from './Art';
import { imageFrame } from './SwingAssets';
import { COMBINE,combineConfig,combineWorldY,combineFrame } from './CombineHarvesterConfig';
let shared:Promise<SpriteFrame[]>;
let headerEffect:Promise<EffectAsset>;
function loadHeaderEffect(){if(!headerEffect)headerEffect=new Promise((resolve,reject)=>resources.load('cat-combine-v01/wide-header',EffectAsset,(error,asset)=>error?reject(error):resolve(asset)));return headerEffect;}
function loadFrames(){
 if(!shared)shared=new Promise<any>((resolve,reject)=>resources.load('cat-combine-v01/animation',JsonAsset,(error,asset)=>error?reject(error):resolve(asset.json))).then(config=>{
  if(config.frameCount!==COMBINE.frames||config.fps!==COMBINE.fps||config.frameSize?.[0]!==COMBINE.width||config.frameSize?.[1]!==COMBINE.height||config.reelAxis?.center?.[0]!==384||config.reelAxis?.center?.[1]!==COMBINE.reelSourceY||config.wheelRegions?.length!==4)throw Error('Combine V01 animation configuration mismatch');
  return Promise.all(Array.from({length:COMBINE.frames},(_,i)=>imageFrame('cat-combine-v01/frames/combine_'+String(i).padStart(2,'0'))));
 }).then(frames=>{if(frames.some(f=>f.width!==COMBINE.width||f.height!==COMBINE.height))throw Error('Combine V01 frame canvas mismatch');return frames;});
 return shared;
}
export class CombineHarvesterActor {
 root:Node;upgradeHint:Node;sprite:Sprite;ready=false;error='';frames:SpriteFrame[]=[];frame=0;
 header:Sprite=null;materials:Material[]=[];
 constructor(parent:Node,public level=4){
  const c=combineConfig(level);
  for(const [x,y,r] of [[239,590,27],[529,590,27],[258,445,16],[508,445,16]]){const n=node('CombineWheelContactShadow',parent,(x-c.width/2)*c.scale,combineWorldY(y,level)-1);ellipse(ink(n),0,0,r*c.scale/COMBINE.scale,5*c.scale/COMBINE.scale,'#604928');n.addComponent(UIOpacity).opacity=55;}
  if(level>=5){const n=node('FullscreenHeader',parent,0,c.groundY),t=n.getComponent(UITransform);t.setAnchorPoint(.5,1-c.groundSourceY/c.height);t.setContentSize(c.width*c.scale*c.headerScaleX,c.height*c.scale);this.header=n.addComponent(Sprite);this.header.sizeMode=Sprite.SizeMode.CUSTOM;this.header.trim=false;}
  this.root=node(level>=5?'FullscreenCombineHarvesterV01':'CombineHarvesterV01',parent,0,c.groundY);const t=this.root.getComponent(UITransform);t.setAnchorPoint(.5,1-c.groundSourceY/c.height);t.setContentSize(c.width*c.scale,c.height*c.scale);
  this.upgradeHint=node('CombineUpgradeHint',parent,0,combineWorldY(c.reelSourceY,level)+140);
  this.sprite=this.root.addComponent(Sprite);this.sprite.sizeMode=Sprite.SizeMode.CUSTOM;this.sprite.trim=false;
  Promise.all([loadFrames(),level>=5?loadHeaderEffect():Promise.resolve(null)]).then(([frames,effect])=>{
   if(!this.root.isValid)return;this.frames=frames;
   if(effect){for(const [sprite,mode] of [[this.sprite,0],[this.header,1]] as [Sprite,number][]){const material=new Material();material.initialize({effectAsset:effect,defines:{USE_TEXTURE:true}});sprite.customMaterial=material;sprite.getMaterialInstance(0).setProperty('headerMode',new Vec4(mode,0,0,0));this.materials.push(material);}}
   this.ready=true;this.sprite.spriteFrame=frames[this.frame];if(this.header)this.header.spriteFrame=frames[this.frame];
  }).catch(error=>{this.error=String(error);console.error('Combine harvester V01',error);});
  this.root.on(Node.EventType.NODE_DESTROYED,()=>this.materials.forEach(m=>m.destroy()));
 }
 pose(rows:number,speed:number){this.frame=combineFrame(rows,speed);if(this.ready){this.sprite.spriteFrame=this.frames[this.frame];if(this.header)this.header.spriteFrame=this.frames[this.frame];}}
}
