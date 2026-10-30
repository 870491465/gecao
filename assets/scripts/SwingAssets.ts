import { resources,JsonAsset,ImageAsset,SpriteFrame,Texture2D,Rect,Size,Vec2 } from 'cc';
import { SwingClip,SwingPlan } from './SwingSequence';
export function imageFrame(path:string){return new Promise<SpriteFrame>((resolve,reject)=>resources.load(path,ImageAsset,(e,img)=>{if(e){reject(e);return;}const texture=new Texture2D();texture.image=img;const f=new SpriteFrame();f.texture=texture;f.rect=new Rect(0,0,img.width,img.height);f.originalSize=new Size(img.width,img.height);f.offset=new Vec2(0,0);f.name=path;resolve(f);}));}
export type LoadedSwing={plan:SwingPlan;frames:SpriteFrame[]};
let shared:Promise<{clips:Map<number,LoadedSwing>;issues:string[]}>;
export function loadSwingLibrary(){
 if(!shared)shared=new Promise<any>((resolve,reject)=>resources.load('cat-swing-sequence/sequence',JsonAsset,(e,a)=>e?reject(e):resolve(a.json))).then(async data=>{
  const clips=new Map<number,LoadedSwing>(),issues:string[]=[];if(data.schemaVersion!==1||!Array.isArray(data.clips))return {clips,issues:['序列配置版本错误']};
  for(const c of data.clips as SwingClip[]){if(!c.enabled)continue;try{if(clips.has(c.level))throw Error('同级存在重复序列');const plan=new SwingPlan(c),frames=await Promise.all(c.frames.map(f=>imageFrame(f.file)));for(const f of frames)if(f.width!==c.canvas[0]||f.height!==c.canvas[1])throw Error('实际 PNG 画布与配置不同');clips.set(c.level,{plan,frames});}catch(e){issues.push(`${c.id||'unknown'}: ${String(e)}`);}}
  return {clips,issues};
 }).catch(e=>({clips:new Map<number,LoadedSwing>(),issues:[String(e)]}));return shared;
}
