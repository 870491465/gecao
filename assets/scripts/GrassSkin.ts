import { Node,Sprite,SpriteFrame,Texture2D,ImageAsset,UITransform,UIOpacity,Rect,Size,Vec2,resources,isValid,JsonAsset } from 'cc';
import { node } from './Art';
import { GRASS,grassVariant,groundSegments } from './GrassLayout';
import { RICE,RICE_IMAGES,RICE_PARTICLES } from './RiceConfig';
import { imageFrame } from './SwingAssets';
import { combineOutlet } from './CombineHarvesterConfig';
let ricePromise:Promise<Map<string,SpriteFrame>>;
function riceJSON(path:string){return new Promise<any>((resolve,reject)=>resources.load(path,JsonAsset,(error,asset)=>error?reject(error):resolve(asset.json)));}
function loadRice(){if(!ricePromise)ricePromise=Promise.all([riceJSON('rice-v01/assets'),riceJSON('rice-v01/rice-atlas'),imageFrame('rice-v01/rice-atlas')]).then(([config,atlas,packed])=>{
 packed.packable=false;
 const entries=RICE_IMAGES.map(name=>{const a=config.assets[name],r=atlas.frames[name]?.rect;if(!a||!r||r[2]!==a.size[0]||r[3]!==a.size[1])throw Error('Rice atlas size mismatch: '+name);if(name.startsWith('rice_mature')||name==='rice_stubble'){if(a.anchor[0]!==RICE.anchorX||a.anchor[1]!==RICE.anchorY)throw Error('Rice crop anchor mismatch');}const frame=new SpriteFrame();frame.texture=packed.texture;frame.rect=new Rect(r[0],r[1],r[2],r[3]);frame.originalSize=new Size(r[2],r[3]);frame.offset=new Vec2(0,0);frame.packable=false;frame.name='rice-v01/textures/'+name;return [name,frame] as [string,SpriteFrame];});return new Map(entries);
 });return ricePromise;}
let promise:Promise<Map<string,SpriteFrame>>;
function load(){if(!promise){const names=['ground_scroll','grass_mature_A','grass_mature_B','grass_mature_C','grass_stubble_A','grass_stubble_B','grass_stubble_C','fx_leaf','fx_stem'];promise=Promise.all(names.map(name=>new Promise<[string,SpriteFrame]>((ok,fail)=>resources.load('grass-batch02/'+name,ImageAsset,(error,image)=>{if(error){fail(error);return;}const texture=new Texture2D();texture.image=image;const frame=new SpriteFrame();frame.name=name;frame.texture=texture;frame.rect=new Rect(0,0,image.width,image.height);frame.originalSize=new Size(image.width,image.height);frame.offset=new Vec2(0,0);ok([name,frame]);})))).then(entries=>{const map=new Map(entries),texture=map.get('ground_scroll').texture;for(const [name,x,width] of [['ground_left_edge',0,208],['ground_soil',208,352],['ground_right_edge',560,208]] as [string,number,number][]){const frame=new SpriteFrame();frame.name=name;frame.texture=texture;frame.rect=new Rect(x,0,width,1536);frame.originalSize=new Size(width,1536);frame.offset=new Vec2(0,0);map.set(name,frame);}return map;});}return promise;}
type PlantVisual={node:Node;sprite:Sprite;alpha:UIOpacity;variant:string;state:string;rice?:boolean};
type Debris={n:Node;vx:number;vy:number;age:number;spin:number;life?:number;outlet?:boolean};
export class GrassSkin {
 ready=false;error='';frames:Map<string,SpriteFrame>;ground:Node;fxRoot:Node;tiles:Node[][]=[];plants=new Map<Node,PlantVisual>();fxPool:Node[]=[];debris:Debris[]=[];emitted=0;
 riceReady=false;riceLoading=false;riceFrames:Map<string,SpriteFrame>;
 groundKey='';
 outletRemaining=0;outletClock=0;outletSerial=0;outletEmitted=0;
 discharge(){this.outletRemaining=.5;}
 spray(dt:number,level:number){
  if(dt<=0||level<4||!this.ready||(level>=6&&!this.riceReady))return;
  const active=Math.min(dt,this.outletRemaining);this.outletRemaining=Math.max(0,this.outletRemaining-dt);if(active<=0){this.outletClock=0;return;}
  this.outletClock+=active;const p=combineOutlet(level),rice=level>=6;
  while(this.outletClock>=.035){this.outletClock-=.035;if(this.debris.filter(p=>p.outlet).length>=18)continue;
   const i=this.outletSerial++,n=this.fxPool.pop()||node('GrassDebris',this.fxRoot);if(!n.getComponent(Sprite)){n.addComponent(Sprite).sizeMode=Sprite.SizeMode.CUSTOM;n.addComponent(UIOpacity);}
   const name=rice?RICE_PARTICLES[i%RICE_PARTICLES.length]:i%2?'fx_leaf':'fx_stem',frame=(rice?this.riceFrames:this.frames).get(name),size=22+(i%4)*3;
   n.active=true;n.setPosition(p.x+(i%3-1)*3,p.y-24);n.angle=i*137%360;n.setScale(1,1,1);const t=n.getComponent(UITransform);t.setContentSize(size,size*frame.rect.height/frame.rect.width);t.setAnchorPoint(.5,.5);n.getComponent(Sprite).spriteFrame=frame;n.getComponent(UIOpacity).opacity=255;
   this.debris.push({n,vx:55+(i*17%45),vy:-55-(i*23%80),age:0,spin:i%2?240:-280,life:.56,outlet:true});this.outletEmitted++;
  }
 }
 ensureRice(){if(this.riceLoading)return;this.riceLoading=true;loadRice().then(frames=>{if(!isValid(this.ground,true))return;this.riceFrames=frames;this.riceReady=true;}).catch(e=>{this.error=String(e);console.error('Rice V01',e);});}
 constructor(parent:Node,fxParent:Node){this.ground=node('Batch02GroundSegments',parent);this.fxRoot=node('GrassDebrisPool',fxParent);for(let i=0;i<3;i++){const parts:Node[]=[];for(const name of ['ground_left_edge','ground_soil','ground_right_edge']){const n=node(name,this.ground);n.getComponent(UITransform).setAnchorPoint(0,0);n.addComponent(Sprite).sizeMode=Sprite.SizeMode.CUSTOM;parts.push(n);}this.tiles.push(parts);}this.ground.active=false;
  load().then(frames=>{if(!isValid(this.ground,true))return;this.frames=frames;this.ready=true;for(const tile of this.tiles)for(const n of tile)n.getComponent(Sprite).spriteFrame=frames.get(n.name);}).catch(e=>{this.error=String(e);console.error('Grass Batch02 load',e);});
 }
 groundLayout(center:number,width:number,distancePixels:number){if(!this.ready)return;const key=center+':'+width,changed=key!==this.groundKey;this.groundKey=key;const soil=width+GRASS.soilMargin,left=center-soil/2,right=center+soil/2,x=[-360,left,right],w=[left+360,soil,360-right],ys=groundSegments(distancePixels);for(let i=0;i<this.tiles.length;i++)for(let j=0;j<3;j++){const n=this.tiles[i][j],y=i<2?ys[i]:ys[0]-GRASS.groundHeight;if(n.position.x!==x[j]||n.position.y!==y)n.setPosition(x[j],y);if(changed)n.getComponent(UITransform).setContentSize(Math.max(1,w[j]),GRASS.groundHeight);}}
 visual(root:Node){let v=this.plants.get(root);if(!v){const n=node('PairedGrassSprite',root);n.getComponent(UITransform).setAnchorPoint(GRASS.anchorX,GRASS.anchorY);n.getComponent(UITransform).setContentSize(GRASS.canvas,GRASS.canvas);const sprite=n.addComponent(Sprite);sprite.sizeMode=Sprite.SizeMode.CUSTOM;sprite.trim=false;v={node:n,sprite,alpha:n.addComponent(UIOpacity),variant:'',state:''};this.plants.set(root,v);}return v;}
 reset(root:Node){const v=this.plants.get(root);if(v){v.node.angle=0;v.node.setScale(1,1,1);v.node.setPosition(0,0);v.alpha.opacity=255;v.variant='';v.state='';}}
 plant(root:Node,variant:string,cut:boolean,age:number,enabled:boolean,rice=false){
  if(!enabled){const old=this.plants.get(root);if(old)old.node.active=false;return;}
  const v=this.visual(root);v.node.active=this.ready&&(!rice||this.riceReady);if(!v.node.active)return;
  const duration=rice?.16:GRASS.fallSeconds,falling=cut&&age<duration,state=falling||!cut?'mature':'stubble';
  if(v.variant!==variant||v.state!==state||v.rice!==rice){
   const key=rice?(state==='stubble'?'rice_stubble':'rice_mature_0'+(['A','B','C'].indexOf(variant)+1)):'grass_'+state+'_'+variant;
   v.sprite.spriteFrame=(rice?this.riceFrames:this.frames).get(key);
   if(v.rice!==rice)v.node.getComponent(UITransform).setAnchorPoint(rice?RICE.anchorX:GRASS.anchorX,rice?RICE.anchorY:GRASS.anchorY);
   v.variant=variant;v.state=state;v.rice=rice;
  }
  const p=falling?Math.max(0,age/duration):0,angle=falling?(rice?-10:-28)*p:0,scale=falling?1-.65*p:1,opacity=falling?Math.round(255*(1-.8*p)):255;
  if(v.node.angle!==angle)v.node.angle=angle;if(v.node.scale.x!==1||v.node.scale.y!==scale)v.node.setScale(1,scale,1);if(v.alpha.opacity!==opacity)v.alpha.opacity=opacity;
 }
 emit(x:number,y:number,seed:number,strength=1,rice=false){
  if(!this.ready||(rice&&!this.riceReady))return;const count=Math.min(6,Math.round(GRASS.fxCount*strength));
  for(let i=0;i<count&&this.debris.length<GRASS.fxLimit;i++){
   const n=this.fxPool.pop()||node('GrassDebris',this.fxRoot);
   if(!n.getComponent(Sprite)){n.addComponent(Sprite).sizeMode=Sprite.SizeMode.CUSTOM;n.addComponent(UIOpacity);}
   n.active=true;n.setPosition(x,y+5);n.angle=(seed*37+i*83)%360;n.setScale(1,1,1);
   const name=rice?RICE_PARTICLES[(seed+i)%RICE_PARTICLES.length]:(seed+i)%2?'fx_leaf':'fx_stem',frame=(rice?this.riceFrames:this.frames).get(name);
   const size=(GRASS.fxBaseSize+(i%3)*GRASS.fxSizeStep)*strength,t=n.getComponent(UITransform);t.setContentSize(size,size*frame.rect.height/frame.rect.width);t.setAnchorPoint(.5,rice?(name.startsWith('rice_grain')?.2:1/6):.5);
   n.getComponent(Sprite).spriteFrame=frame;n.getComponent(UIOpacity).opacity=255;
   this.debris.push({n,vx:((i-(count-1)/2)*60+(seed%7-3)*4)*strength,vy:(90+(seed+i*13)%5*20)*strength,age:0,spin:(i%2?-1:1)*(180+seed%90)*strength});this.emitted++;
  }
 }
 tick(dt:number){this.debris=this.debris.filter(p=>{const life=p.life||GRASS.fxSeconds;p.age+=dt;if(p.age>=life){p.n.active=false;p.n.angle=0;p.n.getComponent(UIOpacity).opacity=255;this.fxPool.push(p.n);return false;}const pos=p.n.position;p.n.setPosition(pos.x+p.vx*dt,pos.y+p.vy*dt-210*dt*dt);p.vy-=420*dt;p.n.angle+=p.spin*dt;p.n.getComponent(UIOpacity).opacity=Math.round(255*(1-p.age/life));return true;});}
 clearFeedback(){for(const p of this.debris){p.n.active=false;this.fxPool.push(p.n);}this.debris=[];this.outletRemaining=0;this.outletClock=0;}
}
