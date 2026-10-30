import { _decorator, Component, Node, Label, Graphics, UITransform, BlockInputEvents, view, ResolutionPolicy, game, Game, sys, profiler } from 'cc';
import { DEV, DEBUG } from 'cc/env';
import { HarvestModel, Cut } from './HarvestModel';
import { LEVELS, RULES, columnX,cutY,continuousRows } from './Config';
import { node,ink,box,ellipse,line,text,color,poly } from './Art';
import { Actor } from './Actor';
import { Field } from './Field';
import { SaveStore } from './SaveStore';
import { Sound } from './Sound';
import { equipmentIcon } from './EquipmentIcon';
import { AnimationDebug } from './AnimationDebug';
import { EquipmentArt } from './EquipmentArt';
import { HomeUI } from './HomeUI';
import { UpgradeFX } from './UpgradeFX';
const { ccclass,property }=_decorator;
@ccclass('HarvestGame')
export class HarvestGame extends Component {
 static startOnNextMain=false;
 pendingAutoStart=false;
 funnyRecording=false;funnyTime=0;recordingBackup:HarvestModel=null;funnyLabel:Label;
 homeUI:HomeUI;upgradeFX:UpgradeFX;stagedActor:Actor=null;upgradePending=false;
 @property({tooltip:'0 正常成长；1 镰刀样机；4 机械样机。样机不覆盖正式存档。'}) sampleLevel=0;
 @property animationLab=false;
 animationDebug:AnimationDebug;animationStatus:Label;upgradeView:Node;currentArt:EquipmentArt;nextArt:EquipmentArt;priceCoin:Node;
 model:HarvestModel;store=new SaveStore();field:Field;actor:Actor;sound:Sound;root:Node;ui:Node;effects:Node;overlay:Node;veil:Graphics;
 coins:Label;status:Label;progress:Label;upgrade:Label;buyLabel:Label;buyNode:Node;mainLabel:Label;mainNode:Node;notice:Label;stats:Label;devPanel:Node;settingsPanel:Node;
 bar:Graphics;upgradeBar:Graphics;purchaseProgress:Label;incomeHint:Label;equipmentInk:Graphics;nextEquipmentInk:Graphics;iconLevel=0;pending=0;feedbackTime=0;floatPool:Node[]=[];floats:{n:Node;age:number}[]=[];coinPool:Node[]=[];particles:{n:Node;age:number;x:number;y:number}[]=[];
 elapsed=0;noticeTime=0;workTime=0;saveTime=0;fps=60;devOpen=false;resetUntil=0;settingsWasActive=false;blockedSave=false;normalSession=0;normalIncome=0;
 onLoad(){
  view.setDesignResolutionSize(720,1280,ResolutionPolicy.SHOW_ALL);
  profiler.hideStats();
  let saved;try{if(!this.sampleLevel)saved=this.store.load();}catch(e){this.blockedSave=true;console.error(e);}
  this.model=new HarvestModel(saved);if(this.sampleLevel){this.model.debugLevel(this.sampleLevel);this.model.s.started=false;this.model.state='Ready';}
  if(!this.sampleLevel&&HarvestGame.startOnNextMain){HarvestGame.startOnNextMain=false;this.pendingAutoStart=!this.blockedSave;}
  this.model.onSave=()=>this.save();this.model.onNotice=s=>this.showNotice(s);this.model.onCut=e=>this.onCut(e);
  this.root=node('GameRoot',this.node);this.adaptSafeArea();this.field=new Field(this.root);this.effects=node('CutFeedbackPool',this.root);this.actor=new Actor(this.root);this.actor.build(this.model.cfg);this.field.foreground.setSiblingIndex(this.root.children.length-1);this.ui=node('SafeUI',this.root);this.sound=new Sound(this.node);
  this.upgradeFX=new UpgradeFX(this.root);this.upgradeFX.root.setSiblingIndex(this.ui.getSiblingIndex());
  this.buildUI();this.overlay=node('TransitionVeil',this.root);this.veil=ink(this.overlay);
  this.buildSettings();if(DEV||DEBUG){this.buildDev();this.animationDebug=new AnimationDebug(this,this.animationLab);if(!this.sampleLevel){this.ui.getChildByName('DevToggle').active=false;this.ui.getChildByName('AnimationInspectorToggle').active=false;}}
  game.on(Game.EVENT_HIDE,this.hide,this);game.on(Game.EVENT_SHOW,this.show,this);
  if(this.store.message)this.showNotice(this.store.message);
  if(DEV||DEBUG)(globalThis as any).__HARVEST__={game:this,model:this.model,snapshot:()=>this.model.snapshot(),logs:()=>this.model.logs};
  if(sys.isBrowser&&new URLSearchParams(globalThis.location?.search||'').get('funny')==='1')this.setFunnyRecording(true);
  this.refresh();this.field.update(this.model,0);this.actor.animate(this.model.cfg,this.model.s.phase,this.model.s.distance,0,this.walkRows());
 }
 onDestroy(){game.off(Game.EVENT_HIDE,this.hide,this);game.off(Game.EVENT_SHOW,this.show,this);this.save();}
 adaptSafeArea(){
  const w=(globalThis as any).wx;if(!w?.getWindowInfo)return;
  const info=w.getWindowInfo(),safe=info.safeArea;if(!safe)return;
  const scale=Math.min(info.windowWidth/720,info.windowHeight/1280);
  const top=Math.max(safe.top,w.getMenuButtonBoundingClientRect?.().bottom||0),bottom=info.windowHeight-safe.bottom;
  // Fit the whole composed game into the space below the WeChat capsule and above the home indicator.
  const available=info.windowHeight-top-bottom;const ratio=Math.min(1,available/(1280*scale));
  this.root.setScale(ratio,ratio,1);this.root.setPosition(0,(bottom-top)/(2*scale));
 }
 save(){if(!this.funnyRecording&&!this.sampleLevel&&!this.blockedSave){try{this.store.save(this.model);}catch(e){this.showNotice('保存失败，请检查本地存储空间');console.error(e);}}}
 hide(){this.actor.hybrid?.cancelFeedback();this.pendingAutoStart=false;HarvestGame.startOnNextMain=false;this.model.suspend();this.sound.stop();this.save();}
 show(){this.model.foreground();if(!this.sampleLevel&&this.model.s.started&&!this.blockedSave)this.pendingAutoStart=true;this.refresh();}
 button(parent:Node,name:string,str:string,x:number,y:number,w:number,h:number,fn:()=>void,fill='#fff1cc'){
  const n=node(name,parent,x,y);n.getComponent(UITransform).setContentSize(w,h);const g=ink(n);box(g,-w/2,-h/2-5,w,h,18,'#686c42');box(g,-w/2,-h/2,w,h,18,fill);const l=text(n,'Label',str,0,0,23,w-12,h-2);n.on(Node.EventType.TOUCH_END,fn);return {n,l,g};
 }
 buildUI(){
  if(!this.sampleLevel){this.homeUI=new HomeUI(this);return;}
  const card=(name:string,x:number,y:number,w:number,h:number)=>{const g=ink(node(name,this.ui,x,y));box(g,-w/2,-h/2-4,w,h,25,'#b29355');box(g,-w/2,-h/2,w,h,25,'#fffcf1');return g;};
  card('BalancePill',-222,579,226,64);
  const coin=ink(node('CoinIcon',this.ui,-297,579));ellipse(coin,0,0,25,25,'#ca8028');ellipse(coin,0,2,22,22,'#ffc94f');ellipse(coin,0,2,17,17,'#f7ae2e');ellipse(coin,0,-3,8,7,'#ffe18a');for(const [x,y] of [[-9,8],[0,12],[9,8]])ellipse(coin,x,y,3,4,'#ffe18a');
  this.coins=text(this.ui,'Balance','0',-200,579,37,143,55);this.coins.color=color('#214b28');
  card('EquipmentPill',-205,501,260,63);this.equipmentInk=ink(node('EquipmentIcon',this.ui,-306,501));this.equipmentInk.node.setScale(1,1,1);
  this.status=text(this.ui,'LevelCrop','',-178,501,23,210);this.status.color=color('#214b28');
  const ribbon=ink(node('FieldProgressRibbon',this.ui,-205,447));box(ribbon,-130,-12,260,24,12,'#52713b');this.progress=text(this.ui,'FieldProgress','',-205,447,14,256,28);this.progress.color=color('#fffde8');this.bar=ink(node('ProgressBar',this.ui,-205,430));
  const gear=this.button(this.ui,'Settings','',301,579,66,66,()=>this.openSettings(),'#fffcf1');const gearInk=ink(node('GearIcon',gear.n));for(let i=0;i<8;i++){const a=i*Math.PI/4;line(gearInk,[[Math.cos(a)*12,Math.sin(a)*12],[Math.cos(a)*21,Math.sin(a)*21]],'#925b2e',10);}ellipse(gearInk,0,0,18,18,'#925b2e');ellipse(gearInk,0,0,8,8,'#fffcf1');
  const upgrade=card('UpgradeCard',0,120,310,166);poly(upgrade,[[-18,-83],[0,-109],[18,-83]],'#fffcf1');
  this.nextEquipmentInk=ink(node('NextToolIcon',this.ui,-118,120));this.nextEquipmentInk.node.setScale(1,1,1);
  this.upgrade=text(this.ui,'NextEquipment','',35,168,22,230,34);this.upgrade.color=color('#234a29');
  this.upgradeBar=ink(node('PurchaseProgress',this.ui,35,107));
  this.purchaseProgress=text(this.ui,'PurchaseAmount','',35,84,20,200,28);this.purchaseProgress.color=color('#285330');
  const b=this.button(this.ui,'Buy','',35,55,188,36,()=>this.purchase(),'#eee0ca');this.buyNode=b.n;this.buyLabel=b.l;this.buyLabel.fontSize=20;
  this.buyLabel.color=color('#875128');this.priceCoin=node('PriceCoin',b.n,3.5,0);const pc=ink(this.priceCoin);ellipse(pc,0,-1,10,10,'#c38a2e');ellipse(pc,0,1,9,9,'#ffca49');ellipse(pc,0,1,6.5,6.5,'#f1aa2d');ellipse(pc,0,-1,3,2.8,'#ffe695');for(const x of [-3,0,3])ellipse(pc,x,4-Math.abs(x)*.3,1.2,1.6,'#ffe695');
  this.incomeHint=text(this.ui,'IncomeHint','',35,140,12,220,34);this.incomeHint.color=color('#577548');
  const start=this.button(this.ui,'StartContinue','开始收割',0,-551,222,80,()=>{if(!this.field.ready||!this.actor.ready){this.showNotice('素材加载中');return;}if(this.model.state==='Ready'||this.model.state==='Paused'){this.model.start();}this.refresh();},'#fffcf1');this.mainNode=start.n;this.mainLabel=start.l;this.mainLabel.fontSize=29;this.mainLabel.color=color('#875128');
  this.animationStatus=text(this.ui,'AnimationResourceStatus','',282,516,12,135,25);this.animationStatus.color=color('#fff7d6');
  this.notice=text(this.ui,'Notice','',0,338,22,650,56);this.notice.color=color('#fff8df');
  this.currentArt=new EquipmentArt(this.equipmentInk.node,this.equipmentInk,36,60);this.nextArt=new EquipmentArt(this.nextEquipmentInk.node,this.nextEquipmentInk,65,114);
  if(this.sampleLevel)text(this.ui,'SampleTag',`样机 Lv.${this.sampleLevel} · 临时进度`,0,615,15);
  this.upgradeView=node('UpgradeHintView',this.ui,0,120);for(const name of ['UpgradeCard','NextToolIcon','NextEquipment','PurchaseProgress','PurchaseAmount','Buy','IncomeHint']){const n=this.ui.getChildByName(name);const p=n.position.clone();n.parent=this.upgradeView;n.setPosition(p.x,p.y-120,p.z);}
 }
 buildSettings(){
  this.settingsPanel=node('SettingsModal',this.root);this.settingsPanel.getComponent(UITransform).setContentSize(720,1280);this.settingsPanel.addComponent(BlockInputEvents);const g=ink(this.settingsPanel);box(g,-340,-270,680,570,25,'#fff3d6');text(this.settingsPanel,'Title','声音与轻反馈',0,231,30);
  const s=this.model.s.settings;
  const a=this.button(this.settingsPanel,'SFX','',0,135,500,60,()=>{const s=this.model.s.settings;s.sfx=!s.sfx;a.l.string='音效：'+(s.sfx?'开启':'关闭');this.save();});a.l.string='音效：'+(s.sfx?'开启':'关闭');
  const b=this.button(this.settingsPanel,'Music','',0,48,500,60,()=>{const s=this.model.s.settings;s.music=!s.music;b.l.string='音乐：'+(s.music?'开启':'关闭');this.save();});b.l.string='音乐：'+(s.music?'开启':'关闭');
  const v=this.button(this.settingsPanel,'Vibration','',0,-39,500,60,()=>{const s=this.model.s.settings;s.vibration=!s.vibration;v.l.string='轻震动：'+(s.vibration?'开启':'关闭');this.save();});v.l.string='轻震动：'+(s.vibration?'开启':'关闭');
  this.funnyLabel=this.button(this.settingsPanel,'FunnyRecording','搞笑录屏：开启',0,-117,500,48,()=>this.setFunnyRecording(!this.funnyRecording)).l;
  if(DEV||DEBUG){this.button(this.settingsPanel,'OpenDevelopment','开发面板',-132,-163,232,34,()=>{this.settingsPanel.active=false;this.devOpen=true;this.devPanel.active=true;});this.button(this.settingsPanel,'OpenAnimation','动画检查',132,-163,232,34,()=>{this.settingsPanel.active=false;this.animationDebug.panel.active=true;});}
  this.button(this.settingsPanel,'Close','返回田地',0,-231,500,48,()=>{this.settingsPanel.active=false;if(this.settingsWasActive)this.model.start();this.refresh();});this.settingsPanel.active=false;
 }
 openSettings(){this.settingsWasActive=['Harvesting','Transition','Upgrading'].includes(this.model.state);if(this.sampleLevel){this.model.pause();this.sound.stop();}this.settingsPanel.active=true;this.refresh();}
 setFunnyRecording(enabled:boolean){
  if(enabled===this.funnyRecording)return;
  this.model.pause();this.sound.stop();this.clearTransientFeedback();this.upgradeFX.clear();this.sound.endUpgrade();
  this.upgradePending=false;this.stagedActor?.root.destroy();this.stagedActor=null;
  if(enabled){
   this.recordingBackup=this.model;const settings=JSON.parse(JSON.stringify(this.model.s.settings));
   this.funnyRecording=true;this.model=new HarvestModel();this.model.s.settings=settings;this.model.s.debug=true;
  }else{
   this.funnyRecording=false;this.model=this.recordingBackup;this.recordingBackup=null;
  }
  this.model.onSave=()=>this.save();this.model.onNotice=s=>this.showNotice(s);this.model.onCut=e=>this.onCut(e);
  const debug=(globalThis as any).__HARVEST__;if(debug)debug.model=this.model;
  this.funnyTime=0;this.settingsWasActive=false;this.actor.root.setPosition(0,0);this.actor.root.angle=0;this.actor.root.setScale(1,1,1);
  this.actor.build(this.model.cfg);this.field.clear();this.field.update(this.model,0);this.actor.prepare(this.model);this.actor.animate(this.model.cfg,this.model.s.phase,this.model.s.distance,this.workTime,this.walkRows());
  this.funnyLabel.string=enabled?'搞笑录屏：已开启 · 点此恢复正常':'搞笑录屏：开启';
  for(const [name,key,title] of [['SFX','sfx','音效'],['Music','music','音乐'],['Vibration','vibration','轻震动']])this.settingsPanel.getChildByName(name).getChildByName('Label').getComponent(Label).string=title+'：'+(this.model.s.settings[key]?'开启':'关闭');
  if(sys.isBrowser){const url=new URL(globalThis.location.href);if(enabled)url.searchParams.set('funny','1');else url.searchParams.delete('funny');globalThis.history.replaceState(null,'',url.toString());}
  if(!enabled)this.save();this.refresh();
 }
 recordingPose(dt:number){
  if(!this.funnyRecording||this.model.s.level!==1)return;
  this.funnyTime+=dt;const q=Math.max(0,Math.min(1,(this.funnyTime-2)/9)),p=q*q*(3-2*q);
  this.actor.root.setPosition(270*p,70*p);this.actor.root.angle=-12*p;
 }
 buildDev(){
  this.button(this.ui,'DevToggle','DEV',283,474,70,35,()=>{this.devOpen=!this.devOpen;this.devPanel.active=this.devOpen;});
  this.devPanel=node('DevelopmentOnly',this.root,0,0);this.devPanel.getComponent(UITransform).setContentSize(720,1280);this.devPanel.addComponent(BlockInputEvents);const g=ink(this.devPanel);box(g,-344,-305,688,600,20,'#f0e6c8');text(this.devPanel,'Title','开发面板 · 使用作弊自动标记调试场次',0,259,21);
  this.stats=text(this.devPanel,'Stats','',0,187,18,650,90);
  this.button(this.devPanel,'AddMoney','+ 10000 金币',-163,96,300,50,()=>{this.cheat();this.model.s.coins+=10000;this.save();this.refresh();});
  this.button(this.devPanel,'HitDebug','作物 ID / 判定区',163,96,300,50,()=>{this.field.debug=!this.field.debug;});
  for(let i=1;i<=LEVELS.length;i++)this.button(this.devPanel,'Level'+i,'Lv.'+i,(i-(LEVELS.length+1)/2)*130,26,115,50,()=>{this.cheat();this.model.debugLevel(i);this.actor.build(this.model.cfg);this.field.clear();this.save();this.refresh();});
  this.button(this.devPanel,'PauseStep','暂停 / 继续',-216,-45,200,50,()=>{if(this.model.state==='Paused')this.model.start();else this.model.pause();this.refresh();});
  this.button(this.devPanel,'SingleStep','单步 1/30 秒',0,-45,200,50,()=>{if(this.model.state!=='Paused')this.model.pause();this.cheat();this.model.start();this.advance(1/30);this.model.pause();this.refresh();});
  this.button(this.devPanel,'LowFPS','低帧一步 0.5s',216,-45,200,50,()=>{this.model.pause();this.cheat();this.model.start();this.advance(.5);this.model.pause();this.refresh();});
  const speeds=[.5,1,2,4];let si=1;const speed=this.button(this.devPanel,'Speed','推进 ×1',-163,-116,300,50,()=>{this.cheat();si=(si+1)%speeds.length;this.model.speedScale=speeds[si];speed.l.string='推进 ×'+speeds[si];});
  const rhythms=[.5,1,1.5,2];let ri=1;const rhythm=this.button(this.devPanel,'Rhythm','挥割节奏 ×1',163,-116,300,50,()=>{this.cheat();ri=(ri+1)%rhythms.length;this.model.rhythm=rhythms[ri];rhythm.l.string='挥割节奏 ×'+rhythms[ri];});
  const reset=this.button(this.devPanel,'Reset','备份并重置进度',-163,-187,300,50,()=>{if(this.elapsed>this.resetUntil){this.resetUntil=this.elapsed+4;reset.l.string='再次点击确认重置';return;}this.store.reset();this.blockedSave=false;this.model.s=HarvestModel.fresh();this.model.state='Ready';this.model.speedScale=1;this.model.rhythm=1;this.actor.build(this.model.cfg);this.field.clear();this.save();reset.l.string='备份并重置进度';this.resetUntil=0;this.refresh();});
  this.button(this.devPanel,'Export','导出测试日志',163,-187,300,50,()=>this.exportLog());
  this.button(this.devPanel,'CloseDev','收起，观看收割',0,-258,620,48,()=>{this.devPanel.active=false;this.devOpen=false;});this.devPanel.active=false;
 }
 cheat(){this.model.s.debug=true;this.model.record('debug-action');}
 exportLog(){const payload=JSON.stringify({snapshot:this.model.snapshot(),fps:this.fps,visible:this.field.cells.size,nodeCount:this.nodeCount(),events:this.model.logs},null,2);const w=(globalThis as any).wx;
  if(sys.isBrowser){const blob=new Blob([payload],{type:'application/json'});const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='orange-cat-test-log.json';a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1000);this.showNotice('测试日志已导出');}
  else if(w?.getFileSystemManager){const p=w.env.USER_DATA_PATH+'/orange-cat-test-log.json';w.getFileSystemManager().writeFileSync(p,payload,'utf8');this.showNotice('日志保存到小游戏用户目录');}else {console.log(payload);this.showNotice('日志已输出到控制台');}
 }
 nodeCount(){let n=0;const walk=(v:Node)=>{n++;v.children.forEach(walk);};walk(this.root);return n;}
 clearTransientFeedback(){this.actor.hybrid?.cancelFeedback();this.field.skin.clearFeedback();this.pending=0;for(const f of this.floats){f.n.active=false;this.floatPool.push(f.n);}for(const p of this.particles){p.n.active=false;this.coinPool.push(p.n);}this.floats=[];this.particles=[];}
 purchase(){
  if(this.funnyRecording||!this.model.cfg.next)return;
  if(this.upgradePending||this.upgradeFX.active)return;
  if(!this.upgradeFX.ready||!this.sound.clips.upgrade){this.showNotice('升级素材加载中');return;}
  if(this.model.purchase()){
   this.clearTransientFeedback();if(this.model.s.level>=6)this.field.skin.ensureRice();this.stagedActor=new Actor(this.root);this.stagedActor.build(this.model.cfg);this.stagedActor.root.active=false;
   this.upgradePending=true;
  }this.refresh();
 }
 updateUpgrade(dt:number){
  const m=this.model,paused=['Paused','Suspended'].includes(m.state);
  if(this.upgradePending){
   if(paused||!this.stagedActor.ready||(m.s.level>=6&&!this.field.skin.riceReady))return;
   this.upgradePending=false;this.upgradeFX.start(m.s.level);this.sound.startUpgrade(m.s.settings.sfx);
  }
  if(this.upgradeFX.active){
   this.sound.syncUpgrade(!paused&&m.s.settings.sfx);
   if(!paused)this.upgradeFX.tick(dt,()=>{
    this.actor.root.destroy();this.actor=this.stagedActor;this.stagedActor=null;this.actor.root.active=true;
    this.actor.root.setSiblingIndex(this.upgradeFX.root.getSiblingIndex()-1);this.field.clear();
   });
   this.upgradeFX.bounce(this.actor.root);
   if(!this.upgradeFX.active)this.sound.endUpgrade();
  }
 }
 showNotice(s:string){if(this.notice){this.notice.string=s;this.noticeTime=3;}}
 onCut(e:Cut){this.actor.onCut(e,this.model);this.field.cut(e);this.pending+=e.value;
  if(this.model.s.settings.vibration){const w=(globalThis as any).wx;if(w?.vibrateShort&&this.feedbackTime>.3)w.vibrateShort({type:'light'});}
  // Representative particles only; balance is already committed by the model.
  if(this.particles.length<5&&e.col===0){let n=this.coinPool.pop();if(!n){n=node('CoinParticle',this.effects);const g=ink(n);ellipse(g,0,0,8,8,'#ffe28a');}n.active=true;const x=columnX(this.model.cfg,e.col),y=cutY(this.model.cfg,e.col);this.particles.push({n,age:0,x,y});}
 }
 feedback(dt:number){
  this.feedbackTime+=dt;
  if(this.pending&&this.feedbackTime>=.4){if(this.floats.length<3){let n=this.floatPool.pop();if(!n)n=text(this.effects,'IncomeFloat','',0,0,26,220,45).node;n.active=true;n.getComponent(Label).string='+'+this.pending;n.getComponent(Label).color=color('#fff1aa');n.setPosition(170,10);this.floats.push({n,age:0});}this.pending=0;this.feedbackTime=0;}
  this.floats=this.floats.filter(v=>{v.age+=dt;v.n.setPosition(170,10+v.age*65);if(v.age>1.05){v.n.active=false;this.floatPool.push(v.n);return false;}return true;});
  this.particles=this.particles.filter(v=>{v.age+=dt;v.n.setPosition(v.x+(180-v.x)*v.age,v.y+v.age*170);if(v.age>.65){v.n.active=false;this.coinPool.push(v.n);return false;}return true;});
 }
 walkRows(){const s=this.model.s;return continuousRows(this.model.cfg,s.round,s.lane,s.distance);}
 advance(dt:number){const m=this.model;if(this.upgradePending)return;if(this.upgradeFX.active&&!this.upgradeFX.swapped){m.update(Math.min(dt,m.s.remaining));return;}this.actor.prepare(m);dt=this.animationDebug?this.animationDebug.limit(dt):dt;const before=m.s.activeSeconds;if(m.state!=='Harvesting'||(this.actor.ready&&this.field.ready))m.update(dt);const simulated=m.s.activeSeconds-before;this.workTime+=simulated;this.actor.animate(m.cfg,m.s.phase,m.s.distance,this.workTime,this.walkRows());this.field.update(m,simulated);this.recordingPose(simulated);this.animationDebug?.after();}
 update(dt:number){
  this.elapsed+=dt;this.fps=this.fps*.95+(1/Math.max(dt,.001))*.05;const m=this.model;
  if(this.pendingAutoStart&&this.actor.ready&&this.field.ready){this.pendingAutoStart=false;if(m.state!=='Suspended')m.start();}
  this.updateUpgrade(dt);
  if(m.state!=='Suspended'){this.advance(dt);if(m.state==='Harvesting')this.feedback(dt);}
  this.sound.tick(dt,m.s.settings.music&&['Harvesting','Transition','Upgrading'].includes(m.state));this.saveTime+=dt;if(this.saveTime>=RULES.saveInterval){this.saveTime=0;this.save();}
  if(this.noticeTime>0){this.noticeTime-=dt;if(this.noticeTime<=0)this.notice.string='';}
  this.refresh();
 }
 refresh(){
  if(this.homeUI){this.homeUI.refresh();this.refreshAuxiliary();return;}
  const m=this.model,s=m.s,c=m.cfg;this.coins.string=s.coins.toLocaleString();this.status.string=`${c.tool} Lv.${s.level}`;
  if(this.upgradeView){const hint=this.actor.hybrid?.upgradeHint||this.actor.combine?.upgradeHint;if(hint)this.upgradeView.setPosition(this.ui.getComponent(UITransform).convertToNodeSpaceAR(hint.worldPosition));else this.upgradeView.setPosition(0,120);}
  if(this.animationStatus){this.animationStatus.node.active=s.level===1;this.animationStatus.string=this.actor.hybrid?.active?'序列挥镰':this.actor.ready?'V02 合体挥镰':'素材加载中';}
  const stateNames={Ready:'等待开始',Harvesting:'自动收割',Transition:'自动换垄',Upgrading:'设备换装',Paused:'已暂停',Suspended:'后台已停止'};
  this.progress.string=`${c.crop} · 第 ${s.round} 轮 · ${Math.floor(100*m.progress/m.total)}%`;
  if(this.iconLevel!==s.level){this.equipmentInk.clear();this.nextEquipmentInk.clear();equipmentIcon(this.equipmentInk,s.level);equipmentIcon(this.nextEquipmentInk,Math.min(LEVELS.length,s.level+1));this.currentArt?.setLevel(s.level);this.nextArt?.setLevel(Math.min(LEVELS.length,s.level+1));this.iconLevel=s.level;}
  this.bar.clear();box(this.bar,-130,-2,260,4,2,'#668345');box(this.bar,-165,-2,Math.max(4,260*m.progress/m.total),4,2,'#ffe09a');
  const next=LEVELS[s.level];this.upgrade.string=next?`${next.tool} Lv.${next.level}`:`${c.tool} Lv.${s.level}`;
  this.upgradeBar.clear();box(this.upgradeBar,-90,-6,180,15,7,'#b5b6ae');box(this.upgradeBar,-88,-4,176,11,5,'#e2e2da');box(this.upgradeBar,-88,-4,Math.max(7,176*(next?Math.min(1,s.coins/c.next):1)),11,5,'#61c434');
  this.purchaseProgress.string=next?`${s.coins} / ${c.next}`:'当前最高级';
  this.incomeHint.string=next?`${next.crop} · 单元 ${c.price} → ${next.price} 金币\n收割时约 ${c.price*c.cols*c.speed} → ${next.price*next.cols*next.speed} 金币/秒`:`持续自动收割 · 收割时约 ${c.price*c.cols*c.speed} 金币/秒`;
  this.buyLabel.string=next?(m.state==='Upgrading'?'换装中…':`升级      ${c.next}`):'持续收割';if(this.priceCoin){this.priceCoin.active=!!next&&m.state!=='Upgrading';this.priceCoin.setPosition((3-String(c.next).length)*5.5+3.5,0);}
  const bg=this.buyNode.getComponent(Graphics);bg.clear();box(bg,-94,-21,188,36,18,'#cab58c');box(bg,-94,-18,188,36,18,next&&s.coins>=c.next?'#d8f4ae':'#eee0ca');
  this.mainNode.active=m.state==='Ready'||m.state==='Paused';this.mainLabel.string=m.state==='Ready'?'开始收割':m.state==='Paused'?'▶ 继续':'Ⅱ 暂停';
  this.refreshAuxiliary();
 }
 refreshAuxiliary(){
  const m=this.model,s=m.s;
  if(this.veil){this.veil.clear();if(m.state==='Transition'){const duration=RULES.transition;const alpha=Math.sin((1-s.remaining/duration)*Math.PI)*.8;const tint=color('#f0e5bf');tint.a=Math.round(alpha*255);this.veil.fillColor=tint;this.veil.rect(-360,-640,720,1280);this.veil.fill();}}
  if(this.stats){this.stats.string=`${s.debug?'调试场次':'正常场次'} · FPS ${this.fps.toFixed(0)} · 存活节点 ${this.nodeCount()} · 作物 ${this.field.cells.size}\n累计 ${s.totalCut} 单元 / ${s.totalIncome} 金币 · 净收割 ${s.activeSeconds.toFixed(1)}s\n实际均收 ${(s.totalIncome/Math.max(1,s.activeSeconds+s.transitionSeconds)).toFixed(2)} 金币/s · 状态 ${m.state}`;}
 }

}
