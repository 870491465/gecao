import { Node,Sprite,SpriteFrame,Rect,Size,Vec2,UITransform,UIOpacity,isValid } from 'cc';
import { node } from './Art';
import { imageFrame } from './SwingAssets';
import { HarvestModel } from './HarvestModel';
import { fieldCenter,fieldWidth,rowSpacing,cutY } from './Config';
let shared:Promise<SpriteFrame>;
function load(){if(!shared)shared=imageFrame('grass-batch02/grass_heap').then(source=>{
 // Ignore transparent canvas margins without changing the supplied PNG.
 const frame=new SpriteFrame();frame.texture=source.texture;frame.rect=new Rect(100,315,1060,645);frame.originalSize=new Size(1060,645);frame.offset=new Vec2(0,0);frame.name='grass_heap';return frame;
});return shared;}
export class Haystacks {
 root:Node;frame:SpriteFrame;error='';pool:{n:Node;t:UITransform;alpha:UIOpacity}[]=[];
 constructor(parent:Node){this.root=node('HarvestedHaystacks',parent);load().then(frame=>{if(isValid(this.root,true))this.frame=frame;}).catch(e=>{this.error=String(e);console.error('Haystack',e);});}
 clear(){for(const v of this.pool)v.n.active=false;}
 update(m:HarvestModel){
  if(!this.frame){this.clear();return;}const s=m.s,c=m.cfg,space=rowSpacing(c),width=fieldWidth(c),center=fieldCenter(c);let count=0;
  const first=Math.max(0,Math.floor(s.distance)-26),last=Math.min(c.rows-1,s.row-1);
  for(let r=first;r<=last;r++){
   // One small pile every five fully cut rows; stable placement also after reload.
   if(r%5!==2)continue;const y=(r+(c.level>=2?1:0)-s.distance)*space+cutY(c,Math.floor(c.cols/2));if(y> -250||y< -680)continue;
   let v=this.pool[count];if(!v){const n=node('Haystack',this.root),t=n.getComponent(UITransform);t.setAnchorPoint(.5,.08);const sprite=n.addComponent(Sprite);sprite.sizeMode=Sprite.SizeMode.CUSTOM;sprite.trim=false;sprite.spriteFrame=this.frame;v={n,t,alpha:n.addComponent(UIOpacity)};this.pool.push(v);}
   const seed=Math.floor(r/5)+s.round*3+s.lane,w=Math.min(130,width*.85)*(1+(seed%3-1)*.06),x=center+(seed%2?1:-1)*Math.max(0,width-w)*.24;
   v.n.active=true;v.n.setPosition(x,y);if(v.t.width!==w)v.t.setContentSize(w,w*645/1060);v.alpha.opacity=Math.round(255*Math.min(1,(-250-y)/40));count++;
  }
  for(let i=count;i<this.pool.length;i++)this.pool[i].n.active=false;
 }
}
