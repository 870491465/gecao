import { Node, Sprite, SpriteFrame, UITransform } from 'cc';
import { node } from './Art';
import { imageFrame } from './SwingAssets';

// Supplied OrangeCat_Upgrade_FX_V01 timeline, in seconds.
export const UPGRADE_FX={duration:4.44,swap:.58,fps:20,frames:89,groundY:-205};
export class UpgradeFX {
 root:Node;sprite:Sprite;frames:SpriteFrame[]=[];ready=false;error='';
 active=false;elapsed=0;swapped=false;frame=0;
 constructor(parent:Node){
  this.root=node('UpgradeFXV01',parent);this.root.active=false;
  this.sprite=this.root.addComponent(Sprite);this.sprite.sizeMode=Sprite.SizeMode.CUSTOM;this.sprite.trim=false;
  Promise.all(Array.from({length:UPGRADE_FX.frames},(_,i)=>imageFrame('upgrade-fx-v01/frames/upgrade_'+String(i).padStart(3,'0')))).then(frames=>{
   if(!this.root.isValid)return;
   if(frames.some(f=>f.width!==512||f.height!==512))throw Error('Upgrade FX canvas mismatch');
   this.frames=frames;this.ready=true;
  }).catch(e=>{this.error=String(e);console.error('Upgrade FX V01',e);});
 }
 start(level:number){
  this.active=true;this.elapsed=0;this.swapped=false;this.frame=0;
  // Center the full untrimmed effects on the equipment, with room for the rings.
  const size=level>=5?900:level===2?440:level===3?680:720;
  this.root.getComponent(UITransform).setContentSize(size,size);
  this.root.setPosition(0,level>=5?130:level===2?-35:level===3?25:45);
  this.root.active=true;this.sprite.spriteFrame=this.frames[0];
 }
 tick(dt:number,onSwap:()=>void){
  if(!this.active)return;
  this.elapsed+=dt;
  if(!this.swapped&&this.elapsed+1e-8>=UPGRADE_FX.swap){this.swapped=true;onSwap();}
  this.frame=Math.min(UPGRADE_FX.frames-1,Math.floor(this.elapsed*UPGRADE_FX.fps+1e-8));
  // The flash's first sampled frame is at .60; display it at the .58 swap cue.
  if(this.swapped&&this.frame===11)this.frame=12;
  this.sprite.spriteFrame=this.frames[this.frame];
  if(this.elapsed+1e-8>=UPGRADE_FX.duration)this.clear();
 }
 bounce(actor:Node){
  const age=this.elapsed-UPGRADE_FX.swap;
  const scale=this.active&&this.swapped&&age<1.4?1+.08*Math.exp(-age*5)*Math.sin(age*15):1;
  actor.setScale(scale,scale,1);
  actor.setPosition(0,UPGRADE_FX.groundY*(1-scale));
 }
 clear(){this.active=false;this.root.active=false;}
}
