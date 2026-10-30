const assert=require('assert/strict'),fs=require('fs'),crypto=require('crypto');
const {v03Pose,v03Contact,V03,COMBINED,v03ToolScale,v03LeftArm}=require('../temp/model-tests/V03Motion.js');
const {manualHit,manualTarget,manualColumn}=require('../temp/model-tests/ManualSickle.js');
for(const level of [1,2])for(let i=0;i<=1000;i++){
 const p=v03Pose(i/1000,level);
 assert(p.attachment.x>-1&&p.attachment.x<60);
 if(i>200&&i<=400)assert(v03Contact(i/1000,level).x<v03Contact((i-1)/1000,level).x);
 // The painted grip and wrist remain a rigid part of the same original image.
 assert(Math.abs(Math.hypot(p.grip.x-p.wrist.x,p.grip.y-p.wrist.y)-Math.hypot(COMBINED.grip[0]-COMBINED.wrist[0],COMBINED.grip[1]-COMBINED.wrist[1])*v03ToolScale(level))<1e-7);
}
for(const level of [1,2])for(let col=0;col<level+1;col++){
 const t=manualHit(level,level+1,col),point=manualTarget(level,level+1,col);
 assert(t>.2&&t<.4);assert(Math.abs(point.x-manualColumn(level,level+1,col))<1e-7);assert(point.y>-40&&point.y<35);
}
const hash=p=>crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');
assert.equal(hash('assets/resources/cat-walk-v02/textures/cat_right_arm_sickle.png'),hash('docs/OrangeCat_Walk_V02/textures/cat_right_arm_sickle.png'));
for(const name of ['cat_torso','cat_head'])assert.equal(hash('assets/resources/cat-swing-v03/'+name+'.png'),hash('docs/OrangeCat_Swing_V03/textures/'+name+'.png'));
assert.equal(v03ToolScale(1),.20);assert.equal(v03ToolScale(2),.24);
assert.deepEqual(V03.grassCanvas,[284,218]);assert.deepEqual(V03.widths,[180,180]);
for(const level of [1,2]){const a=v03Pose(0,level),b=v03Pose(1,level);for(const key of ['toolAngle','bodyAngle'])assert(Math.abs(a[key]-b[key])<1e-8);}
assert(Math.abs(v03LeftArm(0,.25)-v03LeftArm(1,1.25))<1e-8);assert(v03LeftArm(.2,.25)-v03LeftArm(.4,.25)>25);
console.log('PASS original Walk V02 single arm PNG, no extra upper arm, no grip slip, tier sizes, complete blade coverage, recovery continuity and left-arm coordination');
