import { Node,Sprite,SpriteFrame,UITransform,JsonAsset,resources,UIOpacity } from 'cc';
import { node,ink,ellipse } from './Art';
import { imageFrame } from './SwingAssets';
import { PUSH,pushFrame,pushFootContacts } from './PushHarvesterConfig';
let shared:Promise<SpriteFrame[]>;
function loadFrames(){
 if(!shared)shared=new Promise<any>((resolve,reject)=>resources.load('cat-push-color-v03/animation',JsonAsset,(error,asset)=>error?reject(error):resolve(asset.json))).then(config=>{
  if(config.frames!==PUSH.frames||config.fps!==PUSH.fps||config.frameSize?.[0]!==PUSH.width||config.frameSize?.[1]!==PUSH.height||!config.singleSprite||!config.loop||config.cuttingSpan?.[0]!==PUSH.cuttingSpan[0]||config.cuttingSpan?.[1]!==PUSH.cuttingSpan[1])throw Error('Push Color V03 animation configuration mismatch');
  return Promise.all(Array.from({length:PUSH.frames},(_,i)=>imageFrame('cat-push-color-v03/frames/push_'+String(i).padStart(2,'0'))));
 }).then(frames=>{if(frames.some(f=>f.width!==PUSH.width||f.height!==PUSH.height))throw Error('Push Color V03 frame canvas mismatch');return frames;});
 return shared;
}
export class PushHarvesterActor {
 root:Node;sprite:Sprite;ready=false;error='';frames:SpriteFrame[]=[];frame=0;bodyHeight=PUSH.catHeight;contactShadows:{node:Node;alpha:UIOpacity}[]=[];
 constructor(parent:Node){
  for(const [i,contact] of pushFootContacts(0).entries()){
   const n=node('PushFootContact'+i,parent,contact.x,contact.y),g=ink(n);ellipse(g,0,0,14,3.5,'#655037');ellipse(g,0,.5,9,2,'#493721');
   const alpha=n.addComponent(UIOpacity);alpha.opacity=contact.opacity;this.contactShadows.push({node:n,alpha});
  }
  this.root=node('PushHarvesterColorV03',parent,0,PUSH.feetY);
  const t=this.root.getComponent(UITransform);t.setAnchorPoint(.5,1-PUSH.feetSourceY/PUSH.height);t.setContentSize(PUSH.width*PUSH.scale,PUSH.height*PUSH.scale);
  this.sprite=this.root.addComponent(Sprite);this.sprite.sizeMode=Sprite.SizeMode.CUSTOM;this.sprite.trim=false;
  loadFrames().then(frames=>{if(!this.root.isValid)return;this.frames=frames;this.ready=true;this.sprite.spriteFrame=frames[this.frame];}).catch(error=>{this.error=String(error);console.error('Push Color V03',error);});
 }
 pose(rows:number,speed:number){
  this.frame=pushFrame(rows,speed);if(this.ready)this.sprite.spriteFrame=this.frames[this.frame];
  pushFootContacts(this.frame).forEach((contact,i)=>{const shadow=this.contactShadows[i];shadow.node.setPosition(contact.x,contact.y);shadow.alpha.opacity=contact.opacity;});
 }
}
