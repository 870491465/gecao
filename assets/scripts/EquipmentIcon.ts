import { Graphics } from 'cc';
import { line,color,box,ellipse } from './Art';
export function equipmentIcon(g:Graphics,level:number){
 if(level>=2){box(g,-23,-12,46,26,7,level===2?'#63ada2':'#e5b854');box(g,-29,11,58,10,4,'#758c73');for(const x of [-18,18])ellipse(g,x,-14,7,9,'#455d4b');return;}
 line(g,[[-18,-27],[9,18]],'#78472a',9);line(g,[[-19,-26],[8,18]],'#c48b46',4);
 g.fillColor=color('#91a3ab');g.moveTo(8,18);g.bezierCurveTo(8,48,44,45,47,12);g.bezierCurveTo(29,30,18,27,8,18);g.fill();
 g.fillColor=color('#dfebed');g.moveTo(9,21);g.bezierCurveTo(13,46,42,40,45,15);g.bezierCurveTo(30,30,18,27,9,21);g.fill();
}
