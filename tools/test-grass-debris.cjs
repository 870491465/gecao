const fs=require('fs'),assert=require('node:assert/strict');
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const out='docs/verification/grass-debris';fs.mkdirSync(out,{recursive:true});let browser;
(async()=>{
 browser=await chromium.launch({headless:true,executablePath:process.env.CHROMIUM_EXECUTABLE});
 const page=await browser.newPage({viewport:{width:720,height:1280}}),errors=[],results=[];
 page.on('pageerror',e=>errors.push(String(e)));
 await page.goto(process.env.HARVEST_TEST_URL||'http://127.0.0.1:8093');
 await page.waitForFunction(()=>globalThis.__HARVEST__?.game.actor.ready&&__HARVEST__.game.field.ready,null,{timeout:60000});
 const inspect=()=>page.evaluate(async()=>{const g=__HARVEST__.game,k=g.field.skin,cc=await System.import('cc');return {coins:g.model.s.coins,cuts:g.model.s.totalCut,income:g.model.s.totalIncome,emitted:k.emitted,nodes:k.fxRoot.children.length,pool:k.fxPool.length,particles:k.debris.map(p=>({x:p.n.position.x,y:p.n.position.y,age:p.age,angle:p.n.angle,vx:p.vx,frame:p.n.getComponent(cc.Sprite).spriteFrame.name,opacity:p.n.getComponent(cc.UIOpacity).opacity,size:p.n.getComponent(cc.UITransform).width}))};});
 for(let level=1;level<=6;level++){
  await page.evaluate(level=>{const g=__HARVEST__.game;g.enabled=false;g.clearTransientFeedback();g.model.debugLevel(level);Object.assign(g.model.s,{coins:100,totalCut:0,totalIncome:0,started:true});g.model.state='Harvesting';g.field.debrisEnabled=true;g.actor.build(g.model.cfg);g.field.clear();g.advance(0);},level);
  await page.waitForFunction(()=>__HARVEST__.game.actor.ready&&__HARVEST__.game.field.ready,null,{timeout:60000});
  await page.evaluate(()=>{const g=__HARVEST__.game,m=g.model;g.advance(0);if(m.s.level===1){m.s.phase=m.manualAnimation.hitPhase(0)-.01;m.s.distance=m.s.phase;}else m.s.distance=.99;g.advance(0);});
  const before=await inspect();assert.equal(before.particles.length,0);
  await page.evaluate(()=>__HARVEST__.game.advance(.03));const cut=await inspect();
  assert(cut.cuts>0&&cut.coins>before.coins);assert.equal(cut.coins-100,cut.income);assert(cut.emitted>before.emitted&&cut.particles.length>0&&cut.particles.length<=48);
  assert(cut.particles.every(p=>p.size>=(level===1?27:40.5)&&p.size<=(level===1?37.8:56.7)));assert(cut.particles.some(p=>level>=6?p.frame.includes('rice_leaf'):p.frame==='fx_leaf'));assert(cut.particles.some(p=>level>=6?p.frame.includes('rice_grain'):p.frame==='fx_stem'));assert(cut.particles.some(p=>p.vx<0)&&cut.particles.some(p=>p.vx>0));
  await page.evaluate(level=>{const g=__HARVEST__.game;g.field.cut({id:level+':1:0:0:0',row:0,col:0,value:g.model.cfg.price});},level);assert.equal((await inspect()).emitted,cut.emitted);
  await page.evaluate(()=>__HARVEST__.game.field.skin.tick(.08));const flying=await inspect();assert(flying.particles.some((p,i)=>p.x!==cut.particles[i].x&&p.y!==cut.particles[i].y&&p.angle!==cut.particles[i].angle));assert(flying.particles.every(p=>p.opacity>0&&p.opacity<255));await page.evaluate(()=>__HARVEST__.game.refresh());await page.screenshot({path:out+'/level-'+level+'.png'});
  await page.evaluate(()=>__HARVEST__.model.pause());const paused=await inspect();await page.evaluate(()=>__HARVEST__.game.advance(.3));assert.deepEqual(await inspect(),paused);
  await page.evaluate(()=>{const g=__HARVEST__.game;g.hide();g.show();g.advance(.4);});assert.deepEqual(await inspect(),paused);
  await page.evaluate(()=>__HARVEST__.game.field.skin.tick(1));const recycled=await inspect();assert.equal(recycled.particles.length,0);assert(recycled.pool>0);
  await page.evaluate(()=>{const g=__HARVEST__.game;g.field.debrisEnabled=false;g.model.debugLevel(g.model.s.level);g.model.state='Harvesting';g.field.clear();g.advance(0);g.model.cut(0);});const off=await inspect();assert(off.coins>recycled.coins);assert.equal(off.particles.length,0);assert.equal(off.emitted,recycled.emitted);
  const bounded=await page.evaluate(()=>{const g=__HARVEST__.game,k=g.field.skin,before=g.model.s.coins;for(let i=0;i<100;i++)k.emit(0,0,i,1.5);const peak=k.debris.length;k.tick(1);const count=k.fxRoot.children.length;k.emit(0,0,3,1.5);return {before,after:g.model.s.coins,peak,count,reused:k.fxRoot.children.length===count};});assert.equal(bounded.peak,48);assert(bounded.count<=48&&bounded.reused);assert.equal(bounded.before,bounded.after);results.push({level,before,cut,flying,recycled,off,bounded});
 }
 assert.deepEqual(errors,[]);fs.writeFileSync(out+'/results.json',JSON.stringify({checks:'six actual cutting paths / original leaf and stem textures / spread / spin / fade / no duplicate burst / pause / background / toggle / 48-node pool / no extra income',results,errors},null,2));console.log('PASS grass debris across all six tiers, animation, pause and bounded recycling');await browser.close();
})().catch(async e=>{console.error(e);await browser?.close();process.exitCode=1;});
