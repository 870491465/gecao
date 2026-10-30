import { Node,Sprite,SpriteFrame,UITransform,JsonAsset,resources,UIOpacity } from 'cc';
import { node,ink,ellipse } from './Art';
import { imageFrame } from './SwingAssets';
import { RIDE,rideWorldY,rideFrame } from './RideHarvesterConfig';
let shared:Promise<SpriteFrame[]>;
function loadFrames(){
 if(!shared)shared=new Promise<any>((resolve,reject)=>resources.load('cat-ride-v02/animation',JsonAsset,(error,asset)=>error?reject(error):resolve(asset.json))).then(config=>{
  if(config.frames!==RIDE.frames||config.fps!==RIDE.fps||config.frameSize?.[0]!==RIDE.width||config.frameSize?.[1]!==RIDE.height||config.anchorNormalized?.[0]!==RIDE.anchorX||config.anchorNormalized?.[1]!==RIDE.anchorY)throw Error('Ride V02 animation configuration mismatch');
  return Promise.all(Array.from({length:RIDE.frames},(_,i)=>imageFrame('cat-ride-v02/frames/ride_'+String(i).padStart(2,'0'))));
 }).then(frames=>{if(frames.some(f=>f.width!==RIDE.width||f.height!==RIDE.height))throw Error('Ride V02 frame canvas mismatch');return frames;});
 return shared;
}
export class RideHarvesterActor {
 root:Node;sprite:Sprite;upgradeHint:Node;ready=false;error='';frames:SpriteFrame[]=[];frame=0;
 constructor(parent:Node){
  for(const [x,y,r] of [[263,575,25],[505,575,25],[269,435,15],[499,435,15]]){const n=node('RideWheelContactShadow',parent,(x-RIDE.width/2)*RIDE.scale,rideWorldY(y)-1);ellipse(ink(n),0,0,r,5,'#604928');n.addComponent(UIOpacity).opacity=55;}
  this.root=node('RideHarvesterV02',parent,0,rideWorldY(RIDE.height*RIDE.anchorY));const t=this.root.getComponent(UITransform);t.setAnchorPoint(RIDE.anchorX,1-RIDE.anchorY);t.setContentSize(RIDE.width*RIDE.scale,RIDE.height*RIDE.scale);
  this.sprite=this.root.addComponent(Sprite);this.sprite.sizeMode=Sprite.SizeMode.CUSTOM;this.sprite.trim=false;
  this.upgradeHint=node('RideUpgradeHint',parent,0,rideWorldY(RIDE.frontSourceY)+140);
  loadFrames().then(frames=>{if(!this.root.isValid)return;this.frames=frames;this.ready=true;this.sprite.spriteFrame=frames[this.frame];}).catch(error=>{this.error=String(error);console.error('Ride harvester V02',error);});
 }
 pose(rows:number,speed:number){this.frame=rideFrame(rows,speed);if(this.ready)this.sprite.spriteFrame=this.frames[this.frame];}
}
