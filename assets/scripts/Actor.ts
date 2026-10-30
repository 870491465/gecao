import { Node, Graphics,UIOpacity } from 'cc';
import { node,ink,ellipse,box,line,poly } from './Art';
import { LevelConfig, RULES } from './Config';
import { CatPartsActor } from './CatPartsActor';
import { CAT_MOTION } from './CatMotion';
import { amplitudeForRow,gaitPhase } from './CatWalk';
 import { MANUAL } from './ManualSickle';
import { HybridCatActor } from './HybridCatActor';
import { HarvestModel,Cut } from './HarvestModel';
import { PushHarvesterActor } from './PushHarvesterActor';
import { RideHarvesterActor } from './RideHarvesterActor';
import { CombineHarvesterActor } from './CombineHarvesterActor';
// All animation pivots are explicit. Replace Graphics children with Sprite children; retain these nodes.
export class Actor {
 root:Node;body:Node;arm:Node;tool:Node;tail:Node;legs:Node[]=[];wheels:Node[]=[];disc:Node;roller:Graphics;machine:Node;level=0;parts:CatPartsActor=null;
 hybrid:HybridCatActor=null;push:PushHarvesterActor=null;ride:RideHarvesterActor=null;combine:CombineHarvesterActor=null;
 get ready(){return this.hybrid?this.hybrid.ready:this.push?this.push.ready:this.ride?this.ride.ready:this.combine?this.combine.ready:true;}
 prepare(m:HarvestModel){if(this.hybrid)this.hybrid.prepare(m);else m.manualAnimation=null;}
 onCut(e:Cut,m:HarvestModel){this.hybrid?.onCut(e,m);}
 constructor(parent:Node){this.root=node('ActorAnchor',parent);}
 build(c:LevelConfig){
  for(const child of [...this.root.children])child.destroy();this.root.removeAllChildren();this.legs=[];this.wheels=[];this.disc=null;this.roller=null;this.parts=null;this.level=c.level;
  this.hybrid=null;this.push=null;this.ride=null;this.combine=null;
  if(c.level>=4){this.combine=new CombineHarvesterActor(this.root,c.level);this.body=this.combine.root;return;}
  if(c.level===3){this.ride=new RideHarvesterActor(this.root);this.body=this.ride.root;return;}
  if(c.level===2){this.push=new PushHarvesterActor(this.root);this.body=this.push.root;return;}
  if(c.level===1){
   const shadow=ink(node('GroundShadow',this.root,0,MANUAL.feetY+2));ellipse(shadow,0,0,61,10,'#5d4528');shadow.node.addComponent(UIOpacity).opacity=70;
   this.hybrid=new HybridCatActor(this.root,c.level);this.parts=this.hybrid.parts;
   if(this.hybrid.sickle){this.body=this.hybrid.sickle.root;this.arm=null;this.tool=null;this.tail=null;return;}
   this.body=this.hybrid.v03.torso;this.arm=this.hybrid.v03.armPivot;this.tool=this.hybrid.v03.tool;this.tail=this.parts.tail;this.parts.pose(0,true);return;
  }
  const shadow=ink(node('GroundShadow',this.root,0,-277));ellipse(shadow,0,0,c.level===1?79:c.width/2,24,'#69814c');
  for(const x of [-30,30]){const n=node('Leg'+x,this.root,x,-305);box(ink(n),-18,-7,36,28,13,'#b56227');this.legs.push(n);}
  this.tail=node('TailPivot',this.root,43,-274);const t=ink(this.tail);line(t,[[0,0],[35,-4],[54,10],[55,34]],'#bc652b',23);line(t,[[0,5],[33,1],[48,14],[48,31]],'#f4a342',15);
  this.body=node('BodyPivot',this.root,0,-260);const b=ink(this.body);ellipse(b,0,-5,61,65,'#bc702f');ellipse(b,-3,3,56,61,'#ed963b');ellipse(b,-15,20,30,34,'#ffb751');
  for(let i=0;i<3;i++)line(b,[[-26+i*24,25],[-20+i*21,8]],'#c5752d',8);
  const head=ink(node('HeadBack',this.body,0,60));poly(head,[[-47,13],[-44,57],[-14,35]],'#db842e');poly(head,[[47,13],[44,57],[14,35]],'#db842e');poly(head,[[-40,30],[-39,48],[-26,34]],'#efb088');poly(head,[[40,30],[39,48],[26,34]],'#efb088');ellipse(head,0,10,52,39,'#f9ad46');ellipse(head,-14,21,28,19,'#ffbc58');line(head,[[-13,40],[-9,26]],'#c87930',7);line(head,[[12,40],[9,26]],'#c87930',7);
  const left=ink(node('LeftArm',this.root,-49,-233));ellipse(left,0,0,17,28,'#f0a040');
  this.arm=node('ShoulderPivot',this.root,RULES.shoulderX,RULES.shoulderY);
  const hand=ink(node('Arm',this.arm,0,0));box(hand,-13,-10,26,56,12,'#f5a546');
  this.tool=node('GripPivot',this.arm,0,0);const g=ink(this.tool);
  this.tool.active=false;this.buildMachine(c);this.arm.setPosition(56,-228);
 }
 private buildMachine(c:LevelConfig){
  this.machine=node('MachineChassis',this.root);this.machine.setSiblingIndex(1);const w=c.width;
  for(const x of [-w/2+23,w/2-23]){const n=node('WheelPivot',this.machine,x,-237);const g=ink(n);box(g,-17,-35,34,70,12,'#344c45');box(g,-10,-26,20,52,8,'#526a5c');this.wheels.push(n);}
  const body=ink(node('Chassis',this.machine,0,-212));box(body,-w/2+34,-58,w-68,112,26,c.level===2?'#4e9aa1':c.level===3?'#c96846':'#daaa40');box(body,-w/2+43,-22,w-86,66,19,c.level===2?'#72c1b9':c.level===3?'#e88e5c':'#f1ca5c');
  if(c.level>2){box(body,-61,-39,122,78,18,'#486d74');box(body,-49,0,98,31,12,'#9cd2c7');this.body.setPosition(0,-245);this.body.setScale(0.85,0.85);this.body.getComponent(Graphics).enabled=false;this.legs.forEach(n=>n.active=false);this.tail.setPosition(50,-235);}
  else{line(body,[[-56,-10],[-54,-72]],'#52665a',9);line(body,[[56,-10],[54,-72]],'#52665a',9);}
  const tray=ink(node('HeaderHousing',this.machine,0,-119));box(tray,-w/2-10,-21,w+20,68,16,'#496258');box(tray,-w/2-4,-9,w+8,53,13,'#e5b854');
  if(c.level===2){const plane=node('DiscProjection',this.machine,0,-103);plane.setScale(1,0.38);this.disc=node('DiscRotation',plane);const d=ink(this.disc);ellipse(d,0,0,w/2-14,w/2-14,'#92aaa0');for(let i=0;i<4;i++){const a=i*Math.PI/2;line(d,[[0,0],[Math.cos(a)*(w/2-15),Math.sin(a)*(w/2-15)]],'#e1e6cb',12);}ellipse(d,0,0,16,16,'#d99147');}
  else this.roller=ink(node('RollerFlipFrames',this.machine,0,-100));
 }
 animate(c:LevelConfig,phase:number,travel:number,workTime:number,continuousRows=travel){
  if(this.combine){this.combine.pose(continuousRows,c.speed);return;}
  if(this.ride){this.ride.pose(continuousRows,c.speed);return;}
  if(this.push){this.push.pose(continuousRows,c.speed);return;}
  if(c.level===1){this.hybrid.pose(phase,continuousRows);}
  else {
   this.wheels.forEach(n=>{const g=n.getComponent(Graphics);g.clear();box(g,-17,-35,34,70,12,'#344c45');for(let i=0;i<5;i++){const y=((i*15+travel*46)%75)-36;line(g,[[-13,y],[13,y]],'#8a9b82',4);}});
   if(this.disc&&this.disc.isValid)this.disc.angle=workTime*480;
   if(this.roller&&this.roller.isValid){const g=this.roller;g.clear();box(g,-c.width/2+7,-17,c.width-14,34,10,'#876431');for(let i=0;i<5;i++){const a=workTime*12+i*Math.PI*2/5;const y=Math.sin(a)*16;line(g,[[-c.width/2+12,y],[c.width/2-12,y]],Math.cos(a)>0?'#efd18a':'#b98a40',Math.cos(a)>0?5:2);}}
   this.body.angle=Math.sin(workTime*10)*0.6;
  }
 }
}
