const fs=require('fs'),crypto=require('crypto'),assert=require('assert/strict');
const {sampleWalk,advanceWalkPhase,sampleGait,gaitPhase,amplitudeForRow,WALK}=require('../temp/model-tests/CatWalk.js');
const {CAT_MOTION,approachFraction,bladeContact,catArmAngle,bladePixelFor}=require('../temp/model-tests/CatMotion.js');
const {LEVELS,columnX,cutY,hitPhase}=require('../temp/model-tests/Config.js');
const {HarvestModel}=require('../temp/model-tests/HarvestModel.js');
const source='docs/OrangeCat_Walk_V02',target='assets/resources/cat-walk-v02';
const cfg=JSON.parse(fs.readFileSync(source+'/parts_config.json','utf8'));
assert.equal(cfg.parts.length,6);assert(!cfg.parts.some(p=>p.name==='cat_body_feet'));
for(const p of cfg.parts){const hash=f=>crypto.createHash('sha256').update(fs.readFileSync(f)).digest('hex');assert.equal(hash(source+'/'+p.file),hash(target+'/'+p.file));}
assert.deepEqual(cfg,JSON.parse(fs.readFileSync(target+'/parts_config.json','utf8')));
assert.deepEqual(cfg,JSON.parse(fs.readFileSync('assets/scripts/CatPartsConfig.ts','utf8').split('export const CAT_PARTS = ')[1].split(' as const;')[0]));
assert(fs.readFileSync('assets/scripts/CatWalkSource.ts','utf8').endsWith(fs.readFileSync(source+'/walk_motion.js','utf8')));
const amplitude=amplitudeForRow(CAT_MOTION.rowSpace,CAT_MOTION.scale);
assert(Math.abs(4*amplitude*CAT_MOTION.scale-CAT_MOTION.rowSpace)<1e-10);
// Support foot displacement must match actual scrolling, including acceleration/deceleration.
const p=.1,delta=.0001,g0=sampleGait(p,amplitude),g1=sampleGait(p+delta,amplitude);
assert(Math.abs((g1.leftFootYOffset-g0.leftFootYOffset)*CAT_MOTION.scale+4*amplitude*delta*CAT_MOTION.scale)<1e-9);
for(let i=0;i<100;i++){const s=sampleWalk(i/100),a=sampleGait(i/100,12);assert.deepEqual(s,a);assert(s.upperBodyYOffset>=0&&s.upperBodyYOffset<=3);assert(Math.abs(s.leftFootYOffset)<=17);}
assert.equal(advanceWalkPhase(.2,48),.19999999999999996);assert(Math.abs(approachFraction(.55))<1e-12);assert.equal(approachFraction(1),1);
const {v03Contact}=require('../temp/model-tests/V03Motion.js');
const {manualHit,manualTarget,manualColumn}=require('../temp/model-tests/ManualSickle.js');
for(let col=0;col<2;col++){const phase=manualHit(1,2,col),point=v03Contact(phase,1);assert(phase>.2&&phase<.4);assert(Math.abs(point.x-manualColumn(1,2,col))<1e-7);assert(Math.abs(point.y-manualTarget(1,2,col).y)<1e-7);}
const m=new HarvestModel();m.start();const abs=()=>((m.s.round-1)*m.cfg.lanes+m.s.lane)*m.cfg.rows+m.s.distance;
let last=abs();for(let i=0;i<10000;i++){m.update(1/120);const d=abs();assert(d>=last-1e-8);last=d;}
m.pause();const frozen=m.snapshot(),gait=gaitPhase(abs()*28,.26,amplitude);m.update(5);assert.deepEqual(m.snapshot(),frozen);assert.equal(gaitPhase(abs()*28,.26,amplitude),gait);
const restored=new HarvestModel(m.snapshot());assert.equal(restored.s.distance,m.s.distance);
console.log('PASS V02 six original layers, supplied math, support-foot/map synchronization, bounded bob, continuous lane/round gait, pause and restored distance');
