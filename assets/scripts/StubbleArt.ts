import { Graphics } from 'cc';
import { poly,ellipse } from './Art';
/** Fine cut stems for a harvested logical patch. Rendering never changes the ledger. */
export function drawStubble(g:Graphics,width:number,seed:number){g.clear();const patches=Math.max(2,Math.floor(width/32));for(let j=0;j<patches;j++){const s=seed*13+j*19,x=(j-(patches-1)/2)*width/patches+Math.sin(s)*5,y=Math.sin(s*3)*12-9;ellipse(g,x,y-1,8,2,'#987a42');for(let k=0;k<3;k++){const px=x+(k-1)*4,h=9+(s+k*7)%12,w=3,lean=Math.sin(s+k)*2;poly(g,[[px-w/2,y],[px+w/2,y],[px+w/2+lean,y+h],[px-w/2+lean,y+h]],'#5ca82d');poly(g,[[px-w/2,y],[px,y],[px+lean,y+h],[px-w/2+lean,y+h]],'#95d23d');ellipse(g,px+lean,y+h,w/2,1,'#c5ec61');}}}
