import { Node, Graphics, NodePool, Label,UITransform,Sprite } from 'cc';
import { HarvestModel, Cut } from './HarvestModel';
import { LEVELS, RULES, columnX,cutY,fieldCenter,fieldWidth,rowSpacing,continuousRows } from './Config';
import { node,ink,ellipse,line,poly,box,text } from './Art';
import { GrassSkin } from './GrassSkin';
import { grassVariant } from './GrassLayout';
import { GRASS } from './GrassLayout';
import { color } from './Art';
import { V03 } from './V03Motion';
import { PUSH,pushBunch,pushStubbleScale } from './PushHarvesterConfig';
import { RIDE,rideBunch } from './RideHarvesterConfig';
import { combineConfig,combineBunch } from './CombineHarvesterConfig';
import { RICE } from './RiceConfig';
import { Haystacks } from './Haystacks';
export class Field {
 root:Node;foreground:Node;cropLayer:Node;skin:GrassSkin;ground:Graphics;debugInk:Graphics;pool=new NodePool();cells=new Map<string,{n:Node;cut:boolean;born:number;row:number;col:number;artKey:string}>();time=0;debug=false;ids:Label;signature='';
 debrisEnabled=true;rice=false;
 sortPasses=0;layoutWrites=0;
 haystacks:Haystacks;
 get ready(){return this.skin.ready&&(!this.rice||this.skin.riceReady);}
 constructor(parent:Node){this.root=node('ScrollingField',parent);this.foreground=node('FieldForeground',parent);this.ground=ink(node('GroundFallback',this.root));this.skin=new GrassSkin(this.root,this.foreground);this.cropLayer=node('VisibleCropRows',this.root);this.haystacks=new Haystacks(this.root);this.debugInk=ink(node('HitArea',this.root));this.ids=text(this.root,'CellIDs','',0,360,13,650,80);this.ids.node.active=false;}
 cut(e:Cut){const v=this.cells.get(e.id);if(!v||v.cut)return;v.cut=true;v.born=this.time;const level=Number(e.id.split(':')[0]),c=LEVELS[level-1];if(this.debrisEnabled){this.skin.emit(columnX(c,e.col),cutY(c,e.col),e.row*7+e.col*11,level===1?1:1.5,level>=6);if(level>=4)this.skin.discharge();}}
 clear(){this.cells.forEach(v=>{this.skin.reset(v.n);this.pool.put(v.n);});this.cells.clear();this.skin.clearFeedback();this.haystacks.clear();}
 drawPlant(g:Graphics,level:number,cut:boolean,age:number){
  const c=LEVELS[level-1];g.clear();ellipse(g,0,-1,22,8,'#779653');
  if(cut){for(let i=-2;i<=2;i++)line(g,[[i*7,-1],[i*7+1,7]],'#c3c77a',3);
   if(age<0.22){const k=age/.22;poly(g,[[-18,6],[13+32*k,14],[20+40*k,c.height*(1-k)+12],[-6,27]],c.color);}return;
  }
  for(let i=-2;i<=2;i++){const x=i*7,h=c.height-Math.abs(i)*4;line(g,[[x,0],[x+i*3,h]],level>2?'#a2a04f':'#397e42',3);
   if(level===1)poly(g,[[x,1],[x-12,h*.5],[x-8,h],[x+2,h*.48],[x+10,h*.76],[x+7,3]],c.color);
   else if(level===2){ellipse(g,x-4,h*.55,8,5,c.color);ellipse(g,x+5,h*.72,9,6,'#9cbe69');ellipse(g,x,h,5,6,'#b18bc1');}
   else {for(let j=0;j<4;j++){ellipse(g,x-3+j*.8,h-4-j*5,4,6,c.color);ellipse(g,x+4+j*.8,h-7-j*5,4,5,level===3?'#f6d575':'#d5d98a');}}
  }
 }
 update(m:HarvestModel,dt:number){
  this.rice=m.s.level>=6;if(this.rice)this.skin.ensureRice();
  this.time+=dt;const s=m.s,c=m.cfg,key=`${s.level}:${s.round}:${s.lane}`;
  if(this.signature!==key){this.clear();this.signature=key;}
  const center=fieldCenter(c),width=fieldWidth(c),space=rowSpacing(c);
  const g=this.ground;this.skin.ground.active=this.skin.ready;g.enabled=!this.skin.ready;
  if(!this.skin.ready){g.clear();box(g,-360,-440,720,920,1,'#87ab63');box(g,center-width/2-14,-435,width+28,900,17,'#8d9b5c');}
  this.skin.groundLayout(center,width,continuousRows(c,s.round,s.lane,s.distance)*space);this.skin.tick(dt);if(this.debrisEnabled)this.skin.spray(dt,s.level);
  if(this.rice&&!this.skin.riceReady)return;
  let sortDirty=false;const wanted=new Set<string>();const first=Math.max(0,Math.floor(s.distance)-(c.level===1?22:18)),last=Math.min(c.rows-1,Math.ceil(s.distance)+(c.level===1?Math.ceil((650-cutY(c,0))/space)+1:13));
  for(let r=first;r<=last;r++)for(let col=0;col<c.cols;col++){
   const id=`${key}:${r}:${col}`;wanted.add(id);const cut=r<s.row||(r===s.row&&!!(s.mask&(1<<col)));
   let v=this.cells.get(id);if(!v){const n=this.pool.size()?this.pool.get():node('Crop',this.cropLayer);n.parent=this.cropLayer;n.name=id;this.skin.reset(n);v={n,cut,born:-100,row:r,col,artKey:''};this.cells.set(id,v);sortDirty=true;if(!this.skin.ready){if(!n.getComponent(Graphics))ink(n);this.drawPlant(n.getComponent(Graphics),s.level,cut,1);}}
   if(cut!==v.cut){v.cut=cut;v.born=this.time;}
   const age=this.time-v.born,push=s.level===2,ride=s.level===3,combine=s.level>=4,machineGrass=push||ride||combine,bunch=push?pushBunch(col,c.cols):ride?rideBunch(col,c.cols):combine?combineBunch(col,c.cols,c.level):null;
   const spriteGrass=this.skin.ready,graphics=v.n.getComponent(Graphics);if(graphics)graphics.enabled=!spriteGrass;this.skin.plant(v.n,grassVariant(r,machineGrass?bunch.bunch:0,s.round,s.lane),cut,age,true,this.rice);
   if(spriteGrass){const visual=this.skin.plants.get(v.n),artKey=s.level+':'+visual.variant+':'+visual.state;
    if(v.artKey!==artKey){v.artKey=artKey;this.layoutWrites++;const canvas=(push?PUSH.grassCanvas:ride?RIDE.grassCanvas:combine?combineConfig(c.level).grassCanvas:V03.grassCanvas[0])*(visual.state==='stubble'?(push?.9:(ride||combine)?pushStubbleScale(visual.variant):1):1);visual.node.getComponent(UITransform).setContentSize(this.rice?RICE.width:canvas,this.rice?RICE.height:canvas);visual.sprite.color=color('#ffffff');
    // Each bunch uses disjoint horizontal slices, so partial saves never overlap.
    visual.sprite.type=Sprite.Type.FILLED;visual.sprite.fillType=Sprite.FillType.HORIZONTAL;visual.sprite.fillStart=machineGrass?bunch.slice/bunch.slices:col/c.cols;visual.sprite.fillRange=machineGrass?1/bunch.slices:1/c.cols;
    visual.node.setPosition((machineGrass?bunch.center:center)-columnX(c,col),cutY(c,Math.floor(c.cols/2))-cutY(c,col));
    }
   }
   if(!spriteGrass){if(cut&&age<.3)this.drawPlant(v.n.getComponent(Graphics),s.level,true,age);else if(cut&&age<.35)this.drawPlant(v.n.getComponent(Graphics),s.level,true,1);}
   const y=(r+(c.level>=2?1:0)-s.distance)*space+cutY(c,col);
   const depthLine=c.level===1?-213:-305;
   // Cut ground stays behind the cat; passing the soles must not promote it
   // into the foreground and suddenly cover the feet.
   const parent=machineGrass&&cut?this.cropLayer:y<depthLine?this.foreground:this.cropLayer;if(v.n.parent!==parent){v.n.parent=parent;sortDirty=true;}const x=columnX(c,col);if(v.n.position.x!==x||v.n.position.y!==y)v.n.setPosition(x,y);const scale=spriteGrass?1:c.level===1?.45:1;if(v.n.scale.x!==scale||v.n.scale.y!==scale)v.n.setScale(scale,scale,1);v.n.active=y<650&&y>-640;
  }
  this.cells.forEach((v,id)=>{if(!wanted.has(id)){this.pool.put(v.n);this.cells.delete(id);sortDirty=true;}});
  if(sortDirty){this.sortPasses++;for(const parent of [this.cropLayer,this.foreground]){const sorted=Array.from(this.cells.values()).filter(v=>v.n.parent===parent).sort((a,b)=>b.n.position.y-a.n.position.y||a.col-b.col);sorted.forEach((v,i)=>v.n.setSiblingIndex(i));}this.skin.fxRoot.setSiblingIndex(this.foreground.children.length-1);}
  this.haystacks.update(m);
  // One coordinate defines both geometry and hit events. Debug path shows the blade contact arc.
  const d=this.debugInk;d.enabled=this.debug;this.ids.node.active=this.debug;
  if(this.debug){d.clear();for(let col=0;col<c.cols;col++){ellipse(d,columnX(c,col),cutY(c,col),7,5,'#ff795d');}line(d,[[center-width/2,cutY(c,0)],[center+width/2,cutY(c,c.cols-1)]],'#fff5b8',2);this.ids.string=`${key} : 行 ${s.row} : mask ${s.mask.toString(2)}\n${Array.from(this.cells.keys()).filter(id=>id.startsWith(key+':'+s.row+':')).join('  ')}`;this.debugInk.node.setSiblingIndex(this.root.children.length-1);this.ids.node.setSiblingIndex(this.root.children.length-1);}
 }
}
