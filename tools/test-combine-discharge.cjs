const fs=require('fs'),assert=require('node:assert/strict');
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const out='docs/verification/combine-discharge';fs.mkdirSync(out,{recursive:true});let browser;
(async()=>{
 browser=await chromium.launch({headless:true,executablePath:process.env.CHROMIUM_EXECUTABLE});const page=await browser.newPage({viewport:{width:720,height:1280}}),errors=[],results=[];page.on('pageerror',e=>errors.push(String(e)));
 await page.goto(process.env.HARVEST_TEST_URL||'http://127.0.0.1:8093');await page.waitForFunction(()=>globalThis.__HARVEST__?.game.actor.ready&&__HARVEST__.game.field.ready);
 for(const level of [4,5,6]){
  await page.evaluate(level=>{const g=__HARVEST__.game;g.enabled=false;g.model.debugLevel(level);g.actor.build(g.model.cfg);g.field.clear();g.advance(0);},level);await page.waitForFunction(()=>__HARVEST__.game.actor.ready&&__HARVEST__.game.field.ready,null,{timeout:60000});
  await page.evaluate(()=>{const g=__HARVEST__.game;g.model.start();g.model.s.distance=.99;g.advance(0);g.advance(.02);for(let i=0;i<12;i++)g.advance(1/60);g.refresh();});
  const running=await page.evaluate(()=>{const g=__HARVEST__.game,k=g.field.skin;return {level:g.model.s.level,coins:g.model.s.coins,emitted:k.outletEmitted,particles:k.debris.filter(p=>p.outlet).map(p=>({x:p.n.position.x,y:p.n.position.y,vx:p.vx,vy:p.vy,frame:p.n.getComponent('cc.Sprite').spriteFrame.name}))};});
  assert(running.particles.length>=4&&running.particles.length<=18);assert(running.particles.every(p=>p.x>=270&&p.x<340&&p.vx>0&&p.vy<0));assert(running.particles.every(p=>level===6?p.frame.includes('rice_'):p.frame.startsWith('fx_')));
  await page.screenshot({path:out+'/level-'+level+'.png'});
  const pause=await page.evaluate(()=>{const g=__HARVEST__.game;g.model.pause();const k=g.field.skin,before=k.debris.filter(p=>p.outlet).map(p=>[p.age,p.n.position.x,p.n.position.y]);g.advance(.5);return {before,after:k.debris.filter(p=>p.outlet).map(p=>[p.age,p.n.position.x,p.n.position.y])};});assert.deepEqual(pause.before,pause.after);
  const stopped=await page.evaluate(()=>{const g=__HARVEST__.game,k=g.field.skin,coins=g.model.s.coins;for(let i=0;i<90;i++){k.tick(1/60);k.spray(1/60,g.model.s.level);}return {particles:k.debris.length,remaining:k.outletRemaining,coins,after:g.model.s.coins};});assert.equal(stopped.particles,0);assert.equal(stopped.remaining,0);assert.equal(stopped.coins,stopped.after);results.push({running,pause,stopped});
 }
 assert.deepEqual(errors,[]);fs.writeFileSync(out+'/checks.json',JSON.stringify({results,errors},null,2));console.log('PASS levels 4-6 discharge position, crop textures, pause, bounded pool and stop after cutting');await browser.close();
})().catch(async e=>{console.error(e);await browser?.close();process.exitCode=1;});
