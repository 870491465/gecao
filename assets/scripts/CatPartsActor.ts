import { Node,Sprite,SpriteFrame,Texture2D,ImageAsset,UITransform,Rect,Size,Vec2,resources } from 'cc';
import { node } from './Art';
import { CAT_PARTS } from './CatPartsConfig';
import { catArmAngle } from './CatMotion';
import { sampleGait,WALK } from './CatWalk';
let framesPromise:Promise<Map<string,SpriteFrame>>;
function frames(){
 if(!framesPromise)framesPromise=Promise.all(CAT_PARTS.parts.map(p=>new Promise<[string,SpriteFrame]>((resolve,reject)=>{
  resources.load('cat-walk-v02/'+p.file.replace(/\.png$/,''),ImageAsset,(error,image)=>{
   if(error){reject(error);return;}
   const texture=new Texture2D();texture.image=image;
   const frame=new SpriteFrame();frame.texture=texture;frame.rect=new Rect(0,0,p.size_px[0],p.size_px[1]);frame.originalSize=new Size(p.size_px[0],p.size_px[1]);frame.offset=new Vec2(0,0);
   resolve([p.name,frame]);
  });
 }))).then(entries=>new Map(entries));
 return framesPromise;
}
/** Original full PNG extents, explicit anchors and documented back-to-front node order. */
export class CatPartsActor {
 root:Node;upper:Node;parts=new Map<string,Node>();body:Node;arm:Node;left:Node;tail:Node;leftLeg:Node;rightLeg:Node;ready=false;error='';
 constructor(parent:Node){
  this.root=node('CatRoot',parent);
  // Legs stay below the single upper-body group; all configured coordinates remain local base coordinates.
  this.upper=node('UpperBodyMotion',this.root);
  [...CAT_PARTS.parts].sort((a,b)=>a.draw_order_back_to_front-b.draw_order_back_to_front).forEach(p=>{
   const isLeg=p.name==='cat_leg_left'||p.name==='cat_leg_right';const n=node(p.name,isLeg?this.root:this.upper,p.position_from_feet_root_y_up[0],p.position_from_feet_root_y_up[1]);const t=n.getComponent(UITransform);
   t.setAnchorPoint(p.anchor_normalized_bottom_left[0],p.anchor_normalized_bottom_left[1]);t.setContentSize(p.size_px[0],p.size_px[1]);n.setScale(p.local_scale,p.local_scale,1);
   const sprite=n.addComponent(Sprite);sprite.sizeMode=Sprite.SizeMode.CUSTOM;sprite.trim=false;this.parts.set(p.name,n);
  });
  this.upper.setSiblingIndex(this.root.children.length-1);
  this.body=this.parts.get('cat_body');this.leftLeg=this.parts.get('cat_leg_left');this.rightLeg=this.parts.get('cat_leg_right');this.arm=this.parts.get('cat_right_arm_sickle');this.left=this.parts.get('cat_left_arm');this.tail=this.parts.get('cat_tail');
  frames().then(loaded=>{if(!this.root.isValid)return;this.parts.forEach((n,key)=>n.getComponent(Sprite).spriteFrame=loaded.get(key));this.ready=true;}).catch(e=>{this.error=String(e);console.error('Cat parts failed to load',e);});
 }
 pose(phase:number,staticPose=false,walkPhase=WALK.stancePhase,amplitude=12,walkOnly=false){
  const gait=sampleGait(walkPhase,amplitude);
  this.body.angle=0;this.body.setPosition(0,0);this.body.setScale(1,1,1);
  this.upper.setPosition(0,staticPose?0:gait.upperBodyYOffset);
  for(const [n,key,offset] of [[this.leftLeg,'cat_leg_left',gait.leftFootYOffset],[this.rightLeg,'cat_leg_right',gait.rightFootYOffset]] as [Node,string,number][]){const cfg=CAT_PARTS.parts.find(p=>p.name===key);n.setPosition(cfg.position_from_feet_root_y_up[0],cfg.position_from_feet_root_y_up[1]+(staticPose?0:offset));n.angle=0;n.setScale(cfg.local_scale,cfg.local_scale,1);}
  this.arm.angle=staticPose||walkOnly?0:catArmAngle(phase);
  const coordination=walkOnly?walkPhase:phase;
  this.left.angle=staticPose?0:-Math.sin(coordination*Math.PI*2)*2;
  this.tail.angle=staticPose?0:Math.sin(coordination*Math.PI*2)*3;
 }
}
