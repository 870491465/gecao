const assert=require('node:assert/strict'),fs=require('fs'),crypto=require('crypto');
const {COMBINE,combineFrame,combineBunch,combineWorldY,combineCutY}=require('../temp/model-tests/CombineHarvesterConfig.js');
const {LEVELS,cutY,columnX,continuousRows}=require('../temp/model-tests/Config.js');
const {HarvestModel}=require('../temp/model-tests/HarvestModel.js');
const source='docs/OrangeCat_Combine_V01',target='assets/resources/cat-combine-v01';
const config=JSON.parse(fs.readFileSync(source+'/animation.json','utf8'));
assert.deepEqual(config,JSON.parse(fs.readFileSync(target+'/animation.json','utf8')));assert.equal(config.frameCount,COMBINE.frames);assert.equal(config.fps,COMBINE.fps);
const hash=p=>crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');
for(let i=0;i<24;i++){const name='/frames/combine_'+String(i).padStart(2,'0')+'.png',png=fs.readFileSync(target+name);assert.equal(hash(source+name),hash(target+name));assert.equal(png.readUInt32BE(16),768);assert.equal(png.readUInt32BE(20),640);assert.equal(png[25],6);}
const cfg=LEVELS[3],centers=new Set();assert.equal(cfg.next,38400);for(let col=0;col<cfg.cols;col++){const b=combineBunch(col,cfg.cols);centers.add(b.center);assert.equal(b.slices,2);assert.equal(cutY(cfg,col),combineCutY());assert(Math.abs(columnX(cfg,col))<308*COMBINE.scale);}assert.equal(centers.size,4);assert.equal(combineWorldY(590),COMBINE.groundY);
for(let i=0;i<24;i++)assert.equal(combineFrame(i/20*cfg.speed,cfg.speed),i);assert.equal(combineFrame(1.2*cfg.speed,cfg.speed),0);assert.equal(continuousRows(cfg,1,4,90),continuousRows(cfg,2,0,0));
const upgrade=new HarvestModel();upgrade.debugLevel(3);upgrade.s.coins=14400;assert(upgrade.purchase());assert.equal(upgrade.s.level,4);assert.equal(upgrade.s.coins,0);for(let i=0;i<20;i++)assert(!upgrade.purchase());
const m=new HarvestModel();m.debugLevel(4);m.s.started=true;m.start();m.update(2);assert.equal(m.s.coins,320);assert.equal(m.s.totalCut,40);m.pause();const saved=m.snapshot(),frame=combineFrame(continuousRows(cfg,saved.round,saved.lane,saved.distance),cfg.speed);m.update(10);assert.deepEqual(m.snapshot(),saved);const restored=new HarvestModel(saved);assert.equal(combineFrame(continuousRows(cfg,restored.s.round,restored.s.lane,restored.s.distance),cfg.speed),frame);
let celebrations=0;m.onNotice=s=>{if(s.includes('最高级首田'))celebrations++;};for(const round of [1,2]){Object.assign(m.s,{round,lane:4,row:89,distance:89.95,phase:0,mask:0,remaining:0});m.state='Harvesting';m.update(1);}assert.equal(celebrations,0);assert.equal(m.s.round,3);assert(!m.s.celebrated);m.s.coins=38400;assert(m.purchase());assert.equal(m.s.level,5);assert.equal(m.s.coins,0);
for(const check of Object.values(JSON.parse(fs.readFileSync(source+'/validation.json','utf8'))))assert(check.minimumFrameChange>1);
console.log('PASS 24 original combine frames, grounded rear tires, four grass ridges, reel alignment, atomic final upgrade, row income, pause/reload, upgrade to fullscreen stage five');
