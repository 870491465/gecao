const assert=require('node:assert/strict'),fs=require('fs'),crypto=require('crypto');
const {PUSH,pushFrame,pushBunch,pushCutY}=require('../temp/model-tests/PushHarvesterConfig.js');
const {LEVELS,cutY,columnX,rowSpacing,fieldWidth}=require('../temp/model-tests/Config.js');
const {HarvestModel}=require('../temp/model-tests/HarvestModel.js');
const {SICKLE}=require('../temp/model-tests/SickleWalkConfig.js'),{V03}=require('../temp/model-tests/V03Motion.js');
const source='docs/OrangeCat_Push_Color_V03',target='assets/resources/cat-push-color-v03';
const config=JSON.parse(fs.readFileSync(source+'/animation.json','utf8'));
assert.deepEqual(config,JSON.parse(fs.readFileSync(target+'/animation.json','utf8')));
assert.equal(config.frames,PUSH.frames);assert.equal(config.fps,PUSH.fps);
const hash=p=>crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');
for(let i=0;i<PUSH.frames;i++){const name='/frames/push_'+String(i).padStart(2,'0')+'.png',png=fs.readFileSync(target+name);assert.equal(hash(source+name),hash(target+name));assert.equal(png.readUInt32BE(16),PUSH.width);assert.equal(png.readUInt32BE(20),PUSH.height);assert.equal(png[25],6);}
assert(config.singleSprite&&config.loop);assert.deepEqual(config.cuttingSpan,PUSH.cuttingSpan);assert.equal(config.duration,1.2);
const cfg=LEVELS[1],centers=new Set();assert.equal(cfg.lanes,2);
for(let col=0;col<cfg.cols;col++){
 const bunch=pushBunch(col,cfg.cols);centers.add(bunch.center);assert.equal(bunch.slices,2);assert.equal(cutY(cfg,col),pushCutY());
 const x=columnX(cfg,col);assert(x>=(138-256)*PUSH.scale&&x<=(380-256)*PUSH.scale,'crop stems must fit original reel');
}
assert.equal(centers.size,2);assert(Math.abs([...centers][1]-[...centers][0]-PUSH.bunchSpacing)<1e-9);assert.equal(rowSpacing(cfg),PUSH.rowSpace);
assert.equal(PUSH.catHeight,SICKLE.bodySourceHeight*SICKLE.scale*1.12);assert(Math.abs((PUSH.feetSourceY-PUSH.catTopY)*PUSH.scale-PUSH.catHeight)<1e-9);
assert.equal(PUSH.grassCanvas,V03.grassCanvas[0]);assert.equal(PUSH.fieldWidth,240);assert.equal(fieldWidth(LEVELS[0]),180);assert(Math.abs(PUSH.scale-180.5748*1.12/299)<1e-12);
for(let frame=0;frame<24;frame++)assert.equal(pushFrame(frame/PUSH.fps*cfg.speed,cfg.speed),frame);assert.equal(pushFrame(1.2*cfg.speed,cfg.speed),0);
const old={...HarvestModel.fresh(),equipmentRevision:2,level:2,lane:2,round:3,row:17,distance:17.4,mask:5,coins:837,started:true};
const migrated=new HarvestModel(old);assert.equal(migrated.s.round,4);assert.equal(migrated.s.lane,0);assert.equal(migrated.s.row,17);assert.equal(migrated.s.mask,5);assert.equal(migrated.s.coins,837);assert.deepEqual(new HarvestModel(migrated.snapshot()).snapshot(),migrated.snapshot());
const pose=()=>pushFrame(migrated.s.distance,cfg.speed);const frozen=pose();migrated.update(10);assert.equal(pose(),frozen);migrated.start();migrated.update(.5);assert.notEqual(pose(),frozen);
console.log('PASS original 24 frames unchanged, stage-one visual cat size, two wider grass ridges, first-stage grass and stump size, complete Color V03 cat and machine, wider second-stage soil, pause and save migration');
