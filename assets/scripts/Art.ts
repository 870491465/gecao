import { Node, Graphics, UITransform, Color, Label, Layers } from 'cc';
export function node(name:string,parent:Node,x=0,y=0){const n=new Node(name);n.layer=Layers.Enum.UI_2D;n.parent=parent;n.setPosition(x,y);n.addComponent(UITransform);return n;}
export function ink(n:Node){return n.addComponent(Graphics);}
export function color(hex:string){return new Color().fromHEX(hex);}
export function ellipse(g:Graphics,x:number,y:number,rx:number,ry:number,c:string){g.fillColor=color(c);g.ellipse(x,y,rx,ry);g.fill();}
export function box(g:Graphics,x:number,y:number,w:number,h:number,r:number,c:string){g.fillColor=color(c);g.roundRect(x,y,w,h,r);g.fill();}
export function line(g:Graphics,pts:number[][],c:string,w=4){g.strokeColor=color(c);g.lineWidth=w;g.moveTo(pts[0][0],pts[0][1]);for(let i=1;i<pts.length;i++)g.lineTo(pts[i][0],pts[i][1]);g.stroke();}
export function poly(g:Graphics,p:number[][],c:string){g.fillColor=color(c);g.moveTo(p[0][0],p[0][1]);for(let i=1;i<p.length;i++)g.lineTo(p[i][0],p[i][1]);g.close();g.fill();}
export function text(parent:Node,name:string,str:string,x:number,y:number,size=24,w=600,h=50){const n=node(name,parent,x,y);n.getComponent(UITransform).setContentSize(w,h);const l=n.addComponent(Label);l.string=str;l.fontSize=size;l.lineHeight=size+7;l.color=color('#4b5336');l.isBold=true;return l;}
