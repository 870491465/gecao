const assert=require('node:assert/strict'),fs=require('fs'),crypto=require('crypto');
const {RIDE,rideFrame,rideBunch,rideWorldY,rideCutY}=require('../temp/model-tests/RideHarvesterConfig.js');
const {LEVELS,cutY,columnX,continuousRows}=require('../temp/model-tests/Config.js');
const {HarvestModel}=require('../temp/model-tests/HarvestModel.js');
const source='docs/OrangeCat_Ride_V02',target='assets/resources/cat-ride-v02';
const config=JSON.parse(fs.readFileSync(source+'/animation.json','utf8'));
assert.deepEqual(config,JSON.parse(fs.readFileSync(target+'/animation.json','utf8')));assert.equal(config.frames,RIDE.frames);assert.equal(config.fps,RIDE.fps);
const hash=p=>crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');
for(let i=0;i<24;i++){const name='/frames/ride_'+String(i).padStart(2,'0')+'.png',png=fs.readFileSync(target+name);assert.equal(hash(source+name),hash(target+name));assert.equal(png.readUInt32BE(16),RIDE.width);assert.equal(png.readUInt32BE(20),RIDE.height);assert.equal(png[25],6);}
const cfg=LEVELS[2],centers=new Set();for(let col=0;col<cfg.cols;col++){const bunch=rideBunch(col,cfg.cols);centers.add(bunch.center);assert.equal(bunch.slices,2);assert.equal(cutY(cfg,col),rideCutY());assert(Math.abs(columnX(cfg,col))<300*RIDE.scale);}
assert.equal(centers.size,3);assert.equal(rideWorldY(575),RIDE.groundY);assert.equal(rideWorldY(RIDE.reelSourceY),rideCutY());
for(let i=0;i<24;i++)assert.equal(rideFrame(i/20*cfg.speed,cfg.speed),i);assert.equal(rideFrame(1.2*cfg.speed,cfg.speed),0);
assert.equal(continuousRows(cfg,1,0,cfg.rows),continuousRows(cfg,1,1,0));
const m=new HarvestModel();m.debugLevel(3);m.start();m.update(1);assert.equal(m.s.coins,60);assert.equal(m.s.totalCut,12);m.pause();const saved=m.snapshot(),frame=rideFrame(continuousRows(cfg,saved.round,saved.lane,saved.distance),cfg.speed);m.update(10);assert.deepEqual(m.snapshot(),saved);const restored=new HarvestModel(saved);assert.equal(rideFrame(continuousRows(cfg,restored.s.round,restored.s.lane,restored.s.distance),cfg.speed),frame);
for(const check of Object.values(JSON.parse(fs.readFileSync(source+'/wheel_motion_checks.json','utf8'))))assert(check.changedPixels>2000);
console.log('PASS original 24 RGBA ride frames, source metadata, grounded rear wheels, three grass bunches, reel contact, 20fps loop, exact row income and paused reload');
