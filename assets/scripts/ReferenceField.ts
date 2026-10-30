import { Node,UITransform } from 'cc';
import { node,ink,poly,ellipse } from './Art';
import { GrassSkin } from './GrassSkin';
import { grassVariant } from './GrassLayout';
/** Static visual acceptance layout. No crop IDs, cut callback or economic simulation. */
export class ReferenceField {
 root:Node;skin:GrassSkin;built=false;count=0;
 constructor(parent:Node){this.root=node('ReferenceFieldVisualOnly',parent);this.root.setSiblingIndex(0);this.skin=new GrassSkin(this.root,this.root);}
 build(){if(this.built||!this.skin.ready)return;this.built=true;this.skin.ground.active=true;this.skin.groundLayout(0,408,160);
  const plants:Node[]=[];
  for(let row=17;row>=0;row--)for(let col=0;col<5;col++){const n=node('PreviewMature_NoLedger',this.root,(col-2)*76+Math.sin(row*3+col)*4,-85+row*54+(col%2)*7);this.skin.plant(n,grassVariant(row,col,1,0),false,1,true);this.skin.plants.get(n).node.getComponent(UITransform).setContentSize(185,185);plants.push(n);}
  // Separate static look-development layer: fine stems, not scaled-down full crop units.
  const stems=ink(node('PreviewFineStems_NoLedger',this.root));let patches=0;
  for(let row=0;row<21;row++)for(let col=0;col<9;col++){const seed=row*23+col*11,x=(col-4)*48+Math.sin(seed)*8,y=-115-row*27+Math.cos(seed)*6;if(y<-640)continue;patches++;ellipse(stems,x,y-1,8,2,'#987a42');for(let i=0;i<2+seed%2;i++){const sx=x+(i-1)*5,h=10+(seed+i*7)%14,w=2.8+(seed+i)%2*.6,lean=Math.sin(seed+i)*2;poly(stems,[[sx-w/2,y],[sx+w/2,y],[sx+w/2+lean,y+h],[sx-w/2+lean,y+h]],'#56a328');poly(stems,[[sx-w/2,y],[sx,y],[sx+lean,y+h],[sx-w/2+lean,y+h]],'#8fce38');ellipse(stems,sx+lean,y+h,w/2,1.1,'#c6ed57');}if(seed%4===0)poly(stems,[[x+9,y-4],[x+16,y-2],[x+11,y+1],[x+7,y-1]],'#77b437');}
  plants.sort((a,b)=>b.position.y-a.position.y).forEach(n=>n.setSiblingIndex(this.root.children.length-1));stems.node.setSiblingIndex(this.root.children.length-1);this.count=plants.length+patches;
 }
}
