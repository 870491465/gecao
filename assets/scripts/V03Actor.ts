import { Node,Sprite,SpriteFrame,UITransform,isValid } from 'cc';
import { node } from './Art';
import { imageFrame } from './SwingAssets';
import { V03,COMBINED,LEFT_ARM,v03Pose,v03ToolScale,v03LeftArm,v03LeftArmScale } from './V03Motion';
import { CatPartsActor } from './CatPartsActor';
import { CAT_PARTS } from './CatPartsConfig';
let frames:Promise<Map<string,SpriteFrame>>;
function load(){if(!frames)frames=Promise.all(['cat_torso','cat_head','cat_right_arm_sickle'].map(async(name):Promise<[string,SpriteFrame]>=>[name,await imageFrame(name==='cat_right_arm_sickle'?COMBINED.file:'cat-swing-v03/'+name)])).then(a=>new Map(a));return frames;}
/** One original Walk V02 right-arm sprite. No extra upper arm, crop or deformation. */
export class V03Actor {
 root:Node;armPivot:Node;wrist:Node;grip:Node;toolRotation:Node;tool:Node;torsoPivot:Node;torso:Node;head:Node;overlay:Node;ready=false;error='';sprites=new Map<string,Node>();lastPose:ReturnType<typeof v03Pose>;
 constructor(parent:Node,public legacy:CatPartsActor,public level=1){
  this.root=node('LayeredUpperBodyMotion',parent);this.armPivot=node('WalkV02RightArmPivot',this.root);this.toolRotation=this.armPivot;
  const part=(name:string,parent:Node,size:number[],pivot:number[],scale:number)=>{const n=node(name,parent);n.getComponent(UITransform).setAnchorPoint(pivot[0]/size[0],1-pivot[1]/size[1]);n.getComponent(UITransform).setContentSize(size[0],size[1]);n.setScale(scale,scale,1);const s=n.addComponent(Sprite);s.sizeMode=Sprite.SizeMode.CUSTOM;s.trim=false;this.sprites.set(name,n);return n;};
  this.tool=part('cat_right_arm_sickle',this.armPivot,COMBINED.size,COMBINED.pivot,v03ToolScale(level));
  this.wrist=node('PaintedWristMarker',this.tool);this.wrist.setPosition(COMBINED.wrist[0]-COMBINED.pivot[0],COMBINED.pivot[1]-COMBINED.wrist[1]);
  this.grip=node('PaintedGripMarker',this.tool);this.grip.setPosition(COMBINED.grip[0]-COMBINED.pivot[0],COMBINED.pivot[1]-COMBINED.grip[1]);
  legacy.left.parent=this.root;legacy.left.setSiblingIndex(0);
  legacy.left.getComponent(UITransform).setAnchorPoint(LEFT_ARM.pivot[0]/557,1-LEFT_ARM.pivot[1]/311);
  legacy.left.setScale(v03LeftArmScale(level),v03LeftArmScale(level),1);
  this.torsoPivot=node('TorsoPivot',this.root,0,V03.hipY);this.torso=part('cat_torso',this.torsoPivot,[705,560],[352,465],V03.torsoScale);this.head=part('cat_head',this.root,[604,451],[305,399],V03.headScale);this.overlay=node('TailOverlay',this.root);
  legacy.body.active=false;legacy.arm.active=false;const tailCfg=CAT_PARTS.parts.find(p=>p.name==='cat_tail');legacy.tail.parent=this.overlay;legacy.tail.setPosition(tailCfg.position_from_feet_root_y_up[0]*V03.legacyScale,tailCfg.position_from_feet_root_y_up[1]*V03.legacyScale);legacy.tail.setScale(tailCfg.local_scale*V03.legacyScale,tailCfg.local_scale*V03.legacyScale,1);
  load().then(map=>{if(!isValid(this.root,true))return;this.sprites.forEach((n,key)=>n.getComponent(Sprite).spriteFrame=map.get(key));this.ready=true;}).catch(e=>{this.error=String(e);console.error('Cat rig assets',e);});this.pose(0,V03.stanceBob);
 }
 pose(phase:number,bob:number,gait=.25){
  const p=this.lastPose=v03Pose(phase,this.level);this.root.setPosition(0,bob);this.torsoPivot.angle=p.bodyAngle;
  const a=p.bodyAngle*Math.PI/180,nx=10*V03.torsoScale,ny=415*V03.torsoScale;this.head.setPosition(nx*Math.cos(a)-ny*Math.sin(a),V03.hipY+nx*Math.sin(a)+ny*Math.cos(a));this.head.angle=p.bodyAngle*.1;
  const lx=-245*V03.torsoScale,ly=335*V03.torsoScale;this.legacy.left.setPosition(lx*Math.cos(a)-ly*Math.sin(a),V03.hipY+lx*Math.sin(a)+ly*Math.cos(a));this.legacy.left.angle=p.bodyAngle+v03LeftArm(phase,gait);
  this.armPivot.setPosition(p.attachment.x,p.attachment.y);this.armPivot.angle=p.toolAngle;
 }
}
