// Copy the supplied RGBA originals byte-for-byte. Never crop, resize or regenerate them.
const fs=require('fs'),path=require('path');
const source='docs/OrangeCat_Cocos_Parts_V01',target='assets/resources/cat-v01';
const config=JSON.parse(fs.readFileSync(path.join(source,'parts_config.json'),'utf8'));
fs.mkdirSync(path.join(target,'textures'),{recursive:true});
for(const p of config.parts){const data=fs.readFileSync(path.join(source,p.file));fs.writeFileSync(path.join(target,p.file),data);}
fs.writeFileSync(path.join(target,'parts_config.json'),JSON.stringify(config,null,2));
fs.writeFileSync('assets/scripts/CatPartsConfig.ts','// Generated from the supplied parts_config.json by tools/import-cat-parts.cjs.\nexport const CAT_PARTS = '+JSON.stringify(config,null,2)+' as const;\n');
console.log('Imported four original, untrimmed RGBA parts and exact assembly config.');
