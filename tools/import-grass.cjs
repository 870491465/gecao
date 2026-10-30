const fs=require('fs'),path=require('path');const source='docs/Grass_Field_Batch02',target='assets/resources/grass-batch02';fs.mkdirSync(target,{recursive:true});
// The supplied right-edge PNG is truncated; the intact full ground supplies all three runtime UV regions.
for(const file of fs.readdirSync(source+'/textures'))if(file.endsWith('.png')&&file!=='ground_right_edge.png')fs.copyFileSync(source+'/textures/'+file,target+'/'+file);
const config=JSON.parse(fs.readFileSync(source+'/asset_config.json','utf8'));fs.writeFileSync(target+'/asset_config.json',JSON.stringify(config,null,2));
fs.writeFileSync('assets/scripts/GrassAssetConfig.ts','// Generated from Grass_Field_Batch02/asset_config.json.\nexport const GRASS_ASSETS = '+JSON.stringify(config,null,2)+' as const;\n');console.log('Imported 12 decodable original PNGs; truncated right-edge source remains untouched in docs. Runtime ground uses full-image UV regions.');
