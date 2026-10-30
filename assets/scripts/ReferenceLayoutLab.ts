import { _decorator,Component,Node,Graphics,director } from 'cc';
import { HarvestGame } from './HarvestGame';
import { ReferenceField } from './ReferenceField';
import { text,color,box,poly } from './Art';
const {ccclass}=_decorator;
@ccclass('ReferenceLayoutLab')
export class ReferenceLayoutLab extends Component {
 host:HarvestGame;field:ReferenceField;launching=false;
 beginGame(){if(this.launching)return;this.launching=true;this.host.mainLabel.string='正在进入…';HarvestGame.startOnNextMain=true;director.loadScene('Main',error=>{if(error){HarvestGame.startOnNextMain=false;if(this.isValid){this.launching=false;this.host.mainLabel.string='开始游戏';this.host.showNotice('进入游戏失败，请重试');}}});}
 start(){const g=this.host=this.node.getComponent(HarvestGame);if(!g.sampleLevel)throw Error('Reference preview requires isolated sample progress');g.enabled=false;g.actor.hybrid.root.setScale(1.1,1.1,1);g.clearTransientFeedback();g.model.pause();g.model.s.coins=84;g.model.s.debug=true;g.model.s.started=true;g.model.state='Paused';g.field.root.active=false;g.field.foreground.active=false;this.field=new ReferenceField(g.root);g.refresh();g.mainNode.off(Node.EventType.TOUCH_END);g.mainNode.on(Node.EventType.TOUCH_END,()=>this.beginGame());g.buyNode.off(Node.EventType.TOUCH_END);g.mainLabel.string='开始游戏';g.animationStatus.node.active=false;for(const name of ['DevToggle','AnimationInspectorToggle','SampleTag','FieldProgressRibbon','FieldProgress','ProgressBar']){const n=g.ui.getChildByName(name);if(n)n.active=false;}g.incomeHint.node.active=false;g.upgrade.node.setPosition(35,45);g.upgradeBar.node.setPosition(35,6);g.purchaseProgress.node.setPosition(35,-20);g.buyNode.setPosition(35,-57);const card=g.upgradeView.getChildByName('UpgradeCard').getComponent(Graphics);card.clear();box(card,-155,-76,310,144,25,'#b29355');box(card,-155,-72,310,144,25,'#fffcf1');poly(card,[[-18,-72],[0,-104],[18,-72]],'#fffcf1');g.upgradeView.setPosition(0,108);const label=text(g.ui,'VisualAcceptanceOnly','参考构图 · 示例金币不计入存档\n开始后进入V03宽田收割',0,-470,14,520,46);label.color=color('#fff9da');(globalThis as any).__REFERENCE_LAYOUT__=this;}
 update(){this.field?.build();if(this.host){this.host.mainLabel.string=this.launching?'正在进入…':'开始游戏';this.host.upgradeView.setPosition(0,108);this.host.animationStatus.node.active=false;}}
}
