import { Node,Graphics } from 'cc';
import { node,ink,line,ellipse,color } from './Art';
import { WIDE,wideAngle } from './WideScythe';
/** Separate shoulder, forearm, grip, shaft and blade; replace children without changing contact math. */
export class WideScytheActor {
 root:Node;arm:Node;blade:Node;trail:Graphics;
 constructor(parent:Node,level:number){
  const r=WIDE.reach[level-1];this.root=node('WideShoulderPivot',parent,WIDE.shoulderX,WIDE.shoulderY);
  this.arm=node('Forearm',this.root);const a=ink(this.arm);line(a,[[0,0],[0,34]],'#b36c28',26);line(a,[[0,3],[0,35]],'#f4a441',21);ellipse(a,0,37,14,15,'#ffdc9a');
  const shaft=ink(node('WoodenShaft',this.root));line(shaft,[[0,30],[0,r-24]],'#754322',12);line(shaft,[[-2,31],[-2,r-24]],'#c48b46',7);
  this.blade=node('SteelBlade',this.root,0,r);const b=ink(this.blade);
  b.fillColor=color('#768d98');b.moveTo(-60,-14);b.bezierCurveTo(-17,64,75,50,64,-29);b.bezierCurveTo(39,10,9,20,-60,-14);b.fill();
  b.fillColor=color('#dce9e9');b.moveTo(-60,-14);b.bezierCurveTo(-12,58,65,45,61,-22);b.bezierCurveTo(43,15,8,18,-60,-14);b.fill();
  line(b,[[-59,-14],[-30,7],[0,14],[30,8],[60,-22]],'#fbfff1',3);ellipse(b,0,0,5,5,'#f5f4cd');
  this.trail=ink(node('SweepTrail',parent));
 }
 pose(phase:number){this.root.angle=wideAngle(phase);this.trail.clear();if(phase>.22&&phase<.4){const a=this.root.angle*Math.PI/180,r=this.blade.position.y;const points:number[][]=[];for(let i=0;i<=12;i++){const t=a+(12-i)*.022;points.push([WIDE.shoulderX-Math.sin(t)*r,WIDE.shoulderY+Math.cos(t)*r]);}line(this.trail,points,'#fff2a6',3);}}
}
