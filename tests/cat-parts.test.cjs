const fs=require('fs'),crypto=require('crypto'),assert=require('assert/strict');
const {LEVELS,columnX,cutY,hitPhase}=require('../temp/model-tests/Config.js');
const {CAT_MOTION,catArmAngle,bladeContact,bladePixelFor}=require('../temp/model-tests/CatMotion.js');
const config=JSON.parse(fs.readFileSync('docs/OrangeCat_Cocos_Parts_V01/parts_config.json','utf8'));
for(const p of config.parts){const source=fs.readFileSync('docs/OrangeCat_Cocos_Parts_V01/'+p.file),asset=fs.readFileSync('assets/resources/cat-v01/'+p.file);assert.equal(crypto.createHash('sha256').update(source).digest('hex'),crypto.createHash('sha256').update(asset).digest('hex'));}
assert.deepEqual(config,JSON.parse(fs.readFileSync('assets/resources/cat-v01/parts_config.json','utf8')));
assert.deepEqual(config,JSON.parse(fs.readFileSync('assets/scripts/CatPartsConfig.ts','utf8').split('export const CAT_PARTS = ')[1].split(' as const;')[0]));
const arm=config.parts.find(p=>p.name==='cat_right_arm_sickle');assert.deepEqual(CAT_MOTION.rightPivot,arm.pivot_px_top_left);assert.deepEqual(CAT_MOTION.rightPosition,arm.position_from_feet_root_y_up);assert.equal(CAT_MOTION.rightScale,arm.local_scale);
for(let i=0;i<=1000;i++){const a=catArmAngle(i/1000);assert(a>=CAT_MOTION.windup-.00001&&a<=CAT_MOTION.follow+.00001);}
assert.equal(catArmAngle(0),catArmAngle(1));
for(const level of LEVELS.slice(0,2))for(let col=0;col<level.cols;col++){const pixel=bladePixelFor(level.cols,col),x=columnX(level,col),phase=hitPhase(level,col),point=bladeContact(catArmAngle(phase),pixel);assert(bladeContact(catArmAngle(.2),pixel).x>x);assert(bladeContact(catArmAngle(.4),pixel).x<x);assert(phase>.2&&phase<.4);assert(Math.abs(point.x-x)<1e-7);assert(Math.abs(point.y-cutY(level,col))<1e-7);}
console.log('PASS cat originals byte-identical, exact source assembly, continuous restrained pose, all columns physically reachable');
