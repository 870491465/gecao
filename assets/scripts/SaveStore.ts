import { sys } from 'cc';
import { HarvestModel, Snapshot } from './HarvestModel';
export const SAVE_KEY='orange-cat.harvest.v2';
export class SaveStore {
 message='';
 load():Snapshot|undefined {
  // Unknown or incompatible saves are copied before any new snapshot is written.
  const raw=sys.localStorage.getItem(SAVE_KEY);
  if(raw){try{const s=HarvestModel.migrate(JSON.parse(raw));HarvestModel.validate(s);return s;}catch(e){sys.localStorage.setItem(SAVE_KEY+'.backup.'+Date.now(),raw);this.message='存档异常，原文已备份。开发面板可重置。';throw e;}}
  for(const key of ['orange-cat.save','orange-cat.harvest.v1','orangeCatSave']){const old=sys.localStorage.getItem(key);if(old){sys.localStorage.setItem(key+'.backup.'+Date.now(),old);this.message='发现旧存档，已备份；V0.2 使用独立进度。';}}
  return undefined;
 }
 save(m:HarvestModel){sys.localStorage.setItem(SAVE_KEY,JSON.stringify(m.snapshot()));}
 reset(){const raw=sys.localStorage.getItem(SAVE_KEY);if(raw)sys.localStorage.setItem(SAVE_KEY+'.backup.'+Date.now(),raw);sys.localStorage.removeItem(SAVE_KEY);}
}
