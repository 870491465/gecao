import { Node,Sprite,SpriteFrame,UITransform,Graphics } from 'cc';
import { node } from './Art';
import { EQUIPMENT_KEYS,equipmentFrames } from './EquipmentUIAssets';
import { equipmentIcon } from './EquipmentIcon';
/** Static UI illustration only; never used as scene machinery or animation. */
export class EquipmentArt {
 root:Node;ready=false;level=1;frames:Map<string,SpriteFrame>;drawn=0;
 constructor(parent:Node,public fallback:Graphics,width:number,height:number){
  this.root=node('EquipmentIllustration',parent);this.root.getComponent(UITransform).setContentSize(Math.min(width,height),Math.min(width,height));const s=this.root.addComponent(Sprite);s.sizeMode=Sprite.SizeMode.CUSTOM;s.trim=false;this.root.active=false;
  equipmentFrames().then(f=>{if(!this.root.isValid)return;this.frames=f;this.ready=true;this.setLevel(this.level);}).catch(e=>console.error('Equipment UI images',e));
 }
 setLevel(level:number){this.level=level;if(this.ready){this.root.active=true;this.root.getComponent(Sprite).spriteFrame=this.frames.get(EQUIPMENT_KEYS[level-1]);this.fallback.enabled=false;}else{this.fallback.enabled=true;if(this.drawn!==level){this.fallback.clear();equipmentIcon(this.fallback,level);this.drawn=level;}}}
}
