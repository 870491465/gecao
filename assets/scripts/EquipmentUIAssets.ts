import { SpriteFrame,Rect,Size } from 'cc';
import { imageFrame } from './SwingAssets';
export const EQUIPMENT_KEYS=['equip_01_sickle','equip_03_push_harvester','equip_04_ride_harvester','equip_05_combine','equip_05_combine','equip_05_combine'];
let bank:Promise<Map<string,SpriteFrame>>;
export function equipmentFrames(){
 if(!bank){const names=['tile_normal','selection_border','active_dot','lock','button_green','start_play',...EQUIPMENT_KEYS,...EQUIPMENT_KEYS.map(n=>n+'_gray')].filter((name,index,all)=>all.indexOf(name)===index);bank=Promise.all(names.map(async(n):Promise<[string,SpriteFrame]>=>{
  const frame=await imageFrame(n==='start_play'?'ui/start_play':'equipment-ui-v01/textures/'+n);
  // Keep the supplied PNG intact; display only the icon and its antialiased edge.
  if(n==='start_play'){frame.rect=new Rect(220,175,855,925);frame.originalSize=new Size(855,925);}
  return [n,frame];
 })).then(a=>new Map(a));}
 return bank;
}
