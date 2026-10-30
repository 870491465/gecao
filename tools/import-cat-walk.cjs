const fs=require('fs'),path=require('path');
const source='docs/OrangeCat_Walk_V02',target='assets/resources/cat-walk-v02';
const config=JSON.parse(fs.readFileSync(path.join(source,'parts_config.json'),'utf8'));
fs.mkdirSync(path.join(target,'textures'),{recursive:true});
for(const p of config.parts)fs.copyFileSync(path.join(source,p.file),path.join(target,p.file));
fs.writeFileSync(path.join(target,'parts_config.json'),JSON.stringify(config,null,2));
fs.writeFileSync('assets/scripts/CatPartsConfig.ts','// Generated from OrangeCat_Walk_V02/parts_config.json. Keep the source package unchanged.\nexport const CAT_PARTS = '+JSON.stringify(config,null,2)+' as const;\n');
fs.writeFileSync('assets/scripts/CatWalkSource.ts','// Copied verbatim from OrangeCat_Walk_V02/walk_motion.js; default preview mathematics.\n'+fs.readFileSync(path.join(source,'walk_motion.js'),'utf8'));
console.log('Imported all six V02 original PNGs, assembly config and supplied walk functions.');
