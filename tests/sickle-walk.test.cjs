const assert=require('node:assert/strict'),fs=require('fs'),crypto=require('crypto');
const {SICKLE,SICKLE_TRACK,sickleBlade,sickleContact,sickleFrame}=require('../temp/model-tests/SickleWalkConfig.js');
const {LEVELS,cutY,hitPhase,columnX}=require('../temp/model-tests/Config.js');
const {HarvestModel}=require('../temp/model-tests/HarvestModel.js');
const source='docs/OrangeCat_Sickle_Walk_V02',target='assets/resources/cat-sickle-walk-v02';
const config=JSON.parse(fs.readFileSync(source+'/animation.json','utf8'));
assert.deepEqual(config,JSON.parse(fs.readFileSync(target+'/animation.json','utf8')));
assert.equal(config.fps,24);assert.equal(config.frames.length,24);
const hash=p=>crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');
for(let i=0;i<24;i++){
 const name='/frames/swing_'+String(i).padStart(2,'0')+'.png',png=fs.readFileSync(target+name);assert.equal(hash(source+name),hash(target+name));assert.equal(png.readUInt32BE(16),640);assert.equal(png.readUInt32BE(20),640);assert.equal(png[25],6);
 const m=config.frames[i].draws.find(d=>d.part==='cat_right_arm_sickle').matrix;
 const x=(m[0][0]*430+m[0][1]*177+m[0][2]-300)*SICKLE.scale,y=(550-m[1][0]*430-m[1][1]*177-m[1][2])*SICKLE.scale;
 assert(Math.abs(SICKLE_TRACK[i].x-x)<1e-9);assert(Math.abs(SICKLE_TRACK[i].y-y)<1e-9);assert.equal(sickleFrame(i/24),i);
}
assert(Math.abs(SICKLE.bodySourceHeight*SICKLE.scale-180.58)<.1);
const cfg=LEVELS[0];for(let col=0;col<cfg.cols;col++){
 const hit=sickleContact(cfg.cols,col),blade=sickleBlade(hit.phase);assert(Math.abs(blade.x-columnX(cfg,col))<1e-8);assert.equal(hitPhase(cfg,col),hit.phase);
 assert(Math.abs(cutY(cfg,col)-hit.phase*SICKLE.rowSpace-(SICKLE.feetY+blade.y))<1e-8);
}
const m=new HarvestModel(),events=[];m.onCut=e=>events.push({phase:m.s.phase,col:e.col});m.start();m.update(.5);assert.equal(m.s.coins,1);assert.equal(m.s.mask,2);assert.equal(sickleFrame(m.s.phase),12);m.update(.5);assert.equal(m.s.coins,2);assert.equal(m.s.row,1);assert.deepEqual(events.map(e=>e.col),[1,0]);
console.log('PASS 24 unchanged sickle/walk frames, source arm matrices, 181px cat, exact blade/crop contact and one payout per cut');
