import { Node,Sprite,SpriteFrame,UITransform,Graphics,Label,view } from 'cc';
import { node,ink,box,ellipse,poly,line,text,color } from './Art';
import { LEVELS } from './Config';
import { EquipmentArt } from './EquipmentArt';
import { EQUIPMENT_KEYS,equipmentFrames } from './EquipmentUIAssets';
import type { HarvestGame } from './HarvestGame';
export class HomeUI {
 ready=false;error='';bindings:{s:Sprite;key:string}[]=[];frames:Map<string,SpriteFrame>;
 tiles:{root:Node;icon:Sprite;selection:Node;dot:Node;lock:Node}[]=[];
 mainShadow:Label;mainSymbol:Sprite;bubble:Graphics;level=0;row:Node;layoutHeight=0;layoutKey='';topNodes:{n:Node;y:number}[]=[];
 constructor(public g:HarvestGame){
  const ui=g.ui;
  this.panel('BalancePill',ui,-222,579,226,64);this.coin(ui,'CoinIcon',-298,579,29);
  g.coins=text(ui,'Balance','0',-201,579,30,145,50);g.coins.color=color('#814615');
  this.panel('EquipmentPill',ui,164,579,190,64);g.equipmentInk=ink(node('EquipmentIcon',ui,102,579));
  g.status=text(ui,'LevelCrop','',184,579,21,140,46);g.status.color=color('#814615');
  g.currentArt=new EquipmentArt(g.equipmentInk.node,g.equipmentInk,47,47);
  g.bar=ink(node('ProgressBar',ui));g.bar.node.active=false;
  const gear=node('Settings',ui,301,579);gear.getComponent(UITransform).setContentSize(66,66);this.cream(ink(gear),66,66,23);
  const gi=ink(node('GearIcon',gear));for(let i=0;i<8;i++){const a=i*Math.PI/4;line(gi,[[Math.cos(a)*12,Math.sin(a)*12],[Math.cos(a)*21,Math.sin(a)*21]],'#925b2e',10);}ellipse(gi,0,0,18,18,'#925b2e');ellipse(gi,0,0,8,8,'#fff4d7');gear.on(Node.EventType.TOUCH_END,()=>g.openSettings());
  g.upgradeView=node('UpgradeHintView',ui,0,45);g.upgradeView.getComponent(UITransform).setContentSize(96,96);g.buyNode=g.upgradeView;this.bubble=ink(g.buyNode);
  this.cream(this.bubble,84,84,22,true);poly(this.bubble,[[-12,-40],[0,-52],[12,-40]],'#d1a267');poly(this.bubble,[[-9,-40],[0,-48],[9,-40]],'#fff2d5');
  g.buyNode.on(Node.EventType.TOUCH_END,()=>{const m=g.model;if(!g.upgradeView.activeInHierarchy||m.state==='Upgrading'||!m.cfg.next||m.s.coins<m.cfg.next)return;g.purchase();});
  g.nextEquipmentInk=ink(node('NextToolIcon',g.upgradeView));g.nextArt=new EquipmentArt(g.nextEquipmentInk.node,g.nextEquipmentInk,72,72);
  const row=this.row=node('EquipmentBar',ui,0,-420);
  for(let i=0;i<LEVELS.length;i++){
   const root=node('EquipmentSlot'+(i+1),row,(i-(LEVELS.length-1)/2)*112,0);root.getComponent(UITransform).setContentSize(100,100);
   this.image('Tile',root,100,100,'tile_normal');const icon=this.image('Icon',root,83,83,EQUIPMENT_KEYS[i]);icon.node.setPosition(0,-3);
   const n=text(root,'Level',String(i+1),-32,32,23,26,30);n.color=color('#9e733e');
   if(i>=4){const badge=node('FullscreenBadge',root,7,-31);box(ink(badge),-25,-10,50,20,7,i===5?'#a47727':'#517e31');text(badge,'Label',i===5?'水稻':'全屏',0,0,13,48,20).color=color('#fff4b1');}
   const selection=this.image('Selected',root,100,100,'selection_border').node;
   const dot=this.image('CurrentDot',root,13,13,'active_dot').node;dot.setPosition(34,34);
   const lock=this.image('Lock',root,17,17,'lock').node;lock.setPosition(34,34);
   this.tiles.push({root,icon,selection,dot,lock});
   root.on(Node.EventType.TOUCH_END,()=>{const c=LEVELS[i],state=i+1===g.model.s.level?'当前装备':i+1<g.model.s.level?'已解锁':'未解锁，使用头顶气泡升级';g.showNotice(`Lv.${i+1} ${c.tool} · ${c.crop}\n单元 ${c.price} 金币 · ${state}`);});
  }
  g.mainNode=node('StartContinue',ui,0,-552);g.mainNode.getComponent(UITransform).setContentSize(400,112);const fallback=ink(g.mainNode);box(fallback,-198,-51,396,102,48,'#e6bd6b');box(fallback,-188,-42,376,84,40,'#5ac427');this.image('GreenButton',g.mainNode,400,100,'button_green');
  this.mainSymbol=this.image('MainActionSymbol',g.mainNode,48,52,'start_play');this.mainSymbol.node.setPosition(-110,0);this.mainShadow=text(g.mainNode,'MainLabelShadow','',31,-2,33,254,55);this.mainShadow.color=color('#388019');g.mainLabel=text(g.mainNode,'Label','',31,0,33,254,55);g.mainLabel.color=color('#fffbe9');
  g.mainNode.on(Node.EventType.TOUCH_END,()=>{if(!g.field.ready||!g.actor.ready){g.showNotice('素材加载中');return;}if(g.model.state==='Ready'||g.model.state==='Paused')g.model.start();g.refresh();});
  g.animationStatus=text(ui,'AnimationResourceStatus','',0,0,12);g.animationStatus.node.active=false;
  g.notice=text(ui,'Notice','',0,300,20,620,62);g.notice.color=color('#fff8df');
  this.topNodes=['BalancePill','CoinIcon','Balance','EquipmentPill','EquipmentIcon','LevelCrop','Settings'].map(name=>{const n=ui.getChildByName(name);return {n,y:n.position.y};});
  equipmentFrames().then(f=>{if(!ui.isValid)return;this.frames=f;for(const b of this.bindings)b.s.spriteFrame=f.get(b.key);fallback.enabled=false;this.ready=true;this.level=0;this.refresh();}).catch(e=>{this.error=String(e);console.error('Home UI assets',e);});
 }
 image(name:string,parent:Node,w:number,h:number,key:string){const n=node(name,parent);n.getComponent(UITransform).setContentSize(w,h);const s=n.addComponent(Sprite);s.sizeMode=Sprite.SizeMode.CUSTOM;s.trim=false;this.bindings.push({s,key});return s;}
 cream(g:Graphics,w:number,h:number,r:number,lit=false){g.clear();box(g,-w/2,-h/2-4,w,h,r,'#aa7941');box(g,-w/2,-h/2,w,h,r,lit?'#ffd257':'#e5b979');box(g,-w/2+3,-h/2+3,w-6,h-6,r-2,'#fff2d5');box(g,-w/2+7,-h/2+7,w-14,h-14,r-5,lit?'#fff8d9':'#fff7e5');}
 panel(name:string,parent:Node,x:number,y:number,w:number,h:number){const n=node(name,parent,x,y);this.cream(ink(n),w,h,Math.min(28,h/2));return n;}
 coin(parent:Node,name:string,x:number,y:number,r:number){const n=node(name,parent,x,y),g=ink(n);ellipse(g,0,-2,r,r,'#b36b20');ellipse(g,0,0,r,r,'#e59a28');ellipse(g,-1,2,r-3,r-3,'#fff1a1');ellipse(g,0,1,r-5,r-5,'#ffca39');ellipse(g,1,0,r-8,r-8,'#ed9c17');ellipse(g,-2,-4,r*.33,r*.29,'#ffe88c');for(const [px,py] of [[-.36,.22],[0,.40],[.36,.22]])ellipse(g,px*r,py*r,r*.14,r*.18,'#ffe88c');ellipse(g,-r*.45,r*.56,r*.13,r*.20,'#fff6c2');return n;}
 refresh(){
  const g=this.g,m=g.model,s=m.s,c=m.cfg,next=LEVELS[s.level],running=['Harvesting','Transition','Upgrading'].includes(m.state);g.coins.string=s.coins.toLocaleString();g.status.string=c.tool;g.status.fontSize=s.level>=5?18:21;
  const frame=view.getFrameSize();let width=frame.width,pixels=frame.height;const wx=(globalThis as any).wx;
  if(wx?.getWindowInfo){const info=wx.getWindowInfo();if(info.safeArea){const top=Math.max(info.safeArea.top,wx.getMenuButtonBoundingClientRect?.().bottom||0),bottom=info.windowHeight-info.safeArea.bottom;width=info.windowWidth;pixels=info.windowHeight-top-bottom;}}
  const height=Math.max(1280,720*pixels/Math.max(1,width)),layoutKey=height+':'+running;if(layoutKey!==this.layoutKey){this.layoutKey=layoutKey;this.layoutHeight=height;const extra=(height-1280)/2;this.topNodes.forEach(t=>t.n.setPosition(t.n.position.x,t.y+extra));g.mainNode.setPosition(0,-552-extra);this.row.setPosition(0,(running?-570:-435)-extra);}
  const hint=g.actor.hybrid?.upgradeHint||g.actor.ride?.upgradeHint||g.actor.combine?.upgradeHint;if(hint){const p=g.ui.getComponent(UITransform).convertToNodeSpaceAR(hint.worldPosition);g.upgradeView.setPosition(p.x,p.y-75);}else g.upgradeView.setPosition(0,45);
  if(this.level!==s.level){this.level=s.level;g.currentArt.setLevel(s.level);g.nextArt.setLevel(Math.min(LEVELS.length,s.level+1));this.tiles.forEach((t,i)=>{const current=i+1===s.level,locked=i+1>s.level;t.selection.active=current;t.dot.active=current;t.lock.active=locked;if(this.frames)t.icon.spriteFrame=this.frames.get(EQUIPMENT_KEYS[i]+(locked?'_gray':''));});}
  const busy=g.funnyRecording||g.upgradePending||g.upgradeFX.active||['Upgrading','Transition','Suspended'].includes(m.state)||(m.state==='Paused'&&s.resume==='Upgrading'&&s.remaining>0),affordable=!!next&&s.coins>=c.next;
  g.upgradeView.active=affordable&&!busy;
  g.mainNode.active=m.state==='Ready'||m.state==='Paused';
  g.mainLabel.string=m.state==='Ready'?'开始割草':'继续割草';this.mainShadow.string=g.mainLabel.string;
 }
}
